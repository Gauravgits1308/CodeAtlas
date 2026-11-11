import * as React from "react";
import { api } from "@/lib/api-client";

export interface SyncState {
  status: "PENDING" | "QUEUED" | "CLONING" | "ANALYZING" | "INDEXING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "STALLED";
  currentStage: string;
  progress: number;
  currentMessage: string;
  estimatedRemainingTime: string | null;
  startedAt?: string | Date;
}

export function useRepositorySync(
  repositoryId: string,
  initialStatus: SyncState["status"],
  onComplete?: () => void
) {
  const [state, setState] = React.useState<SyncState | null>(() => {
    const isProcessing = ["QUEUED", "CLONING", "ANALYZING", "PROCESSING", "INDEXING"].includes(initialStatus);
    if (isProcessing) {
      return {
        status: initialStatus,
        currentStage: initialStatus === "QUEUED" ? "QUEUED" : "Processing",
        progress: 0,
        currentMessage: "Initializing synchronization...",
        estimatedRemainingTime: null,
      };
    }
    return null;
  });

  const onCompleteRef = React.useRef(onComplete);
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const stateRef = React.useRef<SyncState | null>(null);
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const updateStateIfNeeded = React.useCallback((next: Partial<SyncState>) => {
    const current = stateRef.current;
    if (!current) {
      const newState: SyncState = {
        status: next.status || "QUEUED",
        currentStage: next.currentStage || "QUEUED",
        progress: next.progress ?? 0,
        currentMessage: next.currentMessage || "",
        estimatedRemainingTime: next.estimatedRemainingTime || null,
        startedAt: next.startedAt,
      };
      console.log("[SYNC_POLL] State Updated", repositoryId, newState);
      setState(newState);
      return;
    }

    const hasChanged =
      current.status !== next.status ||
      current.currentStage !== next.currentStage ||
      current.progress !== next.progress ||
      current.currentMessage !== next.currentMessage ||
      current.estimatedRemainingTime !== next.estimatedRemainingTime;

    if (hasChanged) {
      const newState = {
        ...current,
        ...next,
      } as SyncState;
      console.log("[SYNC_POLL] State Updated", repositoryId, newState);
      setState(newState);
    }
  }, [repositoryId]);

  const cleanup = React.useCallback(() => {
    if (pollIntervalRef.current) {
      console.log("[SYNC_POLL] Stop Polling", repositoryId);
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, [repositoryId]);

  const startPolling = React.useCallback(() => {
    cleanup();

    console.log("[SYNC_POLL] Starting HTTP Polling", repositoryId);

    const fetchPoll = async () => {
      try {
        const res = await api.get<{
          status: SyncState["status"];
          currentStage: string;
          progress: number;
          message?: string;
          currentMessage?: string;
          estimatedRemainingTime?: string | null;
          startedAt?: string | Date;
        }>(`/v1/repositories/${repositoryId}/progress`);

        console.log("[SYNC_POLL] Response", repositoryId, res);

        const nextStatus = res.status;
        const currentStage = res.currentStage;
        const progress = res.progress;
        const currentMessage = res.currentMessage || res.message || "";
        const estimatedRemainingTime = res.estimatedRemainingTime || null;
        const startedAt = res.startedAt;

        updateStateIfNeeded({
          status: nextStatus,
          currentStage,
          progress,
          currentMessage,
          estimatedRemainingTime,
          startedAt,
        });

        if (nextStatus === "COMPLETED" || nextStatus === "FAILED" || nextStatus === "CANCELLED" || nextStatus === "STALLED") {
          console.log("[SYNC_POLL] Repository Sync Final State Reached:", repositoryId, nextStatus);
          cleanup();
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }
      } catch (err) {
        console.warn("[SYNC_POLL] Poll error:", err);
      }
    };

    fetchPoll();
    pollIntervalRef.current = setInterval(fetchPoll, 2000);
  }, [repositoryId, cleanup, updateStateIfNeeded]);

  React.useEffect(() => {
    const isProcessing = ["QUEUED", "CLONING", "ANALYZING", "PROCESSING", "INDEXING"].includes(initialStatus);

    if (isProcessing) {
      startPolling();
    } else {
      cleanup();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState(null);
    }

    return () => {
      cleanup();
    };
  }, [repositoryId, initialStatus, startPolling, cleanup]);

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const isProcessing = stateRef.current && ["QUEUED", "CLONING", "ANALYZING", "PROCESSING", "INDEXING"].includes(stateRef.current.status);
        if (isProcessing) {
          startPolling();
        }
      }
    };

    const handleFocus = () => {
      const isProcessing = stateRef.current && ["QUEUED", "CLONING", "ANALYZING", "PROCESSING", "INDEXING"].includes(stateRef.current.status);
      if (isProcessing) {
        startPolling();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [startPolling]);

  return state;
}
