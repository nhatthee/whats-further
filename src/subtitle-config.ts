/**
 * Global subtitle timing tuning.
 *
 * Negative offset = highlight appears slightly before speech.
 * Recommended range: -0.03 to -0.07. Starting point: -0.04.
 *
 * Fine-tune:
 * - Highlight feels slow → decrease offset (more negative)
 * - Highlight feels fast → increase offset (less negative)
 */

/** Applied at render when mapping MFA words to subtitle frames. */
export const SUBTITLE_TIMING_OFFSET_SECONDS = -0.04;

/** MFA post-process: show highlight slightly before raw MFA start. */
export const MFA_VISUAL_LEAD_SECONDS = 0.04;

/** MFA post-process: extend word end for smoother gold highlight tail. */
export const MFA_VISUAL_TAIL_SECONDS = 0.06;

/** MFA post-process: minimum per-word highlight duration. */
export const MFA_MIN_WORD_DURATION_SECONDS = 0.08;

/** Block appears this many seconds before the first word. */
export const BLOCK_START_LEAD_SECONDS = 0.08;

/** Block stays visible this many seconds after the last word. */
export const BLOCK_END_TAIL_SECONDS = 0.15;

export const DEBUG_SUBTITLE_TIMING =
	typeof process !== 'undefined' &&
	process.env.DEBUG_SUBTITLE_TIMING === 'true';
