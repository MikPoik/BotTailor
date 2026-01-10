import React from 'react';
import { CTAComponent } from '@shared/schema';

interface CTAFeaturesProps {
  component: CTAComponent;
  config?: any;
}

interface Feature {
  icon?: string;
  title: string;
  description: string;
}

/**
 * CTAFeatures - Displays feature list in grid or list layout
 * 
 * Props from component:
 * - props.features: Array of feature objects
 * - props.style.layout: 'grid' or 'list' layout
 */
export const CTAFeatures: React.FC<CTAFeaturesProps> = ({ component }) => {
  const { features = [] } = component.props || {};
  // Default to grid layout; 'list' layout not defined in schema props
  const className = 'cta-feature-list';

  if (!component.visible || features.length === 0) return null;

  return (
    <div className={className}>
      {features.map((feature: Feature, index: number) => (
        <div key={`feature-${index}`} className="cta-feature-item">
          {feature.icon && (
            <span className="cta-feature-icon">
              {feature.icon}
            </span>
          )}
          {feature.title && (
            <div className="cta-feature-title">
              {feature.title}
            </div>
          )}
          {feature.description && (
            <div className="cta-feature-description">
              {feature.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CTAFeatures;
