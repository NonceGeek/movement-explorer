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
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TimestampAge } from "@/components/common/TimestampAge";
import { DetailSection, DetailRow } from "@/app/txn/[hash]/components/DetailRow";

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
      <>
        <PageNavigation />
        <PageContainer>
          <EnhancedSkeleton className="h-8 w-40 mb-4" />
          <EnhancedSkeleton className="h-7 w-24 mb-3" />
          <DetailSection>
            {Array.from({ length: 8 }).map((_, i) => (
              <DetailRow key={i} label="">
                <EnhancedSkeleton className="h-5 w-full max-w-md" />
              </DetailRow>
            ))}
          </DetailSection>
        </PageContainer>
      </>
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

  // Sum gas_used and gas_fee from all transactions in the block
  const { totalGasUsed, totalGasFee } = (block.transactions ?? []).reduce(
    (acc, txn) => {
      const t = txn as { gas_used?: string; gas_unit_price?: string };
      const gasUsed = Number(t.gas_used ?? 0);
      const gasUnitPrice = Number(t.gas_unit_price ?? 0);
      return {
        totalGasUsed: acc.totalGasUsed + gasUsed,
        totalGasFee: acc.totalGasFee + gasUsed * gasUnitPrice,
      };
    },
    { totalGasUsed: 0, totalGasFee: 0 },
  );

  // Calculate validator votes from bitvec
  const votesCount = blockMetaTxn?.previous_block_votes_bitvec
    ? blockMetaTxn.previous_block_votes_bitvec.reduce((count, byte) => {
      let bits = 0;
      let n = byte;
      while (n) {
        bits += n & 1;
        n >>= 1;
      }
      return count + bits;
    }, 0)
    : null;

  const totalValidators = blockMetaTxn?.previous_block_votes_bitvec
    ? blockMetaTxn.previous_block_votes_bitvec.length * 8
    : null;

  const previousBlock = height > 0 ? (height - 1).toString() : null;
  const nextBlock = (height + 1).toString();

  return (
    <>
      <PageNavigation />
      <PageContainer>

        <h1 className="text-xl sm:text-3xl font-bold mb-4 font-heading">Block Detail</h1>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl text-muted-foreground">
            #{block.block_height}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={!previousBlock}
              asChild={!!previousBlock}
            >
              {previousBlock ? (
                <Link href={`/block/${previousBlock}`} title="Previous Block">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span><ChevronLeft className="h-3.5 w-3.5" /></span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              asChild
            >
              <Link href={`/block/${nextBlock}`} title="Next Block">
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        <DetailSection>
          <DetailRow label="Block Height">
            {block.block_height}
          </DetailRow>
          <DetailRow label="Block Hash">
            <CopyableAddress
              address={block.block_hash}
              showFull
              showCopyButton
              variant="muted"
              className="text-foreground"
            />
          </DetailRow>
          <DetailRow label="Timestamp">
            <TimestampAge timestamp={block.block_timestamp} />
          </DetailRow>
          <DetailRow label="Transactions">
            <Link
              href={`/transactions?type=all&block=${block.block_height}`}
              className="text-primary hover:underline"
            >
              {transactionCount.toString()} transactions
            </Link>
            <span className="ml-1">
              in this block
            </span>
            <span className="text-muted-foreground ml-1">
              (version {block.first_version} - {block.last_version})
            </span>
          </DetailRow>
          {blockMetaTxn && (
            <>
              <DetailRow label="Proposer">
                <CopyableAddress
                  address={blockMetaTxn.proposer}
                  href={`/account/${blockMetaTxn.proposer}`}
                  showFull
                  showCopyButton
                />
              </DetailRow>
              <DetailRow label="Epoch">
                {blockMetaTxn.epoch}
              </DetailRow>
              <DetailRow label="Round">
                {blockMetaTxn.round}
              </DetailRow>
              <DetailRow label="Gas Used">
                {totalGasUsed.toLocaleString()} Gas
                <span className="text-muted-foreground ml-2">
                  (= {(totalGasFee / 1e8).toFixed(8)} MOVE)
                </span>
              </DetailRow>
              {votesCount !== null && totalValidators !== null && (
                <DetailRow label="Validator Votes">
                  <div className="flex items-center gap-2">
                    {votesCount} / {totalValidators}
                    <span className="text-muted-foreground">
                      ({((votesCount / totalValidators) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </DetailRow>
              )}
              {blockMetaTxn.failed_proposer_indices.length > 0 && (
                <DetailRow label="Failed Proposers">
                  <span className="text-destructive">
                    {blockMetaTxn.failed_proposer_indices.length} failed
                    (indices: {blockMetaTxn.failed_proposer_indices.join(", ")})
                  </span>
                </DetailRow>
              )}
            </>
          )}
        </DetailSection>
      </PageContainer>
    </>
  );
}
