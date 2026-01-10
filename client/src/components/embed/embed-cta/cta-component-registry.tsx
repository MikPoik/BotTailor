import React from 'react';
import { CTAComponent, CTAConfig } from '@shared/schema';
import { CTAHeader } from './cta-components/CTAHeader';
import { CTADescription } from './cta-components/CTADescription';
import { CTAFeatures } from './cta-components/CTAFeatureList';
import { CTAForm } from './cta-components/CTAForm';
import { Badge } from './cta-components/Badge';
import { Divider } from './cta-components/Divider';
import { Container } from './cta-components/Container';
import { RichText } from './cta-components/RichText';
import { CustomHTML } from './cta-components/CustomHTML';

/**
 * Component Registry
 * 
 * Maps CTA component types to React components
 * Extensible for adding new component types
 * 
 * Supported types:
 * - header: Title and subtitle
 * - description: Body text
 * - feature_list: List of features with icons
 * - form: Form fields
 * - badge: Icon badge with title/description
 * - divider: Visual separator
 * - container: Layout wrapper for flex/grid
 * - richtext: Rich formatted content
 * - custom_html: Sanitized HTML for special layouts
 */
const componentRegistry: Partial<Record<CTAComponent['type'], React.ComponentType<any>>> = {
  'header': CTAHeader,
  'description': CTADescription,
  'feature_list': CTAFeatures,
  'form': CTAForm,
  'badge': Badge,
  'divider': Divider,
  'container': Container,
  'richtext': RichText,
  'custom_html': CustomHTML,
  // 'button_group' and 'menu' are handled separately in CTAView
};

/**
 * Get registered component by type
 */
export function getRegisteredComponent(type: CTAComponent['type']) {
  return componentRegistry[type];
}

/**
 * Render a CTA component with styling
 */
export function renderCTAComponent(
  component: CTAComponent,
  config: CTAConfig,
  key?: string
) {
  // Handle special container cases
  if (component.type === 'divider') {
    return (
      <Divider
        key={key || component.id}
        style={component.props?.dividerStyle}
        color={component.props?.dividerColor}
        componentStyle={component.style}
      />
    );
  }

  if (component.type === 'richtext') {
    return (
      <RichText
        key={key || component.id}
        htmlContent={component.props?.htmlContent}
        style={component.style}
      />
    );
  }

  if (component.type === 'custom_html') {
    return (
      <CustomHTML
        key={key || component.id}
        component={component}
        style={component.style}
      />
    );
  }

  if (component.type === 'badge') {
    return (
      <Badge
        key={key || component.id}
        icon={component.props?.icon}
        title={component.props?.title}
        description={component.props?.description}
        style={component.style}
        badgeStyle={component.props?.badgeStyle as any}
      />
    );
  }

  if (component.type === 'container') {
    return (
      <Container
        key={key || component.id}
        layout={component.props?.layout as any}
        columns={component.props?.columns}
        style={component.style}
      >
        {/* Container for layout management - children added manually via builder */}
      </Container>
    );
  }

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
