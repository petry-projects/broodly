/**
 * Runtime color values for non-className contexts (e.g., Ionicons color prop).
 * These MUST stay in sync with the Gluestack design tokens in config.ts.
 * Use Tailwind classes (e.g., text-typography-500) wherever possible — only
 * use these constants when a component API requires a string color value.
 */
export const ICON_COLORS = {
  muted: 'rgb(107, 114, 128)', // typography-500
  primary: 'rgb(212, 136, 15)', // primary-500
  white: 'white',
} as const;
