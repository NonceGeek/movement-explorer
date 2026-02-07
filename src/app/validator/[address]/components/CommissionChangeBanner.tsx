"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useGetDelegationNodeCommissionChange } from "@/hooks/validators/useGetDelegationNodeCommissionChange";
import { AlertTriangle } from "lucide-react";

interface CommissionChangeBannerProps {
  validatorAddress: string;
  currentCommission: number | undefined;
}

export function CommissionChangeBanner({
  validatorAddress,
  currentCommission,
}: CommissionChangeBannerProps) {
  const { nextCommission, isQueryLoading } =
    useGetDelegationNodeCommissionChange({ validatorAddress });

  if (isQueryLoading) return null;
  if (nextCommission === undefined || currentCommission === undefined)
    return null;
  if (nextCommission === currentCommission) return null;

  return (
    <Alert className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Commission Rate Change Pending</AlertTitle>
      <AlertDescription>
        The current commission rate is {currentCommission}%. The commission rate
        will be updated to {nextCommission}% at the start of the next lockup
        period.
      </AlertDescription>
    </Alert>
  );
}
