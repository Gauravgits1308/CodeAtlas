import * as React from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function useRepositoryActions(onActionCompleted: () => void) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);

  const handleSync = async (id: string, name: string) => {
    setIsSyncing(true);
    try {
      const response = await api.post<{ success: boolean }>(
        `/v1/repositories/${id}/process`
      );
      if (response.success) {
        toast.success(`"${name}" queued for sync.`);
        onActionCompleted();
      } else {
        toast.error("Failed to queue repository for processing.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || `An error occurred while syncing ${name}.`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCancel = async (id: string, name: string) => {
    setIsCancelling(true);
    try {
      const response = await api.post<{ success: boolean }>(
        `/v1/repositories/${id}/cancel`
      );
      if (response.success) {
        toast.success(`Processing cancelled for "${name}".`);
        onActionCompleted();
      } else {
        toast.error("Failed to cancel processing.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || `Failed to cancel processing for ${name}.`);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRetry = async (id: string, name: string) => {
    setIsSyncing(true);
    try {
      const response = await api.post<{ success: boolean }>(
        `/v1/repositories/${id}/retry`
      );
      if (response.success) {
        toast.success(`Restarted indexing from 0% for "${name}".`);
        onActionCompleted();
      } else {
        toast.error("Failed to retry repository processing.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || `Failed to retry processing for ${name}.`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleArchive = async (id: string, name: string) => {
    try {
      const res = await api.patch<{ success: boolean }>(`/v1/repositories/${id}/archive`);
      if (res.success) {
        toast.success(`"${name}" archived successfully.`);
        onActionCompleted();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to archive repository.");
    }
  };

  const handleRestore = async (id: string, name: string) => {
    try {
      const res = await api.patch<{ success: boolean }>(`/v1/repositories/${id}/restore`);
      if (res.success) {
        toast.success(`"${name}" restored successfully.`);
        onActionCompleted();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to restore repository.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setIsDeleting(true);
    try {
      const res = await api.delete<{ success: boolean }>(`/v1/repositories/${id}`);
      if (res.success) {
        toast.success(`"${name}" deleted successfully.`);
        onActionCompleted();
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Unable to remove repository.");
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    handleSync,
    handleCancel,
    handleRetry,
    handleArchive,
    handleRestore,
    handleDelete,
    isDeleting,
    isSyncing,
    isCancelling,
  };
}
