// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  VisionDataSchema,
  GoalDataSchema,
  RoleDataSchema,
  RequirementDataSchema,
  FeatureDataSchema,
  ScreenDataSchema,
  EntityDataSchema,
  EntityFieldSchema,
  BusinessRuleDataSchema,
  DecisionDataSchema,
  AssumptionDataSchema,
  TaskDataSchema,
  ItemSchema,
  LinkSchema,
  BrainSchema,
  EMPTY_BRAIN,
  parseBrain,
  isLinkAllowed,
  LINK_RULES,
  OpSchema,
} from '@/server/brain/schemas';

describe('VisionDataSchema', () => {
  it('accepts valid vision data', () => {
    const valid = {
      statement: 'Build the best tutor marketplace',
      problem: 'Hard to find quality tutors',
      target_users: 'Students and parents',
      non_goals: ['Social network features'],
    };
    expect(VisionDataSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects unknown keys', () => {
    const invalid = {
      statement: 'test',
      problem: 'test',
      target_users: 'test',
      non_goals: [],
      extra: 'unknown',
    };
    expect(VisionDataSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('GoalDataSchema', () => {
  it('accepts valid goal with optional success_metric', () => {
    const valid1 = { description: 'Launch in Q1' };
    const valid2 = { description: 'Launch in Q1', success_metric: '1000 users' };
    expect(GoalDataSchema.safeParse(valid1).success).toBe(true);
    expect(GoalDataSchema.safeParse(valid2).success).toBe(true);
  });

  it('rejects unknown keys', () => {
    const invalid = { description: 'test', extra: 'unknown' };
    expect(GoalDataSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('RoleDataSchema', () => {
  it('accepts valid role data', () => {
    const valid = { description: 'Student', permissions: ['view_tutors', 'book_session'] };
    expect(RoleDataSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects unknown keys', () => {
    const invalid = { description: 'test', permissions: [], extra: 'unknown' };
    expect(RoleDataSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('RequirementDataSchema', () => {
  it('accepts valid requirement data', () => {
    const valid = {
      kind: 'functional',
      statement: 'Users can search tutors',
      priority: 'must',
      acceptance_criteria: ['Search works', 'Results paginated'],
    };
    expect(RequirementDataSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects bad kind enum', () => {
    const invalid = {
      kind: 'bad_kind',
      statement: 'test',
      priority: 'must',
      acceptance_criteria: [],
    };
    expect(RequirementDataSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects bad priority enum', () => {
    const invalid = {
      kind: 'functional',
      statement: 'test',
      priority: 'bad_priority',
      acceptance_criteria: [],
    };
    expect(RequirementDataSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects unknown keys', () => {
    const invalid = {
      kind: 'functional',
      statement: 'test',
      priority: 'must',
      acceptance_criteria: [],
      extra: 'unknown',
    };
    expect(RequirementDataSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('FeatureDataSchema', () => {
  it('accepts valid feature data', () => {
    const valid = {
      description: 'Tutor search',
      priority: 'must',
      primary_flow: ['Open search', 'Enter criteria', 'View results'],
    };
    expect(FeatureDataSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects wont priority (feature cannot be wont)', () => {
    const invalid = { description: 'test', priority: 'wont', primary_flow: [] };
    expect(FeatureDataSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects unknown keys', () => {
    const invalid = { description: 'test', priority: 'must', primary_flow: [], extra: 'unknown' };
    expect(FeatureDataSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('ScreenDataSchema', () => {
  it('accepts valid screen data', () => {
    const valid = {
      route: '/search',
      purpose: 'Search tutors',
      components: ['SearchBar', 'ResultList'],
      actions: ['search', 'filter'],
      states: {
        loading: 'Spinner',
        empty: 'No tutors found',
        error: 'Error message',
      },
      permissions: 'authenticated',
    };
    expect(ScreenDataSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects unknown keys', () => {
    const invalid = {
      route: '/test',
      purpose: 'test',
      components: [],
      actions: [],
      states: { loading: 'test', empty: 'test', error: 'test' },
      permissions: 'test',
      extra: 'unknown',
    };
    expect(ScreenDataSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('EntityFieldSchema', () => {
  it('accepts valid entity field', () => {
    const valid = { name: 'email', type: 'string', required: true };
    expect(EntityFieldSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts ref field with ref_entity', () => {
    const valid = { name: 'tutor_id', type: 'ref', required: true, ref_entity: 'ENT-001' };
    expect(EntityFieldSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects bad type enum', () => {
    const invalid = { name: 'test', type: 'bad_type', required: true };
    expect(EntityFieldSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects unknown keys', () => {
    const invalid = { name: 'test', type: 'string', required: true, extra: 'unknown' };
    expect(EntityFieldSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('EntityDataSchema', () => {
  it('accepts valid entity data', () => {
    const valid = {
      description: 'Tutor profile',
      fields: [
        { name: 'id', type: 'uuid', required: true },
        { name: 'email', type: 'string', required: true },
      ],
    };
    expect(EntityDataSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects unknown keys', () => {
    const invalid = { description: 'test', fields: [], extra: 'unknown' };
    expect(EntityDataSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('BusinessRuleDataSchema', () => {
  it('accepts valid business rule data', () => {
    const valid = { statement: 'Refunds within 24h', rationale: 'Customer satisfaction' };
    expect(BusinessRuleDataSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts rule without rationale', () => {
    const valid = { statement: 'Refunds within 24h' };
    expect(BusinessRuleDataSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects unknown keys', () => {
    const invalid = { statement: 'test', extra: 'unknown' };
    expect(BusinessRuleDataSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('DecisionDataSchema', () => {
  it('accepts valid decision data', () => {
    const valid = {
      topic: 'auth',
      choice: 'Supabase',
      rationale: 'Fast setup',
      alternatives: ['Auth0', 'Custom'],
    };
    expect(DecisionDataSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects bad topic enum', () => {
    const invalid = {
      topic: 'bad_topic',
      choice: 'test',
      rationale: 'test',
      alternatives: [],
    };
    expect(DecisionDataSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects unknown keys', () => {
    const invalid = {
      topic: 'auth',
      choice: 'test',
      rationale: 'test',
      alternatives: [],
      extra: 'unknown',
    };
    expect(DecisionDataSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('AssumptionDataSchema', () => {
  it('accepts valid assumption data', () => {
    const valid = { statement: 'Users have email', risk_if_wrong: 'Cannot notify users' };
    expect(AssumptionDataSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects unknown keys', () => {
    const invalid = { statement: 'test', risk_if_wrong: 'test', extra: 'unknown' };
    expect(AssumptionDataSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('TaskDataSchema', () => {
  it('accepts valid task data', () => {
    const valid = {
      phase: { index: 1, title: 'Foundation' },
      description: 'Setup Next.js',
      acceptance_criteria: ['App runs', 'Tests pass'],
      files_hint: ['package.json', 'next.config.ts'],
      priority: 'high',
      state: 'todo',
    };
    expect(TaskDataSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects bad priority enum', () => {
    const invalid = {
      phase: { index: 1, title: 'Foundation' },
      description: 'test',
      acceptance_criteria: [],
      files_hint: [],
      priority: 'bad_priority',
      state: 'todo',
    };
    expect(TaskDataSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects bad state enum', () => {
    const invalid = {
      phase: { index: 1, title: 'Foundation' },
      description: 'test',
      acceptance_criteria: [],
      files_hint: [],
      priority: 'high',
      state: 'bad_state',
    };
    expect(TaskDataSchema.safeParse(invalid).success).toBe(false);
  });

  it('rejects unknown keys', () => {
    const invalid = {
      phase: { index: 1, title: 'Foundation' },
      description: 'test',
      acceptance_criteria: [],
      files_hint: [],
      priority: 'high',
      state: 'todo',
      extra: 'unknown',
    };
    expect(TaskDataSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('ItemSchema', () => {
  it('accepts valid item', () => {
    const valid = {
      key: 'GOAL-001',
      type: 'goal',
      title: 'Launch MVP',
      data: { description: 'Launch in Q1' },
      source: 'user',
      status: 'confirmed',
      reason: 'User stated',
      evidence: 'I want to launch in Q1',
      confidence: 1,
      created_at: '2026-10-08T07:00:00.000Z',
      updated_at: '2026-10-08T07:00:00.000Z',
    };
    expect(ItemSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects user item without evidence', () => {
    const invalid = {
      key: 'GOAL-001',
      type: 'goal',
      title: 'Launch MVP',
      data: { description: 'Launch in Q1' },
      source: 'user',
      status: 'confirmed',
      reason: 'User stated',
      confidence: 1,
      created_at: '2026-10-08T07:00:00.000Z',
      updated_at: '2026-10-08T07:00:00.000Z',
    };
    const result = ItemSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Evidence is required');
    }
  });

  it('accepts AI item without evidence', () => {
    const valid = {
      key: 'GOAL-001',
      type: 'goal',
      title: 'Launch MVP',
      data: { description: 'Launch in Q1' },
      source: 'ai_inferred',
      status: 'confirmed',
      reason: 'Inferred from timeline',
      confidence: 0.8,
      created_at: '2026-10-08T07:00:00.000Z',
      updated_at: '2026-10-08T07:00:00.000Z',
    };
    expect(ItemSchema.safeParse(valid).success).toBe(true);
  });
});

describe('LinkSchema', () => {
  it('accepts valid link', () => {
    const valid = { from: 'REQ-001', kind: 'belongs_to', to: 'FEAT-001' };
    expect(LinkSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects unknown keys', () => {
    const invalid = { from: 'REQ-001', kind: 'belongs_to', to: 'FEAT-001', extra: 'unknown' };
    expect(LinkSchema.safeParse(invalid).success).toBe(false);
  });
});

describe('BrainSchema integrity checks', () => {
  it('rejects duplicate keys', () => {
    const invalid = {
      schema_version: 1,
      counters: { GOAL: 1 },
      items: [
        {
          key: 'GOAL-001',
          type: 'goal',
          title: 'First',
          data: { description: 'test' },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
        {
          key: 'GOAL-001',
          type: 'goal',
          title: 'Second',
          data: { description: 'test' },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
      ],
      links: [],
    };
    const result = BrainSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Duplicate key');
    }
  });

  it('rejects key prefix mismatch', () => {
    const invalid = {
      schema_version: 1,
      counters: { GOAL: 1 },
      items: [
        {
          key: 'REQ-001',
          type: 'goal',
          title: 'Wrong prefix',
          data: { description: 'test' },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
      ],
      links: [],
    };
    const result = BrainSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('does not match type');
    }
  });

  it('rejects duplicate normalized titles per type', () => {
    const invalid = {
      schema_version: 1,
      counters: { GOAL: 2 },
      items: [
        {
          key: 'GOAL-001',
          type: 'goal',
          title: 'Launch MVP',
          data: { description: 'test' },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
        {
          key: 'GOAL-002',
          type: 'goal',
          title: '  launch   mvp  ',
          data: { description: 'test' },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
      ],
      links: [],
    };
    const result = BrainSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Duplicate title');
    }
  });

  it('rejects counter below highest used', () => {
    const invalid = {
      schema_version: 1,
      counters: { GOAL: 1 },
      items: [
        {
          key: 'GOAL-005',
          type: 'goal',
          title: 'High key',
          data: { description: 'test' },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
      ],
      links: [],
    };
    const result = BrainSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Counter');
    }
  });

  it('rejects multiple confirmed visions', () => {
    const invalid = {
      schema_version: 1,
      counters: { VIS: 2 },
      items: [
        {
          key: 'VIS-001',
          type: 'vision',
          title: 'First vision',
          data: { statement: 'test', problem: 'test', target_users: 'test', non_goals: [] },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
        {
          key: 'VIS-002',
          type: 'vision',
          title: 'Second vision',
          data: { statement: 'test', problem: 'test', target_users: 'test', non_goals: [] },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
      ],
      links: [],
    };
    const result = BrainSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('one confirmed vision');
    }
  });

  it('allows one confirmed and one rejected vision', () => {
    const valid = {
      schema_version: 1,
      counters: { VIS: 2 },
      items: [
        {
          key: 'VIS-001',
          type: 'vision',
          title: 'First vision',
          data: { statement: 'test', problem: 'test', target_users: 'test', non_goals: [] },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
        {
          key: 'VIS-002',
          type: 'vision',
          title: 'Second vision',
          data: { statement: 'test', problem: 'test', target_users: 'test', non_goals: [] },
          source: 'ai_inferred',
          status: 'rejected',
          reason: 'test',
          confidence: 0.5,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
      ],
      links: [],
    };
    expect(BrainSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects link with non-existent endpoint', () => {
    const invalid = {
      schema_version: 1,
      counters: { GOAL: 1 },
      items: [
        {
          key: 'GOAL-001',
          type: 'goal',
          title: 'test',
          data: { description: 'test' },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
      ],
      links: [{ from: 'GOAL-001', kind: 'derived_from', to: 'GOAL-999' }],
    };
    const result = BrainSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('does not exist');
    }
  });

  it('rejects duplicate links', () => {
    const invalid = {
      schema_version: 1,
      counters: { GOAL: 2 },
      items: [
        {
          key: 'GOAL-001',
          type: 'goal',
          title: 'First',
          data: { description: 'test' },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
        {
          key: 'GOAL-002',
          type: 'goal',
          title: 'Second',
          data: { description: 'test' },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
      ],
      links: [
        { from: 'GOAL-001', kind: 'derived_from', to: 'GOAL-002' },
        { from: 'GOAL-001', kind: 'derived_from', to: 'GOAL-002' },
      ],
    };
    const result = BrainSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Duplicate link');
    }
  });

  it('rejects disallowed link', () => {
    const invalid = {
      schema_version: 1,
      counters: { GOAL: 2 },
      items: [
        {
          key: 'GOAL-001',
          type: 'goal',
          title: 'First',
          data: { description: 'test' },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
        {
          key: 'GOAL-002',
          type: 'goal',
          title: 'Second',
          data: { description: 'test' },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
      ],
      links: [{ from: 'GOAL-001', kind: 'belongs_to', to: 'GOAL-002' }],
    };
    const result = BrainSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Link not allowed');
    }
  });

  it('rejects depends_on cycle', () => {
    const invalid = {
      schema_version: 1,
      counters: { TASK: 3 },
      items: [
        {
          key: 'TASK-001',
          type: 'task',
          title: 'A',
          data: {
            phase: { index: 1, title: 'Phase 1' },
            description: 'test',
            acceptance_criteria: ['test'],
            files_hint: [],
            priority: 'high',
            state: 'todo',
          },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
        {
          key: 'TASK-002',
          type: 'task',
          title: 'B',
          data: {
            phase: { index: 1, title: 'Phase 1' },
            description: 'test',
            acceptance_criteria: ['test'],
            files_hint: [],
            priority: 'high',
            state: 'todo',
          },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
        {
          key: 'TASK-003',
          type: 'task',
          title: 'C',
          data: {
            phase: { index: 1, title: 'Phase 1' },
            description: 'test',
            acceptance_criteria: ['test'],
            files_hint: [],
            priority: 'high',
            state: 'todo',
          },
          source: 'user',
          status: 'confirmed',
          reason: 'test',
          evidence: 'test',
          confidence: 1,
          created_at: '2026-10-08T07:00:00.000Z',
          updated_at: '2026-10-08T07:00:00.000Z',
        },
      ],
      links: [
        { from: 'TASK-001', kind: 'depends_on', to: 'TASK-002' },
        { from: 'TASK-002', kind: 'depends_on', to: 'TASK-003' },
        { from: 'TASK-003', kind: 'depends_on', to: 'TASK-001' },
      ],
    };
    const result = BrainSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Cycle');
    }
  });
});

describe('EMPTY_BRAIN', () => {
  it('passes BrainSchema', () => {
    expect(BrainSchema.safeParse(EMPTY_BRAIN).success).toBe(true);
  });

  it('matches migration default', () => {
    // Migration default from 0001_init.sql
    const migrationDefault = {
      schema_version: 1,
      counters: {},
      items: [],
      links: [],
    };
    expect(EMPTY_BRAIN).toEqual(migrationDefault);
  });
});

describe('parseBrain', () => {
  it('returns success for valid brain', () => {
    const result = parseBrain(EMPTY_BRAIN);
    expect(result.success).toBe(true);
  });

  it('returns failure for invalid brain', () => {
    const result = parseBrain({ schema_version: 2 });
    expect(result.success).toBe(false);
  });
});

describe('isLinkAllowed', () => {
  it('allows requirement belongs_to feature', () => {
    expect(isLinkAllowed('requirement', 'belongs_to', 'feature')).toBe(true);
  });

  it('allows screen belongs_to feature', () => {
    expect(isLinkAllowed('screen', 'belongs_to', 'feature')).toBe(true);
  });

  it('allows feature involves role', () => {
    expect(isLinkAllowed('feature', 'involves', 'role')).toBe(true);
  });

  it('allows feature involves entity', () => {
    expect(isLinkAllowed('feature', 'involves', 'entity')).toBe(true);
  });

  it('allows screen involves role', () => {
    expect(isLinkAllowed('screen', 'involves', 'role')).toBe(true);
  });

  it('allows business_rule affects feature', () => {
    expect(isLinkAllowed('business_rule', 'affects', 'feature')).toBe(true);
  });

  it('allows business_rule affects requirement', () => {
    expect(isLinkAllowed('business_rule', 'affects', 'requirement')).toBe(true);
  });

  it('allows business_rule affects entity', () => {
    expect(isLinkAllowed('business_rule', 'affects', 'entity')).toBe(true);
  });

  it('allows decision affects any type', () => {
    expect(isLinkAllowed('decision', 'affects', 'vision')).toBe(true);
    expect(isLinkAllowed('decision', 'affects', 'goal')).toBe(true);
    expect(isLinkAllowed('decision', 'affects', 'task')).toBe(true);
  });

  it('allows task implements requirement', () => {
    expect(isLinkAllowed('task', 'implements', 'requirement')).toBe(true);
  });

  it('allows task implements feature', () => {
    expect(isLinkAllowed('task', 'implements', 'feature')).toBe(true);
  });

  it('allows task implements screen', () => {
    expect(isLinkAllowed('task', 'implements', 'screen')).toBe(true);
  });

  it('allows task implements entity', () => {
    expect(isLinkAllowed('task', 'implements', 'entity')).toBe(true);
  });

  it('allows task depends_on task', () => {
    expect(isLinkAllowed('task', 'depends_on', 'task')).toBe(true);
  });

  it('allows feature depends_on feature', () => {
    expect(isLinkAllowed('feature', 'depends_on', 'feature')).toBe(true);
  });

  it('allows requirement conflicts_with requirement', () => {
    expect(isLinkAllowed('requirement', 'conflicts_with', 'requirement')).toBe(true);
  });

  it('allows any derived_from any', () => {
    expect(isLinkAllowed('goal', 'derived_from', 'vision')).toBe(true);
    expect(isLinkAllowed('feature', 'derived_from', 'requirement')).toBe(true);
  });

  it('disallows goal belongs_to feature', () => {
    expect(isLinkAllowed('goal', 'belongs_to', 'feature')).toBe(false);
  });

  it('disallows feature implements requirement', () => {
    expect(isLinkAllowed('feature', 'implements', 'requirement')).toBe(false);
  });

  it('disallows goal depends_on goal', () => {
    expect(isLinkAllowed('goal', 'depends_on', 'goal')).toBe(false);
  });
});

describe('OpSchema', () => {
  it('accepts valid create op', () => {
    const valid = {
      op: 'create',
      ref: '@1',
      type: 'goal',
      title: 'Launch MVP',
      data: { description: 'Launch in Q1' },
      source: 'user',
      reason: 'User stated',
      confidence: 1,
      evidence: 'I want to launch in Q1',
    };
    expect(OpSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts create op with embedded links', () => {
    const valid = {
      op: 'create',
      type: 'requirement',
      title: 'User login',
      data: { kind: 'functional', statement: 'test', priority: 'must', acceptance_criteria: [] },
      source: 'user',
      reason: 'test',
      confidence: 1,
      evidence: 'test',
      links: [{ kind: 'belongs_to', to: 'FEAT-001' }],
    };
    expect(OpSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts valid update op', () => {
    const valid = { op: 'update', key: 'GOAL-001', title: 'New title', reason: 'Clarified' };
    expect(OpSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts valid delete op', () => {
    const valid = { op: 'delete', key: 'GOAL-001', reason: 'No longer needed' };
    expect(OpSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts valid link op', () => {
    const valid = { op: 'link', from: 'REQ-001', kind: 'belongs_to', to: 'FEAT-001' };
    expect(OpSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts valid unlink op', () => {
    const valid = { op: 'unlink', from: 'REQ-001', kind: 'belongs_to', to: 'FEAT-001' };
    expect(OpSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects unknown keys', () => {
    const invalid = {
      op: 'delete',
      key: 'GOAL-001',
      reason: 'test',
      extra: 'unknown',
    };
    expect(OpSchema.safeParse(invalid).success).toBe(false);
  });
});
