import * as React from "react";
import { api } from "@/lib/api-client";

export interface ProgressStatePayload {
  repositoryId: string;
  status: "PENDING" | "QUEUED" | "CLONING" | "ANALYZING" | "INDEXING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "STALLED";
  currentStage: string;
  progress: number;
  message: string;
  errorMessage: string | null;
  processedFiles: number;
  totalFiles: number;
  processedChunks: number;
  totalChunks: number;
  embeddingsGenerated: number;
  estimatedRemainingTime: string | null;
  startedAt: string | Date;
  finishedAt: string | Date | null;
  logs: Array<{ timestamp: string; message: string; stage: string }>;
}

export function useRepositoryProgress(
  repositoryId: string,
  isExpanded: boolean,
  isProcessing: boolean,
  onComplete?: () => void
) {
  const [liveProgress, setLiveProgress] = React.useState<ProgressStatePayload | null>(null);

  const onCompleteRef = React.useRef(onComplete);
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  React.useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    const fetchProgress = async () => {
      try {
        const data = await api.get<ProgressStatePayload>(`/v1/repositories/${repositoryId}/progress`);
        console.log("[POLLING_PROGRESS]", data.currentStage, data.progress);
        setLiveProgress(data);

        if (data.status === "COMPLETED" || data.status === "FAILED" || data.status === "CANCELLED" || data.status === "STALLED") {
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        }
      } catch (err) {
        console.warn("[POLLING_PROGRESS] Poll error:", err);
      }
    };

    if (isExpanded || isProcessing) {
      fetchProgress();
      pollInterval = setInterval(fetchProgress, 2000);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLiveProgress(null);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [repositoryId, isExpanded, isProcessing]);

  return liveProgress;
}
