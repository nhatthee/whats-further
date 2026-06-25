import type { RenderPipelineOrchestratorResult } from "./render-pipeline-orchestrator";
import {
  createRenderPipelineReport,
  type RenderPipelineReport,
} from "./render-pipeline-report";
import type { RenderQueueSpec } from "./render-queue-spec";

export type RenderPipelineApiResponse = {
  ok: boolean;
  queueId: string;
  topic: string;
  status: RenderQueueSpec["status"];
  report: RenderPipelineReport;
  commandsCount: number;
  resultsCount: number;
};

export function createRenderPipelineApiResponse(
  result: RenderPipelineOrchestratorResult,
): RenderPipelineApiResponse {
  const report = createRenderPipelineReport(result);

  return {
    ok: report.failedJobs === 0 && report.status === "completed",
    queueId: report.queueId,
    topic: report.topic,
    status: report.status,
    report,
    commandsCount: result.commands.length,
    resultsCount: result.results.length,
  };
}

export function isRenderPipelineApiResponseOk(
  response: RenderPipelineApiResponse,
): boolean {
  return response.ok;
}
