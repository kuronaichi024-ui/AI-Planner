import { APP_NAME } from "@/config/app";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <h1 className="text-h1">{APP_NAME}</h1>
      <p className="max-w-prose text-center text-base-ui text-muted-foreground">
        Turn a vague idea into a structured, build-ready specification that
        humans and AI coding agents can execute.
      </p>
      {process.env.NODE_ENV === "development" && (
        <a
          href="/styleguide"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View style guide →
        </a>
      )}
    </main>
  );
}