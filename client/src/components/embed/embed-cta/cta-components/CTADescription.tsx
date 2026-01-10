import React from 'react';
import { CTAComponent } from '@shared/schema';

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
 */
export const CTADescription: React.FC<CTADescriptionProps> = ({ component }) => {
  const { description } = component.props || {};

  if (!component.visible || !description) return null;

  return (
    <div className="cta-description">
      {description}
    </div>
  );
};

export default CTADescription;
