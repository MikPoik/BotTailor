import React from 'react';
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

  return (
    <div className={headerClass} style={headerStyle}>
      {title && (
        <h1 className="cta-header-title" style={{ color: titleColor }}>
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="cta-header-subtitle" style={{ color: titleColor, opacity: 0.8 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default CTAHeader;
