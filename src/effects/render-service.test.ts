import { describe, expect, it } from "vitest";
import { runMockRenderService } from "./render-service";
import type { RenderRequest } from "./render-request-contract";

const validRequest: RenderRequest = {
  topic: "growth",
  items: [
    {
      id: "clip-001",
      topic: "growth",
      category: "motivation",
      title: "A new beginning starts today",
      script: ["You can become better one step at a time"],
    },
    {
      id: "clip-002",
      topic: "growth",
      category: "motivation",
      title: "Keep moving forward",
      script: ["Small steps still count"],
    },
  ],
};

describe("render-service", () => {
  it("returns a successful API response for a valid request", () => {
    const response = runMockRenderService(validRequest);

    expect(response.ok).toBe(true);
    expect(response.queueId).toBe("growth-queue");
    expect(response.topic).toBe("growth");
    expect(response.status).toBe("completed");
    expect(response.commandsCount).toBe(2);
    expect(response.resultsCount).toBe(2);
    expect(response.report.completedJobs).toBe(2);
    expect(response.report.failedJobs).toBe(0);
  });

  it("passes request options into the pipeline outputs", () => {
    const response = runMockRenderService({
      ...validRequest,
      options: {
        compositionId: "MotionLab",
        outputDir: "out",
        format: "webm",
      },
    });

    expect(response.report.outputs[0]?.outputPath).toBe("out/clip-001.webm");
    expect(response.report.outputs[1]?.outputPath).toBe("out/clip-002.webm");
  });

  it("returns ok false when failJobIds are provided", () => {
    const response = runMockRenderService(validRequest, {
      failJobIds: ["clip-002"],
      errorMessage: "Service failure",
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe("failed");
    expect(response.report.failedJobs).toBe(1);
    expect(response.report.errors).toEqual([
      {
        jobId: "clip-002",
        error: "Service failure",
      },
    ]);
  });

  it("throws validation errors for invalid requests", () => {
    expect(() =>
      runMockRenderService({
        topic: "",
        items: [],
      }),
    ).toThrow();
  });

  it("joins multiple validation errors", () => {
    expect(() =>
      runMockRenderService({
        topic: "",
        items: [{}],
        options: {
          format: "avi",
        },
      }),
    ).toThrow(/topic must be a non-empty string/);
  });

  it("does not mutate the original request", () => {
    const request = structuredClone(validRequest);
    const originalItemId = request.items[0]?.id;

    runMockRenderService(request);

    expect(request.items[0]?.id).toBe(originalItemId);
    expect(request.items).toHaveLength(2);
  });
});
