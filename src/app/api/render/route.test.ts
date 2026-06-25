import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { demoRenderRequest } from "@/effects/render-demo-fixtures";
import * as renderService from "@/effects/render-service";
import { handleRenderPost, POST } from "./route";

describe("POST /api/render", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 200 for a valid render request", async () => {
    const request = new Request("http://localhost/api/render", {
      method: "POST",
      body: JSON.stringify(demoRenderRequest),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const response = await POST(request as any);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.ok).toBe(true);
    expect(json.data.queueId).toBe("growth-queue");
    expect(json.data.status).toBe("completed");
  });

  it("returns 400 for an invalid render request", async () => {
    const response = await handleRenderPost({
      topic: "",
      items: [],
    });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(typeof json.error).toBe("string");
  });

  it("returns 500 when the render service throws unexpectedly", async () => {
    vi.spyOn(renderService, "runMockRenderService").mockImplementation(() => {
      throw new Error("Unexpected boom");
    });

    const response = await handleRenderPost(demoRenderRequest);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.ok).toBe(false);
    expect(json.error).toBe("Internal render service error");
  });
});
