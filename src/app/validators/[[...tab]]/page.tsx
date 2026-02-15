"use client";

import PageNavigation from "@/components/layout/PageNavigation";
import { PageContainer } from "@/components/layout";
import { useGetValidators } from "@/hooks/validators/useGetValidators";
import { useGetValidatorSet } from "@/hooks/validators/useGetValidatorSet";
import { useGetEpochTime } from "@/hooks/validators/useGetEpochTime";
import { useGetStakingRewardsRate } from "@/hooks/validators/useGetStakingRewardsRate";
import { useGetValidatorsCommissionAndState } from "@/hooks/validators/useGetValidatorsCommissionAndState";
import { useGetDelegatedStakingPoolList } from "@/hooks/validators/useGetDelegatedStakingPoolList";
import { useGetValidatorSetGeoData } from "@/hooks/validators/useGetValidatorSetGeoData";
import { useGlobalStore } from "@/store/useGlobalStore";
import { StakingPromo } from "../components/StakingPromo";
import ValidatorsMap from "../components/ValidatorsMap";
import { ValidatorStatsCards } from "../components/ValidatorStatsCards";
import {
  ValidatorsTable,
  type SortColumn,
  type SortDirection,
} from "../components/ValidatorsTable";
import { TransactionTableFooter } from "@/components/transactions/TransactionTableFooter";
import type { PageSize } from "@/store/useTransactionPaginationStore";
import { Tabs, PillTabsList } from "@/components/ui/tabs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getValidatorStatus } from "@/utils/validators";
import type { ValidatorData } from "@/hooks/validators/useGetValidators";

