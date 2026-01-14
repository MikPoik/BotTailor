import React, { useEffect, useRef } from 'react';
import { CTAComponent } from '@shared/schema';
import { applyComponentStyle } from '../style-utils';

interface CTAHeaderProps {
  component: CTAComponent;
  config?: any;
}

/**
 * CTAHeader - Displays title and subtitle for CTA
 * 
 * Props from component:
 * - props.title: Main heading text
 * - props.subtitle: Secondary heading text
 * - props.backgroundImageUrl: Optional background image
 * 
 * Styling:
 * - component.style allows full customization including:
 *   - textColor: Override text color (theme override)
 *   - backgroundColor: Override background color
 *   - fontSize, fontWeight, textAlign
 *   - padding, margin for spacing
 *   - Any other CSS property
 */
export const CTAHeader: React.FC<CTAHeaderProps> = ({ component }) => {
  const { title, subtitle, backgroundImageUrl } = component.props || {};
  const componentStyle = applyComponentStyle(component.style);

  if (!component.visible) return null;

  const headerClass = backgroundImageUrl ? 'cta-header cta-header-with-bg' : 'cta-header';
  const headerStyle: React.CSSProperties = {
    ...(backgroundImageUrl ? { backgroundImage: `url(${backgroundImageUrl})` } : {}),
    ...componentStyle,
  };

  const titleColor = (component.style as any)?.textColor || (component.style as any)?.color;

  const titleRef = useRef<HTMLElement | null>(null);
  const subtitleRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // If a title color is provided, set it with !important to override global h1 !important rule
    if (titleColor) {
      try {
        titleRef.current?.style.setProperty('color', titleColor, 'important');
        subtitleRef.current?.style.setProperty('color', titleColor, 'important');
      } catch (e) {
        // ignore if DOM not available
      }
    }
  }, [titleColor]);

  return (
    <div className={headerClass} style={headerStyle}>
      {title && (
        <h1 ref={titleRef as any} className="cta-header-title" style={titleColor ? { color: titleColor } : {}}>
          {title}
        </h1>
      )}
      {subtitle && (
        <p ref={subtitleRef as any} className="cta-header-subtitle" style={titleColor ? { color: titleColor, opacity: 0.8 } : { opacity: 0.8 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default CTAHeader;
