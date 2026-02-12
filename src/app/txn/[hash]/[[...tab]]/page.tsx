"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { useGetTransaction } from "@/hooks/transactions/useGetTransaction";
import { useGetBlockByVersion } from "@/hooks/blocks/useGetBlock";
import { useGetPrice } from "@/hooks/useGetPrice";
import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { Types } from "aptos";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, CompactTabsList } from "@/components/ui/tabs";
import {
  Search,
  LayoutDashboard,
  Wallet,
  Activity,
  Code,
  GitCommit,
} from "lucide-react";
import {
  getGasInfo,
  getTransactionCounterparty,
  getTransactionFunction,
  getTransactionAmount,
  getStorageRefund,
  getTransactionActions,
} from "@/utils/transaction";
import {
  BalanceChangeTab,
  TransactionActionCard,
  parseTransactionActions,
  PayloadDecoder,
  ChangesTab,
  EventsTab,
} from "../components";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { Button } from "@/components/ui/button";
import JsonViewer from "@/components/ui/json-viewer";
import { TransactionDetailsTable } from "../components/TransactionDetailsTable";
import { DetailSection, DetailRow } from "../components/DetailRow";

export default function TransactionDetailPage() {
  const params = useParams();
  const hash = params.hash as string;
  const tabSlug = params.tab as string[] | undefined;
  const initialTab = tabSlug ? tabSlug[0] : "overview";
  const [showRaw, setShowRaw] = useState(false);
  const [currentTab, setCurrentTab] = useState(initialTab);

  // Fetch MOVE price
  const { data: movePrice } = useGetPrice("movement");

  const handleTabChange = (value: string) => {
    const scrollY = window.scrollY;
    setCurrentTab(value);
    window.history.pushState(null, "", `/txn/${hash}/${value}`);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
    });
  };

  const { data: tx, isLoading, error } = useGetTransaction(hash);

  // Fetch block height based on transaction version
  const version = tx && "version" in tx ? tx.version : null;
  const { data: blockData } = useGetBlockByVersion({
    version: version ? parseInt(version) : 0,
    withTransactions: false,
  });

  // Extract all transaction data
  const txData = useMemo(() => {
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
        transactionAmount: null,
        storageRefund: null,
        transactionActions: [],
        counterparty: null,
        functionName: null,
        parsedActions: [],
      };
    }

    const isSuccess = "success" in tx ? tx.success : true;
    const txVersion = "version" in tx ? tx.version : null;
    const timestamp = "timestamp" in tx ? tx.timestamp : null;
    const sender = "sender" in tx ? (tx as Types.UserTransaction).sender : null;
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
    const transactionAmount = getTransactionAmount(tx);
    const storageRefund = getStorageRefund(tx);
    const transactionActions = getTransactionActions(tx);
    const counterparty = getTransactionCounterparty(tx);
    const functionName = getTransactionFunction(tx);
    const parsedActions = parseTransactionActions(tx);

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
      transactionAmount,
      storageRefund,
      transactionActions,
      counterparty,
      functionName,
      parsedActions,
    };
  }, [tx]);

  const tabItems = [
    {
      value: "overview",
      label: "Overview",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      value: "balance",
      label: "Balance Changes",
      icon: <Wallet className="w-4 h-4" />,
    },
    {
      value: "events",
      label: isLoading ? "Events" : `Events (${txData.events?.length || 0})`,
      icon: <Activity className="w-4 h-4" />,
    },
    {
      value: "payload",
      label: "Payload",
      icon: <Code className="w-4 h-4" />,
    },
    {
      value: "changes",
      label: isLoading ? "Changes" : `Changes (${txData.changes?.length || 0})`,
      icon: <GitCommit className="w-4 h-4" />,
    },
  ];

  // Note: No separate loading state needed - we render the page structure immediately
  // and only show skeletons for data that's actually loading

  // Not Found State
  const isNotFound = error?.type === "Not Found";
  if (isNotFound || (!tx && !isLoading)) {
    return (
      <>
        <PageNavigation />
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

  // Error State (only if not loading and still no data)
  if (error && !isLoading) {
    return (
      <>
        <PageNavigation />
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
      <PageNavigation />
      <PageContainer>
        {/* Transaction Hash Header */}
        <div className="flex items-start flex-col gap-1 mb-6">
          <h1 className="text-2xl font-semibold ml-2">Transaction Detail</h1>
          <CopyableAddress
            address={hash}
            showFull
            className="text-muted-foreground"
          />
        </div>

        {/* Tabs */}
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="space-y-3"
        >
          <CompactTabsList
            items={tabItems}
            activeTab={currentTab}
            onTabChange={setCurrentTab}
          />

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {isLoading ? (
              // Loading state - only show skeleton for data that needs to load
              <DetailSection>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <DetailRow key={i} label="">
                    <EnhancedSkeleton className="h-5 w-full max-w-md" />
                  </DetailRow>
                ))}
              </DetailSection>
            ) : (
              <>
                {/* Transaction Actions Card */}
                {txData.parsedActions && txData.parsedActions.length > 0 && (
                  <TransactionActionCard actions={txData.parsedActions} />
                )}

                <div className="flex justify-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRaw(!showRaw)}
                    className="font-mono text-xs"
                  >
                    {showRaw ? "Formatted" : "Raw JSON"}
                  </Button>
                </div>

                {tx && (
                  showRaw ? (
                    <JsonViewer data={tx} initialDepth={2} />
                  ) : (
                    <TransactionDetailsTable
                      hash={tx.hash}
                      type={tx.type}
                      version={txData.txVersion}
                      blockHeight={blockHeight}
                      timestamp={txData.timestamp}
                      sender={txData.sender}
                      counterparty={txData.counterparty}
                      functionName={txData.functionName}
                      amount={txData.transactionAmount}
                      gasInfo={txData.gasInfo}
                      sequenceNumber={txData.sequenceNumber}
                      expirationTimestamp={txData.expirationTimestamp}
                      vmStatus={txData.vmStatus}
                      isSuccess={txData.isSuccess}
                      stateChangeHash={txData.stateChangeHash}
                      eventRootHash={txData.eventRootHash}
                      accumulatorRootHash={txData.accumulatorRootHash}
                      signature={txData.signature}
                      feePayer={txData.feePayer}
                      secondarySigners={txData.secondarySigners}
                      usdPrice={movePrice}
                      actions={txData.transactionActions}
                    />
                  )
                )}
              </>
            )}
          </TabsContent>

          {/* Balance Change Tab */}
          <TabsContent value="balance">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <EnhancedSkeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ) : tx ? (
              <BalanceChangeTab transaction={tx} />
            ) : null}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <EnhancedSkeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ) : (
              <EventsTab events={txData.events || []} />
            )}
          </TabsContent>

          {/* Payload Tab */}
          <TabsContent value="payload">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <EnhancedSkeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ) : (
              <PayloadDecoder payload={txData.payload} />
            )}
          </TabsContent>

          {/* Changes Tab */}
          <TabsContent value="changes">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <EnhancedSkeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ) : (
              <ChangesTab changes={txData.changes || []} />
            )}
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}
