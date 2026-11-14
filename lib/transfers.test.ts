import { describe, expect, test } from "bun:test";
import { transferListSchema, type TransferView } from "@/lib/api/schemas";
import { protocolDisplayName } from "@/lib/protocol";
import {
  mergeTransfers,
  transferAmountLabel,
  transferHash,
  transferKey,
  transferTimestamp,
} from "@/lib/transfers";

const SIGNATURE =
  "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW";

const SOLANA = {
  protocol: "wormhole",
  id: "1",
  chain: { id: 1, slug: "solana", name: "Solana" },
};

/** CCTP inbound only: no origin tx, no token metadata, no formatted amount. */
const CCTP_ITEM: TransferView = {
  protocol: "cctp",
  program: "cctp",
  protocol_name: "CCTP",
  direction: "Inbound",
  via: null,
  observed_tx_hash: SIGNATURE,
  event_index: 0,
  message_id: {
    protocol: "cctp",
    source_domain: 0,
    nonce: "ab".repeat(32),
  },
  source: { protocol: "cctp", id: "0", chain: null },
  destination: {
    protocol: "cctp",
    id: "5",
    chain: { id: 1, slug: "solana", name: "Solana" },
  },
  source_wallet: null,
  destination_wallet: "2GvH6NBTBqxVLNnaiWjei2otee4v2e957dGqHhBvBvAy",
  source_tx_hash: null,
  destination_tx_hash: SIGNATURE,
  source_explorer_url: null,
  destination_explorer_url: `https://explorer.solana.com/tx/${SIGNATURE}`,
  token: null,
  token_symbol: null,
  amount_raw: "815182631",
  amount_formatted: null,
  status: "Completed",
};

