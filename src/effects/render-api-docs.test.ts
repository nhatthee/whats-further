import { describe, expect, it } from "vitest";
import { demoRenderRequest } from "./render-demo-fixtures";
import {
  renderApiDescription,
  renderApiDocs,
  renderApiEndpoint,
  renderApiExampleRequest,
  renderApiExampleResponse,
  renderApiMethod,
} from "./render-api-docs";

describe("render-api-docs", () => {
  it("defines the render API endpoint", () => {
    expect(renderApiEndpoint).toBe("/api/render");
  });

  it("defines the render API method", () => {
    expect(renderApiMethod).toBe("POST");
  });

  it("describes mock-safe render API behavior", () => {
    expect(renderApiDescription.toLowerCase()).toContain("mock-safe");
  });

  it("uses the demo render request as the example request", () => {
    expect(renderApiExampleRequest).toBe(demoRenderRequest);
  });

  it("provides a successful example response", () => {
    expect(renderApiExampleResponse.ok).toBe(true);
    expect(renderApiExampleResponse.data.ok).toBe(true);
    expect(renderApiExampleResponse.data.queueId).toBe("growth-queue");
  });

  it("bundles endpoint, method, description, and examples in renderApiDocs", () => {
    expect(renderApiDocs.endpoint).toBe(renderApiEndpoint);
    expect(renderApiDocs.method).toBe(renderApiMethod);
    expect(renderApiDocs.description).toBe(renderApiDescription);
    expect(renderApiDocs.exampleRequest).toBe(renderApiExampleRequest);
    expect(renderApiDocs.exampleResponse).toBe(renderApiExampleResponse);
  });
});
