"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { DetailRow, DetailSection } from "./DetailRow";
import { ValueWithUSD } from "./ValueWithUSD";
import { GasInfoCompact } from "@/components/common/GasInfoCompact";
import { MoreDetailsToggle } from "./MoreDetailsToggle";
import { TimestampAge } from "@/components/common/TimestampAge";
import JsonViewer from "@/components/ui/json-viewer";
import type { Types } from "aptos";

interface GasInfo {
  gasUsed: string;
  gasPrice: string;
  maxGas?: string;
  gasFee: string;
}

interface Counterparty {
  address: string;
  role: "receiver" | "smartContract";
}

interface TransactionDetailsTableProps {
  hash: string;
  type: string;
  version?: string | null;
  blockHeight?: string | number | null;
  timestamp?: string | null;
  sender?: string | null;
  counterparty?: Counterparty | null;
  functionName?: string | null;
  amount?: string | number | bigint | null;
  gasInfo?: GasInfo | null;
  sequenceNumber?: string | null;
  expirationTimestamp?: string | null;
  vmStatus?: string | null;
  isSuccess?: boolean;
  stateChangeHash?: string | null;
  eventRootHash?: string | null;
  accumulatorRootHash?: string | null;
  signature?: Types.TransactionSignature | null;
  feePayer?: string | null;
  secondarySigners?: string[] | null;
  usdPrice?: number | null;
  actions?: Array<{ type: string; data?: unknown }>;
}

export function TransactionDetailsTable({
  hash,
  type,
  version,
  blockHeight,
  timestamp,
  sender,
  counterparty,
  functionName,
  amount,
  gasInfo,
  sequenceNumber,
  expirationTimestamp,
  vmStatus,
  isSuccess = true,
  stateChangeHash,
  eventRootHash,
  accumulatorRootHash,
  signature,
  feePayer,
  secondarySigners,
  usdPrice,
  actions,
}: TransactionDetailsTableProps) {
  const hasAdvancedDetails =
    sequenceNumber ||
    stateChangeHash ||
    eventRootHash ||
    accumulatorRootHash ||
    signature;

  return (
    <DetailSection>
      {/* Basic Info */}
      <DetailRow label="Transaction Hash">
        <CopyableAddress address={hash} showFull variant="hash" />
      </DetailRow>

      <DetailRow label="Status">
        <Badge variant={isSuccess ? "success" : "error"} className="font-medium">
          {isSuccess ? "Success" : "Failed"}
        </Badge>
      </DetailRow>

      {version && (
        <DetailRow label="Version" tooltip="The version number of this transaction">
          {version}
        </DetailRow>
      )}

      {blockHeight && (
        <DetailRow label="Block" tooltip="The block that contains this transaction">
          <Link
            href={`/block/${blockHeight}`}
            className="text-primary hover:underline"
          >
            {Number(blockHeight).toLocaleString()}
          </Link>
        </DetailRow>
      )}

      {timestamp && (
        <DetailRow label="Timestamp">
          <TimestampAge timestamp={timestamp} />
        </DetailRow>
      )}

      <DetailRow label="Type">
        <Badge variant="secondary" className="capitalize text-xs">
          {type.replace(/_/g, " ")}
        </Badge>
      </DetailRow>

      {/* Addresses */}
      {sender && (
        <DetailRow label="From">
          <CopyableAddress address={sender} href={`/account/${sender}`} showFull showLabel />
        </DetailRow>
      )}

      {feePayer && feePayer !== sender && (
        <DetailRow label="Fee Payer" tooltip="The account that paid for this transaction">
          <CopyableAddress address={feePayer} href={`/account/${feePayer}`} showFull showLabel />
        </DetailRow>
      )}

      {secondarySigners && secondarySigners.length > 0 && (
        <DetailRow label="Secondary Signers">
          <div className="space-y-1">
            {secondarySigners.map((addr, i) => (
              <div key={i}>
                <CopyableAddress address={addr} href={`/account/${addr}`} showFull showLabel />
              </div>
            ))}
          </div>
        </DetailRow>
      )}

      {counterparty && (
        <DetailRow
          label={counterparty.role === "receiver" ? "To" : "Interacted With"}
          tooltip={
            counterparty.role === "receiver"
              ? "The recipient of this transaction"
              : "The smart contract this transaction interacted with"
          }
        >
          <CopyableAddress
            address={counterparty.address}
            href={`/account/${counterparty.address}`}
            showFull
            showLabel
          />
        </DetailRow>
      )}

      {functionName && (
        <DetailRow label="Function" tooltip="The function called in this transaction">
          <code className="font-mono text-sm bg-muted px-2 py-0.5 rounded break-all">
            {functionName}
          </code>
        </DetailRow>
      )}

      {/* Value */}
      {amount && Number(amount) > 0 && (
        <DetailRow label="Value">
          <ValueWithUSD amount={amount} usdPrice={usdPrice} />
        </DetailRow>
      )}

      {/* Gas Info */}
      {gasInfo && (
        <DetailRow label="Transaction Fee" tooltip="The fee paid for this transaction">
          <GasInfoCompact
            gasUsed={gasInfo.gasUsed}
            maxGas={gasInfo.maxGas}
            gasPrice={gasInfo.gasPrice}
            gasFee={gasInfo.gasFee}
            usdPrice={usdPrice}
          />
        </DetailRow>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <DetailRow label="Actions">
          <div className="flex flex-wrap gap-2">
            {actions.map((action, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {action.type}
              </Badge>
            ))}
          </div>
        </DetailRow>
      )}

      {/* VM Status - moved to basic info */}
      {vmStatus && (
        <DetailRow label="VM Status" tooltip="The virtual machine execution status">
          <Badge
            variant={isSuccess ? "success" : "error"}
            className="text-xs"
          >
            {vmStatus}
          </Badge>
        </DetailRow>
      )}

      {/* Expiration - moved to basic info */}
      {expirationTimestamp && (
        <DetailRow
          label="Expiration"
          tooltip="The time after which this transaction expires"
        >
          {new Date(parseInt(expirationTimestamp) * 1000).toLocaleString()}
        </DetailRow>
      )}

      {/* Advanced Details */}
      {hasAdvancedDetails && (
        <MoreDetailsToggle>
          {sequenceNumber && (
            <DetailRow
              label="Sequence Number"
              tooltip="The sequence number of the sender's account"
            >
              {sequenceNumber}
            </DetailRow>
          )}

          {stateChangeHash && (
            <DetailRow label="State Change Hash">
              <CopyableAddress address={stateChangeHash} showFull variant="hash" />
            </DetailRow>
          )}

          {eventRootHash && (
            <DetailRow label="Event Root Hash">
              <CopyableAddress address={eventRootHash} showFull variant="hash" />
            </DetailRow>
          )}

          {accumulatorRootHash && (
            <DetailRow label="Accumulator Root Hash">
              <CopyableAddress address={accumulatorRootHash} showFull variant="hash" />
            </DetailRow>
          )}

          {signature && (
            <DetailRow label="Signature" isLast>
              <div className="max-w-full overflow-auto">
                <JsonViewer data={signature} initialDepth={1} />
              </div>
            </DetailRow>
          )}
        </MoreDetailsToggle>
      )}
    </DetailSection>
  );
}
