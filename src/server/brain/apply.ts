import type { Brain, Op, Item } from './schemas';
import { ItemSchema, PREFIX_BY_TYPE, MANUAL_EVIDENCE, isLinkAllowed } from './schemas';
import { allocateKey } from './keys';

export type ApplyContext = {
  actor: 'user' | 'ai' | 'system';
  userApproved?: boolean;
  now: string;
};

export type OpResult =
  | { ok: true; key: string; droppedLinks?: { kind: string; to: string; code: string; message: string }[] }
  | { ok: false; code: string; message: string };

export type ApplyResult = {
  brain: Brain;
  results: OpResult[];
  refs: Record<string, string>;
};

export const PREVIEW_NOW = '1970-01-01T00:00:00.000Z';

function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').normalize('NFKC').toLowerCase();
}

function deepMerge(target: unknown, source: unknown): unknown {
  if (source === undefined) return target;
  if (typeof target !== 'object' || target === null || typeof source !== 'object' || source === null) {
    return source;
  }
  if (Array.isArray(source)) {
    return source;
  }
  const merged = { ...target } as Record<string, unknown>;
  for (const [key, value] of Object.entries(source)) {
    merged[key] = deepMerge((target as Record<string, unknown>)[key], value);
  }
  return merged;
}

function hasDependsOnCycle(links: { from: string; to: string; kind: string }[], fromKey: string, toKey: string): boolean {
  const deps = [...links.filter((l) => l.kind === 'depends_on'), { from: fromKey, kind: 'depends_on' as const, to: toKey }];
  function visit(start: string, visited = new Set<string>()): boolean {
    if (visited.has(start)) return true;
    visited.add(start);
    for (const link of deps) {
      if (link.from === start && visit(link.to, new Set(visited))) return true;
    }
    return false;
  }
  return visit(fromKey);
}

