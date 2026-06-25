import {
  createRenderCommandsFromQueue,
  type RemotionRenderCommand,
  type RenderBackendFormat,
} from "./render-backend-adapter";
import {
  applyRenderExecutionResultsToQueue,
  type RenderExecutionResult,
} from "./render-backend-executor";
import {
  createMockRenderBackend,
  type RenderBackend,
} from "./render-backend-interface";
import type { RenderQueueSpec } from "./render-queue-spec";

export type RenderPipelineOrchestratorOptions = {
  compositionId?: string;
  outputDir?: string;
  format?: RenderBackendFormat;
  failJobIds?: string[];
  errorMessage?: string;
};

export type RenderPipelineOrchestratorResult = {
  queue: RenderQueueSpec;
  commands: RemotionRenderCommand[];
  results: RenderExecutionResult[];
};

type RenderPipelineCommandOptions = Omit<
  RenderPipelineOrchestratorOptions,
  "failJobIds" | "errorMessage"
>;

function createRenderPipelineResult(
  queue: RenderQueueSpec,
  commands: RemotionRenderCommand[],
  results: RenderExecutionResult[],
): RenderPipelineOrchestratorResult {
  return {
    queue: applyRenderExecutionResultsToQueue(queue, results),
    commands,
    results,
  };
}

export function runRenderPipeline(
  queue: RenderQueueSpec,
  backend: RenderBackend,
  options?: RenderPipelineCommandOptions,
):
  | RenderPipelineOrchestratorResult
  | Promise<RenderPipelineOrchestratorResult> {
  const commands = createRenderCommandsFromQueue(queue, {
    compositionId: options?.compositionId,
    outputDir: options?.outputDir,
    format: options?.format,
  });

  const executionResults = backend.executeRenderCommands(commands);

  if (executionResults instanceof Promise) {
    return executionResults.then((results) =>
      createRenderPipelineResult(queue, commands, results),
    );
  }

  return createRenderPipelineResult(queue, commands, executionResults);
}

export function runMockRenderPipeline(
  queue: RenderQueueSpec,
  options?: RenderPipelineOrchestratorOptions,
): RenderPipelineOrchestratorResult {
  const backend = createMockRenderBackend({
    failJobIds: options?.failJobIds,
    errorMessage: options?.errorMessage,
  });

  const result = runRenderPipeline(queue, backend, {
    compositionId: options?.compositionId,
    outputDir: options?.outputDir,
    format: options?.format,
  });

  if (result instanceof Promise) {
    throw new Error("Mock render pipeline must remain synchronous");
  }

  return result;
}
