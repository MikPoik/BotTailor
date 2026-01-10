import { ComponentStyle } from '@shared/schema';

/**
 * Converts ComponentStyle schema to React inline styles
 * Supports comprehensive CSS properties for flexible layouts and theming
 * 
 * Theme color override behavior:
 * - If style.textColor is set, it overrides the component default
 * - If style.backgroundColor is set, it overrides the component default
 * - This allows per-component theme customization while maintaining overall theme consistency
 */
export function applyComponentStyle(style?: ComponentStyle): React.CSSProperties {
  if (!style) return {};

  const css: React.CSSProperties = {};

  // ========== COLORS & OPACITY ==========
  // Color overrides allow per-component theme customization
  if (style.backgroundColor) css.backgroundColor = style.backgroundColor;
  if (style.color) css.color = style.color; // color alias
  if (style.textColor) css.color = style.textColor; // Explicit override
  if (style.borderColor) css.borderColor = style.borderColor;
  if (style.opacity !== undefined) css.opacity = style.opacity;

  // ========== BORDERS ==========
  if (style.border) css.border = style.border;
  if (style.borderWidth !== undefined) css.borderWidth = style.borderWidth;
  if (style.borderRadius !== undefined) css.borderRadius = style.borderRadius;
  if (style.borderStyle) css.borderStyle = style.borderStyle;

  // ========== SHADOWS & EFFECTS ==========
  if (style.boxShadow) css.boxShadow = style.boxShadow;
  if (style.textShadow) css.textShadow = style.textShadow;
  if (style.filter) css.filter = style.filter;

  // ========== SPACING ==========
  // Padding with directional overrides
  if (style.padding !== undefined) css.padding = `${style.padding}px`;
  if (style.paddingTop !== undefined) css.paddingTop = `${style.paddingTop}px`;
  if (style.paddingRight !== undefined) css.paddingRight = `${style.paddingRight}px`;
  if (style.paddingBottom !== undefined) css.paddingBottom = `${style.paddingBottom}px`;
  if (style.paddingLeft !== undefined) css.paddingLeft = `${style.paddingLeft}px`;

  // Margin with directional overrides
  if (style.margin !== undefined) css.margin = `${style.margin}px`;
  if (style.marginTop !== undefined) css.marginTop = `${style.marginTop}px`;
  if (style.marginRight !== undefined) css.marginRight = `${style.marginRight}px`;
  if (style.marginBottom !== undefined) css.marginBottom = `${style.marginBottom}px`;
  if (style.marginLeft !== undefined) css.marginLeft = `${style.marginLeft}px`;

  // Gap
  if (style.gap !== undefined) css.gap = `${style.gap}px`;

  // ========== TYPOGRAPHY ==========
  if (style.fontSize !== undefined) css.fontSize = `${style.fontSize}px`;
  if (style.fontWeight !== undefined) css.fontWeight = style.fontWeight;
  if (style.fontStyle) css.fontStyle = style.fontStyle;
  if (style.lineHeight !== undefined) css.lineHeight = style.lineHeight;
  if (style.letterSpacing !== undefined) css.letterSpacing = `${style.letterSpacing}px`;
  if (style.textAlign) css.textAlign = style.textAlign;
  if (style.textDecoration) css.textDecoration = style.textDecoration;
  if (style.textTransform) css.textTransform = style.textTransform;
  if (style.wordBreak) css.wordBreak = style.wordBreak;
  if (style.whiteSpace) css.whiteSpace = style.whiteSpace;

  // ========== SIZING ==========
  if (style.width) css.width = style.width;
  if (style.height) css.height = style.height;
  if (style.minWidth) css.minWidth = style.minWidth;
  if (style.minHeight) css.minHeight = style.minHeight;
  if (style.maxWidth) css.maxWidth = style.maxWidth;
  if (style.maxHeight) css.maxHeight = style.maxHeight;
  if (style.aspectRatio) css.aspectRatio = style.aspectRatio;

  // ========== DISPLAY & FLEX ==========
  if (style.display) css.display = style.display;
  if (style.flexDirection) css.flexDirection = style.flexDirection;
  if (style.flexWrap) css.flexWrap = style.flexWrap;
  if (style.flexGrow !== undefined) css.flexGrow = style.flexGrow;
  if (style.flexShrink !== undefined) css.flexShrink = style.flexShrink;
  if (style.flexBasis) css.flexBasis = style.flexBasis;
  if (style.flex) css.flex = style.flex;
  if (style.alignItems) css.alignItems = style.alignItems;
  if (style.alignContent) css.alignContent = style.alignContent;
  if (style.justifyContent) css.justifyContent = style.justifyContent;
  if (style.alignSelf) css.alignSelf = style.alignSelf;

  // ========== GRID ==========
  if (style.gridTemplateColumns) css.gridTemplateColumns = style.gridTemplateColumns;
  if (style.gridTemplateRows) css.gridTemplateRows = style.gridTemplateRows;
  if (style.gridAutoFlow) css.gridAutoFlow = style.gridAutoFlow;
  if (style.gridAutoColumns) css.gridAutoColumns = style.gridAutoColumns;
  if (style.gridAutoRows) css.gridAutoRows = style.gridAutoRows;
  if (style.gridGap !== undefined) css.gridGap = `${style.gridGap}px`;
  if (style.gridColumnGap !== undefined) css.gridColumnGap = `${style.gridColumnGap}px`;
  if (style.gridRowGap !== undefined) css.gridRowGap = `${style.gridRowGap}px`;
  if (style.gridColumn) css.gridColumn = style.gridColumn;
  if (style.gridRow) css.gridRow = style.gridRow;

  // ========== POSITIONING ==========
  if (style.position) css.position = style.position;
  if (style.top) css.top = style.top;
  if (style.right) css.right = style.right;
  if (style.bottom) css.bottom = style.bottom;
  if (style.left) css.left = style.left;
  if (style.zIndex !== undefined) css.zIndex = style.zIndex;

  // ========== OVERFLOW ==========
  if (style.overflow) css.overflow = style.overflow;
  if (style.overflowX) css.overflowX = style.overflowX;
  if (style.overflowY) css.overflowY = style.overflowY;

  // ========== TRANSFORMS ==========
  if (style.transform) css.transform = style.transform;
  if (style.transformOrigin) css.transformOrigin = style.transformOrigin;

  // ========== TRANSITIONS & INTERACTIONS ==========
  if (style.transition) css.transition = style.transition;
  if (style.cursor) css.cursor = style.cursor;

  // ========== BACKGROUND ==========
  if (style.backgroundSize) css.backgroundSize = style.backgroundSize;
  if (style.backgroundPosition) css.backgroundPosition = style.backgroundPosition;
  if (style.backgroundRepeat) css.backgroundRepeat = style.backgroundRepeat;
  if (style.backgroundAttachment) css.backgroundAttachment = style.backgroundAttachment;

  // ========== GRADIENTS ==========
  if (style.gradient?.enabled) {
    const gradientCSS = buildGradient(style.gradient);
    if (gradientCSS) css.backgroundImage = gradientCSS;
  }

  return css;
}

