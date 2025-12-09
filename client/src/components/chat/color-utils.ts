// Utility helpers for theme-aware color resolution and contrast-friendly adjustments.
export type ToneMode = 'light' | 'dark';

type MaybeMode = ToneMode | undefined | null | string;

const safeCssVar = (name: string) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
};

// Helper function to lighten or darken a color for better contrast
export function adjustColorBrightness(color: string, percent: number): string {
  // Support short hex (#fff)
  const shortHexMatch = color.match(/^#([A-Fa-f0-9]{3})$/);
  if (shortHexMatch) {
    const expanded = shortHexMatch[1].split('').map((c) => c + c).join('');
    color = `#${expanded}`;
  }

  // For HSL colors
  const hslMatch = color.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/i);
  if (hslMatch) {
    const h = hslMatch[1];
    const s = hslMatch[2];
    const l = parseFloat(hslMatch[3]);
    const newL = Math.min(100, Math.max(0, l + percent));
    return `hsl(${h}, ${s}%, ${newL}%)`;
  }
  
  // For hex colors
  const hexMatch = color.match(/^#([A-Fa-f0-9]{6})$/);
  if (hexMatch) {
    const num = parseInt(hexMatch[1], 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return `#${(0x1000000 + (R * 0x10000) + (G * 0x100) + B).toString(16).slice(1)}`;
  }
  
  // Fallback: return original color
  return color;
}

// Parse a color string into RGB tuple
function parseColorToRgb(color: string): [number, number, number] | null {
  const hexMatch = color.match(/^#([A-Fa-f0-9]{6})$/);
  if (hexMatch) {
    const intVal = parseInt(hexMatch[1], 16);
    return [
      (intVal >> 16) & 255,
      (intVal >> 8) & 255,
      intVal & 255,
    ];
  }

  const shortHexMatch = color.match(/^#([A-Fa-f0-9]{3})$/);
  if (shortHexMatch) {
    const [r, g, b] = shortHexMatch[1].split('').map((c) => c + c).map((v) => parseInt(v, 16));
    return [r, g, b];
  }

  const rgbMatch = color.match(/^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i);
  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }

  const hslMatch = color.match(/^hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)$/i);
  if (hslMatch) {
    const h = Number(hslMatch[1]);
    const s = Number(hslMatch[2]) / 100;
    const l = Number(hslMatch[3]) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255),
    ];
  }

  return null;
}

const relativeLuminance = (rgb: [number, number, number]) => {
  const channel = (v: number) => {
    const srgb = v / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  };

  const [r, g, b] = rgb;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrastRatio = (a: number, b: number) => {
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
};

export function computeToneAdjustedColor(backgroundColor: string, textColor: string, mode?: MaybeMode) {
  const bgRgb = parseColorToRgb(backgroundColor) || [255, 255, 255];
  const textRgb = parseColorToRgb(textColor) || [20, 20, 20];

  const textLum = relativeLuminance(textRgb);
  const autoMode: ToneMode = textLum < 0.55 ? 'light' : 'dark';
  const normalizedMode = typeof mode === 'string' ? mode.toLowerCase() : undefined;
  const chosenMode: ToneMode = normalizedMode === 'light' || normalizedMode === 'dark' ? normalizedMode : autoMode;

  const adjustments = chosenMode === 'light' ? [12, 16, 20, 24] : [-10, -14, -18, -22];

  let bestColor = backgroundColor;
  let bestRatio = contrastRatio(textLum, relativeLuminance(bgRgb));

  for (const adj of adjustments) {
    const candidate = adjustColorBrightness(backgroundColor, adj);
    const candidateRgb = parseColorToRgb(candidate);
    if (!candidateRgb) continue;
    const candidateLum = relativeLuminance(candidateRgb);
    const ratio = contrastRatio(textLum, candidateLum);

    // Prefer the first that meets WCAG AA for normal text
    if (ratio >= 4.5) {
      return candidate;
    }

    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestColor = candidate;
    }
  }

  // Ensure we still nudge away from the background even if ratios are similar
  if (bestColor === backgroundColor) {
    return adjustColorBrightness(backgroundColor, chosenMode === 'light' ? 18 : -18);
  }

  return bestColor;
}

export function resolveThemeColors(chatbotConfig?: any) {
  const embedPrimaryColor = safeCssVar('--chat-primary-color');
  const embedBackgroundColor = safeCssVar('--chat-background');
  const embedTextColor = safeCssVar('--chat-text');
  const embedBubbleMode = safeCssVar('--chat-bot-bubble-mode').toLowerCase();

  const isValidColor = (color: string) => {
    return color && color !== '' && !color.startsWith('var(--') && color !== 'var(--primary)' && color !== 'var(--background)' && color !== 'var(--foreground)';
  };

  const backgroundColor = (isValidColor(embedBackgroundColor) ? embedBackgroundColor : 
                     chatbotConfig?.homeScreenConfig?.theme?.backgroundColor || 
                     chatbotConfig?.theme?.backgroundColor) || 'hsl(0, 0%, 100%)';

  const textColor = (isValidColor(embedTextColor) ? embedTextColor : 
               chatbotConfig?.homeScreenConfig?.theme?.textColor || 
               chatbotConfig?.theme?.textColor) || 'hsl(20, 14.3%, 4.1%)';

  const botBubbleMode = (embedBubbleMode === 'light' || embedBubbleMode === 'dark')
    ? (embedBubbleMode as ToneMode)
    : (chatbotConfig?.homeScreenConfig?.theme?.botBubbleMode || chatbotConfig?.theme?.botBubbleMode);

  const resolvedColors = {
    primaryColor: (isValidColor(embedPrimaryColor) ? embedPrimaryColor : 
                   chatbotConfig?.homeScreenConfig?.theme?.primaryColor || 
                   chatbotConfig?.theme?.primaryColor) || 'hsl(213, 93%, 54%)',
    backgroundColor,
    textColor,
    botBubbleMode,
  };

  return resolvedColors;
}
