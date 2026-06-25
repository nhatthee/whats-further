import { describe, expect, it } from "vitest";
import { demoRenderApiResponse } from "./render-demo-fixtures";
import {
  createRenderDashboardSummary,
  demoRenderDashboardSummary,
} from "./render-dashboard-mock";

describe("render-dashboard-mock", () => {
  it("creates a dashboard summary from a render API response", () => {
    const summary = createRenderDashboardSummary(demoRenderApiResponse);

    expect(summary.queueId).toBe("growth-queue");
    expect(summary.topic).toBe("growth");
    expect(summary.status).toBe("completed");
    expect(summary.successRate).toBe(1);
    expect(summary.successRateLabel).toBe("100%");
    expect(summary.totalJobs).toBe(2);
    expect(summary.completedJobs).toBe(2);
    expect(summary.failedJobs).toBe(0);
    expect(summary.outputs).toHaveLength(2);
    expect(summary.errors).toHaveLength(0);
  });

  it("preserves output order from the report", () => {
    const summary = createRenderDashboardSummary(demoRenderApiResponse);
    const expectedJobIds = demoRenderApiResponse.report.outputs.map(
      (output) => output.jobId,
    );

    expect(summary.outputs.map((output) => output.jobId)).toEqual(
      expectedJobIds,
    );
    expect(summary.outputs).toEqual(demoRenderApiResponse.report.outputs);
  });

  it("does not mutate the original response", () => {
    const response = structuredClone(demoRenderApiResponse);
    const originalOutputs = structuredClone(response.report.outputs);
    const originalErrors = structuredClone(response.report.errors);

    createRenderDashboardSummary(response);

    expect(response.report.outputs).toEqual(originalOutputs);
    expect(response.report.errors).toEqual(originalErrors);
    expect(response.queueId).toBe("growth-queue");
  });

  it("exposes a stable demo dashboard summary", () => {
    expect(demoRenderDashboardSummary.queueId).toBe("growth-queue");
    expect(demoRenderDashboardSummary.topic).toBe("growth");
    expect(demoRenderDashboardSummary.status).toBe("completed");
    expect(demoRenderDashboardSummary.successRate).toBe(1);
    expect(demoRenderDashboardSummary.successRateLabel).toBe("100%");
    expect(demoRenderDashboardSummary.totalJobs).toBe(2);
    expect(demoRenderDashboardSummary.completedJobs).toBe(2);
    expect(demoRenderDashboardSummary.failedJobs).toBe(0);
    expect(demoRenderDashboardSummary.outputs).toHaveLength(2);
    expect(demoRenderDashboardSummary.errors).toHaveLength(0);
  });
});
