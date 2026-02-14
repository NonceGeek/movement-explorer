import moment from "moment";

/**
 * Time formatting utilities
 */

// Format timestamp as age (e.g., "2 minutes ago", "1 hour ago", "3 days ago")
export function formatAge(timestamp: string): string {
  // Timestamp is in microseconds, convert to milliseconds
  return moment(parseInt(timestamp) / 1000).fromNow();
}

// Format timestamp as UTC date time (e.g., "Feb 14, 2026 03:17:37 +UTC")
export function formatDateTimeUTC(timestamp: string): string {
  return moment(parseInt(timestamp) / 1000)
    .utc()
    .format("MMM DD, YYYY HH:mm:ss +UTC");
}
