-- Blueprint: initial schema (MVP-SPEC sections 4.1, 5 and 5.1).
--
-- Security model
--   * RLS is enabled on every table. The app only uses the user-scoped client
--     (publishable key + the user's JWT). The service_role key is never used.
--   * Ownership: projects.owner_id = auth.uid(). Child tables check ownership
--     through their project. ai_usage also carries user_id.
--   * brain_events and ai_usage are append-only logs for users (select + insert
--     only), so a user cannot rewrite the audit trail or reset a rate limit by
--     deleting usage rows. Rows disappear only through foreign-key cascades.
--   * commit_brain is SECURITY INVOKER, so RLS applies to every write it makes.
--   * anon has no privileges on any of these objects.
--
-- Known limitation (accepted for v1, spec section 10): RLS checks ownership, not
-- shape, so a signed-in user can still write their own rows through the API.

-- ---------------------------------------------------------------------------
-- Shared trigger function
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  idea_text text not null,
  language text not null default 'auto',
  -- The empty Brain (spec section 4.1).
  brain jsonb not null default '{"schema_version": 1, "counters": {}, "items": [], "links": []}'::jsonb,
  brain_revision integer not null default 0,
  readiness_score integer not null default 0,
  counts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_name_length check (char_length(btrim(name)) >= 1 and char_length(name) <= 100),
  constraint projects_idea_text_length check (char_length(idea_text) <= 8000),
  constraint projects_brain_is_object check (jsonb_typeof(brain) = 'object'),
  constraint projects_brain_revision_nonneg check (brain_revision >= 0),
  constraint projects_readiness_range check (readiness_score between 0 and 100),
  constraint projects_counts_is_object check (jsonb_typeof(counts) = 'object')
);

create index projects_owner_updated_idx on public.projects (owner_id, updated_at desc);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  role text not null,
  content text not null,
  structured jsonb,
  created_at timestamptz not null default now(),
  constraint messages_role_check check (role in ('user', 'assistant'))
);

create index messages_project_created_idx on public.messages (project_id, created_at);

-- ---------------------------------------------------------------------------
-- proposals
-- ---------------------------------------------------------------------------

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  message_id uuid references public.messages (id) on delete set null,
  -- Each op carries an opId (assigned by the server when the proposal is stored).
  ops jsonb not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint proposals_ops_is_array check (jsonb_typeof(ops) = 'array'),
  constraint proposals_status_check check (status in ('pending', 'accepted', 'rejected', 'partial'))
);

create index proposals_project_status_idx on public.proposals (project_id, status);

-- ---------------------------------------------------------------------------
-- insights
-- ---------------------------------------------------------------------------

create table public.insights (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  message_id uuid references public.messages (id) on delete set null,
  kind text not null,
  title text not null,
  detail text not null default '',
  category text not null,
  blocking boolean not null default false,
  related_keys text[] not null default '{}'::text[],
  options jsonb not null default '[]'::jsonb,
  allow_other boolean not null default false,
  multi boolean not null default false,
  status text not null default 'open',
  resolution jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint insights_kind_check check (kind in ('question', 'ambiguity', 'contradiction', 'missing', 'risk')),
  constraint insights_status_check check (status in ('open', 'resolved', 'dismissed')),
  constraint insights_options_is_array check (jsonb_typeof(options) = 'array')
);

create index insights_project_status_idx on public.insights (project_id, status);

-- ---------------------------------------------------------------------------
-- brain_events (append-only audit log)
-- ---------------------------------------------------------------------------

create table public.brain_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  actor text not null,
  kind text not null,
  summary text not null default '',
  payload jsonb not null default '{}'::jsonb,
  revision integer not null,
  created_at timestamptz not null default now(),
  constraint brain_events_actor_check check (actor in ('user', 'ai', 'system'))
);

create index brain_events_project_revision_idx on public.brain_events (project_id, revision);

-- ---------------------------------------------------------------------------
-- exports
-- ---------------------------------------------------------------------------

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null,
  variant text,
  content_md text not null,
  brain_revision integer not null,
  created_at timestamptz not null default now(),
  constraint exports_kind_check check (kind in ('prd', 'agent_prompt'))
);

create index exports_project_created_idx on public.exports (project_id, created_at desc);

-- ---------------------------------------------------------------------------
-- ai_usage (append-only; also the source for DB-backed rate limits)
-- ---------------------------------------------------------------------------
-- project_id is nullable and uses ON DELETE SET NULL: deleting a project must
-- not erase usage history, otherwise a user could reset a rate limit by
-- deleting and recreating projects.

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  job text not null,
  provider text not null,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  latency_ms integer not null default 0,
  ok boolean not null,
  error_code text,
  created_at timestamptz not null default now(),
  constraint ai_usage_job_check check (job in ('interview', 'plan', 'summary'))
);

