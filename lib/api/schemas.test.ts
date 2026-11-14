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
      program: "token_bridge",
      protocol_name: "Portal",
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

/** A real-shaped CCTP completion: unresolved source domain, no token metadata. */
const CCTP_TRANSFER = {
  protocol: "cctp",
  program: "cctp",
  protocol_name: "CCTP",
  direction: "Inbound",
  via: null,
  observed_tx_hash: SIGNATURE,
  event_index: 0,
  message_id: {
    protocol: "cctp",
    source_domain: 37,
    nonce: "1f5e7bea3e2a18309176bf2b63e4ceb33a129054e9707ac85151dc58d292fd97",
  },
  source: { protocol: "cctp", id: "37", chain: null },
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

function withTransfer(transfer: Record<string, unknown>) {
  return { ...INBOUND_WORMHOLE_SAMPLE, transfers: [transfer] };
}

describe("transactionResponseSchema", () => {
  test("parses an Inbound Completed wormhole transfer with null token metadata", () => {
    const parsed = transactionResponseSchema.parse(INBOUND_WORMHOLE_SAMPLE);
    const [transfer] = parsed.transfers;

    expect(transfer.direction).toBe("Inbound");
    expect(transfer.status).toBe("Completed");
    expect(transfer.protocol_name).toBe("Portal");
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

  test("parses a CCTP transfer with an unresolved source chain and no token", () => {
    const parsed = transactionResponseSchema.parse(withTransfer(CCTP_TRANSFER));
    const [transfer] = parsed.transfers;

    expect(transfer.protocol_name).toBe("CCTP");
    expect(transfer.message_id).toEqual(CCTP_TRANSFER.message_id);
    expect(transfer.source.chain).toBeNull();
    expect(transfer.token).toBeNull();
    expect(transfer.amount_formatted).toBeNull();
    expect(transfer.amount_raw).toBe("815182631");
  });

  test("parses deBridge and Mayan message ids", () => {
    for (const message_id of [
      { protocol: "debridge", order_id: "ab".repeat(32) },
      { protocol: "mayan", order_hash: "cd".repeat(32) },
    ]) {
      const result = transactionResponseSchema.safeParse(
        withTransfer({ ...CCTP_TRANSFER, message_id }),
      );
      expect(result.success).toBe(true);
    }
  });

  test("tolerates an unrecognised protocol in message_id", () => {
    const result = transactionResponseSchema.safeParse(
      withTransfer({
        ...INBOUND_WORMHOLE_SAMPLE.transfers[0],
        message_id: { protocol: "someday", anything: 1 },
      }),
    );

    expect(result.success).toBe(true);
  });

  test("still rejects a message_id with no protocol", () => {
    const result = transactionResponseSchema.safeParse(
      withTransfer({
        ...INBOUND_WORMHOLE_SAMPLE.transfers[0],
        message_id: { sequence: 1 },
      }),
    );

    expect(result.success).toBe(false);
  });
});