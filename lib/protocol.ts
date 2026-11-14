import type { ChainView } from "@/lib/api/schemas";

/** The protocol fields a display name can be derived from. */
export type ProtocolIdentity = {
  protocol: string;
  program?: string | null;
  protocol_name?: string | null;
};

/**
 * The label shown for a transfer's protocol.
 *
 * The backend's `protocol_name` is authoritative when present. Older or
 * partial responses omit it, so the stored `protocol` plus `program` are used
 * to rebuild the same names the backend would have sent.
 */
export function protocolDisplayName({
  protocol,
  program,
  protocol_name,
}: ProtocolIdentity): string {
  if (protocol_name) {
    return protocol_name;
  }

  const name = protocol.toLowerCase();
  const programName = program?.toLowerCase();

  if (name === "wormhole") {
    if (programName === "ntt") {
      return "NTT";
    }

    if (programName === "nft_bridge") {
      return "Portal NFT";
    }

    return "Portal";
  }

  if (name === "cctp") {
    return "CCTP";
  }

  if (name === "debridge") {
    return "deBridge";
  }

  if (name === "mayan") {
    return "Mayan";
  }

  return protocol;
}

const CHAIN_ID_NOUN: Record<string, string> = {
  wormhole: "Wormhole chain",
  cctp: "CCTP domain",
  debridge: "deBridge chain",
};

/**
 * A chain reference as display text. A resolved chain uses its registry name;
 * an unresolved one keeps the protocol's own id so the row is still readable.
 */
export function formatChainView(view: ChainView): string {
  if (view.chain) {
    return view.chain.name;
  }

  return `Unknown (${CHAIN_ID_NOUN[view.protocol] ?? view.protocol} ${view.id})`;
}
