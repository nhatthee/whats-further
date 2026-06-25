import { describe, expect, it } from "vitest";
import type { RemotionRenderCommand } from "./render-backend-adapter";
import {
  applyRenderExecutionResultToQueue,
  applyRenderExecutionResultsToQueue,
  mockExecuteRenderCommand,
  mockExecuteRenderCommands,
} from "./render-backend-executor";
import { createRenderQueueSpec } from "./render-queue-spec";

const sampleCommand = (
  jobId: string,
): RemotionRenderCommand => ({
  jobId,
  compositionId: "QuoteReel",
  inputProps: {
    visualPreset: "hopeful-dawn",
    topic: "growth",
    category: "motivation",
    title: "A new beginning starts today",
    script: ["You can become better one step at a time"],
  },
  outputPath: `renders/${jobId}.mp4`,
  render: {
    width: 1080,
    height: 1920,
    fps: 30,
    duration: 12,
  },
  format: "mp4",
});

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

describe("render-backend-executor", () => {
  it("returns success by default from mockExecuteRenderCommand", () => {
    const command = sampleCommand("clip-001");
    const result = mockExecuteRenderCommand(command, {
      startedAt: "2026-06-24T00:00:00.000Z",
      completedAt: "2026-06-24T00:00:01.000Z",
    });

    expect(result.status).toBe("success");
    expect(result.jobId).toBe("clip-001");
    expect(result.outputPath).toBe("renders/clip-001.mp4");
    expect(result.error).toBeUndefined();
    expect(result.startedAt).toBe("2026-06-24T00:00:00.000Z");
    expect(result.completedAt).toBe("2026-06-24T00:00:01.000Z");
  });

  it("can fail a single mock render command", () => {
    const result = mockExecuteRenderCommand(sampleCommand("clip-001"), {
      shouldFail: true,
      errorMessage: "Encoder unavailable",
    });

    expect(result.status).toBe("failed");
    expect(result.error).toBe("Encoder unavailable");
    expect(result.outputPath).toBeUndefined();
  });

  it("preserves command order in mockExecuteRenderCommands", () => {
    const commands = [
      sampleCommand("clip-001"),
      sampleCommand("clip-002"),
      sampleCommand("clip-003"),
    ];

    const results = mockExecuteRenderCommands(commands);

    expect(results.map((result) => result.jobId)).toEqual([
      "clip-001",
      "clip-002",
      "clip-003",
    ]);
    expect(results.every((result) => result.status === "success")).toBe(true);
  });

  it("fails only matching failJobIds", () => {
    const commands = [
      sampleCommand("clip-001"),
      sampleCommand("clip-002"),
      sampleCommand("clip-003"),
    ];

    const results = mockExecuteRenderCommands(commands, {
      failJobIds: ["clip-002"],
      errorMessage: "Mock failure",
    });

    expect(results[0]?.status).toBe("success");
    expect(results[1]?.status).toBe("failed");
    expect(results[1]?.error).toBe("Mock failure");
    expect(results[2]?.status).toBe("success");
  });

  it("applies success result to queue job", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-001",
      topic: "growth",
      items: [{ id: "clip-001", content: motivationContent }],
    });

    const updated = applyRenderExecutionResultToQueue(queue, {
      jobId: "clip-001",
      status: "success",
      outputPath: "renders/clip-001.mp4",
      startedAt: "2026-06-24T00:00:00.000Z",
      completedAt: "2026-06-24T00:00:01.000Z",
    });

    expect(updated.jobs[0]?.status).toBe("completed");
    expect(updated.jobs[0]?.outputPath).toBe("renders/clip-001.mp4");
    expect(updated.completedJobs).toBe(1);
    expect(updated.status).toBe("completed");
  });

  it("applies failed result to queue job", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-002",
      topic: "growth",
      items: [{ id: "clip-001", content: motivationContent }],
    });

    const updated = applyRenderExecutionResultToQueue(queue, {
      jobId: "clip-001",
      status: "failed",
      error: "Render failed",
      startedAt: "2026-06-24T00:00:00.000Z",
      completedAt: "2026-06-24T00:00:01.000Z",
    });

    expect(updated.jobs[0]?.status).toBe("failed");
    expect(updated.jobs[0]?.error).toBe("Render failed");
    expect(updated.failedJobs).toBe(1);
    expect(updated.status).toBe("failed");
  });

  it("applies multiple results and updates queue progress", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-003",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
      ],
    });

    const updated = applyRenderExecutionResultsToQueue(queue, [
      {
        jobId: "clip-001",
        status: "success",
        outputPath: "renders/clip-001.mp4",
        startedAt: "2026-06-24T00:00:00.000Z",
        completedAt: "2026-06-24T00:00:01.000Z",
      },
      {
        jobId: "clip-002",
        status: "failed",
        error: "Render failed",
        startedAt: "2026-06-24T00:00:02.000Z",
        completedAt: "2026-06-24T00:00:03.000Z",
      },
    ]);

    expect(updated.completedJobs).toBe(1);
    expect(updated.failedJobs).toBe(1);
    expect(updated.status).toBe("failed");
    expect(updated.jobs[0]?.status).toBe("completed");
    expect(updated.jobs[1]?.status).toBe("failed");
  });

  it("does not mutate the original queue", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-004",
      topic: "growth",
      items: [{ id: "clip-001", content: motivationContent }],
    });

    const originalStatus = queue.jobs[0]?.status;
    const originalCompletedJobs = queue.completedJobs;

    applyRenderExecutionResultsToQueue(queue, [
      {
        jobId: "clip-001",
        status: "success",
        outputPath: "renders/clip-001.mp4",
        startedAt: "2026-06-24T00:00:00.000Z",
        completedAt: "2026-06-24T00:00:01.000Z",
      },
    ]);

    expect(queue.jobs[0]?.status).toBe(originalStatus);
    expect(queue.completedJobs).toBe(originalCompletedJobs);
  });
});
