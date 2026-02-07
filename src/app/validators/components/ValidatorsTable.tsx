"use client";

import {
  StyledTable,
  StyledTableHeader,
  StyledTableHeaderRow,
  StyledTableHead,
  StyledTableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { EnhancedSkeleton } from "@/components/ui/skeleton";
import { CopyableAddress } from "@/components/common/CopyableAddress";
import { calculateNetworkPercentage, getValidatorStatus } from "@/utils/validators";
import { ValidatorStatusBadge } from "./ValidatorStatusBadge";
import { DelegatorCountCell } from "./DelegatorCountCell";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { ValidatorData } from "@/hooks/validators/useGetValidators";
import type { ValidatorCommissionAndState } from "@/hooks/validators/useGetValidatorsCommissionAndState";

export type SortColumn =
  | "votingPower"
  | "networkPercent"
  | "commission"
  | "index";
export type SortDirection = "asc" | "desc";

interface ValidatorsTableProps {
  validators: ValidatorData[];
  commissionAndStateMap: Map<string, ValidatorCommissionAndState> | undefined;
  totalVotingPower: string | null;
  isLoading: boolean;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  startIndex: number;
}

function SortableHeader({
  label,
  column,
  currentColumn,
  currentDirection,
  onSort,
  className,
}: {
  label: string;
  column: SortColumn;
  currentColumn: SortColumn;
  currentDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  className?: string;
}) {
  const isActive = currentColumn === column;
  return (
    <StyledTableHead className={className}>
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors"
        onClick={() => onSort(column)}
      >
        {label}
        {isActive ? (
          currentDirection === "desc" ? (
            <ArrowDown className="h-3.5 w-3.5" />
          ) : (
            <ArrowUp className="h-3.5 w-3.5" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
        )}
      </button>
    </StyledTableHead>
  );
}

export function ValidatorsTable({
  validators,
  commissionAndStateMap,
  totalVotingPower,
  isLoading,
  sortColumn,
  sortDirection,
  onSort,
  startIndex,
}: ValidatorsTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <StyledTable>
          <StyledTableHeader>
            <StyledTableHeaderRow>
              <StyledTableHead className="w-16">#</StyledTableHead>
              <StyledTableHead>Staking Pool Address</StyledTableHead>
              <StyledTableHead>Status</StyledTableHead>
              <StyledTableHead>Operator Address</StyledTableHead>
              <StyledTableHead className="text-right">Delegated Amount</StyledTableHead>
              <StyledTableHead className="text-right">Network %</StyledTableHead>
              <StyledTableHead className="text-right hidden md:table-cell">Commission</StyledTableHead>
              <StyledTableHead className="text-right hidden md:table-cell">Delegators</StyledTableHead>
            </StyledTableHeaderRow>
          </StyledTableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <StyledTableRow key={i}>
                <TableCell><EnhancedSkeleton className="h-4 w-6" /></TableCell>
                <TableCell><EnhancedSkeleton className="h-4 w-28" /></TableCell>
                <TableCell><EnhancedSkeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell><EnhancedSkeleton className="h-4 w-28" /></TableCell>
                <TableCell className="text-right"><EnhancedSkeleton className="h-4 w-24 ml-auto" /></TableCell>
                <TableCell className="text-right"><EnhancedSkeleton className="h-4 w-12 ml-auto" /></TableCell>
                <TableCell className="text-right hidden md:table-cell"><EnhancedSkeleton className="h-4 w-10 ml-auto" /></TableCell>
                <TableCell className="text-right hidden md:table-cell"><EnhancedSkeleton className="h-4 w-8 ml-auto" /></TableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </StyledTable>
      </div>
    );
  }

  if (validators.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No validators found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <StyledTable>
        <StyledTableHeader>
          <StyledTableHeaderRow>
            <StyledTableHead className="w-16">#</StyledTableHead>
            <StyledTableHead>Staking Pool Address</StyledTableHead>
            <StyledTableHead>Status</StyledTableHead>
            <StyledTableHead>Operator Address</StyledTableHead>
            <SortableHeader
              label="Delegated Amount"
              column="votingPower"
              currentColumn={sortColumn}
              currentDirection={sortDirection}
              onSort={onSort}
              className="text-right"
            />
            <SortableHeader
              label="Network %"
              column="networkPercent"
              currentColumn={sortColumn}
              currentDirection={sortDirection}
              onSort={onSort}
              className="text-right"
            />
            <SortableHeader
              label="Commission"
              column="commission"
              currentColumn={sortColumn}
              currentDirection={sortDirection}
              onSort={onSort}
              className="text-right hidden md:table-cell"
            />
            <StyledTableHead className="text-right hidden md:table-cell">
              Delegators
            </StyledTableHead>
          </StyledTableHeaderRow>
        </StyledTableHeader>
        <TableBody>
          {validators.map((validator, index) => {
            const votingPower =
              BigInt(validator.voting_power) / BigInt(10 ** 8);
            const networkPercent = calculateNetworkPercentage(
              validator.voting_power,
              totalVotingPower,
            );
            const info = commissionAndStateMap?.get(validator.owner_address);
            const validatorStatus = info
              ? getValidatorStatus(info.status)
              : undefined;

            return (
              <StyledTableRow
                key={validator.owner_address}
                className="cursor-pointer"
                onClick={() =>
                  (window.location.href = `/validator/${validator.owner_address}`)
                }
              >
                <TableCell className="font-medium">
                  {startIndex + index + 1}
                </TableCell>
                <TableCell>
                  <CopyableAddress
                    address={validator.owner_address}
                    href={`/account/${validator.owner_address}`}
                    truncateLength={{ start: 6, end: 4 }}
                    showCopyButton={false}
                  />
                </TableCell>
                <TableCell>
                  <ValidatorStatusBadge status={validatorStatus} />
                </TableCell>
                <TableCell>
                  <CopyableAddress
                    address={validator.operator_address}
                    href={`/account/${validator.operator_address}`}
                    truncateLength={{ start: 6, end: 4 }}
                    showCopyButton={false}
                  />
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {votingPower.toLocaleString("en-US")} MOVE
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {networkPercent}%
                </TableCell>
                <TableCell className="text-right hidden md:table-cell tabular-nums">
                  {info ? `${info.commission}%` : "-"}
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">
                  <DelegatorCountCell poolAddress={validator.owner_address} />
                </TableCell>
              </StyledTableRow>
            );
          })}
        </TableBody>
      </StyledTable>
    </div>
  );
}