/** A Portal send with a known token symbol and amount. */
const PORTAL_ITEM: TransferView = {
  protocol: "wormhole",
  program: "token_bridge",
  protocol_name: "Portal",
  direction: "Outbound",
  via: null,
  observed_tx_hash: SIGNATURE,
  event_index: 2,
  message_id: {
    protocol: "wormhole",
    emitter_chain: 2,
    emitter_address: "0".repeat(64),
    sequence: 42,
  },
  source: SOLANA,
  destination: {
    protocol: "wormhole",
    id: "2",
    chain: { id: 2, slug: "ethereum", name: "Ethereum" },
  },
  source_wallet: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
  destination_wallet: null,
  source_tx_hash: SIGNATURE,
  destination_tx_hash: null,
  source_explorer_url: `https://explorer.solana.com/tx/${SIGNATURE}`,
  destination_explorer_url: null,
  token: {
    chain: SOLANA,
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
  token_symbol: "USDC",
  amount_raw: "25000000",
  amount_formatted: "25.0",
  status: "Pending",
};

/** A protocol this frontend does not know yet: it must still render. */
const UNKNOWN_ITEM: TransferView = {
  protocol: "across",
  program: "across_spoke",
  direction: "Inbound",
  via: null,
  observed_tx_hash: SIGNATURE,
  event_index: 4,
  message_id: { protocol: "across", deposit_id: "0xdeadbeef" },
  source: { protocol: "across", id: "42161", chain: null },
  destination: SOLANA,
  source_wallet: null,
  destination_wallet: null,
  source_tx_hash: null,
  destination_tx_hash: null,
  source_explorer_url: null,
  destination_explorer_url: null,
  token: null,
  token_symbol: null,
  amount_raw: null,
  amount_formatted: "1.5",
  status: "Detected",
};

describe("protocolDisplayName", () => {
  test("uses the backend's protocol_name when present", () => {
    expect(protocolDisplayName(CCTP_ITEM)).toBe("CCTP");
    expect(protocolDisplayName(PORTAL_ITEM)).toBe("Portal");
  });

  test("rebuilds the label when protocol_name is missing", () => {
    expect(protocolDisplayName({ protocol: "wormhole", program: "ntt" })).toBe(
      "NTT",
    );
    expect(
      protocolDisplayName({ protocol: "wormhole", program: "nft_bridge" }),
    ).toBe("Portal NFT");
    expect(
      protocolDisplayName({ protocol: "wormhole", program: "token_bridge" }),
    ).toBe("Portal");
    expect(protocolDisplayName({ protocol: "wormhole" })).toBe("Portal");
    expect(protocolDisplayName({ protocol: "cctp" })).toBe("CCTP");
    expect(protocolDisplayName({ protocol: "debridge" })).toBe("deBridge");
    expect(protocolDisplayName({ protocol: "mayan" })).toBe("Mayan");
  });

  test("keeps an unknown protocol's raw value", () => {
    expect(protocolDisplayName(UNKNOWN_ITEM)).toBe("across");
  });
});

describe("transferHash", () => {
  test("prefers the source hash", () => {
    expect(transferHash(PORTAL_ITEM)).toBe(SIGNATURE);
  });

  test("falls back to the destination, then the observed tx", () => {
    expect(transferHash(CCTP_ITEM)).toBe(SIGNATURE);

    expect(
      transferHash({ ...CCTP_ITEM, destination_tx_hash: null }),
    ).toBe(SIGNATURE);

    expect(transferHash(UNKNOWN_ITEM)).toBe(SIGNATURE);
  });
});

describe("transferAmountLabel", () => {
  test("renders nothing when amount_formatted is null", () => {
    expect(transferAmountLabel(CCTP_ITEM)).toBeNull();
  });

  test("appends the token symbol when known", () => {
    expect(transferAmountLabel(PORTAL_ITEM)).toBe("25.0 USDC");
    expect(transferAmountLabel({ ...PORTAL_ITEM, token_symbol: null })).toBe(
      "25.0",
    );
  });
});

describe("transferTimestamp", () => {
  test("uses the indexer's first-seen time when the list provides one", () => {
    expect(transferTimestamp({ ...PORTAL_ITEM, first_seen_at: 1_700_000_000_000 }))
      .toBe(1_700_000_000_000);
  });

  test("falls back to updated_at, then to null", () => {
    expect(transferTimestamp({ ...PORTAL_ITEM, updated_at: 1_700_000_100_000 }))
      .toBe(1_700_000_100_000);
    expect(transferTimestamp(PORTAL_ITEM)).toBeNull();
  });
});

describe("transferListSchema", () => {
  test("parses CCTP, Portal and an unknown protocol in one page", () => {
    const parsed = transferListSchema.parse({
      items: [CCTP_ITEM, PORTAL_ITEM, UNKNOWN_ITEM],
      next_cursor: "opaque-cursor",
    });

    expect(parsed.items).toHaveLength(3);
    expect(parsed.items[0]?.protocol_name).toBe("CCTP");
    expect(parsed.items[2]?.message_id).toEqual({
      protocol: "across",
      deposit_id: "0xdeadbeef",
    });
    expect(parsed.next_cursor).toBe("opaque-cursor");
  });

  test("accepts the end of the list", () => {
    const parsed = transferListSchema.parse({
      items: [],
      next_cursor: null,
    });

    expect(parsed.next_cursor).toBeNull();
  });
});

describe("mergeTransfers", () => {
  test("keeps one row per observed tx and event index", () => {
    expect(transferKey(PORTAL_ITEM)).toBe(`${SIGNATURE}:2`);

    const merged = mergeTransfers([PORTAL_ITEM], [PORTAL_ITEM]);
    expect(merged).toHaveLength(1);
  });

  test("lets the incoming page update a row in place", () => {
    const updated = { ...PORTAL_ITEM, status: "Completed" as const };
    const merged = mergeTransfers([PORTAL_ITEM], [updated]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.status).toBe("Completed");
  });

  test("puts new rows first and keeps older rows after them", () => {
    const merged = mergeTransfers([UNKNOWN_ITEM], [CCTP_ITEM, PORTAL_ITEM]);

    expect(merged.map(transferKey)).toEqual([
      transferKey(CCTP_ITEM),
      transferKey(PORTAL_ITEM),
      transferKey(UNKNOWN_ITEM),
    ]);
  });
});
