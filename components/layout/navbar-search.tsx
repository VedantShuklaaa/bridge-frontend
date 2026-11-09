"use client";

import { BorderBeam } from "border-beam";
import { useReducedMotion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { isValidSolanaSignature } from "@/lib/security";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 128;
/** Matches the h-11 / rounded-full search pill. */
const SEARCH_RADIUS = 22;
const INVALID_MESSAGE =
  "That is not a Solana transaction signature. Expected 86–88 base58 characters.";

/**
 * Reads the current route so the search field can mirror `/txs/[hash]` without
 * navigating. The field is keyed by that hash, which resets its state on every
 * transaction change without a set-state-in-effect.
 */
export function NavbarSearch() {
  const params = useParams<{ hash?: string | string[] }>();
  const routeHash = typeof params?.hash === "string" ? params.hash : null;

  return (
    <SearchField key={routeHash ?? ""} initialValue={routeHash ?? ""} />
  );
}

function SearchField({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isPending, startTransition] = useTransition();

  const beamActive =
    reduceMotion !== true && (focused || hovered || isPending);

  // "/" focuses the field unless the user is already typing somewhere.
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.defaultPrevented || event.key !== "/") {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      if (
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }

      event.preventDefault();
      inputRef.current?.focus();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function submit() {
    const trimmed = query.trim();

    if (trimmed.length === 0) {
      inputRef.current?.focus();
      return;
    }

    if (!isValidSolanaSignature(trimmed)) {
      setError(INVALID_MESSAGE);
      return;
    }

    setError(null);
    setQuery(trimmed);
    startTransition(() => {
      router.push(`/txs/${encodeURIComponent(trimmed)}`);
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit();
  }

  function handleFormKeyDown(event: ReactKeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    setError(null);

    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      active.blur();
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value);
    setError(null);
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").trim();
    event.preventDefault();

    const input = event.currentTarget;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const next =
      `${input.value.slice(0, start)}${pasted}${input.value.slice(end)}`.slice(
        0,
        MAX_LENGTH,
      );

    setQuery(next);
    setError(null);
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }

    setFocused(false);
  }

  return (
    <div
      className="relative min-w-0 flex-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
    >
      <BorderBeam
        size="md"
        colorVariant="mono"
        strength={0.7}
        borderRadius={SEARCH_RADIUS}
        theme="light"
        active={beamActive}
        className="w-full"
      >
        <form
          role="search"
          onSubmit={handleSubmit}
          onKeyDown={handleFormKeyDown}
          className={cn(
            "flex h-11 w-full items-center gap-1.5 rounded-full border border-border bg-background/80 px-2.5 backdrop-blur-sm transition-colors sm:gap-2 sm:px-3",
            focused && "border-ring/70 ring-1 ring-ring/40",
          )}
        >
          <SearchIcon className="hidden size-4 shrink-0 text-muted-foreground sm:block" />

          <label htmlFor="navbar-search" className="sr-only">
            Search a Solana transaction signature
          </label>
          <input
            ref={inputRef}
            id="navbar-search"
            type="text"
            value={query}
            onChange={handleChange}
            onPaste={handlePaste}
            maxLength={MAX_LENGTH}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Search signature"
            aria-keyshortcuts="/"
            aria-invalid={error !== null}
            aria-describedby={error ? "navbar-search-error" : undefined}
            className="min-w-0 flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:font-sans placeholder:text-muted-foreground"
          />

          <kbd
            aria-hidden
            className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground md:inline-block"
          >
            /
          </kbd>

          <button
            type="submit"
            disabled={isPending}
            aria-label={isPending ? "Searching" : "Search transaction"}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-95"
          >
            {isPending ? (
              <SpinnerIcon className="size-3.5 motion-safe:animate-spin" />
            ) : (
              <ArrowIcon className="size-3.5" />
            )}
          </button>
        </form>
      </BorderBeam>

      <p
        id="navbar-search-error"
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-none absolute top-full left-3 z-10 mt-2 max-w-[min(22rem,90vw)] rounded-md border border-border bg-background/95 px-2.5 py-1.5 text-xs text-foreground shadow-sm backdrop-blur transition-opacity duration-150 motion-reduce:transition-none",
          error ? "opacity-100" : "opacity-0",
        )}
      >
        {error ?? ""}
      </p>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className={className}
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </svg>
  );
}
