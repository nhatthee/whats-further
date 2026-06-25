import { describe, expect, it } from "vitest";
import {
  createRenderPipelineApiResponse,
  isRenderPipelineApiResponseOk,
} from "./render-pipeline-api-contract";
import { runMockRenderPipeline } from "./render-pipeline-orchestrator";
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

describe("render-pipeline-api-contract", () => {
  it("creates API response from successful orchestrator result", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-001",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
      ],
    });

    const result = runMockRenderPipeline(queue);
    const response = createRenderPipelineApiResponse(result);

    expect(response.ok).toBe(true);
    expect(response.queueId).toBe("batch-growth-001");
    expect(response.topic).toBe("growth");
    expect(response.status).toBe("completed");
    expect(response.commandsCount).toBe(2);
    expect(response.resultsCount).toBe(2);
    expect(response.report.completedJobs).toBe(2);
    expect(response.report.failedJobs).toBe(0);
    expect(response.report.successRate).toBe(1);
  });

  it("sets ok to false when any job failed", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-002",
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
    const response = createRenderPipelineApiResponse(result);

    expect(response.ok).toBe(false);
    expect(response.status).toBe("failed");
    expect(response.report.failedJobs).toBe(1);
    expect(response.report.errors).toHaveLength(1);
  });

  it("sets ok to false when status is not completed", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-003",
      topic: "growth",
      items: [{ id: "clip-001", content: motivationContent }],
    });

    const pendingResult = {
      queue,
      commands: [],
      results: [],
    };

    const response = createRenderPipelineApiResponse(pendingResult);

    expect(response.status).toBe("pending");
    expect(response.ok).toBe(false);
    expect(response.commandsCount).toBe(0);
    expect(response.resultsCount).toBe(0);
  });

  it("does not mutate the orchestrator result", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-004",
      topic: "growth",
      items: [{ id: "clip-001", content: motivationContent }],
    });

    const result = runMockRenderPipeline(queue);
    const originalQueueStatus = result.queue.status;
    const originalCommandsLength = result.commands.length;

    createRenderPipelineApiResponse(result);

    expect(result.queue.status).toBe(originalQueueStatus);
    expect(result.commands).toHaveLength(originalCommandsLength);
  });

  it("returns response.ok from isRenderPipelineApiResponseOk", () => {
    const successResponse = createRenderPipelineApiResponse(
      runMockRenderPipeline(
        createRenderQueueSpec({
          id: "batch-growth-005",
          topic: "growth",
          items: [{ id: "clip-001", content: motivationContent }],
        }),
      ),
    );

    const failedResponse = createRenderPipelineApiResponse(
      runMockRenderPipeline(
        createRenderQueueSpec({
          id: "batch-growth-006",
          topic: "growth",
          items: [{ id: "clip-001", content: motivationContent }],
        }),
        {
          failJobIds: ["clip-001"],
          errorMessage: "Pipeline failure",
        },
      ),
    );

    expect(isRenderPipelineApiResponseOk(successResponse)).toBe(true);
    expect(isRenderPipelineApiResponseOk(failedResponse)).toBe(false);
  });
});
