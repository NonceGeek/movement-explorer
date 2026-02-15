"use client";

import { EnhancedSkeleton } from "@/components/ui/skeleton";
import ValidatorsWorldMap from "./Map";
import type {
  ValidatorGeoGroup,
  ValidatorGeoMetric,
} from "@/hooks/validators/useGetValidatorSetGeoData";

interface ValidatorsMapProps {
  validatorGeoGroups: ValidatorGeoGroup[];
  validatorGeoMetric: ValidatorGeoMetric;
  numberOfActiveValidators: number | null;
  hasGeoData: boolean;
  isLoading: boolean;
}

function GeoMetrics({
  validatorGeoMetric,
  isLoading,
}: {
  validatorGeoMetric: ValidatorGeoMetric;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center gap-2 min-w-[200px] p-4">
        <EnhancedSkeleton className="h-8 w-32" />
        <EnhancedSkeleton className="h-5 w-28" />
        <EnhancedSkeleton className="h-5 w-24" />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center gap-1 min-w-[200px] p-4">
      <div className="text-2xl font-bold">
        {validatorGeoMetric.nodeCount} Nodes
      </div>
      <div className="text-sm text-muted-foreground">
        {validatorGeoMetric.countryCount} Countries
      </div>
      <div className="text-sm text-muted-foreground">
        {validatorGeoMetric.cityCount} Cities
      </div>
    </div>
  );
}

export default function ValidatorsMap({
  validatorGeoGroups,
  validatorGeoMetric,
  numberOfActiveValidators,
  hasGeoData,
  isLoading,
}: ValidatorsMapProps) {
  const metric = {
    ...validatorGeoMetric,
    nodeCount: numberOfActiveValidators ?? validatorGeoMetric.nodeCount,
  };
  // When no geo data, don't render the map section
  // (ValidatorStatsCards already shows node count, epoch, staking info)
  if (!hasGeoData) {
    return null;
  }

  return (
    <div className="rounded-lg overflow-hidden mb-6 bg-card border border-border/50">
      {/* Desktop: metrics left, map right */}
      <div className="hidden md:flex flex-row justify-between">
        <GeoMetrics
          validatorGeoMetric={metric}
          isLoading={isLoading}
        />
        <ValidatorsWorldMap validatorGeoGroups={validatorGeoGroups} />
      </div>

      {/* Mobile: map top, metrics bottom */}
      <div className="flex md:hidden flex-col">
        <ValidatorsWorldMap validatorGeoGroups={validatorGeoGroups} />
        <GeoMetrics
          validatorGeoMetric={metric}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
