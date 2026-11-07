import { METRICS, METRICS_NOTE } from "@/lib/api/hermit";
import { CountUp } from "./countUp";

export function Metrics() {
	return (
		<div>
			<ul className="grid gap-px overflow-hidden rounded-lg border border-black/10 bg-white/10 sm:grid-cols-2">
				{METRICS.map((m) => (
					<li key={m.label} className="bg-white p-8">
						<p className="font-mono text-5xl tracking-tight sm:text-6xl">
							<CountUp to={m.value} decimals={m.decimals} />
							<span className="text-black/40">{m.suffix}</span>
						</p>
						<p className="mt-4 text-sm font-medium">{m.label}</p>
						<p className="mt-1 text-sm text-black/50">{m.detail}</p>
					</li>
				))}
			</ul>
			<p className="mt-6 text-xs text-black/40">{METRICS_NOTE}</p>
		</div>
	);
}