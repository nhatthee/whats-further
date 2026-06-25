import { describe, expect, it } from "vitest";
import {
  createRenderJobSpec,
  createRenderJobSpecs,
} from "./render-job-spec";

describe("render-job-spec", () => {
  it("creates render job spec with selected visual preset", () => {
    const spec = createRenderJobSpec({
      id: "clip-001",
      content: {
        topic: "growth",
        category: "motivation",
        title: "A new beginning starts today",
        script: ["You can become better one step at a time"],
      },
    });

    expect(spec.id).toBe("clip-001");
    expect(spec.topic).toBe("growth");
    expect(spec.category).toBe("motivation");
    expect(spec.visualPreset).toBe("hopeful-dawn");
    expect(spec.render.width).toBe(1080);
    expect(spec.render.height).toBe(1920);
    expect(spec.render.fps).toBe(30);
    expect(spec.render.duration).toBe(12);
    expect(spec.selectionInput.mood).toBe("hopeful");
  });

  it("allows manual visualPreset override", () => {
    const spec = createRenderJobSpec({
      id: "clip-002",
      content: {
        topic: "growth",
        category: "motivation",
        title: "A new beginning starts today",
        script: ["You can become better one step at a time"],
      },
      visualPreset: "cinematic-growth",
    });

    expect(spec.visualPreset).toBe("cinematic-growth");
  });

  it("allows render setting override", () => {
    const spec = createRenderJobSpec({
      id: "clip-003",
      content: {
        topic: "growth",
        category: "motivation",
      },
      render: {
        duration: 15,
        fps: 24,
      },
    });

    expect(spec.render.duration).toBe(15);
    expect(spec.render.fps).toBe(24);
    expect(spec.render.width).toBe(1080);
    expect(spec.render.height).toBe(1920);
  });

  it("creates batch render job specs", () => {
    const specs = createRenderJobSpecs([
      {
        id: "clip-a",
        content: {
          topic: "growth",
          category: "motivation",
        },
      },
      {
        id: "clip-b",
        content: {
          topic: "discipline",
          category: "mistake",
          title: "Patience and focus build progress",
          script: ["Patience and focus build progress"],
        },
      },
    ]);

    expect(specs).toHaveLength(2);
    expect(specs[0]?.id).toBe("clip-a");
    expect(specs[1]?.id).toBe("clip-b");
  });
});
