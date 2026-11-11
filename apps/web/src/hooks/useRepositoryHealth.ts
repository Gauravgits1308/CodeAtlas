import { useMemo } from "react";

export function useRepositoryHealth(score?: number) {
  return useMemo(() => {
    if (score === undefined || score === null) {
      return {
        rating: "N/A",
        colorClass: "text-zinc-400 bg-zinc-900/40 border-zinc-800",
        label: "Pending Analysis",
        colorHex: "#71717a",
      };
    }

    let rating = "D";
    let colorClass = "text-rose-400 bg-rose-400/5 border-rose-400/20";
    let label = "Critical Issues";
    let colorHex = "#f43f5e";

    if (score >= 90) {
      rating = "A+";
      colorClass = "text-emerald-400 bg-emerald-400/5 border-emerald-400/20";
      label = "Excellent Health";
      colorHex = "#34d399";
    } else if (score >= 80) {
      rating = "A";
      colorClass = "text-emerald-400 bg-emerald-400/5 border-emerald-400/20";
      label = "Healthy";
      colorHex = "#34d399";
    } else if (score >= 70) {
      rating = "B";
      colorClass = "text-blue-400 bg-blue-400/5 border-blue-400/20";
      label = "Good";
      colorHex = "#60a5fa";
    } else if (score >= 60) {
      rating = "C";
      colorClass = "text-amber-400 bg-amber-400/5 border-amber-400/20";
      label = "Fair";
      colorHex = "#fbbf24";
    }

    return {
      rating,
      colorClass,
      label,
      colorHex,
    };
  }, [score]);
}
