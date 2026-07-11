export interface PipelineContext {
  repositoryId: string;
  userId: string;
  completedStages: string[];
  failedStage: string | null;
  failureReason: string | null;
  duration: number;
  processedFiles: number;
  totalFiles: number;
  processedChunks: number;
  totalChunks: number;
  embeddingsGenerated: number;
  startedAt: Date;
}
 
export interface PipelineTask {
  name: string;
  execute(ctx: PipelineContext): Promise<void>;
  rollback?(ctx: PipelineContext): Promise<void>;
}
