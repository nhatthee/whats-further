import type { RenderPipelineOrchestratorResult } from "./render-pipeline-orchestrator";
import type { RenderQueueSpec } from "./render-queue-spec";

export type RenderPipelineOutput = {
  jobId: string;
  outputPath: string;
};

export type RenderPipelineError = {
  jobId: string;
  error: string;
};

export type RenderPipelineReport = {
  queueId: string;
  topic: string;
  status: RenderQueueSpec["status"];
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  successRate: number;
  outputs: RenderPipelineOutput[];
  errors: RenderPipelineError[];
};

export function createRenderPipelineReport(
  result: RenderPipelineOrchestratorResult,
): RenderPipelineReport {
  const { queue, results } = result;
  const successRate =
    queue.totalJobs === 0 ? 0 : queue.completedJobs / queue.totalJobs;

  const outputs: RenderPipelineOutput[] = [];
  const errors: RenderPipelineError[] = [];

  for (const executionResult of results) {
    if (executionResult.status === "success" && executionResult.outputPath) {
      outputs.push({
        jobId: executionResult.jobId,
        outputPath: executionResult.outputPath,
      });
      continue;
    }

    if (executionResult.status === "failed" && executionResult.error) {
      errors.push({
        jobId: executionResult.jobId,
        error: executionResult.error,
      });
    }
  }

  return {
    queueId: queue.id,
    topic: queue.topic,
    status: queue.status,
    totalJobs: queue.totalJobs,
    completedJobs: queue.completedJobs,
    failedJobs: queue.failedJobs,
    successRate,
    outputs,
    errors,
  };
}

export function formatRenderPipelineSuccessRate(
  report: RenderPipelineReport,
): string {
  return `${Math.round(report.successRate * 100)}%`;
}
