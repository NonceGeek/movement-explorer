/**
 * Parse Move source code to extract function parameter names and types.
 */

export interface ParsedParam {
  name: string;
  type: string;
}

/**
 * Regex fragment matching Move function modifiers in any order
 * (public, public(friend), entry, inline) followed by `fun`.
 */
const MOVE_FN_MODIFIERS = `(?:(?:public(?:\\(friend\\))?\\s+|entry\\s+|inline\\s+)*)fun`;

/**
 * Match a Move function declaration line capturing the function name.
 * Works for any modifier ordering (e.g. `entry public fun`, `public entry fun`).
 */
export const MOVE_FN_REGEX =
  /^\s*(?:(?:public(?:\(friend\))?\s+|entry\s+|inline\s+)*)fun\s+(\w+)/;

/**
 * Build a regex that matches a specific named function declaration.
 */
export function buildFnDeclRegex(functionName: string): RegExp {
  const escapedName = escapeRegExp(functionName);
  return new RegExp(
    `^\\s*${MOVE_FN_MODIFIERS}\\s+${escapedName}\\s*(?:<[^>]*>)?\\s*\\(`,
    "m",
  );
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extract content inside balanced parentheses starting at the given index.
 * @param source The source string
 * @param startIndex Index of the opening '('
 * @returns The content between '(' and matching ')', or null if unbalanced
 */
function extractBalancedParens(
  source: string,
  startIndex: number,
): string | null {
  let depth = 0;
  let i = startIndex;
  while (i < source.length) {
    if (source[i] === "(") depth++;
    else if (source[i] === ")") {
      depth--;
      if (depth === 0) return source.slice(startIndex + 1, i);
    }
    i++;
  }
  return null;
}

/**
 * Split a parameter string by commas, respecting nested `<>` depth.
 * e.g. "a: vector<u8>, b: Object<T>" → ["a: vector<u8>", "b: Object<T>"]
 */
function splitParams(paramStr: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of paramStr) {
    if (ch === "<") depth++;
    else if (ch === ">") depth--;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * Extract content inside balanced angle brackets starting at the given index.
 * @param source The source string
 * @param startIndex Index of the opening '<'
 * @returns The content between '<' and matching '>', or null if unbalanced
 */
function extractBalancedAngles(
  source: string,
  startIndex: number,
): string | null {
  let depth = 0;
  let i = startIndex;
  while (i < source.length) {
    if (source[i] === "<") depth++;
    else if (source[i] === ">") {
      depth--;
      if (depth === 0) return source.slice(startIndex + 1, i);
    }
    i++;
  }
  return null;
}

/**
 * Parse a Move function's generic type parameter names from source code.
 *
 * e.g. `fun transfer<CoinType>(...)` → ["CoinType"]
 *      `fun swap<X, Y: store + drop>(...)` → ["X", "Y"]
 *
 * @param sourceCode Decompressed Move source code
 * @param functionName The function name to find
 * @returns Array of type parameter names, or null if not found / no generics
 */
export function parseFunctionTypeParams(
  sourceCode: string,
  functionName: string,
): string[] | null {
  const escapedName = escapeRegExp(functionName);
  // Match the function declaration up to the generic `<`
  const regex = new RegExp(
    `^\\s*${MOVE_FN_MODIFIERS}\\s+${escapedName}\\s*<`,
    "m",
  );
  const match = regex.exec(sourceCode);
  if (!match) return null;

  // Find the '<' position at end of match
  const angleBracketIndex = match.index + match[0].length - 1;
  const content = extractBalancedAngles(sourceCode, angleBracketIndex);
  if (content === null) return null;

  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized === "") return [];

  // Split by comma respecting nested <> (for phantom Type<X>)
  const parts = splitParams(normalized);
  return parts.map((part) => {
    // "CoinType: store + drop" → "CoinType"
    // "phantom CoinType" → "CoinType"
    let name = part.trim();
    // Strip `phantom` keyword
    if (name.startsWith("phantom ")) {
      name = name.slice(8).trim();
    }
    // Strip constraint after `:`
    const colonIdx = name.indexOf(":");
    if (colonIdx !== -1) {
      name = name.slice(0, colonIdx).trim();
    }
    return name;
  });
}

/**
 * Parse a Move function's parameters from source code.
 *
 * @param sourceCode Decompressed Move source code
 * @param functionName The function name to find
 * @returns Array of parsed parameters (signer params filtered out), or null if not found
 */
export function parseFunctionParams(
  sourceCode: string,
  functionName: string,
): ParsedParam[] | null {
  const fnDeclRegex = buildFnDeclRegex(functionName);

  const match = fnDeclRegex.exec(sourceCode);
  if (!match) return null;

  // Find the opening '(' position
  const parenIndex = sourceCode.indexOf("(", match.index + match[0].length - 1);
  if (parenIndex === -1) return null;

  const paramContent = extractBalancedParens(sourceCode, parenIndex);
  if (paramContent === null) return null;

  // Normalize whitespace (handle multi-line signatures)
  const normalized = paramContent.replace(/\s+/g, " ").trim();
  if (normalized === "") return [];

  const rawParts = splitParams(normalized);
  const params: ParsedParam[] = [];

  for (const part of rawParts) {
    // Each parameter is "name: type"
    const colonIndex = part.indexOf(":");
    if (colonIndex === -1) continue;

    const name = part.slice(0, colonIndex).trim();
    const type = part.slice(colonIndex + 1).trim();

    // Filter out signer parameters (they don't appear in payload arguments)
    if (type === "signer" || type === "&signer") continue;

    params.push({ name, type });
  }

  return params;
}
