import { describe, expect, it } from "vitest";
import { runMockRenderPipeline } from "./render-pipeline-orchestrator";
import {
  createRenderPipelineReport,
  formatRenderPipelineSuccessRate,
} from "./render-pipeline-report";
import type { RenderPipelineOrchestratorResult } from "./render-pipeline-orchestrator";
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

function createEmptyPipelineResult(): RenderPipelineOrchestratorResult {
  const queue = createRenderQueueSpec({
    id: "batch-empty-001",
    topic: "empty",
    items: [],
  });

  return {
    queue,
    commands: [],
    results: [],
  };
}

describe("render-pipeline-report", () => {
  it("creates report from successful pipeline result", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-001",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
      ],
    });

    const pipelineResult = runMockRenderPipeline(queue);
    const report = createRenderPipelineReport(pipelineResult);

    expect(report.queueId).toBe("batch-growth-001");
    expect(report.topic).toBe("growth");
    expect(report.status).toBe("completed");
    expect(report.totalJobs).toBe(2);
    expect(report.completedJobs).toBe(2);
    expect(report.failedJobs).toBe(0);
    expect(report.successRate).toBe(1);
    expect(report.outputs).toHaveLength(2);
    expect(report.errors).toHaveLength(0);
  });

  it("creates report from failed pipeline result", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-002",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
      ],
    });

    const pipelineResult = runMockRenderPipeline(queue, {
      failJobIds: ["clip-002"],
      errorMessage: "Pipeline failure",
    });
    const report = createRenderPipelineReport(pipelineResult);

    expect(report.status).toBe("failed");
    expect(report.completedJobs).toBe(1);
    expect(report.failedJobs).toBe(1);
    expect(report.successRate).toBe(0.5);
    expect(report.outputs).toHaveLength(1);
    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]).toEqual({
      jobId: "clip-002",
      error: "Pipeline failure",
    });
  });

  it("uses zero success rate when there are no jobs", () => {
    const report = createRenderPipelineReport(createEmptyPipelineResult());

    expect(report.totalJobs).toBe(0);
    expect(report.successRate).toBe(0);
    expect(report.outputs).toHaveLength(0);
    expect(report.errors).toHaveLength(0);
  });

  it("includes only successful outputs and failed errors", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-003",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
        { id: "clip-003", content: motivationContent },
      ],
    });

    const pipelineResult = runMockRenderPipeline(queue, {
      failJobIds: ["clip-002"],
      errorMessage: "Render failed",
    });
    const report = createRenderPipelineReport(pipelineResult);

    expect(report.outputs.map((output) => output.jobId)).toEqual([
      "clip-001",
      "clip-003",
    ]);
    expect(report.errors.map((error) => error.jobId)).toEqual(["clip-002"]);
    expect(
      report.outputs.every((output) => output.outputPath.length > 0),
    ).toBe(true);
  });

  it("does not mutate the pipeline result", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-004",
      topic: "growth",
      items: [{ id: "clip-001", content: motivationContent }],
    });

    const pipelineResult = runMockRenderPipeline(queue);
    const originalQueueStatus = pipelineResult.queue.status;
    const originalResultsLength = pipelineResult.results.length;

    createRenderPipelineReport(pipelineResult);

    expect(pipelineResult.queue.status).toBe(originalQueueStatus);
    expect(pipelineResult.results).toHaveLength(originalResultsLength);
  });

  it("formats success rate as percentage strings", () => {
    expect(
      formatRenderPipelineSuccessRate({
        queueId: "a",
        topic: "growth",
        status: "completed",
        totalJobs: 2,
        completedJobs: 2,
        failedJobs: 0,
        successRate: 1,
        outputs: [],
        errors: [],
      }),
    ).toBe("100%");

    expect(
      formatRenderPipelineSuccessRate({
        queueId: "b",
        topic: "growth",
        status: "failed",
        totalJobs: 2,
        completedJobs: 1,
        failedJobs: 1,
        successRate: 0.5,
        outputs: [],
        errors: [],
      }),
    ).toBe("50%");

    expect(
      formatRenderPipelineSuccessRate({
        queueId: "c",
        topic: "growth",
        status: "pending",
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        successRate: 0,
        outputs: [],
        errors: [],
      }),
    ).toBe("0%");
  });
});
