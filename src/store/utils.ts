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

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".ogg", ".ogv"];

export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    // For non-standard URLs (e.g. ipfs://), check the raw string
    const lower = url.toLowerCase();
    return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
  }
}
