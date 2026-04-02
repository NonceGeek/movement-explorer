import { useState, useEffect, useRef, useMemo } from "react";
import { AptosClient, Types } from "aptos";
import { getTransaction } from "@/services";
import { StreamingRowData } from "@/components/transactions";

interface UseStreamingTransactionsResult {
  /** Fixed-position rows: transaction is null while loading, filled when resolved */
  rows: StreamingRowData[];
  /** Number of transactions loaded */
  loadedCount: number;
  /** Total number of transactions to load */
  totalCount: number;
  /** Whether fetches are still in-flight */
  isStreaming: boolean;
  /** Whether all transactions have been loaded */
  isComplete: boolean;
}

/**
 * Fetches transaction details independently and fills them into
 * fixed-position rows. Each row starts as a skeleton (transaction=null)
 * and transitions to real data when its fetch resolves.
 */
export function useStreamingTransactions(
  versions: number[] | undefined,
  client: AptosClient,
  enabled: boolean = true,
): UseStreamingTransactionsResult {
  // Map of version -> transaction (filled as fetches resolve)
  const [loadedMap, setLoadedMap] = useState<Map<number, Types.Transaction>>(
    () => new Map(),
  );

  // Track current fetch session to ignore stale results
  const sessionRef = useRef(0);

  // Detect stale state: versions changed but useEffect hasn't fired yet
  const versionsKey = useMemo(
    () => (versions ? versions.join(",") : ""),
    [versions],
  );
  const activeKeyRef = useRef("");
  const isStale = versionsKey !== activeKeyRef.current;

  const totalCount = versions?.length ?? 0;
  const loadedCount = isStale ? 0 : loadedMap.size;
  const isStreaming = enabled && totalCount > 0 && loadedCount < totalCount;
  const isComplete = !isStale && enabled && totalCount > 0 && loadedCount >= totalCount;

  // Build fixed-position rows array
  const rows: StreamingRowData[] = useMemo(() => {
    if (!versions || versions.length === 0) return [];
    if (isStale) {
      // Versions changed but effect hasn't run — return all skeletons
      return versions.map((v) => ({ version: v, transaction: null }));
    }
    return versions.map((v) => ({
      version: v,
      transaction: loadedMap.get(v) ?? null,
    }));
  }, [versions, loadedMap, isStale]);

  useEffect(() => {
    // Bump session to invalidate any in-flight fetches from previous versions
    const session = ++sessionRef.current;

    // Mark this versions set as active (resolves stale detection)
    activeKeyRef.current = versions ? versions.join(",") : "";

    // Reset loaded data
    setLoadedMap(new Map());

    if (!enabled || !versions || versions.length === 0) {
      return;
    }

    // Minimum stagger between each row appearing (ms)
    const STAGGER_MS = 60;
    let resolveOrder = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Fire off all fetches independently
    versions.forEach((version) => {
      getTransaction({ txnHashOrVersion: version }, client)
        .then((tx) => {
          if (sessionRef.current !== session) return;

          const delay = resolveOrder++ * STAGGER_MS;
          const timer = setTimeout(() => {
            if (sessionRef.current !== session) return;
            setLoadedMap((prev) => {
              const next = new Map(prev);
              next.set(version, tx);
              return next;
            });
          }, delay);
          timers.push(timer);
        })
        .catch(() => {
          if (sessionRef.current !== session) return;

          const delay = resolveOrder++ * STAGGER_MS;
          const timer = setTimeout(() => {
            if (sessionRef.current !== session) return;
            setLoadedMap((prev) => {
              const next = new Map(prev);
              next.set(version, null as unknown as Types.Transaction);
              return next;
            });
          }, delay);
          timers.push(timer);
        });
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [versions, client, enabled]);

  return {
    rows,
    loadedCount,
    totalCount,
    isStreaming,
    isComplete,
  };
}
