import { z } from 'zod';

// Enums
export const ItemTypeSchema = z.enum([
  'vision',
  'goal',
  'role',
  'requirement',
  'feature',
  'screen',
  'entity',
  'business_rule',
  'decision',
  'assumption',
  'task',
]);
export type ItemType = z.infer<typeof ItemTypeSchema>;

export const PrioritySchema = z.enum(['must', 'should', 'could', 'wont']);
export type Priority = z.infer<typeof PrioritySchema>;

export const SourceSchema = z.enum(['user', 'ai_inferred', 'ai_recommended']);
export type Source = z.infer<typeof SourceSchema>;

export const StatusSchema = z.enum(['confirmed', 'rejected']);
export type Status = z.infer<typeof StatusSchema>;

export const LinkKindSchema = z.enum([
  'belongs_to',
  'involves',
  'implements',
  'depends_on',
  'affects',
  'conflicts_with',
  'derived_from',
]);
export type LinkKind = z.infer<typeof LinkKindSchema>;

export const CategorySchema = z.enum([
  'product_definition',
  'roles',
  'features',
  'screens',
  'data_model',
  'business_rules',
  'edge_cases',
  'technical_decisions',
]);
export type Category = z.infer<typeof CategorySchema>;

// Prefix mapping
export const PREFIX_BY_TYPE: Record<ItemType, string> = {
  vision: 'VIS',
  goal: 'GOAL',
  role: 'ROLE',
  requirement: 'REQ',
  feature: 'FEAT',
  screen: 'SCR',
  entity: 'ENT',
  business_rule: 'BR',
  decision: 'DEC',
  assumption: 'ASM',
  task: 'TASK',
};

export const PREFIXES = Object.values(PREFIX_BY_TYPE);
export const ITEM_TYPES = Object.keys(PREFIX_BY_TYPE) as ItemType[];

export const MANUAL_EVIDENCE = '[manual]';

// Item data schemas
export const VisionDataSchema = z.strictObject({
  statement: z.string(),
  problem: z.string(),
  target_users: z.string(),
  non_goals: z.array(z.string()),
});
export type VisionData = z.infer<typeof VisionDataSchema>;

export const GoalDataSchema = z.strictObject({
  description: z.string(),
  success_metric: z.string().optional(),
});
export type GoalData = z.infer<typeof GoalDataSchema>;

export const RoleDataSchema = z.strictObject({
  description: z.string(),
  permissions: z.array(z.string()),
});
export type RoleData = z.infer<typeof RoleDataSchema>;

export const RequirementDataSchema = z.strictObject({
  kind: z.enum(['functional', 'non_functional', 'edge_case', 'constraint']),
  statement: z.string(),
  priority: PrioritySchema,
  acceptance_criteria: z.array(z.string()),
});
export type RequirementData = z.infer<typeof RequirementDataSchema>;

export const FeatureDataSchema = z.strictObject({
  description: z.string(),
  priority: z.enum(['must', 'should', 'could']),
  primary_flow: z.array(z.string()),
});
export type FeatureData = z.infer<typeof FeatureDataSchema>;

export const ScreenDataSchema = z.strictObject({
  route: z.string(),
  purpose: z.string(),
  components: z.array(z.string()),
  actions: z.array(z.string()),
  states: z.strictObject({
    loading: z.string(),
    empty: z.string(),
    error: z.string(),
  }),
  permissions: z.string(),
});
export type ScreenData = z.infer<typeof ScreenDataSchema>;

export const EntityFieldSchema = z.strictObject({
  name: z.string(),
  type: z.enum([
    'string',
    'text',
    'int',
    'decimal',
    'boolean',
    'date',
    'datetime',
    'enum',
    'uuid',
    'json',
    'ref',
  ]),
  required: z.boolean(),
  enum_values: z.array(z.string()).optional(),
  ref_entity: z.string().optional(),
  notes: z.string().optional(),
});
export type EntityField = z.infer<typeof EntityFieldSchema>;

