import * as React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-rose-500/10 bg-rose-500/5 min-h-[300px]">
      <div className="flex items-center justify-center size-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4 animate-bounce">
        <AlertCircle className="size-6" />
      </div>
      
      <h3 className="text-xs font-bold text-foreground font-mono">
        Connection Failure
      </h3>
      <p className="text-xs text-rose-400/80 max-w-sm mt-1.5 leading-relaxed font-mono">
        {message || "An unexpected error occurred while communicating with the database server."}
      </p>

      <Button
        onClick={onRetry}
        variant="outline"
        size="sm"
        className="mt-6 h-8 text-xs gap-1 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
      >
        <RotateCcw className="size-3" />
        <span>Retry Sync</span>
      </Button>
    </div>
  );
}
