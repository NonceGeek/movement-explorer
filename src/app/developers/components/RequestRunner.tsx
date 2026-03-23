"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/styling";
import { Play, Loader2, Copy, Check } from "lucide-react";

interface RequestRunnerProps {
  method: string;
  url: string;
  body?: object;
}

export default function RequestRunner({ method, url, body }: RequestRunnerProps) {
  const [response, setResponse] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setStatusCode(null);

    const start = performance.now();

    try {
      const options: RequestInit = { method };
      if (body && method !== "GET") {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(body);
      }

      const res = await fetch(url, options);
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setStatusCode(res.status);

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!response) return;
    await navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleRun}
        disabled={loading}
        size="sm"
        className="bg-guild-green hover:bg-guild-green/90 text-white"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Play className="h-4 w-4 mr-2" />
        )}
        Send Request
      </Button>

      {(response || error) && (
        <div className="rounded-lg border overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b text-sm">
            <div className="flex items-center gap-3">
              {statusCode && (
                <span
                  className={cn(
                    "font-mono font-medium",
                    statusCode < 300
                      ? "text-green-600"
                      : statusCode < 400
                        ? "text-yellow-600"
                        : "text-red-600"
                  )}
                >
                  {statusCode}
                </span>
              )}
              {responseTime !== null && (
                <span className="text-muted-foreground">
                  {responseTime}ms
                </span>
              )}
            </div>
            {response && (
              <button
                onClick={handleCopy}
                className="text-muted-foreground hover:text-foreground"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            )}
          </div>

          {/* Response body */}
          <pre className="p-4 text-sm font-mono overflow-x-auto max-h-[400px] overflow-y-auto bg-background">
            {error ? (
              <span className="text-red-600">{error}</span>
            ) : (
              response
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
