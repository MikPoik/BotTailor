# Documentation for client/src/components/chat/color-utils.ts

Utility helpers for theme-aware color resolution and contrast-friendly adjustments.
Helper function to lighten or darken a color for better contrast
Support short hex (#fff)
For HSL colors
For hex colors
Fallback: return original color
Parse a color string into RGB tuple
Prefer the first that meets WCAG AA for normal text
Ensure we still nudge away from the background even if ratios are similar