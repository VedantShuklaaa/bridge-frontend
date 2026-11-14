import {
  cctpMessageIdSchema,
  debridgeMessageIdSchema,
  mayanMessageIdSchema,
  wormholeMessageIdSchema,
  type TransactionResponse,
  type TransferView,
} from "@/lib/api/schemas";
import { formatChainView, protocolDisplayName } from "@/lib/protocol";

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

/** The presentation model for a v2 `TransactionResponse`. */
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
  raw: unknown;
};

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
    protocol: transfer ? protocolDisplayName(transfer) : "—",
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
    raw: response,
  };
}