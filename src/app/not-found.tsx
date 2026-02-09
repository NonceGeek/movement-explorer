"use client";

import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative min-h-[calc(100vh-200px)] flex items-center justify-center overflow-hidden">
      {/* Dotted Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(129, 255, 186, 0.3) 1.2px, transparent 1.2px),
            radial-gradient(circle, rgba(0, 45, 214, 0.18) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px, 24px 24px",
          backgroundPosition: "0 0, 12px 12px",
          maskImage: `linear-gradient(to bottom, black 0%, black 70%, transparent 100%),
                      linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)`,
          maskComposite: "intersect",
          WebkitMaskImage: `linear-gradient(to bottom, black 0%, black 70%, transparent 100%),
                            linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)`,
          WebkitMaskComposite: "source-in",
        }}
      />

      {/* Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-guild-green-500/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] bg-byzantine-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 font-heading">
        {/* 404 Number */}
        <div className="relative mb-6">
          <span className="text-[120px] md:text-[180px] font-bold leading-none text-transparent bg-clip-text bg-linear-to-b from-white/20 to-white/5 select-none">
            404
          </span>
          <span className="absolute inset-0 flex items-center justify-center text-[120px] md:text-[180px] font-bold leading-none text-transparent bg-clip-text bg-linear-to-b from-guild-green-400 to-guild-green-600/50">
            404
          </span>
        </div>

        {/* Message */}
        <h1 className="text-2xl md:text-3xl font-semibold text-white mb-3">
          Page Not Found
        </h1>
      </div>
    </div>
  );
}
