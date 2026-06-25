# WHAT'S FURTHER — Visual Style Guide

## Purpose

This document defines the visual language for WHAT'S FURTHER.

Every video, overlay, animation, transition, and visual asset should follow this guide to keep the channel consistent, recognizable, and original.

---

## Core Visual Identity

WHAT'S FURTHER should feel:

- Quiet
- Cinematic
- Reflective
- Premium
- Emotional
- Minimal
- Timeless

The visual style should not feel flashy, loud, chaotic, or overly commercial.

---

## Primary Style

Japanese sumi-e anime illustration with cinematic lighting.

Core traits:

- Soft ink wash textures
- Watercolor atmosphere
- Minimal composition
- Emotional negative space
- Gentle motion
- Warm highlights
- Muted shadows
- No text inside images
- No logos inside images

---

## Color Language

Primary colors:

- Warm gold
- Muted charcoal
- Soft black
- Mist gray
- Warm ivory
- Deep navy
- Faded amber
- Subtle brown

Avoid:

- Neon colors
- Oversaturated colors
- Harsh red
- Bright synthetic blue
- Strong purple
- Comic-style colors

---

## Motion Language

Motion should be slow, subtle, and cinematic.

Preferred motion:

- Slow camera drift
- Gentle zoom
- Soft floating particles
- Slow falling petals
- Subtle light movement
- Ink-like transitions
- Breathing glow

Avoid:

- Fast zooms
- Hard cuts
- Flash transitions
- Aggressive shakes
- Loud kinetic effects
- Overly busy movement

---

## Overlay System

All overlays should support the emotional tone of the video without distracting from the quote.

Overlay categories:

```text
assets/overlays/dust/
assets/overlays/petals/
assets/overlays/light/
assets/overlays/grain/
assets/overlays/ink/
```

---

## Dust Overlay

Dust should feel like small particles floating in natural light.

Rules:

* Very subtle
* Slow movement
* Low opacity
* Mostly warm or neutral
* No heavy snow-like density
* No horror-style dust
* No distracting particles over subtitle area

Recommended opacity:

```text
10%–25%
```

---

## Golden Petals Overlay

Golden petals are a signature visual element for WHAT'S FURTHER.

They should feel like tiny golden leaves or paper fragments drifting through the air.

Rules:

* Small particles only
* 3–8 visible petals at a time
* Slow falling motion
* Slight sideways drift
* Gentle rotation
* Warm gold color
* Mixed blur depth
* Mostly transparent background

Recommended opacity:

```text
20%–70%
```

Use sparingly. The effect should feel poetic, not decorative.

---

## Golden Light Sweep

Golden light sweep should feel like sunlight passing through the scene.

Rules:

* Soft and wide
* Warm gold tone
* Very low opacity
* Slow horizontal or diagonal movement
* Should not cover subtitles too strongly
* Should not look like a nightclub light effect

Recommended opacity:

```text
8%–15%
```

---

## Film Grain

Film grain should be subtle and premium.

Rules:

* Fine grain only
* Low opacity
* No heavy VHS effect
* No dirty film scratches unless intentionally used
* Should add texture, not noise

Recommended opacity:

```text
3%–8%
```

---

## Ink Transition

Ink transitions should feel like brush ink spreading across paper.

Rules:

* Soft edges
* Organic movement
* Short duration
* No flashy wipe
* No digital glitch
* Should feel handmade and calm

Recommended duration:

```text
250ms–500ms
```

---

## Subtitle Style

Subtitles should remain clear and premium.

Rules:

* Minimal words per line
* Strong readability
* Gold highlight only on key words
* No excessive animation
* No emoji
* No decorative fonts

Subtitle mood:

* Calm
* Intentional
* Cinematic
* Easy to read

---

## Camera Movement

Every video should have subtle motion, even when using a still image.

Recommended movement:

```text
Scale: 1.00 → 1.03
TranslateX: 0px → 10–25px
TranslateY: 0px → 5–15px
```

The movement should be barely noticeable.

---

## Image Generation Rules

All generated images should follow these rules:

* Vertical 9:16
* No text
* No logo
* No watermark
* Cinematic composition
* Strong negative space
* Emotional atmosphere
* Sumi-e anime influence
* Soft watercolor texture
* Premium lighting

Avoid:

* Repeated scenes too often
* Generic stock-photo feeling
* Overly realistic faces
* Random fantasy clutter
* Text inside the image

---

## WHAT'S FURTHER Visual DNA

Every finished video should ideally include:

```text
Sumi-e anime image
Slow camera drift
Dust overlay
Golden petals
Soft light movement
Fine film grain
Gold subtitle highlight
Calm voiceover
Atmospheric music
```

This combination is the visual identity of WHAT'S FURTHER.

---

## Asset Naming Convention

Use clear versioned names.

Examples:

```text
dust_v1_soft_warm_20s.mov
petals_v1_warm_gold_20s.mov
light_sweep_v1_soft_gold_12s.mov
grain_v1_fine_20s.mov
ink_transition_v1_soft_500ms.mov
```

Rules:

* Lowercase only
* Use hyphens or underscores consistently
* Include version number
* Include style description
* Include duration when useful

---

## Final Rule

If an effect does not support the emotion of the quote, remove it.

The goal is not to add more effects.

The goal is to make the viewer feel something.
