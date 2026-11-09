"use client";

import { useEffect, useState } from "react";

type ActiveState = { key: string; id: string | null };

/**
 * Tracks which of the given heading ids is currently in the reading band.
 * Stale ids from a previous page are ignored until the new observer reports.
 */
export function useActiveHeading(ids: string[]) {
	const key = ids.join("|");
	const [state, setState] = useState<ActiveState>({ key, id: null });

	useEffect(() => {
		if (!key) return;

		let observer: IntersectionObserver | undefined;
		const raf = requestAnimationFrame(() => {
			const els = key
				.split("|")
				.map((id) => document.getElementById(id))
				.filter((el): el is HTMLElement => el !== null);

			observer = new IntersectionObserver(
				(entries) => {
					const visible = entries
						.filter((e) => e.isIntersecting)
						.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
					if (visible[0]) setState({ key, id: visible[0].target.id });
				},
				{ rootMargin: "-80px 0px -65% 0px", threshold: 0 },
			);
			els.forEach((el) => observer?.observe(el));
		});

		return () => {
			cancelAnimationFrame(raf);
			observer?.disconnect();
		};
	}, [key]);

	return state.key === key ? state.id : null;
}
