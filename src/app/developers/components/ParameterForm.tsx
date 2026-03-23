"use client";

import { Input } from "@/components/ui/input";
import type { Parameter } from "@/types/openapi";

interface ParameterFormProps {
  parameters: Parameter[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}

export default function ParameterForm({
  parameters,
  values,
  onChange,
}: ParameterFormProps) {
  if (parameters.length === 0) return null;

  const pathParams = parameters.filter((p) => p.in === "path");
  const queryParams = parameters.filter((p) => p.in === "query");

  return (
    <div className="space-y-4">
      {pathParams.length > 0 && (
        <ParamGroup label="Path Parameters" params={pathParams} values={values} onChange={onChange} />
      )}
      {queryParams.length > 0 && (
        <ParamGroup label="Query Parameters" params={queryParams} values={values} onChange={onChange} />
      )}
    </div>
  );
}

function ParamGroup({
  label,
  params,
  values,
  onChange,
}: {
  label: string;
  params: Parameter[];
  values: Record<string, string>;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <div>
      <h4 className="text-sm font-medium text-muted-foreground mb-2">
        {label}
      </h4>
      <div className="space-y-2">
        {params.map((param) => (
          <div key={param.name} className="flex items-start gap-3">
            <div className="w-32 flex-shrink-0 pt-2">
              <span className="text-sm font-mono">{param.name}</span>
              {param.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
              <div className="text-xs text-muted-foreground">
                {param.schema?.type ?? "string"}
              </div>
            </div>
            <div className="flex-1">
              <Input
                placeholder={param.description || param.name}
                value={values[param.name] ?? ""}
                onChange={(e) => onChange(param.name, e.target.value)}
                className="font-mono text-sm"
              />
              {param.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {param.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
