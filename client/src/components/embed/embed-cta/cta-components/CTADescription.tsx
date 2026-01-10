import React from 'react';
import { CTAComponent } from '@shared/schema';
import { applyComponentStyle } from '../style-utils';

interface CTADescriptionProps {
  component: CTAComponent;
  config?: any;
}

/**
 * CTADescription - Displays descriptive text
 * 
 * Props from component:
 * - props.description: Main description text
 * - props.backgroundImageUrl: Optional background
 * 
 * Styling:
 * - component.style allows customization including:
 *   - textColor: Override text color (theme override)
 *   - fontSize, fontWeight, textAlign, lineHeight
 *   - padding, margin for spacing
 *   - Any other CSS property
 */
export const CTADescription: React.FC<CTADescriptionProps> = ({ component }) => {
  const { description } = component.props || {};
  const componentStyle = applyComponentStyle(component.style);

  if (!component.visible || !description) return null;

  return (
    <div className="cta-description" style={componentStyle}>
      {description}
    </div>
  );
};

export default CTADescription;
