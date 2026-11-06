import { shortHash } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

type DetailFieldProps = {
  label: string;
  value: string | null | undefined;
  copy?: boolean;
  truncate?: boolean;
  mono?: boolean;
  href?: string | null;
};

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export function DetailField({
  label,
  value,
  copy = false,
  truncate = false,
  mono = false,
  href = null,
}: DetailFieldProps) {
  const text = value ?? "";
  const hasValue = text !== "";
  const showCopy = hasValue && (copy || text.length > 20);
  const display = !hasValue
    ? null
    : href !== null
      ? hostOf(href)
      : truncate
        ? shortHash(text, 8, 8)
        : text;

  return (
    <div className="grid gap-1 py-2 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-start sm:gap-3">
      <dt className="text-xs text-muted-foreground sm:pt-0.5 sm:text-sm">
        {label}
      </dt>
      <dd className="flex min-w-0 items-center gap-2 text-sm">
        {!hasValue ? (
          <span className="text-muted-foreground">—</span>
        ) : href !== null ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            title={text}
            className="inline-flex min-w-0 items-center gap-1 truncate font-mono text-xs underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <span className="truncate">{display}</span>
            <span aria-hidden className="shrink-0 text-muted-foreground">
              ↗
            </span>
          </a>
        ) : (
          <span
            title={truncate ? text : undefined}
            className={cn(
              "min-w-0",
              mono && "font-mono text-xs",
              truncate ? "truncate" : "break-all",
            )}
          >
            {display}
          </span>
        )}
        {showCopy ? <CopyButton value={text} label={label} /> : null}
      </dd>
    </div>
  );
}
