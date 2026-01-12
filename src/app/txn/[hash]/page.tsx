"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { useGetTransaction } from "@/hooks/transactions/useGetTransaction";
import { useGetBlockByVersion } from "@/hooks/blocks/useGetBlock";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { Types } from "aptos";
import { Card, CardContent, SectionCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { JsonViewer } from "@/components/ui/json-viewer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  LayoutDashboard,
  Wallet,
  Activity,
  Code,
  GitCommit,
} from "lucide-react";
import {
  formatTimestamp,
  getGasInfo,
  getTransactionCounterparty,
  getTransactionFunction,
  getBalanceChanges,
  getTransactionAmount,
  getStorageRefund,
  getTransactionActions,
} from "@/utils/transaction";
import {
  InfoItem,
  BalanceChangeTable,
  ActionsDisplay,
  CollapsibleList,
} from "./components";
import { CopyableAddress } from "@/components/common/CopyableAddress";

export default function TransactionDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const hash = params.hash as string;
  const [showRaw, setShowRaw] = useState(false);

  // Get tab from URL or default to overview
  const tabFromUrl = searchParams.get("tab") || "overview";
  const validTabs = ["overview", "balance", "events", "payload", "changes"];

  const [currentTab, setCurrentTab] = useState(() =>
    validTabs.includes(tabFromUrl) ? tabFromUrl : "overview"
  );

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && validTabs.includes(tab)) {
      setCurrentTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", value);
    router.push(`/txn/${hash}?${newParams.toString()}`, { scroll: false });
  };

  const { data: tx, isLoading, error } = useGetTransaction(hash);

  // Fetch block height based on transaction version
  const version = tx && "version" in tx ? tx.version : null;
  const { data: blockData } = useGetBlockByVersion({
    version: version ? parseInt(version) : 0,
    withTransactions: false,
  });
  // Basic fields
  const {
    isSuccess,
    txVersion,
    timestamp,
    sender,
    sequenceNumber,
    expirationTimestamp,
    vmStatus,
    stateChangeHash,
    eventRootHash,
    accumulatorRootHash,
    signature,
    feePayer,
    secondarySigners,
    gasInfo,
    payload,
    events,
    changes,
    balanceChanges,
    transactionAmount,
    storageRefund,
    transactionActions,
    counterparty,
    functionName,
  } = useMemo(() => {
    if (!tx) {
      return {
        isSuccess: true,
        txVersion: null,
        timestamp: null,
        sender: null,
        sequenceNumber: null,
        expirationTimestamp: null,
        vmStatus: null,
        stateChangeHash: null,
        eventRootHash: null,
        accumulatorRootHash: null,
        signature: null,
        feePayer: undefined,
        secondarySigners: undefined,
        gasInfo: null,
        payload: null,
        events: [],
        changes: [],
        balanceChanges: [],
        transactionAmount: null,
        storageRefund: null,
        transactionActions: [],
        counterparty: null,
        functionName: null,
      };
    }

    const isSuccess = "success" in tx ? tx.success : true;
    const txVersion = "version" in tx ? tx.version : null;
    const timestamp = "timestamp" in tx ? tx.timestamp : null;
    const sender = "sender" in tx ? (tx as Types.UserTransaction).sender : null;

    // Additional fields
    const sequenceNumber =
      "sequence_number" in tx
        ? (tx as Types.UserTransaction).sequence_number
        : null;
    const expirationTimestamp =
      "expiration_timestamp_secs" in tx
        ? (tx as Types.UserTransaction).expiration_timestamp_secs
        : null;
    const vmStatus = "vm_status" in tx ? tx.vm_status : null;
    const stateChangeHash =
      "state_change_hash" in tx ? tx.state_change_hash : null;
    const eventRootHash = "event_root_hash" in tx ? tx.event_root_hash : null;
    const accumulatorRootHash =
      "accumulator_root_hash" in tx ? tx.accumulator_root_hash : null;
    const signature =
      "signature" in tx ? (tx as Types.UserTransaction).signature : null;

    // Fee payer & secondary signers
    let feePayer: string | undefined;
    let secondarySigners: string[] | undefined;
    if (signature) {
      if ("fee_payer_address" in signature) {
        feePayer = (signature as { fee_payer_address?: string })
          .fee_payer_address;
      }
      if ("secondary_signer_addresses" in signature) {
        secondarySigners = (
          signature as { secondary_signer_addresses?: string[] }
        ).secondary_signer_addresses;
      }
    }

    const gasInfo = getGasInfo(tx);
    const payload =
      "payload" in tx ? (tx as Types.UserTransaction).payload : null;
    const events = "events" in tx ? tx.events : [];
    const changes = "changes" in tx ? tx.changes : [];
    const balanceChanges = getBalanceChanges(tx);

    // New fields
    const transactionAmount = getTransactionAmount(tx);
    const storageRefund = getStorageRefund(tx);
    const transactionActions = getTransactionActions(tx);

    // Counterparty and function
    const counterparty = getTransactionCounterparty(tx);
    const functionName = getTransactionFunction(tx);

    return {
      isSuccess,
      txVersion,
      timestamp,
      sender,
      sequenceNumber,
      expirationTimestamp,
      vmStatus,
      stateChangeHash,
      eventRootHash,
      accumulatorRootHash,
      signature,
      feePayer,
      secondarySigners,
      gasInfo,
      payload,
      events,
      changes,
      balanceChanges,
      transactionAmount,
      storageRefund,
      transactionActions,
      counterparty,
      functionName,
    };
  }, [tx]);

  if (isLoading) {
    return (
      <>
        <PageNavigation title="Transaction Details" />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </>
    );
  }

  // Check if transaction not found
  const isNotFound = error?.type === "Not Found";

  if (isNotFound || (!tx && !isLoading)) {
    return (
      <>
        <PageNavigation title="Transaction Details" />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-center py-12 space-y-4">
                <Search className="w-16 h-16 mx-auto text-muted-foreground" />
                <h2 className="text-xl font-semibold">Transaction Not Found</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  The transaction{" "}
                  <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {hash.slice(0, 20)}...
                  </code>{" "}
                  could not be found on the current network.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check the transaction hash or try a different network.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (error || !tx) {
    return (
      <>
        <PageNavigation title="Transaction Details" />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">
                Failed to load transaction {hash}
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const blockHeight = blockData?.block_height;

  return (
    <>
      <PageNavigation title="Transaction Details" />
      <div className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-2xl font-bold font-heading">
            Transaction Details
          </h1>
          <Badge variant={isSuccess ? "success" : "error"}>
            {isSuccess ? "✓ Success" : "✗ Failed"}
          </Badge>
        </div>
        {/* Transaction Hash */}
        <div className="mb-6">
          <CopyableAddress
            address={tx.hash}
            truncateLength={{ start: 16, end: 16 }}
            className="text-muted-foreground"
          />
        </div>

        {/* Tabs */}
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="space-y-4"
        >
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 py-2 -mx-4 px-4 md:mx-0 md:px-0">
            {/* Mobile: Dropdown Select */}
            <div className="md:hidden">
              <Select value={currentTab} onValueChange={handleTabChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Overview
                    </div>
                  </SelectItem>
                  <SelectItem value="balance">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Balance Change ({balanceChanges.length})
                    </div>
                  </SelectItem>
                  <SelectItem value="events">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Events ({events?.length || 0})
                    </div>
                  </SelectItem>
                  <SelectItem value="payload">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      Payload
                    </div>
                  </SelectItem>
                  <SelectItem value="changes">
                    <div className="flex items-center gap-2">
                      <GitCommit className="w-4 h-4" />
                      Changes ({changes?.length || 0})
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Desktop: Tab Pills */}
            <TabsList className="hidden md:inline-flex w-full justify-center">
              <TabsTrigger value="overview" variant="interactive">
                <LayoutDashboard className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="balance" variant="interactive">
                <Wallet className="w-4 h-4" />
                Balance Change ({balanceChanges.length})
              </TabsTrigger>
              <TabsTrigger value="events" variant="interactive">
                <Activity className="w-4 h-4" />
                Events ({events?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="payload" variant="interactive">
                <Code className="w-4 h-4" />
                Payload
              </TabsTrigger>
              <TabsTrigger value="changes" variant="interactive">
                <GitCommit className="w-4 h-4" />
                Changes ({changes?.length || 0})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="flex justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRaw(!showRaw)}
                className="font-mono text-xs"
              >
                {showRaw ? "Formatted" : "Raw"}
              </Button>
            </div>
            {showRaw ? (
              <JsonViewer data={tx} initialDepth={2} />
            ) : (
              <div className="space-y-4">
                {/* Basic Info */}
                <SectionCard title="Basic Info">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoItem label="Version" value={txVersion} mono />
                    {blockHeight && (
                      <InfoItem label="Block">
                        <Link
                          href={`/block/${blockHeight}`}
                          className="font-mono text-sm text-primary hover:underline"
                        >
                          {blockHeight}
                        </Link>
                      </InfoItem>
                    )}
                    <InfoItem
                      label="Timestamp"
                      value={timestamp ? formatTimestamp(timestamp) : null}
                      mono
                    />
                    <InfoItem label="Type">
                      <Badge variant="secondary" className="capitalize">
                        {tx.type.replace(/_/g, " ")}
                      </Badge>
                    </InfoItem>
                  </div>
                  <InfoItem label="Hash">
                    <CopyableAddress
                      address={tx.hash}
                      showFull
                      variant="hash"
                    />
                  </InfoItem>
                  {sender && (
                    <InfoItem label="Sender">
                      <CopyableAddress
                        address={sender}
                        href={`/account/${sender}`}
                        showFull
                      />
                    </InfoItem>
                  )}
                  {feePayer && (
                    <InfoItem label="Fee Payer">
                      <CopyableAddress
                        address={feePayer}
                        href={`/account/${feePayer}`}
                        showFull
                      />
                    </InfoItem>
                  )}
                  {secondarySigners && secondarySigners.length > 0 && (
                    <InfoItem label="Secondary Signers">
                      <div className="space-y-2">
                        {secondarySigners.map((addr, i) => (
                          <div key={i}>
                            <CopyableAddress
                              address={addr}
                              href={`/account/${addr}`}
                              showFull
                            />
                          </div>
                        ))}
                      </div>
                    </InfoItem>
                  )}
                  {counterparty && (
                    <InfoItem
                      label={
                        counterparty.role === "receiver"
                          ? "Receiver"
                          : "Smart Contract"
                      }
                    >
                      <CopyableAddress
                        address={counterparty.address}
                        href={`/account/${counterparty.address}`}
                        showFull
                      />
                    </InfoItem>
                  )}
                  {functionName && (
                    <InfoItem label="Function">
                      <CopyableAddress address={functionName} showFull />
                    </InfoItem>
                  )}
                  {transactionAmount && (
                    <InfoItem
                      label="Amount"
                      value={`${(Number(transactionAmount) / 1e8).toFixed(
                        8
                      )} MOVE`}
                      mono
                    />
                  )}
                  {transactionActions.length > 0 && (
                    <InfoItem label="Actions">
                      <ActionsDisplay actions={transactionActions} />
                    </InfoItem>
                  )}
                </SectionCard>

                {/* Gas Info */}
                {gasInfo && (
                  <SectionCard title="Gas Info">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <InfoItem label="Gas Used" value={gasInfo.gasUsed} mono />
                      <InfoItem
                        label="Gas Price"
                        value={`${gasInfo.gasPrice} Octas`}
                        mono
                      />
                      {gasInfo.maxGas && (
                        <InfoItem label="Max Gas" value={gasInfo.maxGas} mono />
                      )}
                      <InfoItem
                        label="Gas Fee"
                        value={`${(Number(gasInfo.gasFee) / 1e8).toFixed(
                          8
                        )} MOVE`}
                        mono
                      />
                    </div>
                    {storageRefund && (
                      <InfoItem
                        label="Storage Refund"
                        value={`${(Number(storageRefund) / 1e8).toFixed(
                          8
                        )} MOVE`}
                        mono
                      />
                    )}
                  </SectionCard>
                )}

                {/* Execution Info */}
                {(sequenceNumber || expirationTimestamp || vmStatus) && (
                  <SectionCard title="Execution Info">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sequenceNumber && (
                        <InfoItem
                          label="Sequence Number"
                          value={sequenceNumber}
                          mono
                        />
                      )}
                      {expirationTimestamp && (
                        <InfoItem
                          label="Expiration"
                          value={new Date(
                            parseInt(expirationTimestamp) * 1000
                          ).toLocaleString()}
                          mono
                        />
                      )}
                      {vmStatus && (
                        <InfoItem label="VM Status">
                          <Badge
                            variant={isSuccess ? "success" : "error"}
                            className="font-mono text-xs"
                          >
                            {vmStatus}
                          </Badge>
                        </InfoItem>
                      )}
                    </div>
                  </SectionCard>
                )}

                {/* Advanced */}
                {(stateChangeHash ||
                  eventRootHash ||
                  accumulatorRootHash ||
                  signature) && (
                  <SectionCard title="Advanced" defaultCollapsed>
                    {stateChangeHash && (
                      <InfoItem label="State Change Hash">
                        <CopyableAddress
                          address={stateChangeHash}
                          showFull
                          variant="hash"
                        />
                      </InfoItem>
                    )}
                    {eventRootHash && (
                      <InfoItem label="Event Root Hash">
                        <CopyableAddress
                          address={eventRootHash}
                          showFull
                          variant="hash"
                        />
                      </InfoItem>
                    )}
                    {accumulatorRootHash && (
                      <InfoItem label="Accumulator Root Hash">
                        <CopyableAddress
                          address={accumulatorRootHash}
                          showFull
                          variant="hash"
                        />
                      </InfoItem>
                    )}
                    {signature && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Signature
                        </p>
                        <JsonViewer data={signature} initialDepth={1} />
                      </div>
                    )}
                  </SectionCard>
                )}
              </div>
            )}
          </TabsContent>

          {/* Balance Change Tab */}
          <TabsContent value="balance">
            <BalanceChangeTable changes={balanceChanges} />
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <CollapsibleList
              items={
                events?.map((event, i) => ({
                  key: i,
                  title: `#${event.sequence_number} - ${event.type}`,
                  data: event.data,
                })) || []
              }
              emptyMessage="No events"
            />
          </TabsContent>

          <TabsContent value="payload">
            {payload ? (
              <JsonViewer data={payload} initialDepth={2} />
            ) : (
              <p className="text-muted-foreground">No payload</p>
            )}
          </TabsContent>

          {/* Changes Tab */}
          <TabsContent value="changes">
            <CollapsibleList
              items={
                changes?.slice(0, 50).map((change, i) => ({
                  key: i,
                  title: change.type,
                  data: change,
                })) || []
              }
              emptyMessage="No changes"
              defaultExpanded={true}
            />
            {changes && changes.length > 50 && (
              <p className="text-muted-foreground text-sm mt-4">
                Showing first 50 of {changes.length} changes
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
