# Quote Library

Canonical registry of approved clip quotes. Use it before creating any new clip to avoid repeating the same lines, ideas, or opening hooks across batches.

---

## Purpose

- Keep one source of truth for quote text (without timing data).
- Block exact duplicates before they enter production.
- Flag near-duplicates and repeated opening hooks such as `The truth is...` vs `The reality is...`.
- Preserve thematic variety across future batches.

The library is separate from `src/quotes.ts`. Timing and rendering still live in the Remotion quote data; this file tracks content only.

---

## Structure

File: `data/quote-library.json`

```json
[
  {
    "id": "001",
    "theme": "self-discovery",
    "quote": [
      "The truth is...",
      "Most people never become who they could be.",
      "Not because they failed.",
      "Because they stopped too early.",
      "What's further?"
    ]
  }
]
```

| Field | Description |
|-------|-------------|
| `id` | Three-digit clip ID (`001`, `002`, …) |
| `theme` | Short slug describing the idea (e.g. `self-discovery`, `lost-love`) |
| `quote` | Array of exactly 5 subtitle blocks (Template V1 word structure) |

---

## Current clips

| ID | Theme |
|----|-------|
| 001 | self-discovery |
| 002 | lost-love |
| 003 | breakup-grief |
| 004 | unexpected-endings |
| 005 | love-and-loss |
| 006 | identity-in-love |

Clips `007`–`013` are not in the repo yet. Add them to the library when their quotes are approved.

---

## How to add a new clip

Follow this order every time:

### Step 1 — Check the library

Create a candidate JSON file:

```json
{
  "id": "014",
  "theme": "new-theme",
  "quote": [
    "The reality is...",
    "Eight words forming the main statement here.",
    "Four words for the turn.",
    "Five words for the resolution.",
    "Closing line."
  ]
}
```

Run:

```bash
npm run check:quotes -- --file path/to/candidate.json
```

### Step 2 — Reject duplicates

If the checker reports any conflict, revise the quote and check again. Do not add the clip until the command prints `PASS`.

Conflict types:

| Kind | Meaning |
|------|---------|
| `exact` | All five blocks match an existing clip |
| `near-duplicate` | Combined quote text is ≥ 82% similar (word overlap) |
| `similar-opening-hook` | Block 1 matches or closely mirrors an existing hook |

Examples flagged as similar hooks:

- `The truth is...` vs `The reality is...`
- `The painful lesson...` vs `The painful truth...`

### Step 3 — Add to the library

After `PASS`, append the entry to `data/quote-library.json` (keep IDs sorted). Then add timing in `src/quotes.ts` and produce assets as usual.

---

## Duplicate checking

Command:

```bash
npm run check:quotes -- --file path/to/candidate.json
```

Implementation: `scripts/check-quote-library.ts`

**Exact duplicates** — Normalized comparison of all five blocks (case-insensitive, punctuation-stripped).

**Near duplicates** — Jaccard similarity on the full joined quote. Threshold: 82%.

**Opening hooks** — Compares block 1 only:

- Exact normalized match
- Shared `The {word...}` pattern
- High word overlap (≥ 65%)

Exit code `0` = safe to approve. Exit code `1` = conflict found.

---

## Future clip rule

Whenever a new clip is created:

1. Check `data/quote-library.json` with `npm run check:quotes`.
2. Reject duplicates and revise until the check passes.
3. Add the approved quote to the library before rendering.

Do not skip the library step. Template V1, rendering, and quote timing are unchanged by this workflow.
