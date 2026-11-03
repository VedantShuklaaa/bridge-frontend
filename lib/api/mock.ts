import type { TransferView } from "./schemas";

/**
 * MOCK: bridgeIndexer has no list or stats endpoint yet.
 *
 * TODO(backend): replace this object with real endpoint calls, keeping the
 * `IndexerDataLayer` interface in `lib/api/index.ts` unchanged. Components must
 * import the data layer from `lib/api`, never this file directly.
 */
export const mockIndexerData = {
  async listTransfers(): Promise<{
    transfers: TransferView[];
    nextCursor: string | null;
  }> {
    return { transfers: [], nextCursor: null };
  },

  async getStats(): Promise<{
    totalTransactions: number;
    totalTransfers: number;
    updatedAt: string;
  }> {
    return {
      totalTransactions: 0,
      totalTransfers: 0,
      updatedAt: new Date().toISOString(),
    };
  },
};
