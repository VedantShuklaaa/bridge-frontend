import { mockIndexerData } from "./mock";
import type { TransferView } from "./schemas";

export * from "./schemas";
export * from "./errors";
export * from "./client";
export * from "./live";

export type TransferListQuery = {
  limit?: number;
  cursor?: string | null;
};

export type TransferListPage = {
  transfers: TransferView[];
  nextCursor: string | null;
};

export type IndexerStats = {
  totalTransactions: number;
  totalTransfers: number;
  updatedAt: string;
};

/** The data layer components use. No endpoint for these exists yet. */
export type IndexerDataLayer = {
  listTransfers(query?: TransferListQuery): Promise<TransferListPage>;
  getStats(): Promise<IndexerStats>;
};

// TODO(backend): swap the mock for the real implementation in one place.
export const indexerData: IndexerDataLayer = mockIndexerData;
