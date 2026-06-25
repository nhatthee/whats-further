import type { RemotionRenderCommand } from "./render-backend-adapter";
import type { RenderExecutionResult } from "./render-backend-executor";
import {
  mockExecuteRenderCommand,
  mockExecuteRenderCommands,
} from "./render-backend-executor";

export type RenderBackend = {
  name: string;
  executeRenderCommand: (
    command: RemotionRenderCommand,
  ) => RenderExecutionResult | Promise<RenderExecutionResult>;
  executeRenderCommands: (
    commands: RemotionRenderCommand[],
  ) => RenderExecutionResult[] | Promise<RenderExecutionResult[]>;
};

export type RenderBackendName = "mock" | "remotion";

export type MockRenderBackendOptions = {
  failJobIds?: string[];
  errorMessage?: string;
};

export function createMockRenderBackend(
  options?: MockRenderBackendOptions,
): RenderBackend {
  const failJobIds = new Set(options?.failJobIds ?? []);

  return {
    name: "mock",
    executeRenderCommand(command) {
      return mockExecuteRenderCommand(command, {
        shouldFail: failJobIds.has(command.jobId),
        errorMessage: options?.errorMessage,
      });
    },
    executeRenderCommands(commands) {
      return mockExecuteRenderCommands(commands, options);
    },
  };
}

export function createUnsupportedRemotionRenderBackend(): RenderBackend {
  const notImplementedError = "Real Remotion backend is not implemented yet";

  return {
    name: "remotion",
    executeRenderCommand() {
      throw new Error(notImplementedError);
    },
    executeRenderCommands() {
      throw new Error(notImplementedError);
    },
  };
}
