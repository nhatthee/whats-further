import type { VisualPresetIntensity, VisualPresetName } from "../visual-presets";
import { listVisualPresets } from "../visual-presets";

export type VisualSelectionWeights = {
  mood?: number;
  category?: number;
  emotion?: number;
  topic?: number;
  tags?: number;
};

export type VisualSelectionInput = {
  topic?: string;
  category?: string;
  mood?: string;
  emotion?: string;
  tags?: string[];
  weights?: VisualSelectionWeights;
};

export type VisualPresetRecommendation = {
  preset: VisualPresetName;
  score: number;
};

export type VisualPresetSelectionReason = {
  signal: "mood" | "category" | "emotion" | "topic" | "tag" | "fallback";
  value: string;
  points: number;
  message: string;
};

export type VisualPresetSelectionExplanation = {
  selected: VisualPresetName;
  score: number;
  reasons: VisualPresetSelectionReason[];
  recommendations: Array<{
    preset: VisualPresetName;
    score: number;
  }>;
};

const DEFAULT_PRESET: VisualPresetName = "golden-sunset";

const FALLBACK_REASON: VisualPresetSelectionReason = {
  signal: "fallback",
  value: "golden-sunset",
  points: 0,
  message: "No metadata match found; using default visual preset.",
};

const DEFAULT_WEIGHTS: Required<VisualSelectionWeights> = {
  mood: 1,
  category: 1,
  emotion: 1,
  topic: 1,
  tags: 1,
};

export const VisualSelectionWeightPresets = {
  motivation: {
    mood: 1.2,
    category: 1,
    emotion: 1.4,
    topic: 0.8,
    tags: 1.1,
  },
  facts: {
    mood: 0.6,
    category: 1.4,
    emotion: 0.7,
    topic: 1.2,
    tags: 1,
  },
  "lost-love": {
    mood: 1.1,
    category: 1,
    emotion: 1.6,
    topic: 1,
    tags: 1.2,
  },
  discipline: {
    mood: 0.9,
    category: 1.5,
    emotion: 1,
    topic: 1.1,
    tags: 1.4,
  },
} satisfies Record<string, VisualSelectionWeights>;

const INTENSITY_PRIORITY: Record<VisualPresetIntensity, number> = {
  medium: 0,
  soft: 1,
  strong: 2,
};

function normalize(value?: string): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || undefined;
}

function resolveWeights(
  input: VisualSelectionInput,
): Required<VisualSelectionWeights> {
  return {
    ...DEFAULT_WEIGHTS,
    ...input.weights,
  };
}

function scoreVisualPreset(
  preset: ReturnType<typeof listVisualPresets>[number],
  input: VisualSelectionInput,
): {
  score: number;
  reasons: VisualPresetSelectionReason[];
} {
  const weights = resolveWeights(input);
  const reasons: VisualPresetSelectionReason[] = [];
  let score = 0;
  const topic = normalize(input.topic);
  const category = normalize(input.category);
  const mood = normalize(input.mood);
  const emotion = normalize(input.emotion);
  const useCases = preset.metadata.useCases.map((useCase) =>
    useCase.toLowerCase(),
  );

  if (mood && mood === preset.metadata.tone) {
    const points = 10 * weights.mood;
    score += points;
    reasons.push({
      signal: "mood",
      value: input.mood!,
      points,
      message: `Mood matched tone: ${input.mood}`,
    });
  }

  if (category && useCases.includes(category)) {
    const points = 6 * weights.category;
    score += points;
    reasons.push({
      signal: "category",
      value: input.category!,
      points,
      message: `Category matched use case: ${input.category}`,
    });
  }

  if (emotion && useCases.includes(emotion)) {
    const points = 5 * weights.emotion;
    score += points;
    reasons.push({
      signal: "emotion",
      value: input.emotion!,
      points,
      message: `Emotion matched use case: ${input.emotion}`,
    });
  }

  if (topic && useCases.includes(topic)) {
    const points = 3 * weights.topic;
    score += points;
    reasons.push({
      signal: "topic",
      value: input.topic!,
      points,
      message: `Topic matched use case: ${input.topic}`,
    });
  }

  if (input.tags && input.tags.length > 0) {
    const useCaseSet = new Set(useCases);

    for (const tag of input.tags) {
      const normalizedTag = normalize(tag);

      if (normalizedTag && useCaseSet.has(normalizedTag)) {
        const points = 2 * weights.tags;
        score += points;
        reasons.push({
          signal: "tag",
          value: tag,
          points,
          message: `Tag matched use case: ${tag}`,
        });
      }
    }
  }

  return { score, reasons };
}

function compareIntensityTiebreaker(
  left: VisualPresetIntensity,
  right: VisualPresetIntensity,
): number {
  return INTENSITY_PRIORITY[left] - INTENSITY_PRIORITY[right];
}

function rankPresets(
  input: VisualSelectionInput,
): VisualPresetRecommendation[] {
  return listVisualPresets()
    .map((preset) => ({
      preset: preset.name,
      ...scoreVisualPreset(preset, input),
      intensity: preset.metadata.intensity,
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return compareIntensityTiebreaker(left.intensity, right.intensity);
    })
    .map(({ preset, score }) => ({ preset, score }));
}

export function getVisualSelectionWeights(
  preset: keyof typeof VisualSelectionWeightPresets,
): VisualSelectionWeights {
  return VisualSelectionWeightPresets[preset];
}

export function recommendVisualPresets(
  input: VisualSelectionInput,
): VisualPresetRecommendation[] {
  return rankPresets(input).slice(0, 5);
}

export function selectVisualPreset(
  input: VisualSelectionInput,
): VisualPresetName {
  const ranked = rankPresets(input);

  if (ranked.length === 0 || ranked[0].score === 0) {
    return DEFAULT_PRESET;
  }

  return ranked[0].preset;
}

export function explainVisualPresetSelection(
  input: VisualSelectionInput,
): VisualPresetSelectionExplanation {
  const recommendations = recommendVisualPresets(input);
  const selected = selectVisualPreset(input);
  const selectedPreset = listVisualPresets().find(
    (preset) => preset.name === selected,
  );

  if (!selectedPreset) {
    return {
      selected: DEFAULT_PRESET,
      score: 0,
      reasons: [FALLBACK_REASON],
      recommendations,
    };
  }

  const result = scoreVisualPreset(selectedPreset, input);

  const reasons =
    result.score > 0 ? result.reasons : [FALLBACK_REASON];

  return {
    selected,
    score: result.score,
    reasons,
    recommendations,
  };
}
