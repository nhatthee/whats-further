import { createSafeRenderSlug } from "./render-backend-adapter";
import type { RenderBackendFormat } from "./render-backend-adapter";
import type { ContentEngineItem } from "./presets/contentMetadataAdapter";
import type { RenderJobSettings } from "./render-job-spec";
import {
  createRenderQueueSpec,
  type RenderQueueSpec,
} from "./render-queue-spec";

export type RenderSettings = RenderJobSettings;

export type RenderRequestItem = ContentEngineItem & {
  id: string;
  title: string;
  script: string[];
};

export type RenderRequest = {
  topic: string;
  items: RenderRequestItem[];
  render?: Partial<RenderSettings>;
  options?: {
    compositionId?: string;
    outputDir?: string;
    format?: RenderBackendFormat;
  };
};

export type RenderRequestValidationResult = {
  ok: boolean;
  errors: string[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateRenderRequestItem(
  item: unknown,
  index: number,
): string[] {
  const errors: string[] = [];
  const prefix = `items[${index}]`;

  if (!isObject(item)) {
    errors.push(`${prefix} must be an object`);
    return errors;
  }

  if (!isNonEmptyString(item.id)) {
    errors.push(`${prefix}.id must be a non-empty string`);
  }

  if (!isNonEmptyString(item.category)) {
    errors.push(`${prefix}.category must be a non-empty string`);
  }

  if (!isNonEmptyString(item.title)) {
    errors.push(`${prefix}.title must be a non-empty string`);
  }

  if (!Array.isArray(item.script)) {
    errors.push(`${prefix}.script must be an array`);
  } else if (item.script.length === 0) {
    errors.push(`${prefix}.script must not be empty`);
  }

  return errors;
}

export function validateRenderRequest(
  request: unknown,
): RenderRequestValidationResult {
  const errors: string[] = [];

  if (!isObject(request)) {
    return {
      ok: false,
      errors: ["request must be an object"],
    };
  }

  if (!isNonEmptyString(request.topic)) {
    errors.push("topic must be a non-empty string");
  }

  if (!Array.isArray(request.items)) {
    errors.push("items must be an array");
  } else if (request.items.length === 0) {
    errors.push("items must not be empty");
  } else {
    for (const [index, item] of request.items.entries()) {
      errors.push(...validateRenderRequestItem(item, index));
    }
  }

  if (request.render !== undefined && !isObject(request.render)) {
    errors.push("render must be an object when provided");
  }

  if (request.options !== undefined) {
    if (!isObject(request.options)) {
      errors.push("options must be an object when provided");
    } else if (
      request.options.format !== undefined &&
      request.options.format !== "mp4" &&
      request.options.format !== "webm"
    ) {
      errors.push('options.format must be "mp4" or "webm"');
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function assertValidRenderRequest(
  request: unknown,
): asserts request is RenderRequest {
  const validation = validateRenderRequest(request);

  if (!validation.ok) {
    throw new Error(validation.errors.join("; "));
  }
}

export function createRenderQueueFromRequest(
  request: RenderRequest,
): RenderQueueSpec {
  const validation = validateRenderRequest(request);

  if (!validation.ok) {
    throw new Error(validation.errors.join("; "));
  }

  return createRenderQueueSpec({
    id: `${createSafeRenderSlug(request.topic)}-queue`,
    topic: request.topic,
    items: request.items.map((item) => ({
      id: item.id,
      content: {
        topic: item.topic ?? request.topic,
        category: item.category,
        title: item.title,
        script: item.script,
        mood: item.mood,
        emotion: item.emotion,
        tags: item.tags,
      },
    })),
    render: request.render,
  });
}
