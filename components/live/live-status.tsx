import type { LiveStatus } from "@/hooks/use-live-stream";

const LABEL: Record<LiveStatus, string> = {
	connecting: "connecting",
	open: "live",
	closed: "disconnected",
};

export function LiveStatusBadge({ status }: { status: LiveStatus }) {
	return (
		<span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
			<span
				className={`h-2 w-2 rounded-full border border-current ${status === "open" ? "bg-current" : "bg-transparent"
					}`}
			/>
			{LABEL[status]}
		</span>
	);
}