export const EntityDataSchema = z.strictObject({
  description: z.string(),
  fields: z.array(EntityFieldSchema),
});
export type EntityData = z.infer<typeof EntityDataSchema>;

export const BusinessRuleDataSchema = z.strictObject({
  statement: z.string(),
  rationale: z.string().optional(),
});
export type BusinessRuleData = z.infer<typeof BusinessRuleDataSchema>;

export const DecisionDataSchema = z.strictObject({
  topic: z.enum([
    'auth',
    'database',
    'frontend',
    'backend',
    'hosting',
    'payments',
    'storage',
    'email',
    'ai',
    'product',
    'other',
  ]),
  choice: z.string(),
  rationale: z.string(),
  alternatives: z.array(z.string()),
});
export type DecisionData = z.infer<typeof DecisionDataSchema>;

export const AssumptionDataSchema = z.strictObject({
  statement: z.string(),
  risk_if_wrong: z.string(),
});
export type AssumptionData = z.infer<typeof AssumptionDataSchema>;

export const TaskDataSchema = z.strictObject({
  phase: z.strictObject({
    index: z.number(),
    title: z.string(),
  }),
  description: z.string(),
  acceptance_criteria: z.array(z.string()),
  files_hint: z.array(z.string()),
  priority: z.enum(['high', 'medium', 'low']),
  state: z.enum(['todo', 'in_progress', 'done', 'blocked']),
});
export type TaskData = z.infer<typeof TaskDataSchema>;

// Item schema with discriminated union
const itemBase = {
  key: z.string().regex(/^[A-Z]+-\d{3,}$/),
  title: z.string().trim().min(1).max(120),
  source: SourceSchema,
  status: StatusSchema,
  reason: z.string(),
  evidence: z.string().optional(),
  confidence: z.number().min(0).max(1),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
};

function itemOf<T extends string, D extends z.ZodType>(type: T, data: D) {
  return z.strictObject({ ...itemBase, type: z.literal(type), data });
}

export const ItemSchema = z
  .discriminatedUnion('type', [
    itemOf('vision', VisionDataSchema),
    itemOf('goal', GoalDataSchema),
    itemOf('role', RoleDataSchema),
    itemOf('requirement', RequirementDataSchema),
    itemOf('feature', FeatureDataSchema),
    itemOf('screen', ScreenDataSchema),
    itemOf('entity', EntityDataSchema),
    itemOf('business_rule', BusinessRuleDataSchema),
    itemOf('decision', DecisionDataSchema),
    itemOf('assumption', AssumptionDataSchema),
    itemOf('task', TaskDataSchema),
  ])
  .superRefine((item, ctx) => {
    if (item.source === 'user' && !item.evidence) {
      ctx.addIssue({
        code: 'custom',
        path: ['evidence'],
        message: 'Evidence is required for user items.',
      });
    }
  });

export type Item = z.infer<typeof ItemSchema>;

// Link schema
export const LinkSchema = z.strictObject({
  from: z.string(),
  to: z.string(),
  kind: LinkKindSchema,
});
export type Link = z.infer<typeof LinkSchema>;

// Link rules matrix
type LinkRule = {
  from: ItemType[];
  kind: LinkKind;
  to: ItemType[];
};

export const LINK_RULES: LinkRule[] = [
  { from: ['requirement'], kind: 'belongs_to', to: ['feature'] },
  { from: ['screen'], kind: 'belongs_to', to: ['feature'] },
  { from: ['feature'], kind: 'involves', to: ['role', 'entity'] },
  { from: ['screen'], kind: 'involves', to: ['role'] },
  { from: ['business_rule'], kind: 'affects', to: ['feature', 'requirement', 'entity'] },
  {
    from: ['decision'],
    kind: 'affects',
    to: [
      'vision',
      'goal',
      'role',
      'requirement',
      'feature',
      'screen',
      'entity',
      'business_rule',
      'decision',
      'assumption',
      'task',
    ],
  },
  {
    from: ['task'],
    kind: 'implements',
    to: ['requirement', 'feature', 'screen', 'entity'],
  },
  { from: ['task'], kind: 'depends_on', to: ['task'] },
  { from: ['feature'], kind: 'depends_on', to: ['feature'] },
  { from: ['requirement'], kind: 'conflicts_with', to: ['requirement'] },
  {
    from: [
      'vision',
      'goal',
      'role',
      'requirement',
      'feature',
      'screen',
      'entity',
      'business_rule',
      'decision',
      'assumption',
      'task',
    ],
    kind: 'derived_from',
    to: [
      'vision',
      'goal',
      'role',
      'requirement',
      'feature',
      'screen',
      'entity',
      'business_rule',
      'decision',
      'assumption',
      'task',
    ],
  },
];

