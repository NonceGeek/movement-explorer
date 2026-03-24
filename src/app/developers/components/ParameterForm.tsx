"use client";

import { Fragment } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/styling";
import type { Parameter } from "@/types/openapi";

interface ParameterFormProps {
  parameters: Parameter[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
  errorParams?: Set<string>;
}

// Colors aligned with shiki JSON syntax highlighting tokens
const TYPE_COLORS: Record<string, string> = {
  string: "text-[var(--color-moveus-marigold-400)]",
  integer: "text-[var(--color-oracle-orange-400)]",
  number: "text-[var(--color-oracle-orange-400)]",
  boolean: "text-[var(--color-guild-green-300)]",
  array: "text-[var(--color-protocol-pink-300)]",
  object: "text-[var(--color-byzantine-blue-200)]",
};

export default function ParameterForm({
  parameters,
  values,
  onChange,
  errorParams,
}: ParameterFormProps) {
  if (parameters.length === 0) return null;

  const pathParams = parameters.filter((p) => p.in === "path");
  const queryParams = parameters.filter((p) => p.in === "query");

  const groups: { label: string; params: Parameter[] }[] = [];
  if (pathParams.length > 0)
    groups.push({ label: "Path Parameters", params: pathParams });
  if (queryParams.length > 0)
    groups.push({ label: "Query Parameters", params: queryParams });

  return (
    <>
      {/* Mobile: stacked layout */}
      <div className="md:hidden space-y-4">
        {groups.map((group) => (
          <div key={group.label} className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </h4>
            {group.params.map((param) => {
              const hasError = errorParams?.has(param.name);
              return (
                <div key={param.name} className="space-y-1">
                  <div>
                    <span className="text-sm font-mono font-medium">
                      {param.name}
                    </span>
                    {param.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    <span
                      className={cn(
                        "text-[11px] ml-2",
                        TYPE_COLORS[param.schema?.type ?? "string"] ??
                          "text-muted-foreground/50",
                      )}
                    >
                      {param.schema?.type ?? "string"}
                    </span>
                  </div>
                  <Input
                    placeholder={param.description || param.name}
                    value={values[param.name] ?? ""}
                    onChange={(e) => onChange(param.name, e.target.value)}
                    className={cn(
                      "font-mono text-sm",
                      hasError && "border-red-500 focus-visible:ring-red-500",
                    )}
                  />
                  {hasError && <p className="text-xs text-red-500">Required</p>}
                  {!hasError && param.description && (
                    <p className="text-xs text-muted-foreground">
                      {param.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Desktop: single unified grid so all inputs align */}
      <div className="hidden md:grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-start">
        {groups.map((group) => (
          <Fragment key={group.label}>
            <h4 className="col-span-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 pt-1 first:pt-0">
              {group.label}
            </h4>
            {group.params.map((param) => {
              const hasError = errorParams?.has(param.name);
              return (
                <Fragment key={param.name}>
                  <div className="pt-2">
                    <span className="text-sm font-mono font-medium whitespace-nowrap">
                      {param.name}
                    </span>
                    {param.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    <div
                      className={cn(
                        "text-[11px]",
                        TYPE_COLORS[param.schema?.type ?? "string"] ??
                          "text-muted-foreground/50",
                      )}
                    >
                      {param.schema?.type ?? "string"}
                    </div>
                  </div>
                  <div className="pt-0.5">
                    <Input
                      placeholder={param.description || param.name}
                      value={values[param.name] ?? ""}
                      onChange={(e) => onChange(param.name, e.target.value)}
                      className={cn(
                        "font-mono text-sm",
                        hasError && "border-red-500 focus-visible:ring-red-500",
                      )}
                    />
                    {hasError && (
                      <p className="text-xs text-red-500 mt-1">Required</p>
                    )}
                    {!hasError && param.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {param.description}
                      </p>
                    )}
                  </div>
                </Fragment>
              );
            })}
          </Fragment>
        ))}
      </div>
    </>
  );
}
