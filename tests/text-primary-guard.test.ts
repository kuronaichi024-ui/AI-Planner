import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Recursively list all .tsx files under `dir`, returned as repo-relative paths. */
function listTsxFiles(dir: string, base: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listTsxFiles(full, base));
    } else if (entry.endsWith(".tsx")) {
      out.push(full.slice(base.length + 1).replace(/\\/g, "/"));
    }
  }
  return out;
}

const srcRoot = join(process.cwd(), "src");

describe("No stray text-primary Tailwind class", () => {
  const files = listTsxFiles(srcRoot, srcRoot);

  for (const relative of files) {
    // The shadcn RadioGroup indicator legitimately uses text-primary.
    if (relative === "components/ui/radio-group.tsx") continue;

    it(`should not contain "text-primary" in ${relative}`, () => {
      const content = readFileSync(join(srcRoot, relative), "utf8");
      // Match "text-primary" but NOT "text-primary-foreground" or any other
      // "text-primary-*" utility (which has its own token).
      const matches = [...content.matchAll(/\btext-primary(?!-)\b/g)];
      expect(
        matches,
        `Found "text-primary" in ${relative} (use text-link or the appropriate token)`
      ).toHaveLength(0);
    });
  }
});
