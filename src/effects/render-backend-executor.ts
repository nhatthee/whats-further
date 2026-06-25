import type { RemotionRenderCommand } from "./render-backend-adapter";
import type { RenderQueueSpec } from "./render-queue-spec";
import { updateRenderQueueJobStatus } from "./render-queue-spec";

export type RenderExecutionStatus = "success" | "failed";

export type RenderExecutionResult = {
  jobId: string;
  status: RenderExecutionStatus;
  outputPath?: string;
  error?: string;
  startedAt: string;
  completedAt: string;
};

export function mockExecuteRenderCommand(
  command: RemotionRenderCommand,
  options?: {
    shouldFail?: boolean;
    errorMessage?: string;
    startedAt?: string;
    completedAt?: string;
  },
): RenderExecutionResult {
  const startedAt = options?.startedAt ?? new Date().toISOString();
  const completedAt = options?.completedAt ?? new Date().toISOString();

  if (options?.shouldFail) {
    return {
      jobId: command.jobId,
      status: "failed",
      error: options.errorMessage ?? "Mock render failed",
      startedAt,
      completedAt,
    };
  }

  return {
    jobId: command.jobId,
    status: "success",
    outputPath: command.outputPath,
    startedAt,
    completedAt,
  };
}

export function mockExecuteRenderCommands(
  commands: RemotionRenderCommand[],
  options?: {
    failJobIds?: string[];
    errorMessage?: string;
    startedAt?: string;
    completedAt?: string;
  },
): RenderExecutionResult[] {
  const failJobIds = new Set(options?.failJobIds ?? []);

  return commands.map((command) =>
    mockExecuteRenderCommand(command, {
      shouldFail: failJobIds.has(command.jobId),
      errorMessage: options?.errorMessage,
      startedAt: options?.startedAt,
      completedAt: options?.completedAt,
    }),
  );
}

export function applyRenderExecutionResultToQueue(
  queue: RenderQueueSpec,
  result: RenderExecutionResult,
): RenderQueueSpec {
  if (result.status === "success") {
    return updateRenderQueueJobStatus(
      queue,
      result.jobId,
      "completed",
      {
        outputPath: result.outputPath,
        updatedAt: result.completedAt,
      },
    );
  }

  return updateRenderQueueJobStatus(
    queue,
    result.jobId,
    "failed",
    {
      error: result.error,
      updatedAt: result.completedAt,
    },
  );
}

export function applyRenderExecutionResultsToQueue(
  queue: RenderQueueSpec,
  results: RenderExecutionResult[],
): RenderQueueSpec {
  return results.reduce(
    (currentQueue, result) =>
      applyRenderExecutionResultToQueue(currentQueue, result),
    queue,
  );
}
