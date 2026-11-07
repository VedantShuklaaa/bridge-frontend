"use client";

import { NavbarSearch } from "@/components/layout/navbar-search";
import { TxsFeed } from "./txs-feed";

/**
 * The `/txs` route: the search hero from the landing page, then the live
 * transfer feed. Keeping the search and the feed in one client boundary lets
 * the feed sit directly under the search without an extra server round trip.
 */
export function TxsView({ pageParam }: { pageParam?: string }) {
  return (
    <section className="mx-auto mt-20 flex w-full max-w-5xl flex-col gap-10 px-4 py-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <h1 className="text-3xl">bridgeIndexer</h1>
        <p className="text-muted-foreground">
          Search a Solana transaction to inspect its bridge transfers.
        </p>
        <NavbarSearch />
      </div>

      <TxsFeed pageParam={pageParam} />
    </section>
  );
}
