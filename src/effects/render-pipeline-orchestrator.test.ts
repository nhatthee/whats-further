import { describe, expect, it, vi } from "vitest";
import type { RemotionRenderCommand } from "./render-backend-adapter";
import type { RenderExecutionResult } from "./render-backend-executor";
import { createMockRenderBackend } from "./render-backend-interface";
import {
  runMockRenderPipeline,
  runRenderPipeline,
} from "./render-pipeline-orchestrator";
import { createRenderQueueSpec } from "./render-queue-spec";

const motivationContent = {
  topic: "growth",
  category: "motivation",
  title: "A new beginning starts today",
  script: ["You can become better one step at a time"],
};

const disciplineContent = {
  topic: "discipline",
  category: "mistake",
  title: "Patience and focus build progress",
  script: ["Patience and focus build progress"],
};

describe("render-pipeline-orchestrator", () => {
  it("returns queue, commands, and results", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-001",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
      ],
    });

    const result = runMockRenderPipeline(queue);

    expect(result.queue).toBeDefined();
    expect(result.commands).toHaveLength(2);
    expect(result.results).toHaveLength(2);
  });

  it("completes all jobs by default", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-002",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
      ],
    });

    const result = runMockRenderPipeline(queue);

    expect(result.results.every((item) => item.status === "success")).toBe(
      true,
    );
    expect(result.queue.status).toBe("completed");
    expect(result.queue.completedJobs).toBe(2);
    expect(result.queue.failedJobs).toBe(0);
    expect(result.queue.jobs.every((job) => job.status === "completed")).toBe(
      true,
    );
  });

  it("fails only matching jobs and marks queue failed", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-003",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
      ],
    });

    const result = runMockRenderPipeline(queue, {
      failJobIds: ["clip-002"],
      errorMessage: "Pipeline failure",
    });

    expect(result.results[0]?.status).toBe("success");
    expect(result.results[1]?.status).toBe("failed");
    expect(result.results[1]?.error).toBe("Pipeline failure");
    expect(result.queue.status).toBe("failed");
    expect(result.queue.completedJobs).toBe(1);
    expect(result.queue.failedJobs).toBe(1);
  });

  it("passes custom adapter options into commands", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-004",
      topic: "growth",
      items: [{ id: "clip-001", content: motivationContent }],
    });

    const result = runMockRenderPipeline(queue, {
      compositionId: "MotionLab",
      outputDir: "out",
      format: "webm",
    });

    expect(result.commands[0]?.compositionId).toBe("MotionLab");
    expect(result.commands[0]?.outputPath).toBe("out/clip-001.webm");
    expect(result.commands[0]?.format).toBe("webm");
  });

  it("preserves command and result order", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-005",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
        { id: "clip-003", content: motivationContent },
      ],
    });

    const result = runMockRenderPipeline(queue);

    expect(result.commands.map((command) => command.jobId)).toEqual([
      "clip-001",
      "clip-002",
      "clip-003",
    ]);
    expect(result.results.map((item) => item.jobId)).toEqual([
      "clip-001",
      "clip-002",
      "clip-003",
    ]);
  });

  it("does not mutate the original queue", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-006",
      topic: "growth",
      items: [{ id: "clip-001", content: motivationContent }],
    });

    const originalStatus = queue.status;
    const originalJobStatus = queue.jobs[0]?.status;

    runMockRenderPipeline(queue);

    expect(queue.status).toBe(originalStatus);
    expect(queue.jobs[0]?.status).toBe(originalJobStatus);
  });

  it("runRenderPipeline works with createMockRenderBackend()", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-007",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
      ],
    });

    const backend = createMockRenderBackend();
    const result = runRenderPipeline(queue, backend);

    expect(result).not.toBeInstanceOf(Promise);
    if (result instanceof Promise) {
      throw new Error("Expected synchronous render pipeline result");
    }

    expect(result.commands).toHaveLength(2);
    expect(result.results.every((item) => item.status === "success")).toBe(
      true,
    );
    expect(result.queue.status).toBe("completed");
  });

  it("runRenderPipeline accepts an injected backend", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-008",
      topic: "growth",
      items: [{ id: "clip-001", content: motivationContent }],
    });

    const backend: {
      name: string;
      executeRenderCommand: (
        command: RemotionRenderCommand,
      ) => RenderExecutionResult;
      executeRenderCommands: (
        commands: RemotionRenderCommand[],
      ) => RenderExecutionResult[];
    } = {
      name: "injected",
      executeRenderCommand(command) {
        return {
          jobId: command.jobId,
          status: "success",
          outputPath: command.outputPath,
          startedAt: "2026-06-24T00:00:00.000Z",
          completedAt: "2026-06-24T00:00:01.000Z",
        };
      },
      executeRenderCommands(commands) {
        return commands.map((command) => this.executeRenderCommand(command));
      },
    };

    const result = runRenderPipeline(queue, backend);

    expect(result).not.toBeInstanceOf(Promise);
    if (result instanceof Promise) {
      throw new Error("Expected synchronous render pipeline result");
    }

    expect(result.results[0]?.status).toBe("success");
    expect(result.queue.jobs[0]?.status).toBe("completed");
  });

  it("calls injected backend executeRenderCommands once", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-009",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
      ],
    });

    const backend = createMockRenderBackend();
    const executeRenderCommands = vi.spyOn(backend, "executeRenderCommands");

    runRenderPipeline(queue, backend);

    expect(executeRenderCommands).toHaveBeenCalledTimes(1);
    expect(executeRenderCommands.mock.calls[0]?.[0]).toHaveLength(2);
  });

  it("updates queue from injected backend results", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-010",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
      ],
    });

    const result = runRenderPipeline(
      queue,
      createMockRenderBackend({
        failJobIds: ["clip-002"],
        errorMessage: "Injected failure",
      }),
    );

    expect(result).not.toBeInstanceOf(Promise);
    if (result instanceof Promise) {
      throw new Error("Expected synchronous render pipeline result");
    }

    expect(result.results[1]?.status).toBe("failed");
    expect(result.results[1]?.error).toBe("Injected failure");
    expect(result.queue.status).toBe("failed");
    expect(result.queue.completedJobs).toBe(1);
    expect(result.queue.failedJobs).toBe(1);
  });
});
