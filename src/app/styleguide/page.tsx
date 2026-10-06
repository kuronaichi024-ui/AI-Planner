import { notFound } from "next/navigation";
import { APP_NAME } from "@/config/app";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProvenanceChip } from "@/components/provenance-chip";
import { DialogDemo } from "@/components/dialog-demo";

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-prose py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-h1">{APP_NAME} Style Guide</h1>
          <ThemeToggle />
        </div>

        <section className="mb-8">
          <h2 className="text-h2 mb-4">Color Tokens</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <ColorSwatch label="Background" className="bg-background border" />
            <ColorSwatch label="Foreground" className="bg-foreground" />
            <ColorSwatch label="Primary" className="bg-primary" />
            <ColorSwatch label="Secondary" className="bg-secondary" />
            <ColorSwatch label="Muted" className="bg-muted border" />
            <ColorSwatch label="Accent" className="bg-accent border" />
            <ColorSwatch label="Destructive" className="bg-destructive" />
            <ColorSwatch label="Success" className="bg-success" />
            <ColorSwatch label="Warning" className="bg-warning" />
            <ColorSwatch label="Border" className="bg-border" />
            <ColorSwatch label="Link" className="bg-link" />
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-8">
          <h2 className="text-h2 mb-4">Typography</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">H1 (24/32 semibold)</p>
              <h1 className="text-h1">The quick brown fox</h1>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">H2 (18/28 semibold)</p>
              <h2 className="text-h2">The quick brown fox</h2>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Base (14/20)</p>
              <p className="text-base-ui">The quick brown fox jumps over the lazy dog</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Small (12/16)</p>
              <p className="text-small">The quick brown fox jumps over the lazy dog</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Mono + tabular</p>
              <p className="font-mono tabular-nums">REQ-042 • 1,234.56</p>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-8">
          <h2 className="text-h2 mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-8">
          <h2 className="text-h2 mb-4">Provenance Chips</h2>
          <div className="flex flex-wrap gap-3">
            <ProvenanceChip type="user" />
            <ProvenanceChip type="ai-inferred" />
            <ProvenanceChip type="ai-recommended" />
            <ProvenanceChip type="proposed" />
            <ProvenanceChip type="open" />
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-8">
          <h2 className="text-h2 mb-4">Badges</h2>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-8">
          <h2 className="text-h2 mb-4">Form Elements</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="input-demo">Input</Label>
              <Input id="input-demo" placeholder="Type something..." />
            </div>
            <div>
              <Label htmlFor="textarea-demo">Textarea</Label>
              <Textarea id="textarea-demo" placeholder="Type something..." />
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-8">
          <h2 className="text-h2 mb-4">Dialog</h2>
          <DialogDemo />
        </section>

        <Separator className="my-8" />

        <section className="mb-8">
          <h2 className="text-h2 mb-4">Item List Row</h2>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-muted-foreground">REQ-004</span>
              <span className="flex-1 text-sm">Users must be able to sign in with email and password</span>
              <ProvenanceChip type="user" />
              <Badge variant="outline">Must</Badge>
              <span className="text-xs text-muted-foreground">3 links</span>
            </div>
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-8">
          <h2 className="text-h2 mb-4">Skeleton</h2>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </section>

        <Separator className="my-8" />

        <section className="mb-8">
          <h2 className="text-h2 mb-4">Empty State</h2>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-12 text-center">
            <p className="text-h2 mb-2">No items yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Start by adding your first requirement.
            </p>
            <Button>Add Requirement</Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ColorSwatch({ label, className }: { label: string; className: string }) {
  return (
    <div>
      <div className={`h-16 w-full rounded-md ${className}`} />
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}