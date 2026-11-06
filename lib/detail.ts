import type {
  ChainView,
  TransactionResponse,
  TransferView,
} from "@/lib/api/schemas";
import { formatChain } from "@/lib/format";
import type { BridgeEvent, ChainId, StoreEntry } from "@/types/hermit";

export type DetailMessage = {
  emitterChain: string;
  emitterAddress: string;
  sequence: string;
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

function protocolLabel(protocol: string): string {
  return protocol === "wormhole" ? "Wormhole" : protocol;
}

function formatChainView(view: ChainView): string {
  return view.chain?.name ?? `${view.protocol} ${view.id}`;
}

function messageFromTransfer(transfer: TransferView): DetailMessage | null {
  if (transfer.message_id.protocol !== "wormhole") {
    return null;
  }

  return {
    emitterChain: String(transfer.message_id.emitter_chain),
    emitterAddress: transfer.message_id.emitter_address,
    sequence: String(transfer.message_id.sequence),
  };
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
      ? {
          emitterChain: String(transfer.message_id.emitter_chain),
          emitterAddress: transfer.message_id.emitter_address,
          sequence: String(transfer.message_id.sequence),
        }
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
    protocol: transfer ? protocolLabel(transfer.protocol) : "Wormhole",
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
