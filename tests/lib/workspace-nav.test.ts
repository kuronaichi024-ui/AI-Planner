import { describe, it, expect } from 'vitest';
import {
  workspaceHref,
  findSection,
  countKeyForSlug,
  WORKSPACE_SECTIONS,
} from '@/lib/workspace-nav';

describe('workspace-nav', () => {
  describe('workspaceHref', () => {
    it('overview slug empty', () => {
      expect(workspaceHref('proj-1', '')).toBe('/projects/proj-1');
    });

    it('section slug', () => {
      expect(workspaceHref('proj-1', 'requirements')).toBe('/projects/proj-1/requirements');
    });
  });

  describe('findSection', () => {
    it('returns section for valid slug', () => {
      const section = findSection('requirements');
      expect(section).not.toBeNull();
      expect(section?.label).toBe('Requirements');
    });

    it('returns null for overview', () => {
      expect(findSection('')).toBeNull();
    });

    it('returns null for unknown slug', () => {
      expect(findSection('unknown')).toBeNull();
    });
  });

  describe('countKeyForSlug', () => {
    it('maps project section slugs to correct keys', () => {
      expect(countKeyForSlug('requirements')).toBe('requirements');
      expect(countKeyForSlug('features')).toBe('features');
      expect(countKeyForSlug('roles')).toBe('roles');
      expect(countKeyForSlug('screens')).toBe('screens');
      expect(countKeyForSlug('data-model')).toBe('entities');
      expect(countKeyForSlug('rules')).toBe('rules');
      expect(countKeyForSlug('decisions')).toBe('decisions');
      expect(countKeyForSlug('build-plan')).toBe('tasks');
    });

    it('returns null for overview and output sections', () => {
      expect(countKeyForSlug('')).toBeNull();
      expect(countKeyForSlug('prd')).toBeNull();
      expect(countKeyForSlug('agent-prompt')).toBeNull();
    });

    it('returns null for unknown slug', () => {
      expect(countKeyForSlug('unknown')).toBeNull();
    });
  });

  describe('WORKSPACE_SECTIONS', () => {
    it('has 11 unique slugs', () => {
      const slugs = WORKSPACE_SECTIONS.map(s => s.slug);
      expect(new Set(slugs).size).toBe(11);
    });
  });
});