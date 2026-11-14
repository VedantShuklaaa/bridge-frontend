import {
  cctpMessageIdSchema,
  debridgeMessageIdSchema,
  mayanMessageIdSchema,
  wormholeMessageIdSchema,
  type ChainView,
  type TransactionResponse,
  type TransferView,
} from "@/lib/api/schemas";
import { formatChain } from "@/lib/format";
import type { BridgeEvent, ChainId, StoreEntry } from "@/types/hermit";

export type DetailMessageField = {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
  copy?: boolean;
};

/** A protocol-specific message identity, rendered as one section. */
export type DetailMessage = {
  title: string;
  fields: DetailMessageField[];
};

/**
 * One presentation model for both sources: a live `StreamFrame` and the v2
 * `TransactionResponse` fetched for a direct link.
 */
export type DetailView = {
  hash: string;
  txStatus: string;
  slot: number | null;
  timestamp: number | null;
  signer: string | null;
  feeLamports: number | null;
  sourceChain: string | null;
  destinationChain: string | null;
  direction: string | null;
  protocol: string;
  transferStatus: string | null;
  transferCount: number;
  sourceTxHash: string | null;
  sourceWallet: string | null;
  sourceExplorerUrl: string | null;
  destinationTxHash: string | null;
  destinationWallet: string | null;
  destinationExplorerUrl: string | null;
  tokenAddress: string | null;
  tokenSymbol: string | null;
  amountFormatted: string | null;
  amountRaw: string | null;
  message: DetailMessage | null;
  bridgeEvent: BridgeEvent | null;
  raw: unknown;
};

function directionFor(source: ChainId, destination: ChainId): string {
  return destination === "Solana" && source !== "Solana"
    ? "Inbound"
    : "Outbound";
}

/** Prefer the backend's display name; fall back for older responses. */
function protocolLabel(transfer: TransferView): string {
  if (transfer.protocol_name) {
    return transfer.protocol_name;
  }

  return transfer.protocol === "wormhole" ? "Wormhole" : transfer.protocol;
}

const CHAIN_ID_NOUN: Record<string, string> = {
  wormhole: "Wormhole chain",
  cctp: "CCTP domain",
  debridge: "deBridge chain",
};

function formatChainView(view: ChainView): string {
  if (view.chain) {
    return view.chain.name;
  }

  return `Unknown (${CHAIN_ID_NOUN[view.protocol] ?? view.protocol} ${view.id})`;
}

function wormholeMessage(
  emitterChain: string,
  emitterAddress: string,
  sequence: string,
): DetailMessage {
  return {
    title: "Wormhole message",
    fields: [
      { label: "Emitter chain", value: emitterChain },
      {
        label: "Emitter address",
        value: emitterAddress,
        mono: true,
        truncate: true,
        copy: true,
      },
      { label: "Sequence", value: sequence, mono: true },
    ],
  };
}

function messageFromTransfer(transfer: TransferView): DetailMessage | null {
  const id = transfer.message_id;

  const wormhole = wormholeMessageIdSchema.safeParse(id);
  if (wormhole.success) {
    return wormholeMessage(
      String(wormhole.data.emitter_chain),
      wormhole.data.emitter_address,
      String(wormhole.data.sequence),
    );
  }

  const cctp = cctpMessageIdSchema.safeParse(id);
  if (cctp.success) {
    return {
      title: "CCTP message",
      fields: [
        { label: "Source domain", value: String(cctp.data.source_domain) },
        {
          label: "Nonce",
          value: cctp.data.nonce,
          mono: true,
          truncate: true,
          copy: true,
        },
      ],
    };
  }

  const debridge = debridgeMessageIdSchema.safeParse(id);
  if (debridge.success) {
    return {
      title: "deBridge order",
      fields: [
        {
          label: "Order ID",
          value: debridge.data.order_id,
          mono: true,
          truncate: true,
          copy: true,
        },
      ],
    };
  }

  const mayan = mayanMessageIdSchema.safeParse(id);
  if (mayan.success) {
    return {
      title: "Mayan order",
      fields: [
        {
          label: "Order hash",
          value: mayan.data.order_hash,
          mono: true,
          truncate: true,
          copy: true,
        },
      ],
    };
  }

  return null;
}

export function detailFromEntry(entry: StoreEntry): DetailView {
  const frame = entry.frame;
  const transfer = frame.bridge_transfer;

  return {
    hash: frame.hash,
    txStatus: frame.status,
    slot: frame.slot,
    timestamp: frame.timestamp,
    signer: frame.signer,
    feeLamports: frame.fee_lamports,
    sourceChain: transfer ? formatChain(transfer.source_chain) : null,
    destinationChain: transfer ? formatChain(transfer.destination_chain) : null,
    direction: transfer
      ? directionFor(transfer.source_chain, transfer.destination_chain)
      : null,
    // Live frames are Wormhole-shaped and carry no display name yet.
    protocol: "Wormhole",
    transferStatus: transfer?.status ?? null,
    transferCount: transfer ? 1 : 0,
    sourceTxHash: transfer?.source_tx_hash ?? null,
    sourceWallet: transfer?.source_wallet ?? null,
    sourceExplorerUrl: transfer?.source_explorer_url ?? null,
    destinationTxHash: transfer?.destination_tx_hash ?? null,
    destinationWallet: transfer?.destination_wallet ?? null,
    destinationExplorerUrl: transfer?.destination_explorer_url ?? null,
    tokenAddress: transfer?.token ?? null,
    tokenSymbol: transfer?.token_symbol ?? null,
    amountFormatted: transfer?.amount_formatted ?? null,
    amountRaw: transfer?.amount ?? null,
    message: transfer
      ? wormholeMessage(
        String(transfer.message_id.emitter_chain),
        transfer.message_id.emitter_address,
        String(transfer.message_id.sequence),
      )
      : null,
    bridgeEvent: frame.bridge_event,
    raw: frame,
  };
}

export function detailFromResponse(response: TransactionResponse): DetailView {
  const transfer = response.transfers[0] ?? null;

  return {
    hash: response.hash,
    txStatus: response.status,
    slot: response.slot,
    timestamp: response.timestamp,
    signer: response.signer,
    feeLamports: response.fee_lamports,
    sourceChain: transfer ? formatChainView(transfer.source) : null,
    destinationChain: transfer
      ? formatChainView(transfer.destination)
      : null,
    direction: transfer?.direction ?? null,
    protocol: transfer ? protocolLabel(transfer) : "Wormhole",
    transferStatus: transfer?.status ?? null,
    transferCount: response.transfers.length,
    sourceTxHash: transfer?.source_tx_hash ?? null,
    sourceWallet: transfer?.source_wallet ?? null,
    sourceExplorerUrl: transfer?.source_explorer_url ?? null,
    destinationTxHash: transfer?.destination_tx_hash ?? null,
    destinationWallet: transfer?.destination_wallet ?? null,
    destinationExplorerUrl: transfer?.destination_explorer_url ?? null,
    tokenAddress: transfer?.token?.address ?? null,
    tokenSymbol: transfer?.token_symbol ?? null,
    amountFormatted: transfer?.amount_formatted ?? null,
    amountRaw: transfer?.amount_raw ?? null,
    message: transfer ? messageFromTransfer(transfer) : null,
    bridgeEvent: null,
    raw: response,
  };
}