/**
 * Builds gradient CSS string
 */
function buildGradient(gradient: {
  type?: string;
  angle?: number;
  startColor?: string;
  endColor?: string;
}): string | null {
  if (!gradient.startColor || !gradient.endColor) return null;

  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${gradient.startColor}, ${gradient.endColor})`;
  }

  // Linear gradient (default)
  const angle = gradient.angle ?? 90;
  return `linear-gradient(${angle}deg, ${gradient.startColor}, ${gradient.endColor})`;
}

/**
 * Builds background pattern CSS
 */
export function getBackgroundPattern(
  pattern?: string,
  color?: string
): string | undefined {
  if (!pattern || pattern === 'none') return undefined;

  const patternColor = color || 'rgba(0, 0, 0, 0.1)';

  const patterns: Record<string, string> = {
    dots: `radial-gradient(circle, ${patternColor} 1px, transparent 1px)`,
    grid: `linear-gradient(0deg, ${patternColor} 1px, transparent 1px), linear-gradient(90deg, ${patternColor} 1px, transparent 1px)`,
    waves: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 120'%3E%3Cpath d='M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z' fill='${encodeURIComponent(patternColor)}'/%3E%3C/svg%3E")`,
    stripes: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${patternColor} 10px, ${patternColor} 20px)`,
  };

  return patterns[pattern];
}
