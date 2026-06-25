import type { RenderPipelineApiResponse } from "./render-pipeline-api-contract";
import { demoRenderApiResponse } from "./render-demo-fixtures";
import { formatRenderPipelineSuccessRate } from "./render-pipeline-report";

export type RenderDashboardOutput = {
  jobId: string;
  outputPath: string;
};

export type RenderDashboardError = {
  jobId: string;
  error: string;
};

export type RenderDashboardSummary = {
  queueId: string;
  topic: string;
  status: RenderPipelineApiResponse["status"];
  successRate: number;
  successRateLabel: string;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  outputs: RenderDashboardOutput[];
  errors: RenderDashboardError[];
};

export function createRenderDashboardSummary(
  response: RenderPipelineApiResponse,
): RenderDashboardSummary {
  const { report } = response;

  return {
    queueId: response.queueId,
    topic: response.topic,
    status: response.status,
    successRate: report.successRate,
    successRateLabel: formatRenderPipelineSuccessRate(report),
    totalJobs: report.totalJobs,
    completedJobs: report.completedJobs,
    failedJobs: report.failedJobs,
    outputs: report.outputs.map((output) => ({
      jobId: output.jobId,
      outputPath: output.outputPath,
    })),
    errors: report.errors.map((error) => ({
      jobId: error.jobId,
      error: error.error,
    })),
  };
}

export const demoRenderDashboardSummary =
  createRenderDashboardSummary(demoRenderApiResponse);
