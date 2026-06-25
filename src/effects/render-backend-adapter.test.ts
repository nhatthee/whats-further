import { describe, expect, it } from "vitest";
import {
  createRenderCommandFromJob,
  createRenderCommandsFromQueue,
  createSafeRenderSlug,
  DEFAULT_COMPOSITION_ID,
} from "./render-backend-adapter";
import { createRenderJobSpec } from "./render-job-spec";
import { createRenderQueueSpec } from "./render-queue-spec";

const motivationContent = {
  topic: "growth",
  category: "motivation",
  title: "A new beginning starts today",
  script: ["You can become better one step at a time"],
};

describe("render-backend-adapter", () => {
  it("creates render command from job", () => {
    const job = createRenderJobSpec({
      id: "clip-001",
      content: motivationContent,
    });

    const command = createRenderCommandFromJob(job);

    expect(command.jobId).toBe("clip-001");
    expect(command.compositionId).toBe(DEFAULT_COMPOSITION_ID);
    expect(command.inputProps.visualPreset).toBe(job.visualPreset);
    expect(command.outputPath).toBe("renders/clip-001.mp4");
    expect(command.format).toBe("mp4");
    expect(command.render.width).toBe(1080);
  });

  it("supports custom composition, output dir, and format", () => {
    const job = createRenderJobSpec({
      id: "clip-001",
      content: motivationContent,
    });

    const command = createRenderCommandFromJob(job, {
      compositionId: "MotionLab",
      outputDir: "out",
      format: "webm",
    });

    expect(command.compositionId).toBe("MotionLab");
    expect(command.outputPath).toBe("out/clip-001.webm");
    expect(command.format).toBe("webm");
  });

  it("creates commands from queue", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-001",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        {
          id: "clip-002",
          content: {
            topic: "discipline",
            category: "mistake",
            title: "Patience and focus build progress",
            script: ["Patience and focus build progress"],
          },
        },
      ],
    });

    const commands = createRenderCommandsFromQueue(queue);

    expect(commands).toHaveLength(2);
    expect(commands[0]?.jobId).toBe("clip-001");
    expect(commands[1]?.jobId).toBe("clip-002");
  });

  it("creates safe slugs for output paths", () => {
    expect(createSafeRenderSlug(" Clip 001 !! ")).toBe("clip-001");
    expect(createSafeRenderSlug("!!!")).toBe("render");
  });
});
