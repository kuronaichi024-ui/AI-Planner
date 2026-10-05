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
        user: "bg-foreground text-background",
        "ai-inferred": "border border-primary text-primary bg-transparent",
        "ai-recommended": "border border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400 bg-transparent",
        proposed: "border border-dashed border-muted-foreground text-muted-foreground bg-transparent",
        open: "bg-warning text-warning-foreground font-medium",
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