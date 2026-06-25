import { describe, expect, it } from "vitest";
import {
  assertValidRenderRequest,
  createRenderQueueFromRequest,
  validateRenderRequest,
  type RenderRequest,
} from "./render-request-contract";

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
  ],
  render: {
    duration: 15,
  },
  options: {
    compositionId: "QuoteReel",
    outputDir: "renders",
    format: "mp4",
  },
};

describe("render-request-contract", () => {
  it("passes validation for a valid request", () => {
    const result = validateRenderRequest(validRequest);

    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails when request is not an object", () => {
    const result = validateRenderRequest(null);

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("request must be an object");
  });

  it("fails when topic is empty", () => {
    const result = validateRenderRequest({
      ...validRequest,
      topic: "   ",
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("topic must be a non-empty string");
  });

  it("fails when items are missing or empty", () => {
    const missingItems = validateRenderRequest({
      topic: "growth",
    });
    const emptyItems = validateRenderRequest({
      topic: "growth",
      items: [],
    });

    expect(missingItems.errors).toContain("items must be an array");
    expect(emptyItems.errors).toContain("items must not be empty");
  });

  it("fails when item fields are invalid", () => {
    const result = validateRenderRequest({
      topic: "growth",
      items: [
        {
          category: "motivation",
          title: "",
          script: [],
        },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain("items[0].id must be a non-empty string");
    expect(result.errors).toContain(
      "items[0].title must be a non-empty string",
    );
    expect(result.errors).toContain("items[0].script must not be empty");
  });

  it("fails when options.format is invalid", () => {
    const result = validateRenderRequest({
      ...validRequest,
      options: {
        format: "mov",
      },
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      'options.format must be "mp4" or "webm"',
    );
  });

  it("returns multiple validation errors at once", () => {
    const result = validateRenderRequest({
      topic: "",
      items: [{}],
      options: {
        format: "avi",
      },
    });

    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });

  it("creates a render queue from a valid request", () => {
    const queue = createRenderQueueFromRequest(validRequest);

    expect(queue.topic).toBe("growth");
    expect(queue.id).toBe("growth-queue");
    expect(queue.jobs).toHaveLength(1);
    expect(queue.jobs[0]?.id).toBe("clip-001");
    expect(queue.render.duration).toBe(15);
    expect(queue.jobs[0]?.status).toBe("pending");
  });

  it("throws when creating a queue from an invalid request", () => {
    expect(() =>
      createRenderQueueFromRequest({
        topic: "",
        items: [],
      }),
    ).toThrow();
  });

  it("does not mutate the original request", () => {
    const request = structuredClone(validRequest);
    const originalItemsLength = request.items.length;

    createRenderQueueFromRequest(request);

    expect(request.items).toHaveLength(originalItemsLength);
    expect(request.items[0]?.id).toBe("clip-001");
  });

  it("throws from assertValidRenderRequest for invalid input", () => {
    expect(() => assertValidRenderRequest({ topic: "", items: [] })).toThrow();
  });

  it("narrows type with assertValidRenderRequest", () => {
    const input: unknown = validRequest;

    assertValidRenderRequest(input);

    expect(input.topic).toBe("growth");
  });
});
