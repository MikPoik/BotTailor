import React from 'react';
import { CTAComponent, CTAConfig } from '@shared/schema';
import { CTAHeader } from './cta-components/CTAHeader';
import { CTADescription } from './cta-components/CTADescription';
import { CTAFeatures } from './cta-components/CTAFeatureList';
import { CTAForm } from './cta-components/CTAForm';

/**
 * Component Registry
 * 
 * Maps CTA component types to React components
 * Extensible for adding new component types
 */
const componentRegistry: Partial<Record<CTAComponent['type'], React.ComponentType<any>>> = {
  'header': CTAHeader,
  'description': CTADescription,
  'feature_list': CTAFeatures,
  'form': CTAForm,
  // 'button_group' and 'menu' are handled separately in CTAView
};

/**
 * Get registered component by type
 */
export function getRegisteredComponent(type: CTAComponent['type']) {
  return componentRegistry[type];
}

/**
 * Render a CTA component
 */
export function renderCTAComponent(
  component: CTAComponent,
  config: CTAConfig,
  key?: string
) {
  const Component = getRegisteredComponent(component.type);
  
  if (!Component) {
    console.warn(`Unknown CTA component type: ${component.type}`);
    return null;
  }

  return (
    <Component
      key={key || component.id}
      component={component}
      config={config}
    />
  );
}

/**
 * Get all available component types
 */
export function getAvailableComponentTypes(): CTAComponent['type'][] {
  return Object.keys(componentRegistry) as CTAComponent['type'][];
}

/**
 * Check if component type exists
 */
export function isValidComponentType(type: string): type is CTAComponent['type'] {
  return type in componentRegistry;
}

export default {
  getRegisteredComponent,
  renderCTAComponent,
  getAvailableComponentTypes,
  isValidComponentType,
};
