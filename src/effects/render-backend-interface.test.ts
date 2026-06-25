import { describe, expect, it, vi } from "vitest";
import type { RemotionRenderCommand } from "./render-backend-adapter";
import * as renderBackendExecutor from "./render-backend-executor";
import {
  createMockRenderBackend,
  createUnsupportedRemotionRenderBackend,
} from "./render-backend-interface";

const sampleCommand = (
  jobId: string,
): RemotionRenderCommand => ({
  jobId,
  compositionId: "QuoteReel",
  inputProps: {
    visualPreset: "hopeful-dawn",
    topic: "growth",
    category: "motivation",
    title: "A new beginning starts today",
    script: ["You can become better one step at a time"],
  },
  outputPath: `renders/${jobId}.mp4`,
  render: {
    width: 1080,
    height: 1920,
    fps: 30,
    duration: 12,
  },
  format: "mp4",
});

describe("render-backend-interface", () => {
  it('createMockRenderBackend returns backend with name "mock"', () => {
    const backend = createMockRenderBackend();

    expect(backend.name).toBe("mock");
    expect(typeof backend.executeRenderCommand).toBe("function");
    expect(typeof backend.executeRenderCommands).toBe("function");
  });

  it("executeRenderCommand returns success by default", async () => {
    const backend = createMockRenderBackend();
    const command = sampleCommand("clip-001");

    const result = await backend.executeRenderCommand(command);

    expect(result).toEqual({
      jobId: "clip-001",
      status: "success",
      outputPath: "renders/clip-001.mp4",
      startedAt: expect.any(String),
      completedAt: expect.any(String),
    });
  });

  it("executeRenderCommand fails if jobId is in failJobIds", async () => {
    const backend = createMockRenderBackend({
      failJobIds: ["clip-002"],
      errorMessage: "Mock failure",
    });

    const result = await backend.executeRenderCommand(sampleCommand("clip-002"));

    expect(result).toMatchObject({
      jobId: "clip-002",
      status: "failed",
      error: "Mock failure",
    });
    expect(result).not.toHaveProperty("outputPath");
  });

  it("executeRenderCommands preserves order", async () => {
    const backend = createMockRenderBackend();
    const commands = [
      sampleCommand("clip-001"),
      sampleCommand("clip-002"),
      sampleCommand("clip-003"),
    ];

    const results = await backend.executeRenderCommands(commands);

    expect(results.map((result) => result.jobId)).toEqual([
      "clip-001",
      "clip-002",
      "clip-003",
    ]);
  });

  it("executeRenderCommands respects failJobIds", async () => {
    const backend = createMockRenderBackend({
      failJobIds: ["clip-002"],
      errorMessage: "Batch failure",
    });

    const results = await backend.executeRenderCommands([
      sampleCommand("clip-001"),
      sampleCommand("clip-002"),
      sampleCommand("clip-003"),
    ]);

    expect(results[0]?.status).toBe("success");
    expect(results[1]?.status).toBe("failed");
    expect(results[1]?.error).toBe("Batch failure");
    expect(results[2]?.status).toBe("success");
  });

  it("unsupported Remotion backend throws expected error", () => {
    const backend = createUnsupportedRemotionRenderBackend();

    expect(backend.name).toBe("remotion");
    expect(() => backend.executeRenderCommand(sampleCommand("clip-001"))).toThrow(
      "Real Remotion backend is not implemented yet",
    );
    expect(() =>
      backend.executeRenderCommands([sampleCommand("clip-001")]),
    ).toThrow("Real Remotion backend is not implemented yet");
  });

  it("does not invoke Remotion rendering", () => {
    const executeCommandSpy = vi.spyOn(
      renderBackendExecutor,
      "mockExecuteRenderCommand",
    );
    const executeCommandsSpy = vi.spyOn(
      renderBackendExecutor,
      "mockExecuteRenderCommands",
    );

    const backend = createMockRenderBackend();
    const command = sampleCommand("clip-001");

    backend.executeRenderCommand(command);
    backend.executeRenderCommands([command]);

    expect(executeCommandSpy).toHaveBeenCalledWith(command, {
      shouldFail: false,
      errorMessage: undefined,
    });
    expect(executeCommandsSpy).toHaveBeenCalledWith([command], undefined);

    executeCommandSpy.mockRestore();
    executeCommandsSpy.mockRestore();
  });

  it("does not write files", async () => {
    const backend = createMockRenderBackend();
    const commands = [
      sampleCommand("clip-001"),
      sampleCommand("clip-002"),
    ];

    const results = await backend.executeRenderCommands(commands);

    expect(results).toHaveLength(2);
    expect(results.every((result) => result.status === "success")).toBe(true);
    expect(results.map((result) => result.outputPath)).toEqual([
      "renders/clip-001.mp4",
      "renders/clip-002.mp4",
    ]);
  });
});
