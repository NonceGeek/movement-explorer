"use client";

import { useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { useGetCoinHolders } from "@/hooks/coins/useGetCoinHolders";
import { formatMoveAmount } from "@/utils/transaction";
import { CoinData } from "./InfoTab";
import { toast } from "@movementlabsxyz/movement-design-system";
import { AlertCircle } from "lucide-react";

interface HoldersTabProps {
  struct: string;
  coinData: CoinData | undefined;
}

export default function HoldersTab({ struct, coinData }: HoldersTabProps) {
  const { isLoading, error, data: holders } = useGetCoinHolders(struct);

  // Show toast when error occurs
  useEffect(() => {
    if (error) {
      toast.error("Failed to load holders", {
        description: error.message,
      });
    }
  }, [error]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Holders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
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
          <CardTitle>Top Holders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive mb-2">
              Failed to load holders
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!holders || holders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Holders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">No holders found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const decimals = coinData?.data?.decimals ?? 8;
  const symbol = coinData?.data?.symbol ?? "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Holders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <HeaderRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </HeaderRow>
            </TableHeader>
            <TableBody>
              {holders.map((holder, index) => (
                <TableRow key={holder.owner_address}>
                  <TableCell className="font-mono text-muted-foreground">
                    #{index + 1}
                  </TableCell>
                  <TableCell>
                    <CopyableAddress
                      address={holder.owner_address}
                      href={`/account/${holder.owner_address}`}
                      variant="label"
                      showLabel
                      truncateLength={{ start: 8, end: 6 }}
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {holder.amount_v2 != null
                      ? formatMoveAmount(BigInt(holder.amount_v2), decimals)
                      : "0"}{" "}
                    <span className="text-muted-foreground">{symbol}</span>
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
