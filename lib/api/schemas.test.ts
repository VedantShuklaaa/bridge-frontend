import { describe, expect, test } from "bun:test";
import { transactionResponseSchema } from "./schemas";

const SIGNATURE =
  "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW";

const BSC_CHAIN = {
  protocol: "wormhole",
  id: "4",
  chain: { id: 3, slug: "bsc", name: "BNB Smart Chain" },
};

const SOLANA_CHAIN = {
  protocol: "wormhole",
  id: "1",
  chain: { id: 1, slug: "solana", name: "Solana" },
};

/** A Completed Inbound wormhole transfer BSC -> Solana with unknown token metadata. */
const INBOUND_WORMHOLE_SAMPLE = {
  hash: SIGNATURE,
  chain: SOLANA_CHAIN,
  status: "Success",
  slot: 312_345_678,
  timestamp: 1_762_243_200,
  fee_lamports: 5_000,
  signer: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
  transfers: [
    {
      protocol: "wormhole",
      direction: "Inbound",
      via: null,
      observed_tx_hash: SIGNATURE,
      event_index: 1,
      message_id: {
        protocol: "wormhole",
        emitter_chain: 4,
        emitter_address: "0".repeat(64),
        sequence: 987_654_321,
      },
      source: BSC_CHAIN,
      destination: SOLANA_CHAIN,
      source_wallet: null,
      destination_wallet: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
      source_tx_hash: `0x${"ab".repeat(32)}`,
      destination_tx_hash: SIGNATURE,
      source_explorer_url: `https://bscscan.com/tx/0x${"ab".repeat(32)}`,
      destination_explorer_url: `https://explorer.solana.com/tx/${SIGNATURE}`,
      token: {
        chain: BSC_CHAIN,
        address: `0x${"cd".repeat(20)}`,
      },
      token_symbol: null,
      amount_raw: "25000000000000000000",
      amount_formatted: "25.0",
      status: "Completed",
    },
  ],
};

describe("transactionResponseSchema", () => {
  test("parses an Inbound Completed wormhole transfer with null token metadata", () => {
    const parsed = transactionResponseSchema.parse(INBOUND_WORMHOLE_SAMPLE);
    const [transfer] = parsed.transfers;

    expect(transfer.direction).toBe("Inbound");
    expect(transfer.status).toBe("Completed");
    expect(transfer.message_id).toEqual({
      protocol: "wormhole",
      emitter_chain: 4,
      emitter_address: "0".repeat(64),
      sequence: 987_654_321,
    });
    expect(transfer.token_symbol).toBeNull();
    expect(transfer.via).toBeNull();
    expect(transfer.source_wallet).toBeNull();
    expect(transfer.amount_raw).toBe("25000000000000000000");
    expect(transfer.amount_formatted).toBe("25.0");
    expect(parsed.timestamp).toBe(1_762_243_200);
  });

  test("rejects a message_id whose protocol is not a known variant", () => {
    const invalid = {
      ...INBOUND_WORMHOLE_SAMPLE,
      transfers: [
        {
          ...INBOUND_WORMHOLE_SAMPLE.transfers[0],
          message_id: { protocol: "cctp", domain: 0, nonce: 1 },
        },
      ],
    };

    expect(transactionResponseSchema.safeParse(invalid).success).toBe(false);
  });
});
