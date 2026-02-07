"use client";

import { useGetNumberOfDelegators } from "@/hooks/validators/useGetNumberOfDelegators";
import { EnhancedSkeleton } from "@/components/ui/skeleton";

interface DelegatorCountCellProps {
  poolAddress: string;
}

export function DelegatorCountCell({ poolAddress }: DelegatorCountCellProps) {
  const { delegatorBalance, loading } = useGetNumberOfDelegators(poolAddress);

  if (loading) {
    return <EnhancedSkeleton className="h-4 w-8" />;
  }

  return <span>{delegatorBalance}</span>;
}
