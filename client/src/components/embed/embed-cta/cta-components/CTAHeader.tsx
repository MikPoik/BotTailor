import React from 'react';
import { CTAComponent } from '@shared/schema';

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
 */
export const CTAHeader: React.FC<CTAHeaderProps> = ({ component }) => {
  const { title, subtitle, backgroundImageUrl } = component.props || {};

  if (!component.visible) return null;

  const headerClass = backgroundImageUrl ? 'cta-header cta-header-with-bg' : 'cta-header';
  const headerStyle = backgroundImageUrl 
    ? { backgroundImage: `url(${backgroundImageUrl})` }
    : {};

  return (
    <div className={headerClass} style={headerStyle}>
      {title && (
        <h1 className="cta-header-title">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="cta-header-subtitle">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default CTAHeader;
