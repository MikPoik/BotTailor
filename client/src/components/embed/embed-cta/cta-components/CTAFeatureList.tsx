import React from 'react';
import { CTAComponent } from '@shared/schema';
import { applyComponentStyle } from '../style-utils';

interface CTAFeaturesProps {
  component: CTAComponent;
  config?: any;
}

interface Feature {
  icon?: string;
  title: string;
  description: string;
  style?: any;
}

/**
 * CTAFeatures - Displays feature list in grid or list layout
 * 
 * Props from component:
 * - props.features: Array of feature objects
 * - props.layout: 'grid' or 'column' layout
 * 
 * Styling via component.style:
 * - gridTemplateColumns: Control grid layout (e.g., "repeat(3, 1fr)")
 * - gap: Control spacing between items
 * - display, flexDirection, alignItems, justifyContent
 * - textColor: Override text color (theme override)
 * - backgroundColor: Override background
 * - Any other CSS property
 */
export const CTAFeatures: React.FC<CTAFeaturesProps> = ({ component }) => {
  const { features = [] } = component.props || {};
  const layout = component.props?.layout || 'grid';
  const layoutClass = layout === 'column' ? 'list' : 'grid';
  const className = `cta-feature-list ${layoutClass}`;
  
  // Get component-level styles (for the wrapper)
  const componentStyle = applyComponentStyle(component.style);
  
  // Build grid style from component.style or defaults
  const gridStyle: React.CSSProperties = { ...componentStyle };
  
  // If not explicitly set in component.style, use defaults based on layout
  if (!gridStyle.gridTemplateColumns && layoutClass === 'grid') {
    if (component.props?.columns) {
      gridStyle.gridTemplateColumns = `repeat(${component.props.columns}, minmax(180px, 1fr))`;
    } else {
      gridStyle.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
    }
  }
  
  // Set default gap if not in component.style
  if (!gridStyle.gap && !componentStyle.gap) {
    gridStyle.gap = '16px';
  }

  if (!component.visible || features.length === 0) return null;

  return (
    <div className={className} style={gridStyle}>
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