export default function ValidatorsPage() {
  const { validators } = useGetValidators();
  const { totalVotingPower, numberOfActiveValidators } = useGetValidatorSet();
  const { curEpoch, lastEpochTime, epochInterval } = useGetEpochTime();
  const { rewardsRateYearly } = useGetStakingRewardsRate();
  const { validatorGeoGroups, validatorGeoMetric, hasGeoData } =
    useGetValidatorSetGeoData();
  const { network_name } = useGlobalStore();

  // Epoch progress state
  const [epochProgress, setEpochProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState("");

  // Table state
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<PageSize>(25);
  const [sortColumn, setSortColumn] = useState<SortColumn>("votingPower");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Calculate epoch progress from real data
  useEffect(() => {
    if (lastEpochTime && epochInterval) {
      const epochIntervalMs = parseInt(epochInterval) / 1000;
      const lastReconfig = parseInt(lastEpochTime) / 1000;
      const now = Date.now();
      const timePassed = now - lastReconfig;

      const percentComplete = Math.min(
        100,
        Math.floor((timePassed / epochIntervalMs) * 100),
      );
      setEpochProgress(percentComplete);

      const remaining = Math.max(0, epochIntervalMs - timePassed);
      const remainingSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }
  }, [lastEpochTime, epochInterval, curEpoch]);

  // Update time remaining every second
  useEffect(() => {
    if (!lastEpochTime || !epochInterval) return;

    const interval = setInterval(() => {
      const epochIntervalMs = parseInt(epochInterval) / 1000;
      const lastReconfig = parseInt(lastEpochTime) / 1000;
      const now = Date.now();
      const timePassed = now - lastReconfig;

      const percentComplete = Math.min(
        100,
        Math.floor((timePassed / epochIntervalMs) * 100),
      );
      setEpochProgress(percentComplete);

      const remaining = Math.max(0, epochIntervalMs - timePassed);
      const remainingSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.floor((remainingSeconds % 3600) / 60);
      const seconds = remainingSeconds % 60;
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastEpochTime, epochInterval]);

  // Fetch delegated staking pools (includes inactive pools not in ValidatorSet)
  const { delegatedStakingPools, loading: poolsLoading } =
    useGetDelegatedStakingPoolList();

  // Merge validators with delegation pools (same logic as source project)
  // If delegation pools query fails or returns empty, fallback to all active validators
  const delegationValidators = useMemo(() => {
    // While pools are loading, show active validators first
    if (poolsLoading) return validators;

    // If no delegation pools data available, fallback to all active validators
    if (!delegatedStakingPools || delegatedStakingPools.length === 0) {
      return validators;
    }

    // Delegation pools that are in validators list (active or once-active now inactive)
    const validatorsInPools: ValidatorData[] = validators.filter((v) =>
      delegatedStakingPools.some(
        (pool) => pool.staking_pool_address === v.owner_address,
      ),
    );

    // Delegation pools NOT in validators list (were never active)
    const poolsNotInValidators: ValidatorData[] = delegatedStakingPools
      .filter(
        (pool) =>
          !validators.some(
            (v) => v.owner_address === pool.staking_pool_address,
          ),
      )
      .map((pool) => ({
        owner_address: pool.staking_pool_address,
        operator_address: pool.current_staking_pool.operator_address,
        voting_power: "0",
        governance_voting_record: "",
        last_epoch: 0,
        last_epoch_performance: "",
        liveness: 0,
        rewards_growth: 0,
        apt_rewards_distributed: 0,
      }));

    return [...validatorsInPools, ...poolsNotInValidators];
  }, [validators, delegatedStakingPools, poolsLoading]);

  const isLoading =
    validators.length === 0 && numberOfActiveValidators === null;

  // Calculate total stake
  const totalStake = totalVotingPower
    ? (BigInt(totalVotingPower) / BigInt(10 ** 8)).toLocaleString("en-US")
    : "-";

  // Batch fetch commission and state for all delegation validators
  const allAddresses = useMemo(
    () => delegationValidators.map((v) => v.owner_address),
    [delegationValidators],
  );
  const { data: commissionAndStateMap } =
    useGetValidatorsCommissionAndState(allAddresses);

  // Filter by tab (status)
  const tabFiltered = useMemo(() => {
    if (activeTab === "all") return delegationValidators;
    return delegationValidators.filter((v) => {
      const info = commissionAndStateMap?.get(v.owner_address);
      if (!info) return activeTab === "all";
      const status = getValidatorStatus(info.status);
      if (activeTab === "active")
        return status === "Active" || status === "Pending Active";
      if (activeTab === "inactive")
        return status === "Inactive" || status === "Pending Inactive";
      return true;
    });
  }, [delegationValidators, activeTab, commissionAndStateMap]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...tabFiltered];
    const dir = sortDirection === "desc" ? -1 : 1;

    copy.sort((a, b) => {
      switch (sortColumn) {
        case "votingPower":
          return Number(BigInt(b.voting_power) - BigInt(a.voting_power)) * dir;
        case "networkPercent":
          return Number(BigInt(b.voting_power) - BigInt(a.voting_power)) * dir;
        case "commission": {
          const aInfo = commissionAndStateMap?.get(a.owner_address);
          const bInfo = commissionAndStateMap?.get(b.owner_address);
          return (
            ((bInfo?.commission ?? 0) - (aInfo?.commission ?? 0)) * dir
          );
        }
        case "index":
        default:
          return Number(BigInt(b.voting_power) - BigInt(a.voting_power)) * dir;
      }
    });
    // Hide inactive validators with zero delegated stake (same as source project)
    return copy.filter((v) => {
      const info = commissionAndStateMap?.get(v.owner_address);
      if (info) {
        const status = getValidatorStatus(info.status);
        if (status === "Inactive" && v.voting_power === "0") return false;
      }
      return true;
    });
  }, [tabFiltered, sortColumn, sortDirection, commissionAndStateMap]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / rowsPerPage);
  const paginatedValidators = useMemo(
    () =>
      sorted.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage,
      ),
    [sorted, currentPage, rowsPerPage],
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sortColumn, sortDirection]);

  // Tab counts
  const counts = useMemo(() => {
    let active = 0;
    let inactive = 0;
    delegationValidators.forEach((v) => {
      const info = commissionAndStateMap?.get(v.owner_address);
      if (info) {
        const status = getValidatorStatus(info.status);
        if (status === "Active" || status === "Pending Active") active++;
        else if (status === "Inactive" || status === "Pending Inactive")
          inactive++;
      }
    });
    return { all: delegationValidators.length, active, inactive };
  }, [delegationValidators, commissionAndStateMap]);

  const handleSort = useCallback(
    (column: SortColumn) => {
      if (sortColumn === column) {
        setSortDirection((d) => (d === "desc" ? "asc" : "desc"));
      } else {
        setSortColumn(column);
        setSortDirection("desc");
      }
    },
    [sortColumn],
  );

  const tabItems = useMemo(
    () => [
      { value: "all", label: "All Validators", badge: counts.all },
      { value: "active", label: "Active", badge: counts.active },
      { value: "inactive", label: "Inactive", badge: counts.inactive },
    ],
    [counts],
  );

  return (
    <>
      <PageNavigation />
      <PageContainer>
        {/* Staking Promo Banner */}
        <StakingPromo />

        {/* Validators Map (mainnet only, requires geo data) */}
        {network_name === "mainnet" && (
          <ValidatorsMap
            validatorGeoGroups={validatorGeoGroups}
            validatorGeoMetric={validatorGeoMetric}
            numberOfActiveValidators={numberOfActiveValidators}
            hasGeoData={hasGeoData}
            isLoading={isLoading}
          />
        )}

        {/* Stats Grid */}
        <ValidatorStatsCards
          numberOfActiveValidators={numberOfActiveValidators}
          curEpoch={curEpoch}
          epochProgress={epochProgress}
          timeRemaining={timeRemaining}
          totalStake={totalStake}
          rewardsRateYearly={rewardsRateYearly}
          isLoading={isLoading}
        />

        {/* Table Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-4">
            <PillTabsList
              items={tabItems}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              className="!static !p-0"
            />
          </div>

          <ValidatorsTable
            validators={paginatedValidators}
            commissionAndStateMap={commissionAndStateMap}
            totalVotingPower={totalVotingPower}
            isLoading={isLoading}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            startIndex={(currentPage - 1) * rowsPerPage}
          />
        </Tabs>

        <TransactionTableFooter
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={rowsPerPage}
          onPageSizeChange={(size) => {
            setRowsPerPage(size);
            setCurrentPage(1);
          }}
          isLoading={isLoading}
        />
      </PageContainer>
    </>
  );
}
