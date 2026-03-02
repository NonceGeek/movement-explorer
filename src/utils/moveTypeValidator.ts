import {
  isValidAccountAddress,
  isValidStruct,
  deserializeVector,
} from "./index";

// Integer range limits
const U8_MAX = 255;
const U16_MAX = 65_535;
const U32_MAX = 4_294_967_295;
const U64_MAX = BigInt("18446744073709551615");
const U128_MAX = BigInt("340282366920938463463374607431768211455");
const U256_MAX = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935",
);

function validateUint(
  value: string,
  max: number,
): string | true {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  if (!/^\d+$/.test(trimmed)) {
    return `Must be an integer (0 to ${max.toLocaleString()})`;
  }
  const n = Number(trimmed);
  if (n < 0 || n > max) {
    return `Must be an integer (0 to ${max.toLocaleString()})`;
  }
  return true;
}

function validateBigUint(
  value: string,
  max: bigint,
  label: string,
): string | true {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  if (!/^\d+$/.test(trimmed)) {
    return `Must be a valid ${label} integer`;
  }
  try {
    const n = BigInt(trimmed);
    if (n < BigInt(0) || n > max) {
      return `Must be a valid ${label} integer`;
    }
    return true;
  } catch {
    return `Must be a valid ${label} integer`;
  }
}

function validateBool(value: string): string | true {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  if (trimmed !== "true" && trimmed !== "false") {
    return 'Must be "true" or "false"';
  }
  return true;
}

function validateAddress(value: string): string | true {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  if (!isValidAccountAddress(trimmed)) {
    return "Invalid address (expected 0x...)";
  }
  return true;
}

function validateVector(type: string, value: string): string | true {
  const trimmed = value.trim();
  if (trimmed === "") return true;

  const innerMatch = type.match(/^vector<(.+)>$/);
  if (!innerMatch) return "Invalid vector type";
  const innerType = innerMatch[1];

  if (innerType === "u8" && trimmed.startsWith("0x")) {
    if (!/^0x[a-fA-F0-9]*$/.test(trimmed)) {
      return "Invalid hex format (expected 0x followed by hex characters)";
    }
    return true;
  }

  try {
    const items = deserializeVector(trimmed);
    if (items.length === 0) return true;

    const innerValidator = getMoveTypeValidator(innerType);
    for (let i = 0; i < items.length; i++) {
      const result = innerValidator(items[i].trim());
      if (result !== true) {
        return `Element [${i}]: ${result}`;
      }
    }
    return true;
  } catch {
    return "Invalid vector format (use JSON array or comma-separated values)";
  }
}

function validateOption(type: string, value: string): string | true {
  const trimmed = value.trim();
  if (trimmed === "") return true;

  const innerMatch = type.match(/^0x1::option::Option<(.+)>$/);
  if (!innerMatch) return true;

  const innerValidator = getMoveTypeValidator(innerMatch[1]);
  return innerValidator(trimmed);
}

function validateStructType(value: string): string | true {
  const trimmed = value.trim();
  if (trimmed === "") return true;
  if (!isValidStruct(trimmed)) {
    return "Invalid type (expected addr::module::name)";
  }
  return true;
}

/**
 * Returns a react-hook-form compatible validate function for a given Move type.
 * Returns `true` if valid, or an error message string if invalid.
 */
export function getMoveTypeValidator(
  moveType: string,
): (value: string) => string | true {
  const type = moveType.trim();

  if (type === "bool") return validateBool;
  if (type === "address") return validateAddress;
  if (type === "u8") return (v) => validateUint(v, U8_MAX);
  if (type === "u16") return (v) => validateUint(v, U16_MAX);
  if (type === "u32") return (v) => validateUint(v, U32_MAX);
  if (type === "u64") return (v) => validateBigUint(v, U64_MAX, "u64");
  if (type === "u128") return (v) => validateBigUint(v, U128_MAX, "u128");
  if (type === "u256") return (v) => validateBigUint(v, U256_MAX, "u256");
  if (type.startsWith("vector<")) return (v) => validateVector(type, v);
  if (type.startsWith("0x1::option::Option"))
    return (v) => validateOption(type, v);
  if (type.startsWith("0x")) return validateStructType;

  return () => true;
}

/**
 * Validates ledger version input: must be a non-negative integer or empty.
 */
export function validateLedgerVersion(value: string): string | true {
  const trimmed = (value ?? "").trim();
  if (trimmed === "") return true;
  if (!/^\d+$/.test(trimmed)) {
    return "Must be a non-negative integer";
  }
  return true;
}
