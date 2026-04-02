import { useState, useEffect, useRef, useMemo } from "react";
import { AptosClient, Types } from "aptos";

export interface StreamingBlockRowData {
  blockHeight: number;
  block: Types.Block | null;
}

interface UseStreamingBlocksResult {
  rows: StreamingBlockRowData[];
  loadedCount: number;
  totalCount: number;
  isStreaming: boolean;
  isComplete: boolean;
}

/**
 * Fetches block details independently and fills them into
 * fixed-position rows. Each row starts as a skeleton (block=null)
 * and transitions to real data when its fetch resolves.
 */
export function useStreamingBlocks(
  heights: number[] | undefined,
  client: AptosClient,
  enabled: boolean = true,
): UseStreamingBlocksResult {
  const [loadedMap, setLoadedMap] = useState<Map<number, Types.Block>>(
    () => new Map(),
  );

  const sessionRef = useRef(0);

  const heightsKey = useMemo(
    () => (heights ? heights.join(",") : ""),
    [heights],
  );
  const activeKeyRef = useRef("");
  const isStale = heightsKey !== activeKeyRef.current;

  const totalCount = heights?.length ?? 0;
  const loadedCount = isStale ? 0 : loadedMap.size;
  const isStreaming = enabled && totalCount > 0 && loadedCount < totalCount;
  const isComplete = !isStale && enabled && totalCount > 0 && loadedCount >= totalCount;

  const rows: StreamingBlockRowData[] = useMemo(() => {
    if (!heights || heights.length === 0) return [];
    if (isStale) {
      return heights.map((h) => ({ blockHeight: h, block: null }));
    }
    return heights.map((h) => ({
      blockHeight: h,
      block: loadedMap.get(h) ?? null,
    }));
  }, [heights, loadedMap, isStale]);

  useEffect(() => {
    const session = ++sessionRef.current;
    activeKeyRef.current = heights ? heights.join(",") : "";
    setLoadedMap(new Map());

    if (!enabled || !heights || heights.length === 0) {
      return;
    }

    const STAGGER_MS = 60;
    let resolveOrder = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    heights.forEach((height) => {
      client
        .getBlockByHeight(height, false)
        .then((block) => {
          if (sessionRef.current !== session) return;

          const delay = resolveOrder++ * STAGGER_MS;
          const timer = setTimeout(() => {
            if (sessionRef.current !== session) return;
            setLoadedMap((prev) => {
              const next = new Map(prev);
              next.set(height, block);
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
              next.set(height, null as unknown as Types.Block);
              return next;
            });
          }, delay);
          timers.push(timer);
        });
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [heights, client, enabled]);

  return {
    rows,
    loadedCount,
    totalCount,
    isStreaming,
    isComplete,
  };
}