create index ai_usage_user_created_idx on public.ai_usage (user_id, created_at);
create index ai_usage_project_idx on public.ai_usage (project_id) where project_id is not null;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.messages enable row level security;
alter table public.proposals enable row level security;
alter table public.insights enable row level security;
alter table public.brain_events enable row level security;
alter table public.exports enable row level security;
alter table public.ai_usage enable row level security;

-- projects: full owner access.
create policy projects_select_own on public.projects
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy projects_insert_own on public.projects
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy projects_update_own on public.projects
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy projects_delete_own on public.projects
  for delete to authenticated
  using (owner_id = (select auth.uid()));

-- messages: select + insert.
create policy messages_select_own on public.messages
  for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = messages.project_id and p.owner_id = (select auth.uid())
  ));

create policy messages_insert_own on public.messages
  for insert to authenticated
  with check (exists (
    select 1 from public.projects p
    where p.id = messages.project_id and p.owner_id = (select auth.uid())
  ));

-- proposals: select + insert + update (a decision updates status and decided_at).
create policy proposals_select_own on public.proposals
  for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = proposals.project_id and p.owner_id = (select auth.uid())
  ));

create policy proposals_insert_own on public.proposals
  for insert to authenticated
  with check (exists (
    select 1 from public.projects p
    where p.id = proposals.project_id and p.owner_id = (select auth.uid())
  ));

create policy proposals_update_own on public.proposals
  for update to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = proposals.project_id and p.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.projects p
    where p.id = proposals.project_id and p.owner_id = (select auth.uid())
  ));

-- insights: select + insert + update (resolve or dismiss).
create policy insights_select_own on public.insights
  for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = insights.project_id and p.owner_id = (select auth.uid())
  ));

create policy insights_insert_own on public.insights
  for insert to authenticated
  with check (exists (
    select 1 from public.projects p
    where p.id = insights.project_id and p.owner_id = (select auth.uid())
  ));

create policy insights_update_own on public.insights
  for update to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = insights.project_id and p.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.projects p
    where p.id = insights.project_id and p.owner_id = (select auth.uid())
  ));

-- brain_events: append-only (select + insert).
create policy brain_events_select_own on public.brain_events
  for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = brain_events.project_id and p.owner_id = (select auth.uid())
  ));

create policy brain_events_insert_own on public.brain_events
  for insert to authenticated
  with check (exists (
    select 1 from public.projects p
    where p.id = brain_events.project_id and p.owner_id = (select auth.uid())
  ));

-- exports: select + insert (a regeneration stores new rows).
create policy exports_select_own on public.exports
  for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = exports.project_id and p.owner_id = (select auth.uid())
  ));

create policy exports_insert_own on public.exports
  for insert to authenticated
  with check (exists (
    select 1 from public.projects p
    where p.id = exports.project_id and p.owner_id = (select auth.uid())
  ));