export function applyOps(brain: Brain, ops: Op[], ctx: ApplyContext): ApplyResult {
  const currentBrain: Brain = structuredClone(brain);
  const results: OpResult[] = new Array(ops.length);
  const refs: Record<string, string> = {};
  const failedRefs = new Set<string>();
  const invalidTempRefs = new Set<string>();
  const deferredLinks: Array<{ index: number; op: Extract<Op, { op: 'link' }> }> = [];

  // Pre-validate temp refs: unique per batch, match /^@\d+$/
  const seenTempRefs = new Map<string, number>();
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op.op === 'create' && op.ref !== undefined) {
      if (!/^@\d+$/.test(op.ref)) {
        invalidTempRefs.add(op.ref);
      } else if (seenTempRefs.has(op.ref)) {
        invalidTempRefs.add(op.ref);
      } else {
        seenTempRefs.set(op.ref, i);
      }
    }
  }

  function resolveRef(ref: string): string | undefined {
    if (!ref.startsWith('@')) return ref;
    if (failedRefs.has(ref)) return undefined;
    return refs[ref];
  }

  function resolveEndpoint(ref: string): { key?: string; deferred?: boolean } {
    if (!ref.startsWith('@')) return { key: ref };
    if (failedRefs.has(ref)) return {};
    if (refs[ref]) return { key: refs[ref] };
    // Temp ref not yet resolved - it may be declared later in the batch
    return { deferred: true };
  }

  function applyLinkOrUnlink(op: Extract<Op, { op: 'link' | 'unlink' }>, dryRun = false): OpResult {
    const from = resolveEndpoint(op.from);
    const to = resolveEndpoint(op.to);

    if (from.deferred || to.deferred) {
      return { ok: true, key: '' };
    }

    const fromKey = from.key;
    const toKey = to.key;

    if (!fromKey || !toKey) {
      return {
        ok: false,
        code: 'UNKNOWN_REF',
        message: `Link endpoint ${!fromKey ? op.from : op.to} not found`,
      };
    }

    const fromItem = currentBrain.items.find((item) => item.key === fromKey && item.status === 'confirmed');
    const toItem = currentBrain.items.find((item) => item.key === toKey && item.status === 'confirmed');

    if (!fromItem || !toItem) {
      return {
        ok: false,
        code: 'UNKNOWN_REF',
        message: `Link endpoint ${!fromItem ? fromKey : toKey} not found or not confirmed`,
      };
    }

    if (fromKey === toKey) {
      return { ok: false, code: 'LINK_NOT_ALLOWED', message: 'Self-link not allowed' };
    }

    if (!isLinkAllowed(fromItem.type, op.kind, toItem.type)) {
      return {
        ok: false,
        code: 'LINK_NOT_ALLOWED',
        message: `Link ${fromItem.type} -${op.kind}-> ${toItem.type} not allowed`,
      };
    }

    const existingIndex = currentBrain.links.findIndex(
      (link) => link.from === fromKey && link.kind === op.kind && link.to === toKey
    );

    if (op.op === 'link') {
      if (existingIndex !== -1) {
        return { ok: false, code: 'LINK_DUPLICATE', message: 'Link already exists' };
      }
      if (op.kind === 'depends_on' && hasDependsOnCycle(currentBrain.links, fromKey, toKey)) {
        return { ok: false, code: 'CYCLE', message: `Cycle detected involving ${fromKey}` };
      }
      if (!dryRun) {
        currentBrain.links.push({ from: fromKey, kind: op.kind, to: toKey });
      }
      return { ok: true, key: '' };
    } else {
      if (existingIndex === -1) {
        return { ok: false, code: 'UNKNOWN_REF', message: 'Link does not exist' };
      }
      if (!dryRun) {
        currentBrain.links.splice(existingIndex, 1);
      }
      return { ok: true, key: '' };
    }
  }

  function createItem(op: Extract<Op, { op: 'create' }>, index: number): OpResult {
    if (op.ref !== undefined && invalidTempRefs.has(op.ref)) {
      failedRefs.add(op.ref);
      return { ok: false, code: 'SCHEMA_INVALID', message: `Invalid or duplicate temp ref: ${op.ref}` };
    }

    const prefix = PREFIX_BY_TYPE[op.type];
    const normalized = normalizeTitle(op.title);
    const existing = currentBrain.items.find(
      (item) => item.type === op.type && normalizeTitle(item.title) === normalized
    );

    // Tombstone revival for user-sourced creates
    if (existing && existing.status === 'rejected' && op.source === 'user') {
      const revived = {
        ...existing,
        title: op.title.trim(),
        data: op.data,
        source: 'user' as const,
        status: 'confirmed' as const,
        reason: op.reason,
        evidence: op.evidence,
        confidence: 1,
        updated_at: ctx.now,
      };
      const validated = ItemSchema.safeParse(revived);
      if (!validated.success) {
        if (op.ref) failedRefs.add(op.ref);
        return { ok: false, code: 'SCHEMA_INVALID', message: `Invalid revived item: ${validated.error.message}` };
      }

      if (op.type === 'vision') {
        const confirmedVisions = currentBrain.items.filter(
          (item) => item.type === 'vision' && item.status === 'confirmed' && item.key !== existing.key
        );
        if (confirmedVisions.length > 0) {
          if (op.ref) failedRefs.add(op.ref);
          return { ok: false, code: 'VISION_SINGLETON', message: 'Only one confirmed vision allowed' };
        }
      }

      currentBrain.items = currentBrain.items.map((item) => (item.key === existing.key ? revived : item));
      if (op.ref) refs[op.ref] = existing.key;

      const droppedLinks = applyEmbeddedLinks(op, existing.key);
      return { ok: true, key: existing.key, droppedLinks: droppedLinks.length > 0 ? droppedLinks : undefined };
    }

    if (existing) {
      if (op.ref) failedRefs.add(op.ref);
      return { ok: false, code: 'DUPLICATE_TITLE', message: `Duplicate title: ${op.title}` };
    }

    if (op.type === 'vision') {
      const confirmedVisions = currentBrain.items.filter(
        (item) => item.type === 'vision' && item.status === 'confirmed'
      );
      if (confirmedVisions.length > 0) {
        if (op.ref) failedRefs.add(op.ref);
        return { ok: false, code: 'VISION_SINGLETON', message: 'Only one confirmed vision allowed' };
      }
    }

    if (op.source === 'user' && (!op.evidence || op.evidence.trim() === '')) {
      if (op.ref) failedRefs.add(op.ref);
      return { ok: false, code: 'EVIDENCE_REQUIRED', message: 'Evidence required for user items' };
    }

    const keyAllocation = allocateKey(currentBrain.counters, prefix);
    const newKey = keyAllocation.key;
    currentBrain.counters = keyAllocation.counters;

    const newItem = {
      key: newKey,
      type: op.type,
      title: op.title.trim(),
      data: op.data,
      source: op.source,
      status: 'confirmed' as const,
      reason: op.reason,
      evidence: op.evidence,
      confidence: op.source === 'user' ? 1 : op.confidence,
      created_at: ctx.now,
      updated_at: ctx.now,
    };

    const validated = ItemSchema.safeParse(newItem);
    if (!validated.success) {
      if (op.ref) failedRefs.add(op.ref);
      return { ok: false, code: 'SCHEMA_INVALID', message: `Invalid item: ${validated.error.message}` };
    }

    currentBrain.items.push(validated.data);
    if (op.ref) refs[op.ref] = newKey;

    const droppedLinks = applyEmbeddedLinks(op, newKey);
    return { ok: true, key: newKey, droppedLinks: droppedLinks.length > 0 ? droppedLinks : undefined };
  }

  function applyEmbeddedLinks(
    op: Extract<Op, { op: 'create' }>,
    fromKey: string
  ): { kind: string; to: string; code: string; message: string }[] {
    const dropped: { kind: string; to: string; code: string; message: string }[] = [];
    if (!op.links) return dropped;

    for (const link of op.links) {
      const toKey = resolveRef(link.to);
      if (!toKey) {
        dropped.push({
          kind: link.kind,
          to: link.to,
          code: 'UNKNOWN_REF',
          message: `Link endpoint ${link.to} not found`,
        });
        continue;
      }
      const toItem = currentBrain.items.find((item) => item.key === toKey && item.status === 'confirmed');
      if (!toItem) {
        dropped.push({
          kind: link.kind,
          to: link.to,
          code: 'UNKNOWN_REF',
          message: `Link endpoint ${toKey} not found or not confirmed`,
        });
        continue;
      }
      if (fromKey === toKey) {
        dropped.push({
          kind: link.kind,
          to: link.to,
          code: 'LINK_NOT_ALLOWED',
          message: 'Self-link not allowed',
        });
        continue;
      }
      if (!isLinkAllowed(op.type, link.kind, toItem.type)) {
        dropped.push({
          kind: link.kind,
          to: link.to,
          code: 'LINK_NOT_ALLOWED',
          message: `Link ${op.type} -${link.kind}-> ${toItem.type} not allowed`,
        });
        continue;
      }
      const linkExists = currentBrain.links.some(
        (l) => l.from === fromKey && l.kind === link.kind && l.to === toKey
      );
      if (linkExists) {
        dropped.push({
          kind: link.kind,
          to: link.to,
          code: 'LINK_DUPLICATE',
          message: 'Link already exists',
        });
        continue;
      }
      if (link.kind === 'depends_on' && hasDependsOnCycle(currentBrain.links, fromKey, toKey)) {
        dropped.push({
          kind: link.kind,
          to: link.to,
          code: 'CYCLE',
          message: `Cycle detected involving ${fromKey}`,
        });
        continue;
      }
      currentBrain.links.push({ from: fromKey, kind: link.kind, to: toKey });
    }

    return dropped;
  }

  function applyUpdate(op: Extract<Op, { op: 'update' }>): OpResult {
    const item = currentBrain.items.find((item) => item.key === op.key && item.status === 'confirmed');
    if (!item) {
      return { ok: false, code: 'UNKNOWN_REF', message: `Item ${op.key} not found or not confirmed` };
    }

    if (ctx.actor === 'ai' && !ctx.userApproved) {
      return { ok: false, code: 'PROTECTED_ITEM', message: `Item ${op.key} is protected` };
    }

    const updated: Item = { ...item, reason: op.reason, updated_at: ctx.now };

    if (op.evidence !== undefined) {
      updated.evidence = op.evidence;
      if (op.evidence === MANUAL_EVIDENCE && ctx.actor === 'user') {
        updated.source = 'user';
        updated.confidence = 1;
      }
    }

    if (op.title !== undefined) {
      const normalized = normalizeTitle(op.title);
      const duplicate = currentBrain.items.find(
        (other) =>
          other.key !== item.key && other.type === item.type && normalizeTitle(other.title) === normalized
      );
      if (duplicate) {
        return { ok: false, code: 'DUPLICATE_TITLE', message: `Duplicate title: ${op.title}` };
      }
      updated.title = op.title.trim();
    }

    if (op.data !== undefined) {
      updated.data = deepMerge(item.data, op.data) as Item['data'];
      const validated = ItemSchema.safeParse(updated);
      if (!validated.success) {
        return {
          ok: false,
          code: 'SCHEMA_INVALID',
          message: `Invalid merged data: ${validated.error.message}`,
        };
      }
    }

    currentBrain.items = currentBrain.items.map((i) => (i.key === item.key ? updated : i));
    return { ok: true, key: item.key };
  }

  function applyDelete(op: Extract<Op, { op: 'delete' }>): OpResult {
    const item = currentBrain.items.find((item) => item.key === op.key && item.status === 'confirmed');
    if (!item) {
      return { ok: false, code: 'UNKNOWN_REF', message: `Item ${op.key} not found or not confirmed` };
    }

    if (ctx.actor === 'ai' && !ctx.userApproved) {
      return { ok: false, code: 'PROTECTED_ITEM', message: `Item ${op.key} is protected` };
    }

    currentBrain.items = currentBrain.items.filter((i) => i.key !== op.key);
    currentBrain.links = currentBrain.links.filter((link) => link.from !== op.key && link.to !== op.key);
    return { ok: true, key: op.key };
  }

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];

    if (op.op === 'create') {
      results[i] = createItem(op, i);
    } else if (op.op === 'update') {
      results[i] = applyUpdate(op);
    } else if (op.op === 'delete') {
      results[i] = applyDelete(op);
    } else if (op.op === 'link') {
      const resolved = resolveEndpoint(op.from);
      const resolvedTo = resolveEndpoint(op.to);
      if (resolved.deferred || resolvedTo.deferred) {
        deferredLinks.push({ index: i, op });
        results[i] = { ok: true, key: '' };
      } else {
        results[i] = applyLinkOrUnlink(op);
      }
    } else if (op.op === 'unlink') {
      const resolved = resolveEndpoint(op.from);
      const resolvedTo = resolveEndpoint(op.to);
      if (resolved.deferred || resolvedTo.deferred) {
        // Unlinks cannot be deferred: temp refs must be resolved by now
        results[i] = {
          ok: false,
          code: 'UNKNOWN_REF',
          message: `Link endpoint ${!resolved.deferred ? op.from : op.to} not found`,
        };
      } else {
        results[i] = applyLinkOrUnlink(op);
      }
    }
  }

  // Process deferred links
  for (const { index, op } of deferredLinks) {
    const resolvedFrom = resolveEndpoint(op.from);
    const resolvedTo = resolveEndpoint(op.to);
    if (resolvedFrom.deferred || resolvedTo.deferred) {
      results[index] = {
        ok: false,
        code: 'UNKNOWN_REF',
        message: `Link endpoint ${resolvedFrom.deferred ? op.from : op.to} not found`,
      };
    } else {
      results[index] = applyLinkOrUnlink(op);
    }
  }

  return { brain: currentBrain, results, refs };
}

export function previewApply(brain: Brain, ops: Op[]): Brain {
  const result = applyOps(brain, ops, { actor: 'user', userApproved: true, now: PREVIEW_NOW });
  return result.brain;
}