export function isLinkAllowed(from: ItemType, kind: LinkKind, to: ItemType): boolean {
  return LINK_RULES.some(
    (rule) => rule.kind === kind && rule.from.includes(from) && rule.to.includes(to)
  );
}

// Brain schema
export const BrainSchema = z
  .strictObject({
    schema_version: z.literal(1),
    counters: z.partialRecord(z.enum(PREFIXES as [string, ...string[]]), z.number()),
    items: z.array(ItemSchema),
    links: z.array(LinkSchema),
  })
  .superRefine((brain, ctx) => {
    const keys = new Set<string>();
    const normalizedTitles = new Map<ItemType, Set<string>>();
    let confirmedVisionCount = 0;

    // Check unique keys and prefix matches type
    for (let i = 0; i < brain.items.length; i++) {
      const item = brain.items[i];
      const prefix = item.key.split('-')[0];
      const expectedPrefix = PREFIX_BY_TYPE[item.type];

      if (prefix !== expectedPrefix) {
        ctx.addIssue({
          code: 'custom',
          path: ['items', i, 'key'],
          message: `Key prefix ${prefix} does not match type ${item.type} (expected ${expectedPrefix})`,
        });
      }

      if (keys.has(item.key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['items', i, 'key'],
          message: `Duplicate key: ${item.key}`,
        });
      }
      keys.add(item.key);

      // Check title uniqueness per type
      if (!normalizedTitles.has(item.type)) {
        normalizedTitles.set(item.type, new Set());
      }
      const normalized = item.title
        .trim()
        .replace(/\s+/g, ' ')
        .normalize('NFKC')
        .toLowerCase();
      const titlesForType = normalizedTitles.get(item.type)!;
      if (titlesForType.has(normalized)) {
        ctx.addIssue({
          code: 'custom',
          path: ['items', i, 'title'],
          message: `Duplicate title for type ${item.type}: ${item.title}`,
        });
      }
      titlesForType.add(normalized);

      // Count confirmed visions
      if (item.type === 'vision' && item.status === 'confirmed') {
        confirmedVisionCount++;
      }
    }

    // Check counters are at least the highest number used
    for (const [prefix, counter] of Object.entries(brain.counters)) {
      if (counter === undefined) continue;
      const maxUsed = brain.items
        .filter((item) => item.key.startsWith(prefix + '-'))
        .map((item) => parseInt(item.key.split('-')[1], 10))
        .reduce((max, num) => Math.max(max, num), 0);

      if (counter < maxUsed) {
        ctx.addIssue({
          code: 'custom',
          path: ['counters', prefix],
          message: `Counter for ${prefix} is ${counter} but highest used is ${maxUsed}`,
        });
      }
    }

    // Check at most one confirmed vision
    if (confirmedVisionCount > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['items'],
        message: `At most one confirmed vision allowed, found ${confirmedVisionCount}`,
      });
    }

    // Check link endpoints exist and are confirmed
    const confirmedKeys = new Set(
      brain.items.filter((item) => item.status === 'confirmed').map((item) => item.key)
    );

    for (let i = 0; i < brain.links.length; i++) {
      const link = brain.links[i];
      if (!confirmedKeys.has(link.from)) {
        ctx.addIssue({
          code: 'custom',
          path: ['links', i, 'from'],
          message: `Link endpoint ${link.from} does not exist or is not confirmed`,
        });
      }
      if (!confirmedKeys.has(link.to)) {
        ctx.addIssue({
          code: 'custom',
          path: ['links', i, 'to'],
          message: `Link endpoint ${link.to} does not exist or is not confirmed`,
        });
      }
    }

    // Check no duplicate links
    const linkKeys = new Set<string>();
    for (let i = 0; i < brain.links.length; i++) {
      const link = brain.links[i];
      const linkKey = `${link.from}:${link.kind}:${link.to}`;
      if (linkKeys.has(linkKey)) {
        ctx.addIssue({
          code: 'custom',
          path: ['links', i],
          message: `Duplicate link: ${linkKey}`,
        });
      }
      linkKeys.add(linkKey);
    }

    // Check every link is allowed by the matrix
    for (let i = 0; i < brain.links.length; i++) {
      const link = brain.links[i];
      const fromItem = brain.items.find((item) => item.key === link.from);
      const toItem = brain.items.find((item) => item.key === link.to);
      if (fromItem && toItem && !isLinkAllowed(fromItem.type, link.kind, toItem.type)) {
        ctx.addIssue({
          code: 'custom',
          path: ['links', i],
          message: `Link not allowed: ${fromItem.type} -${link.kind}-> ${toItem.type}`,
        });
      }
    }

    // Check no depends_on cycles
    const dependsOnLinks = brain.links.filter((link) => link.kind === 'depends_on');
    function hasCycle(start: string, visited = new Set<string>()): boolean {
      if (visited.has(start)) return true;
      visited.add(start);
      const outgoing = dependsOnLinks.filter((link) => link.from === start);
      for (const link of outgoing) {
        if (hasCycle(link.to, new Set(visited))) return true;
      }
      return false;
    }
    for (const link of dependsOnLinks) {
      if (hasCycle(link.from)) {
        ctx.addIssue({
          code: 'custom',
          path: ['links'],
          message: `Cycle detected in depends_on links involving ${link.from}`,
        });
        break;
      }
    }
  });

