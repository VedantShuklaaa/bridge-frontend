import { HERMIT } from "@/lib/api/hermit";

export function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-black/10 py-10 font-mono text-sm text-black/50">
      <span>built by Vedant Shukla</span>
      <span className="flex gap-6">
        <a
          href={HERMIT.repo}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-black"
        >
          GitHub ↗
        </a>
        <a href={HERMIT.home} className="transition-colors hover:text-black">
          All projects
        </a>
      </span>
    </footer>
  );
}