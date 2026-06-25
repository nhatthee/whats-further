import type { ContentEngineItem } from "./presets/contentMetadataAdapter";
import type {
  RenderJobSettings,
  RenderJobSpec,
} from "./render-job-spec";
import {
  createRenderJobSpec,
  DEFAULT_RENDER_SETTINGS,
} from "./render-job-spec";

export type RenderQueueStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type RenderQueueJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

export type RenderQueueJob = RenderJobSpec & {
  status: RenderQueueJobStatus;
  outputPath?: string;
  error?: string;
};

export type RenderQueueSpec = {
  id: string;
  topic: string;
  status: RenderQueueStatus;
  jobs: RenderQueueJob[];
  createdAt: string;
  updatedAt: string;
  render: RenderJobSettings;
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
};

export type CreateRenderQueueSpecInput = {
  id: string;
  topic: string;
  items: Array<{
    id: string;
    content: ContentEngineItem;
    render?: Partial<RenderJobSettings>;
  }>;
  render?: Partial<RenderJobSettings>;
  createdAt?: string;
};

export function createRenderQueueSpec({
  id,
  topic,
  items,
  render,
  createdAt,
}: CreateRenderQueueSpecInput): RenderQueueSpec {
  const timestamp = createdAt ?? new Date().toISOString();

  const queueRenderSettings: RenderJobSettings = {
    ...DEFAULT_RENDER_SETTINGS,
    ...render,
  };

  const jobs: RenderQueueJob[] = items.map((item) => {
    const job = createRenderJobSpec({
      id: item.id,
      content: item.content,
      render: {
        ...queueRenderSettings,
        ...item.render,
      },
    });

    return {
      ...job,
      status: "pending",
    };
  });

  return {
    id,
    topic,
    status: "pending",
    jobs,
    createdAt: timestamp,
    updatedAt: timestamp,
    render: queueRenderSettings,
    totalJobs: jobs.length,
    completedJobs: 0,
    failedJobs: 0,
  };
}

export function getRenderQueueProgress(
  queue: RenderQueueSpec,
): {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
  percent: number;
} {
  const total = queue.jobs.length;
  const completed = queue.jobs.filter(
    (job) => job.status === "completed",
  ).length;
  const failed = queue.jobs.filter(
    (job) => job.status === "failed",
  ).length;
  const processing = queue.jobs.filter(
    (job) => job.status === "processing",
  ).length;
  const pending = queue.jobs.filter(
    (job) => job.status === "pending",
  ).length;

  return {
    total,
    completed,
    failed,
    pending,
    processing,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function updateRenderQueueJobStatus(
  queue: RenderQueueSpec,
  jobId: string,
  status: RenderQueueJobStatus,
  options?: {
    outputPath?: string;
    error?: string;
    updatedAt?: string;
  },
): RenderQueueSpec {
  const updatedAt = options?.updatedAt ?? new Date().toISOString();

  const jobs = queue.jobs.map((job) => {
    if (job.id !== jobId) {
      return job;
    }

    return {
      ...job,
      status,
      outputPath: options?.outputPath ?? job.outputPath,
      error: options?.error ?? job.error,
    };
  });

  const completedJobs = jobs.filter(
    (job) => job.status === "completed",
  ).length;

  const failedJobs = jobs.filter(
    (job) => job.status === "failed",
  ).length;

  const hasProcessing = jobs.some(
    (job) => job.status === "processing",
  );

  const hasPending = jobs.some(
    (job) => job.status === "pending",
  );

  const queueStatus: RenderQueueStatus =
    failedJobs > 0 && completedJobs + failedJobs === jobs.length
      ? "failed"
      : completedJobs === jobs.length
        ? "completed"
        : hasProcessing
          ? "processing"
          : hasPending
            ? "pending"
            : queue.status;

  return {
    ...queue,
    jobs,
    updatedAt,
    completedJobs,
    failedJobs,
    status: queueStatus,
  };
}
