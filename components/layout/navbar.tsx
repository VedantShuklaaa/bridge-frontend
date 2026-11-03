import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

/**
 * Placeholder navbar shell. The real floating/centered design and search
 * behaviour land in the navbar task.
 */
export function Navbar() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        aria-label="Primary"
        className="pointer-events-auto flex h-14 w-full max-w-2xl items-center gap-2 rounded-full border border-border bg-background/80 px-3 shadow-sm backdrop-blur-md"
      >
        <Link
          href="/"
          className="rounded-full px-3 py-2 font-heading text-base font-medium tracking-tight transition-colors hover:text-muted-foreground"
        >
          bridgeIndexer
        </Link>
        <div className="flex-1" />
        <Link
          href="/live"
          className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Live
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
