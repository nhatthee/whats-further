import {
  createRenderPipelineApiResponse,
  type RenderPipelineApiResponse,
} from "./render-pipeline-api-contract";
import { runMockRenderPipeline } from "./render-pipeline-orchestrator";
import {
  createRenderQueueFromRequest,
  validateRenderRequest,
  type RenderRequest,
} from "./render-request-contract";

export type RenderServiceOptions = {
  failJobIds?: string[];
  errorMessage?: string;
};

export function runMockRenderService(
  request: unknown,
  options?: RenderServiceOptions,
): RenderPipelineApiResponse {
  const validation = validateRenderRequest(request);

  if (!validation.ok) {
    throw new Error(validation.errors.join("; "));
  }

  const renderRequest = request as RenderRequest;
  const queue = createRenderQueueFromRequest(renderRequest);

  const pipelineResult = runMockRenderPipeline(queue, {
    compositionId: renderRequest.options?.compositionId,
    outputDir: renderRequest.options?.outputDir,
    format: renderRequest.options?.format,
    failJobIds: options?.failJobIds,
    errorMessage: options?.errorMessage,
  });

  return createRenderPipelineApiResponse(pipelineResult);
}
