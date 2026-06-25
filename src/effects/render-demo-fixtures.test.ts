import { describe, expect, it } from "vitest";
import {
  createDemoRenderApiResponse,
  demoRenderApiResponse,
  demoRenderRequest,
} from "./render-demo-fixtures";
import { runMockRenderService } from "./render-service";

describe("render-demo-fixtures", () => {
  it("defines a growth demo request with two items", () => {
    expect(demoRenderRequest.topic).toBe("growth");
    expect(demoRenderRequest.items).toHaveLength(2);
    expect(demoRenderRequest.options?.outputDir).toBe("demo-renders");
    expect(demoRenderRequest.options?.format).toBe("mp4");
  });

  it("validates through runMockRenderService", () => {
    const response = runMockRenderService(demoRenderRequest);

    expect(response.ok).toBe(true);
    expect(response.queueId).toBe("growth-queue");
  });

  it("creates a successful demo API response", () => {
    const response = createDemoRenderApiResponse();

    expect(response.ok).toBe(true);
    expect(response.queueId).toBe("growth-queue");
    expect(response.topic).toBe("growth");
    expect(response.status).toBe("completed");
    expect(response.commandsCount).toBe(2);
    expect(response.resultsCount).toBe(2);
    expect(response.report.totalJobs).toBe(2);
    expect(response.report.completedJobs).toBe(2);
    expect(response.report.failedJobs).toBe(0);
    expect(response.report.outputs).toHaveLength(2);
  });

  it("exposes a prebuilt demo API response fixture", () => {
    expect(demoRenderApiResponse.ok).toBe(true);
    expect(demoRenderApiResponse.queueId).toBe("growth-queue");
    expect(demoRenderApiResponse.report.outputs).toHaveLength(2);
  });

  it("does not mutate the demo request", () => {
    const request = structuredClone(demoRenderRequest);
    const originalItemId = request.items[0]?.id;

    createDemoRenderApiResponse();

    expect(request.items[0]?.id).toBe(originalItemId);
    expect(request.items).toHaveLength(2);
  });
});
