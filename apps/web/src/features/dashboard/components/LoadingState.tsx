import * as React from "react";

export function LoadingState() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="p-5 border border-border/20 bg-[#111625]/20 rounded-xl space-y-4 shadow-sm relative overflow-hidden"
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-800/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />

          {/* Header skeleton */}
          <div className="flex items-center justify-between pb-3 border-b border-border/10">
            <div className="space-y-1.5 flex-1">
              <div className="h-3.5 w-1/3 bg-[#1F2937]/50 rounded" />
              <div className="h-2.5 w-2/3 bg-[#1F2937]/30 rounded" />
            </div>
            <div className="h-5 w-14 bg-[#1F2937]/40 rounded-full" />
          </div>

          {/* Stats skeleton */}
          <div className="h-10 bg-[#0F1320]/45 rounded-lg w-full" />

          {/* Action skeleton */}
          <div className="flex items-center justify-between pt-3">
            <div className="h-6 w-24 bg-[#1F2937]/30 rounded" />
            <div className="h-6 w-32 bg-[#1F2937]/40 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
