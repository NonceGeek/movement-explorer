"use client";

import Link from "next/link";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserTransactionRow } from "./UserTransactionRow";
import useGetUserTransactionVersions from "@/hooks/transactions/useGetUserTransactionVersions";

export interface LatestUserTransactionsProps {
  limit?: number;
}

export function LatestUserTransactions({
  limit = 10,
}: LatestUserTransactionsProps) {
  const userTransactionVersions = useGetUserTransactionVersions(limit);
  const isLoading = userTransactionVersions.length === 0;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-heading">
          <ArrowLeftRight size={20} className="text-moveus-marigold-500" />
          Latest User Transactions
        </CardTitle>
        <Link
          href="/transactions?type=user"
          className="text-sm font-medium text-moveus-marigold-500 hover:text-moveus-marigold-400 transition-colors flex items-center gap-1"
        >
          View All
          <ArrowRight size={16} />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead>Function</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userTransactionVersions.map((version) => (
                  <UserTransactionRow key={version} version={version} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
