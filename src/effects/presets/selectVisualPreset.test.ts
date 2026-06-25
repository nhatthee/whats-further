import { describe, expect, it } from "vitest";
import {
  explainVisualPresetSelection,
  recommendVisualPresets,
  selectVisualPreset,
  VisualSelectionWeightPresets,
} from "./selectVisualPreset";

describe("selectVisualPreset", () => {
  it("selects hopeful-dawn for growth motivation", () => {
    expect(
      selectVisualPreset({
        topic: "growth",
        category: "motivation",
        mood: "hopeful",
        emotion: "new-beginning",
        weights: VisualSelectionWeightPresets.motivation,
      }),
    ).toBe("hopeful-dawn");
  });

  it("selects deep-lonely for lost-love sadness", () => {
    expect(
      selectVisualPreset({
        topic: "lost-love",
        category: "reflection",
        mood: "lonely",
        emotion: "sadness",
        weights: VisualSelectionWeightPresets["lost-love"],
      }),
    ).toBe("deep-lonely");
  });

  it("selects quiet-discipline for discipline focus", () => {
    expect(
      selectVisualPreset({
        topic: "discipline",
        category: "focus",
        mood: "peaceful",
        tags: ["discipline", "self-improvement", "patience"],
        weights: VisualSelectionWeightPresets.discipline,
      }),
    ).toBe("quiet-discipline");
  });

  it("falls back to golden-sunset when there is no match", () => {
    expect(
      selectVisualPreset({
        topic: "xyz",
        category: "abc",
        mood: "unknown",
        emotion: "none",
      }),
    ).toBe("golden-sunset");
  });

  it("recommends top 5 presets", () => {
    const recommendations = recommendVisualPresets({
      topic: "growth",
      category: "motivation",
      mood: "hopeful",
      emotion: "new-beginning",
      tags: ["discipline", "self-improvement"],
      weights: VisualSelectionWeightPresets.motivation,
    });

    expect(recommendations).toHaveLength(5);
    expect(recommendations[0]?.preset).toBe("hopeful-dawn");
    expect(
      recommendations.every((item) => typeof item.score === "number"),
    ).toBe(true);
  });

  it("explains selected preset reasons", () => {
    const explanation = explainVisualPresetSelection({
      topic: "growth",
      category: "motivation",
      mood: "hopeful",
      emotion: "new-beginning",
      weights: VisualSelectionWeightPresets.motivation,
    });

    expect(explanation.selected).toBe("hopeful-dawn");
    expect(explanation.score).toBeGreaterThan(0);
    expect(explanation.reasons.length).toBeGreaterThan(0);
    expect(explanation.reasons.some((reason) => reason.signal === "mood")).toBe(
      true,
    );
    expect(explanation.recommendations).toHaveLength(5);
  });

  it("explains fallback selection", () => {
    const explanation = explainVisualPresetSelection({
      topic: "xyz",
      category: "abc",
    });

    expect(explanation.selected).toBe("golden-sunset");
    expect(explanation.score).toBe(0);
    expect(explanation.reasons[0]?.signal).toBe("fallback");
  });
});
