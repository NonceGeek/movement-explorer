import { useMemo } from "react";
import { transformCode, removeSignerParam } from "@/utils";
import { parseFunctionParams } from "@/utils/moveSourceParser";
import { useGetAccountModule } from "./useGetAccountModule";
import { useGetPackageRegistry } from "./useGetPackageRegistry";

export interface ResolvedParam {
  name: string;
  type: string;
}

/**
 * Parse a fully-qualified Move function path into its components.
 * e.g. "0x1::coin::transfer" → { address: "0x1", module: "coin", function: "transfer" }
 */
function parseFunctionPath(functionPath: string) {
  const parts = functionPath.split("::");
  if (parts.length < 3) return null;
  return {
    address: parts[0],
    module: parts[1],
    function: parts.slice(2).join("::"),
  };
}

/**
 * Hook to dynamically resolve function parameter names and types
 * by composing useGetAccountModule (ABI) and useGetPackageRegistry (source).
 *
 * Caching is handled at each layer:
 * - Module ABI: cached by ["accountModule", address, moduleName, network]
 * - PackageRegistry: cached by ["packageRegistry", address, network]
 *
 * So multiple functions from the same module or address share cached data.
 */
export function useGetFunctionParams(functionPath: string | null): {
  params: ResolvedParam[] | null;
  isLoading: boolean;
} {
  const parsed = functionPath ? parseFunctionPath(functionPath) : null;

  // Reuse cached module ABI (shared with CodeTab, AbiDisplay, etc.)
  const { data: moduleData, isLoading: moduleLoading } = useGetAccountModule(
    parsed?.address ?? "",
    parsed?.module ?? "",
  );

  // Reuse cached PackageRegistry (shared with useContractSourceAvailability)
  const { data: packages, isLoading: pkgLoading } = useGetPackageRegistry(
    parsed?.address ?? null,
  );

  const params = useMemo(() => {
    if (!parsed || !moduleData?.abi) return null;

    const moveFunction = moduleData.abi.exposed_functions.find(
      (f) => f.name === parsed.function,
    );
    if (!moveFunction) return null;

    const abiTypes = removeSignerParam(moveFunction);

    // Try to get parameter names from source code
    let sourceNames: string[] | null = null;
    if (packages) {
      for (const pkg of packages) {
        const mod = pkg.modules.find((m) => m.name === parsed.module);
        if (mod?.source && mod.source !== "0x") {
          const sourceCode = transformCode(mod.source);
          if (sourceCode) {
            const parsedParams = parseFunctionParams(
              sourceCode,
              parsed.function,
            );
            if (parsedParams && parsedParams.length === abiTypes.length) {
              sourceNames = parsedParams.map((p) => p.name);
            }
          }
          break;
        }
      }
    }

    return abiTypes.map((type, i) => ({
      name: sourceNames?.[i] ?? `arg_${i}`,
      type,
    }));
  }, [moduleData, packages, parsed]);

  const enabled = !!parsed?.address && !!parsed?.module && !!parsed?.function;
  const isLoading = enabled && (moduleLoading || pkgLoading);

  return { params, isLoading };
}
