"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TableBody,
  TableCell,
  StyledTableRow as TableRow,
  StyledTable as Table,
  StyledTableHead as TableHead,
  StyledTableHeader as TableHeader,
  StyledTableHeaderRow as HeaderRow,
} from "@/components/ui/table";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { useGetCoinActivities } from "@/hooks/coins/useGetCoinActivities";
import { formatTimestamp } from "@/utils/transaction";
import { toast } from "@movementlabsxyz/movement-design-system";
import { AlertCircle } from "lucide-react";

interface TransactionsTabProps {
  address: string;
}

export default function TransactionsTab({ address }: TransactionsTabProps) {
  const { isLoading, error, data: activities } = useGetCoinActivities(address);

  useEffect(() => {
    if (error) {
      toast.error({
        title: "Failed to load transactions",
        description: error.message,
      });
    }
  }, [error]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <EnhancedSkeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive mb-2">
              Failed to load transactions
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <HeaderRow>
                <TableHead>Version</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Address</TableHead>
              </HeaderRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.transaction_version}>
                  <TableCell>
                    <Link
                      href={`/txn/${activity.transaction_version}`}
                      className="text-primary hover:underline font-mono"
                    >
                      {activity.transaction_version}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {formatTimestamp(activity.transaction_timestamp)}
                  </TableCell>
                  <TableCell>
                    <CopyableAddress
                      address={activity.owner_address}
                      href={`/account/${activity.owner_address}`}
                      variant="label"
                      showLabel
                      truncateLength={{ start: 8, end: 6 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
