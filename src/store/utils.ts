// Helper functions for URL validation and IPFS conversion
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidIpfsUrl(url: string): boolean {
  return url?.startsWith("ipfs://") ?? false;
}

export function toIpfsUrl(url: string): string {
  return `https://ipfs.io/ipfs/${url.slice(7)}`;
}
