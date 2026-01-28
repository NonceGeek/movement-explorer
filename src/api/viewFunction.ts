import { Types, AptosClient } from "aptos";

/**
 * Call a view function on the blockchain
 * View functions are read-only and don't require gas
 */
export async function viewFunction(
  request: Types.ViewRequest,
  client: AptosClient,
  ledgerVersion?: string,
): Promise<Types.MoveValue[]> {
  let parsedVersion = ledgerVersion;

  // Handle non-numbers, to default to the latest ledger version
  if (typeof ledgerVersion === "string" && isNaN(parseInt(ledgerVersion, 10))) {
    parsedVersion = undefined;
  }

  return client.view(request, parsedVersion);
}

/**
 * Remove signer parameters from function params
 * Signer is automatically populated by the wallet
 */
export function removeSignerParam(fn: Types.MoveFunction): string[] {
  return fn.params.filter((param) => param !== "signer" && param !== "&signer");
}

/**
 * Get bytecode size in KB
 */
export function getBytecodeSizeInKB(bytecode: string): string {
  // Each hex character represents 4 bits, so divide by 2 for bytes, then 1024 for KB
  const bytes = (bytecode.length - 2) / 2; // subtract 2 for "0x" prefix
  const kb = bytes / 1024;
  return kb.toFixed(2);
}

/**
 * Encode input args for view request
 * Handles arrays and basic types
 */
export function encodeInputArgsForViewRequest(
  type: string,
  arg: string,
): string | string[] {
  if (!arg || arg.trim() === "") {
    return "";
  }

  const trimmedArg = arg.trim();

  // Handle vector types
  if (type.startsWith("vector<")) {
    if (trimmedArg.startsWith("[")) {
      try {
        return JSON.parse(trimmedArg) as string[];
      } catch {
        return trimmedArg.split(",").map((s) => s.trim());
      }
    }
    return trimmedArg.split(",").map((s) => s.trim());
  }

  return trimmedArg;
}
