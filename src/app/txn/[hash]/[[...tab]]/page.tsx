"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { useGetTransaction } from "@/hooks/transactions/useGetTransaction";
import { useGetBlockByVersion } from "@/hooks/blocks/useGetBlock";
import { useGetPrice } from "@/hooks/useGetPrice";
import {
  useGetTransactionBalanceChanges,
  type FungibleAssetActivity,
} from "@/hooks/transactions/useGetTransactionBalanceChanges";
import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { Types } from "aptos";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableRow,
  StyledTableHead as TableHead,
  StyledTableHeader as TableHeader,
  StyledTableHeaderRow as HeaderRow,
  StyledTable as Table,
} from "@/components/ui/table";
import { Tabs, TabsContent, CompactTabsList } from "@/components/ui/tabs";
import {
  Search,
  LayoutDashboard,
  Wallet,
  Activity,
  Code,
  GitCommit,
  Table2,
  ListTree,
} from "lucide-react";
import {
  getGasInfo,
  getTransactionCounterparty,
  getTransactionFunction,
  getTransactionAmount,
  getStorageRefund,
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
import { HeaderCopyableAddress } from "@/components/common/HeaderCopyableAddress";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import JsonViewer from "@/components/ui/json-viewer";
import { TransactionDetailsTable } from "../components/TransactionDetailsTable";
import { DetailSection, DetailRow } from "../components/DetailRow";

export default function TransactionDetailPage() {
  const params = useParams();
  const hash = params.hash as string;
  const tabSlug = params.tab as string[] | undefined;
  const initialTab = tabSlug ? tabSlug[0] : "overview";
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
      counterparty,
      functionName,
      parsedActions,
    };
  }, [tx]);

  const { data: activitiesData, isLoading: activitiesLoading } =
    useGetTransactionBalanceChanges(
      txData.txVersion ? parseInt(txData.txVersion) : 0,
    );
  const fungibleAssetActivities =
    activitiesData?.fungible_asset_activities ?? [];

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
    {
      value: "raw-json",
      label: "Raw JSON",
      icon: <Code className="w-4 h-4" />,
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
          <h1 className="text-2xl font-semibold ml-2 font-heading">Transaction Detail</h1>
          <HeaderCopyableAddress address={hash} />
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

                {tx && (
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
                  />
                )}
              </>
            )}
          </TabsContent>

          {/* Balance Change Tab */}
          <TabsContent value="balance">
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex justify-end space-x-2 text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary font-bold bg-primary/10"
                    disabled
                  >
                    Non-aggregated
                  </Button>
                  <div className="w-px bg-border h-6 my-auto" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    disabled
                  >
                    Aggregated
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <HeaderRow>
                      <TableHead className="w-[20%]">Account</TableHead>
                      <TableHead className="w-[10%]">Type</TableHead>
                      <TableHead className="w-[15%]">Asset</TableHead>
                      <TableHead className="w-[20%]">Asset Address</TableHead>
                      <TableHead className="w-[10%]">Verified</TableHead>
                      <TableHead className="text-right w-[25%]">Change</TableHead>
                    </HeaderRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><EnhancedSkeleton className="h-4 w-24" /></TableCell>
                        <TableCell><EnhancedSkeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell><EnhancedSkeleton className="h-4 w-16" /></TableCell>
                        <TableCell><EnhancedSkeleton className="h-4 w-24" /></TableCell>
                        <TableCell><EnhancedSkeleton className="h-4 w-12" /></TableCell>
                        <TableCell className="text-right"><EnhancedSkeleton className="h-4 w-28 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : tx ? (
              <BalanceChangeTab transaction={tx} />
            ) : null}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            {isLoading ? (
              <div className="space-y-4">
                <ToggleGroup value="table" disabled>
                  <ToggleGroupItem value="table">
                    <Table2 className="h-3.5 w-3.5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="raw">
                    RAW
                  </ToggleGroupItem>
                </ToggleGroup>

                <Table>
                  <TableHeader>
                    <HeaderRow>
                      <TableHead className="w-[30%]">Account</TableHead>
                      <TableHead className="w-[25%]">Module</TableHead>
                      <TableHead className="w-[35%]">Event</TableHead>
                      <TableHead className="w-[10%] text-center">Data</TableHead>
                    </HeaderRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><EnhancedSkeleton className="h-4 w-24" /></TableCell>
                        <TableCell><EnhancedSkeleton className="h-5 w-20 rounded-full" /></TableCell>
                        <TableCell><EnhancedSkeleton className="h-4 w-32" /></TableCell>
                        <TableCell className="text-center"><EnhancedSkeleton className="h-4 w-4 mx-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EventsTab events={txData.events || []} />
            )}
          </TabsContent>

          {/* Payload Tab */}
          <TabsContent value="payload">
            {isLoading ? (
              <div className="space-y-4">
                <ToggleGroup value="decoded" disabled>
                  <ToggleGroupItem value="decoded">
                    <ListTree className="h-3.5 w-3.5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="raw">
                    RAW
                  </ToggleGroupItem>
                </ToggleGroup>

                <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl overflow-hidden divide-y divide-border/20">
                  {/* Type row */}
                  <div className="px-5 py-3 flex items-center gap-3 bg-muted/20">
                    <EnhancedSkeleton className="h-4 w-8" />
                    <EnhancedSkeleton className="h-5 w-36 rounded-full" />
                  </div>
                  {/* Function row */}
                  <div className="px-5 py-3 space-y-2">
                    <EnhancedSkeleton className="h-3 w-16" />
                    <EnhancedSkeleton className="h-5 w-full max-w-sm" />
                  </div>
                  {/* Arguments header */}
                  <div className="px-5 py-3 bg-muted/20">
                    <EnhancedSkeleton className="h-3 w-24" />
                  </div>
                  {/* Argument rows */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex border-b border-border/20 last:border-0">
                      <div className="w-[200px] shrink-0 px-4 py-3 flex items-center gap-2">
                        <EnhancedSkeleton className="h-4 w-4" />
                        <EnhancedSkeleton className="h-4 w-16" />
                        <EnhancedSkeleton className="h-4 w-12 rounded-full" />
                      </div>
                      <div className="flex-1 px-4 py-3">
                        <EnhancedSkeleton className="h-4 w-full max-w-xs" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <PayloadDecoder payload={txData.payload} />
            )}
          </TabsContent>

          {/* Changes Tab */}
          <TabsContent value="changes">
            {isLoading ? (
              <div className="space-y-4">
                <ToggleGroup value="table" disabled>
                  <ToggleGroupItem value="table">
                    <Table2 className="h-3.5 w-3.5" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="raw">
                    RAW
                  </ToggleGroupItem>
                </ToggleGroup>

                <Table>
                  <TableHeader>
                    <HeaderRow>
                      <TableHead className="w-[25%]">Address / Handle</TableHead>
                      <TableHead className="w-[15%]">Type</TableHead>
                      <TableHead className="w-[50%]">Resource / Module</TableHead>
                      <TableHead className="w-[10%] text-center">Data</TableHead>
                    </HeaderRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><EnhancedSkeleton className="h-4 w-24" /></TableCell>
                        <TableCell><EnhancedSkeleton className="h-5 w-20 rounded-full" /></TableCell>
                        <TableCell><EnhancedSkeleton className="h-4 w-40" /></TableCell>
                        <TableCell className="text-center"><EnhancedSkeleton className="h-4 w-4 mx-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <ChangesTab changes={txData.changes || []} />
            )}
          </TabsContent>

          {/* Raw JSON Tab */}
          <TabsContent value="raw-json">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <EnhancedSkeleton key={i} className="h-5 w-full" />
                ))}
              </div>
            ) : tx ? (
              <JsonViewer data={tx} initialDepth={2} />
            ) : null}
          </TabsContent>
        </Tabs>
      </PageContainer>
    </>
  );
}
