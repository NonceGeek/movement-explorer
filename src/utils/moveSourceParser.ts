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