-- ai_usage: append-only, scoped by user_id; project_id (if set) must be owned.
create policy ai_usage_select_own on public.ai_usage
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy ai_usage_insert_own on public.ai_usage
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (
      project_id is null
      or exists (
        select 1 from public.projects p
        where p.id = ai_usage.project_id and p.owner_id = (select auth.uid())
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Table privileges (explicit, least privilege; do not rely on default grants)
-- ---------------------------------------------------------------------------

revoke all on table
  public.projects, public.messages, public.proposals, public.insights,
  public.brain_events, public.exports, public.ai_usage
  from anon, authenticated;

grant select, insert, update, delete on public.projects to authenticated;
grant select, insert on public.messages to authenticated;
grant select, insert, update on public.proposals to authenticated;
grant select, insert, update on public.insights to authenticated;
grant select, insert on public.brain_events to authenticated;
grant select, insert on public.exports to authenticated;
grant select, insert on public.ai_usage to authenticated;

-- ---------------------------------------------------------------------------
-- commit_brain: the single atomic write path (spec section 5.1)
-- ---------------------------------------------------------------------------
-- Persists everything one turn or edit changes, in one transaction.
--
-- Errors (raised as plain exceptions; the message is the contract):
--   PROJECT_NOT_FOUND       the project does not exist or is not owned by the caller
--   REVISION_CONFLICT       brain_revision no longer equals p_expected_revision
--   INVALID_PROPOSAL_STATUS p_decide_proposal.status is not accepted, rejected or partial
--   PROPOSAL_NOT_PENDING    the proposal to decide is missing, in another project, or already decided
-- Any other failure (constraint violation, bad JSON shape) also aborts the whole call.
--
-- Failure events (ai_turn_failed) are inserted directly by the app and do not
-- bump the revision, so they never go through this function.

create or replace function public.commit_brain(
  p_project_id uuid,
  p_expected_revision integer,
  p_brain jsonb,
  p_readiness integer,
  p_counts jsonb,
  p_event jsonb,
  p_new_proposal jsonb default null,
  p_decide_proposal jsonb default null,
  p_new_insights jsonb default '[]'::jsonb,
  p_resolve_insight_ids uuid[] default '{}'::uuid[],
  p_assistant_message jsonb default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_revision integer;
begin
  -- RLS hides projects the caller does not own, so this doubles as an ownership check.
  perform 1 from public.projects where id = p_project_id;
  if not found then
    raise exception 'PROJECT_NOT_FOUND';
  end if;

  update public.projects
     set brain = p_brain,
         brain_revision = brain_revision + 1,
         readiness_score = p_readiness,
         counts = p_counts
   where id = p_project_id
     and brain_revision = p_expected_revision
  returning brain_revision into v_revision;

  if v_revision is null then
    raise exception 'REVISION_CONFLICT'
      using hint = 'The project changed since it was loaded. Reload and retry.';
  end if;

  insert into public.brain_events (project_id, actor, kind, summary, payload, revision)
  values (
    p_project_id,
    p_event ->> 'actor',
    p_event ->> 'kind',
    coalesce(p_event ->> 'summary', ''),
    coalesce(nullif(p_event -> 'payload', 'null'::jsonb), '{}'::jsonb),
    v_revision
  );

  -- The assistant message goes first: proposals and insights may reference it.
  if p_assistant_message is not null and jsonb_typeof(p_assistant_message) = 'object' then
    insert into public.messages (id, project_id, role, content, structured)
    values (
      coalesce((p_assistant_message ->> 'id')::uuid, gen_random_uuid()),
      p_project_id,
      'assistant',
      p_assistant_message ->> 'content',
      nullif(p_assistant_message -> 'structured', 'null'::jsonb)
    );
  end if;

  if p_new_proposal is not null and jsonb_typeof(p_new_proposal) = 'object' then
    insert into public.proposals (id, project_id, message_id, ops, status)
    values (
      coalesce((p_new_proposal ->> 'id')::uuid, gen_random_uuid()),
      p_project_id,
      nullif(p_new_proposal ->> 'message_id', '')::uuid,
      p_new_proposal -> 'ops',
      'pending'
    );
  end if;

  if p_new_insights is not null
     and jsonb_typeof(p_new_insights) = 'array'
     and jsonb_array_length(p_new_insights) > 0 then
    -- project_id is always forced to p_project_id; any project_id in the payload is ignored.
    insert into public.insights (
      id, project_id, message_id, kind, title, detail, category,
      blocking, related_keys, options, allow_other, multi
    )
    select
      coalesce(r.id, gen_random_uuid()),
      p_project_id,
      r.message_id,
      r.kind,
      r.title,
      coalesce(r.detail, ''),
      r.category,
      coalesce(r.blocking, false),
      coalesce(array(select jsonb_array_elements_text(r.related_keys)), '{}'::text[]),
      coalesce(nullif(r.options, 'null'::jsonb), '[]'::jsonb),
      coalesce(r.allow_other, false),
      coalesce(r.multi, false)
    from jsonb_to_recordset(p_new_insights) as r(
      id uuid,
      message_id uuid,
      kind text,
      title text,
      detail text,
      category text,
      blocking boolean,
      related_keys jsonb,
      options jsonb,
      allow_other boolean,
      multi boolean
    );
  end if;

  if p_decide_proposal is not null and jsonb_typeof(p_decide_proposal) = 'object' then
    if (p_decide_proposal ->> 'status') is null
       or (p_decide_proposal ->> 'status') not in ('accepted', 'rejected', 'partial') then
      raise exception 'INVALID_PROPOSAL_STATUS';
    end if;

    update public.proposals
       set status = p_decide_proposal ->> 'status',
           decided_at = now()
     where id = (p_decide_proposal ->> 'id')::uuid
       and project_id = p_project_id
       and status = 'pending';

    if not found then
      raise exception 'PROPOSAL_NOT_PENDING';
    end if;
  end if;

  if coalesce(array_length(p_resolve_insight_ids, 1), 0) > 0 then
    update public.insights
       set status = 'resolved',
           resolved_at = now()
     where project_id = p_project_id
       and id = any (p_resolve_insight_ids)
       and status = 'open';
  end if;

  return v_revision;
end;
$$;

revoke all on function public.commit_brain(
  uuid, integer, jsonb, integer, jsonb, jsonb, jsonb, jsonb, jsonb, uuid[], jsonb
) from public, anon;

grant execute on function public.commit_brain(
  uuid, integer, jsonb, integer, jsonb, jsonb, jsonb, jsonb, jsonb, uuid[], jsonb
) to authenticated;