export type Brain = z.infer<typeof BrainSchema>;

export const EMPTY_BRAIN: Brain = {
  schema_version: 1,
  counters: {},
  items: [],
  links: [],
};

export function parseBrain(value: unknown) {
  return BrainSchema.safeParse(value);
}

// Op schemas
export const RefSchema = z.string();
export type Ref = z.infer<typeof RefSchema>;

const CreateOpSchema = z.strictObject({
  op: z.literal('create'),
  ref: z.string().optional(),
  type: ItemTypeSchema,
  title: z.string(),
  data: z.unknown(),
  source: SourceSchema,
  reason: z.string(),
  confidence: z.number(),
  evidence: z.string().optional(),
  links: z
    .array(
      z.strictObject({
        kind: LinkKindSchema,
        to: RefSchema,
      })
    )
    .optional(),
});

const UpdateOpSchema = z.strictObject({
  op: z.literal('update'),
  key: z.string(),
  title: z.string().optional(),
  data: z.unknown().optional(),
  reason: z.string(),
  evidence: z.string().optional(),
});

const DeleteOpSchema = z.strictObject({
  op: z.literal('delete'),
  key: z.string(),
  reason: z.string(),
});

const LinkOpSchema = z.strictObject({
  op: z.literal('link'),
  from: RefSchema,
  kind: LinkKindSchema,
  to: RefSchema,
});

const UnlinkOpSchema = z.strictObject({
  op: z.literal('unlink'),
  from: RefSchema,
  kind: LinkKindSchema,
  to: RefSchema,
});

export const OpSchema = z.discriminatedUnion('op', [
  CreateOpSchema,
  UpdateOpSchema,
  DeleteOpSchema,
  LinkOpSchema,
  UnlinkOpSchema,
]);

export type Op = z.infer<typeof OpSchema>;

// OpenInsight schema
export const OpenInsightSchema = z.strictObject({
  id: z.string(),
  kind: z.enum(['question', 'ambiguity', 'contradiction', 'missing', 'risk']),
  title: z.string(),
  category: z.string(),
  blocking: z.boolean(),
});

export type OpenInsight = z.infer<typeof OpenInsightSchema>;
