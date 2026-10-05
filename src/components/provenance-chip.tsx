import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Provenance chips per MVP-SPEC §9.4:
 * - USER: solid near-black (inverted in dark)
 * - AI-INFERRED: blue outline
 * - AI-RECOMMENDED: teal outline
 * - PROPOSED: dashed neutral border
 * - OPEN: amber fill
 * Text always included.
 */
const chipVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider font-mono",
  {
    variants: {
      type: {
        user: "bg-[hsl(var(--chip-user-bg))] text-[hsl(var(--chip-user-fg))]",
        "ai-inferred": "border border-[hsl(var(--chip-ai-inferred))] text-[hsl(var(--chip-ai-inferred))] bg-transparent",
        "ai-recommended": "border border-[hsl(var(--chip-ai-recommended))] text-[hsl(var(--chip-ai-recommended))] bg-transparent",
        proposed: "border border-dashed border-[hsl(var(--chip-proposed))] text-[hsl(var(--chip-proposed))] bg-transparent",
        open: "bg-[hsl(var(--chip-open-bg))] text-[hsl(var(--chip-open-fg))] font-medium",
      },
    },
    defaultVariants: {
      type: "user",
    },
  }
);

export interface ProvenanceChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  type: "user" | "ai-inferred" | "ai-recommended" | "proposed" | "open";
  label?: string;
}

export function ProvenanceChip({
  type,
  label,
  className,
  ...props
}: ProvenanceChipProps) {
  const displayLabel =
    label ||
    {
      user: "User",
      "ai-inferred": "AI Inferred",
      "ai-recommended": "AI Recommended",
      proposed: "Proposed",
      open: "Open",
    }[type];

  return (
    <span className={cn(chipVariants({ type }), className)} {...props}>
      {displayLabel}
    </span>
  );
}