"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { useGetBlockByHeight } from "@/hooks/blocks/useGetBlock";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import {
  isBlockMetadataTransactionResponse,
  BlockMetadataTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

function formatTimestamp(timestamp: string): string {
  const date = new Date(parseInt(timestamp) / 1000);
  return date.toLocaleString();
}

function CopyableTimestamp({ timestamp }: { timestamp: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(timestamp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono">{formatTimestamp(timestamp)}</span>
      <button
        onClick={handleCopy}
        className="p-1 hover:bg-muted rounded transition-colors"
        title="Copy timestamp"
      >
        {copied ? (
          <Check className="h-4 w-4 text-guild-green-500" />
        ) : (
          <Copy className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

interface ContentRowProps {
  title: string;
  value: React.ReactNode;
}

function ContentRow({ title, value }: ContentRowProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 py-3 border-b border-border/50 last:border-b-0">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-sm">{value ?? "-"}</div>
    </div>
  );
}

export default function BlockDetailPage() {
  const params = useParams();
  const height = parseInt(params.height as string);

  const {
    data: block,
    isLoading,
    error,
  } = useGetBlockByHeight({
    height,
    withTransactions: true,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <EnhancedSkeleton className="h-10 w-48" />
          <EnhancedSkeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load block {height}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract BlockMetadata transaction for additional info
  const blockMetaTxn = (block.transactions ?? []).find(
    isBlockMetadataTransactionResponse,
  ) as BlockMetadataTransactionResponse | undefined;

  const transactionCount =
    BigInt(block.last_version) - BigInt(block.first_version) + BigInt(1);

  const previousBlock = height > 0 ? (height - 1).toString() : null;
  const nextBlock = (height + 1).toString();

  return (
    <>
      <PageNavigation />
      <PageContainer>
        <h1 className="text-xl sm:text-3xl font-bold mb-6">
          Block #{block.block_height}
        </h1>
        <Card>
          <CardContent className="pt-6">
            <ContentRow
              title="Block Height:"
              value={
                <span className="font-mono text-lg">
                  {block.block_height}
                </span>
              }
            />
            <ContentRow
              title="Block Hash:"
              value={
                <CopyableAddress
                  address={block.block_hash}
                  showFull
                  showCopyButton
                  variant="muted"
                />
              }
            />
            <ContentRow
              title="Timestamp:"
              value={
                <CopyableTimestamp timestamp={block.block_timestamp} />
              }
            />
            <ContentRow
              title="Transactions:"
              value={
                <Link
                  href={`/transactions?type=all&block=${block.block_height}`}
                  className="text-primary hover:underline"
                >
                  {transactionCount.toString()} transactions in this block
                </Link>
              }
            />
            <ContentRow
              title="Version Range:"
              value={
                <div className="flex items-center gap-1 font-mono">
                  <Link
                    href={`/txn/${block.first_version}`}
                    className="text-primary hover:underline"
                  >
                    {block.first_version}
                  </Link>
                  <span className="text-muted-foreground mx-1">to</span>
                  <Link
                    href={`/txn/${block.last_version}`}
                    className="text-primary hover:underline"
                  >
                    {block.last_version}
                  </Link>
                </div>
              }
            />
            {blockMetaTxn && (
              <>
                <ContentRow
                  title="Proposer:"
                  value={
                    <CopyableAddress
                      address={blockMetaTxn.proposer}
                      href={`/account/${blockMetaTxn.proposer}`}
                    />
                  }
                />
                <ContentRow title="Epoch:" value={blockMetaTxn.epoch} />
                <ContentRow title="Round:" value={blockMetaTxn.round} />
              </>
            )}
            {previousBlock && (
              <ContentRow
                title="Previous Block:"
                value={
                  <Link
                    href={`/block/${previousBlock}`}
                    className="text-primary hover:underline font-mono"
                  >
                    {previousBlock}
                  </Link>
                }
              />
            )}
            <ContentRow
              title="Next Block:"
              value={
                <Link
                  href={`/block/${nextBlock}`}
                  className="text-primary hover:underline font-mono"
                >
                  {nextBlock}
                </Link>
              }
            />
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
