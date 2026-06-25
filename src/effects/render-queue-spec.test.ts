import { describe, expect, it } from "vitest";
import {
  createRenderQueueSpec,
  getRenderQueueProgress,
  updateRenderQueueJobStatus,
} from "./render-queue-spec";

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

describe("render-queue-spec", () => {
  it("creates queue with pending jobs", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-001",
      topic: "growth",
      createdAt: "2026-06-24T00:00:00.000Z",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
      ],
    });

    expect(queue.id).toBe("batch-growth-001");
    expect(queue.topic).toBe("growth");
    expect(queue.status).toBe("pending");
    expect(queue.jobs).toHaveLength(2);
    expect(queue.totalJobs).toBe(2);
    expect(queue.completedJobs).toBe(0);
    expect(queue.failedJobs).toBe(0);
    expect(queue.jobs.every((job) => job.status === "pending")).toBe(true);
    expect(queue.jobs.every((job) => job.visualPreset)).toBe(true);
  });

  it("applies queue render settings to jobs", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-002",
      topic: "growth",
      render: {
        fps: 24,
        duration: 15,
      },
      items: [{ id: "clip-001", content: motivationContent }],
    });

    expect(queue.render.fps).toBe(24);
    expect(queue.render.duration).toBe(15);
    expect(queue.jobs[0]?.render.fps).toBe(24);
    expect(queue.jobs[0]?.render.duration).toBe(15);
  });

  it("lets item render override win over queue render", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-003",
      topic: "growth",
      render: {
        fps: 24,
        duration: 15,
      },
      items: [
        {
          id: "clip-001",
          content: motivationContent,
          render: {
            duration: 10,
          },
        },
      ],
    });

    expect(queue.jobs[0]?.render.fps).toBe(24);
    expect(queue.jobs[0]?.render.duration).toBe(10);
  });

  it("calculates render queue progress", () => {
    let queue = createRenderQueueSpec({
      id: "batch-growth-004",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
        { id: "clip-003", content: motivationContent },
      ],
    });

    queue = updateRenderQueueJobStatus(queue, "clip-001", "completed");
    queue = updateRenderQueueJobStatus(queue, "clip-002", "failed");
    queue = updateRenderQueueJobStatus(queue, "clip-003", "processing");

    const progress = getRenderQueueProgress(queue);

    expect(progress.total).toBe(3);
    expect(progress.completed).toBe(1);
    expect(progress.failed).toBe(1);
    expect(progress.processing).toBe(1);
    expect(progress.percent).toBe(33);
  });

  it("marks completed job with output path", () => {
    const queue = createRenderQueueSpec({
      id: "batch-growth-005",
      topic: "growth",
      items: [{ id: "clip-001", content: motivationContent }],
    });

    const updated = updateRenderQueueJobStatus(
      queue,
      "clip-001",
      "completed",
      {
        outputPath: "out/clip-001.mp4",
        updatedAt: "2026-06-24T01:00:00.000Z",
      },
    );

    expect(updated.jobs[0]?.status).toBe("completed");
    expect(updated.jobs[0]?.outputPath).toBe("out/clip-001.mp4");
    expect(updated.completedJobs).toBe(1);
  });

  it("marks queue completed when all jobs complete", () => {
    let queue = createRenderQueueSpec({
      id: "batch-growth-006",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
      ],
    });

    queue = updateRenderQueueJobStatus(queue, "clip-001", "completed");
    queue = updateRenderQueueJobStatus(queue, "clip-002", "completed");

    expect(queue.status).toBe("completed");
    expect(queue.completedJobs).toBe(2);
  });

  it("marks queue failed when all jobs are terminal and one failed", () => {
    let queue = createRenderQueueSpec({
      id: "batch-growth-007",
      topic: "growth",
      items: [
        { id: "clip-001", content: motivationContent },
        { id: "clip-002", content: disciplineContent },
      ],
    });

    queue = updateRenderQueueJobStatus(queue, "clip-001", "completed");
    queue = updateRenderQueueJobStatus(queue, "clip-002", "failed", {
      error: "Render failed",
    });

    expect(queue.status).toBe("failed");
    expect(queue.failedJobs).toBe(1);
  });
});
