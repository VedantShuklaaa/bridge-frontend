import type { LiveConnectionStatus } from "@/types/hermit";

const LABEL: Record<LiveConnectionStatus, string> = {
  connecting: "connecting",
  open: "live",
  reconnecting: "reconnecting",
  closed: "disconnected",
};

export function LiveStatusBadge({ status }: { status: LiveConnectionStatus }) {
  const isOpen = status === "open";
  const isWaiting = status === "connecting" || status === "reconnecting";

  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full border border-current ${
          isOpen ? "bg-current" : "bg-transparent"
        } ${isWaiting ? "motion-safe:animate-pulse" : ""}`}
      />
      {LABEL[status]}
    </span>
  );
}
