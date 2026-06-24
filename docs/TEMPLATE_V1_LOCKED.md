# What's Further — Template V1 (LOCKED)

Canonical production specification for all quote reel clips. This document is the source of truth for future batches.

---

## Video

| Setting | Value |
|---------|-------|
| Resolution | 1080×1920 |
| FPS | 30 |
| Duration | 11.78 seconds (354 frames) |
| Output size | 2–3 MB |
| Render CRF | 28 |

**Render command:**

```bash
npx remotion render src/index.ts QuoteReel renders/{CLIP_ID}.mp4 --crf=28
```

**Composition:** `QuoteReel` in `src/Root.tsx`

---

## Audio

**Required per clip:**

- Voiceover — `assets/audio/{CLIP_ID}-voice.mp3`
- Ambient piano — fixed for all clips

**Music (locked):**

```
assets/music/001-music.wav
```

Do not swap music per clip unless explicitly requested.

---

## Visual System

**Required:**

- Anime visuals
- Slow zoom
- Dust overlay (`assets/overlays/dust.mp4`)
- Organic particles (`src/OrganicParticles.tsx`)
- Centered quote text

**Locked (do not modify unless explicitly requested):**

- Typography
- Animation
- Composition settings
- Dust overlay system
- Particle system

---

## CLIP_ID Workflow

`CLIP_ID` in `src/QuoteReel.tsx` drives the active clip. Changing `CLIP_ID` switches:

- Image — `assets/images/{CLIP_ID}.webp`
- Voiceover — `assets/audio/{CLIP_ID}-voice.mp3`
- Subtitles — `QUOTES["{CLIP_ID}"]` in `src/quotes.ts`

No other code changes are required to produce a new clip.

**Before re-rendering after changing `CLIP_ID`:**

1. Set `CLIP_ID` in `src/QuoteReel.tsx`
2. Delete the old output file `renders/{CLIP_ID}.mp4`
3. Clear bundle cache: `rm -rf node_modules/.cache`
4. Render fresh

Stale Remotion bundles can bake in wrong assets if the cache is not cleared between clip switches.

---

## Quote Structure (LOCKED)

Every clip uses exactly **5 subtitle blocks** and **22 words total**.

| Block | Word count | Role |
|-------|------------|------|
| 1 | 3 words | Opening hook |
| 2 | 8 words | Main statement |
| 3 | 4 words | Turn |
| 4 | 5 words | Resolution |
| 5 | 2 words | Closing line |

**Total:** 22 words · 5 blocks · 11.78 seconds

### Example (Clip 001)

```
The truth is...                                          (3)
Most people never become who they could be.              (8)
Not because they failed.                                 (4)
Because they stopped too early.                          (5)
What's further?                                          (2)
```

### Default Subtitle Timing (Template 001 schedule)

Used by clips **001–004** and **006**:

| Line | Start | End |
|------|-------|-----|
| 1 | 0.0s | 1.4s |
| 2 | 1.4s | 4.6s |
| 3 | 4.6s | 6.7s |
| 4 | 6.7s | 10.0s |
| 5 | 10.0s | 11.78s |

Subtitle behaviour: one line at a time, fade in/out (`FADE_FRAMES = 6`), last line boosted to higher opacity.

---

## Locked Components

| Component | Location |
|-----------|----------|
| Main composition | `src/QuoteReel.tsx` |
| Particle system | `src/OrganicParticles.tsx` |
| Remotion root | `src/Root.tsx` |
| Quote data | `src/quotes.ts` |
| Dust overlay | `assets/overlays/dust.mp4` |
| Music | `assets/music/001-music.wav` |
| Remotion config | `remotion.config.ts` (`publicDir = './assets'`) |

---

## Clip 005 Timing Exception

Clip **005** uses custom subtitle timing to sync the final line with the voiceover. The voiceover ends at ~9.98s; the default schedule placed "In memory." too late (starting at 10.0s).

**Custom timing for `QUOTES["005"]` only:**

| Line | Start | End | Text |
|------|-------|-----|------|
| 1 | 0.0s | 1.3s | The painful lesson... |
| 2 | 1.3s | 4.2s | Love and permanence are different things entirely. |
| 3 | 4.2s | 6.1s | Not always connected together. |
| 4 | 6.1s | 8.8s | Some people stay briefly forever. |
| 5 | 8.8s | 10.6s | In memory. |

All other clip 005 assets and template settings are unchanged. Do not apply this schedule to other clips unless a similar voice-sync fix is explicitly requested.

---

## Future Clip Rule

Only these may change per clip:

- `images/{CLIP_ID}.webp`
- `audio/{CLIP_ID}-voice.mp3`
- `QUOTES["{CLIP_ID}"]`

Everything else remains locked unless explicitly requested.

When adding a new clip:

1. Add image, voice, and quote entry following the 3+8+4+5+2 word structure.
2. Use the default Template 001 subtitle schedule unless voice-sync requires adjustment.
3. Set `CLIP_ID`, clear cache, and render.
4. Do not modify Template V1 composition, particles, dust, typography, or music.
