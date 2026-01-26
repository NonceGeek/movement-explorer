import { Card, CardContent } from "@/components/ui/card";
import { useGetUnifiedMOVEBalance } from "@/hooks/accounts/useGetAccountAPTBalance";
import { useGetPrice } from "@/hooks/useGetPrice";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EnhancedSkeleton } from "@/components/ui/skeleton";

interface BalanceCardProps {
  address: string;
}

export default function BalanceCard({ address }: BalanceCardProps) {
  const { data: balance, isLoading: balanceLoading } =
    useGetUnifiedMOVEBalance(address);
  // Default to borrowing "movement" price for now, can be parameterized if needed
  const { data: price, isLoading: priceLoading } = useGetPrice();

  const isLoading = balanceLoading || priceLoading;

  const formattedBalance = balance
    ? (Number(balance) / 100000000).toLocaleString("en-US", {
        maximumFractionDigits: 8,
      })
    : "0";

  const balanceUSD =
    balance && price
      ? ((Number(balance) / 100000000) * price).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })
      : null;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6 flex flex-col gap-2">
          <EnhancedSkeleton className="h-8 w-32" />
          <EnhancedSkeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  // If no balance data, we might show 0 or nothing. Showing 0 for consistency.
  if (!balance) return null;

  return (
    <Card className="h-full bg-card/50 backdrop-blur-sm">
      <CardContent className="pt-6 flex flex-col justify-center h-full gap-1">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{formattedBalance} MOVE</span>
        </div>
        {balanceUSD && (
          <span className="text-sm text-muted-foreground">
            {balanceUSD} USD
          </span>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
            Balance
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  This balance reflects the amount of MOVE tokens held in your
                  wallet.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
