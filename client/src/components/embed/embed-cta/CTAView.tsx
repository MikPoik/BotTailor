import React, { useMemo } from 'react';
import { CTAConfig } from '@shared/schema';
import { renderCTAComponent } from './cta-component-registry';
import { CTAButtonGroup } from './cta-components/CTAButtonGroup';
import '../cta-styles.css';

interface CTAViewProps {
  config: CTAConfig;
  chatbotName?: string;
  chatbotAvatarUrl?: string;
  onPrimaryButtonClick?: (message: string) => void;
  onSecondaryButtonClick?: (message?: string) => void;
  onClose?: () => void;
  embedded?: boolean;
}

/**
 * CTAView - Main CTA display component
 * 
 * Renders the complete CTA view with:
 * - Components (header, description, features, etc.)
 * - Primary and secondary buttons
 * - Theme application
 * - Responsive layouts
 */
export const CTAView: React.FC<CTAViewProps> = ({
  config,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  onClose,
  embedded = false,
}) => {
  if (!config?.enabled) return null;

  // Get layout CSS classes
  const layoutClass = `cta-layout-${config.layout?.style || 'card'}`;
  const positionClass = `cta-position-${config.layout?.position || 'center'}`;

  // Theme CSS variables applied via useEffect below
  const themeStyle: React.CSSProperties = {};

  // Apply theme colors
  React.useEffect(() => {
    if (config.theme) {
      if (config.theme.primaryColor) {
        document.documentElement.style.setProperty('--cta-primary', config.theme.primaryColor);
      }
      if (config.theme.backgroundColor) {
        document.documentElement.style.setProperty('--cta-bg', config.theme.backgroundColor);
      }
      if (config.theme.textColor) {
        document.documentElement.style.setProperty('--cta-text', config.theme.textColor);
      }
    }
  }, [config.theme]);

  // Handle primary button click
  const handlePrimaryClick = () => {
    const message = config.primaryButton?.predefinedMessage || 'Hello';
    onPrimaryButtonClick?.(message);
  };

  // Handle secondary button click
  const handleSecondaryClick = () => {
    if (config.secondaryButton?.action === 'close') {
      onClose?.();
    } else if (config.secondaryButton?.action === 'link' && config.secondaryButton.url) {
      window.open(config.secondaryButton.url, '_blank');
    } else {
      onSecondaryButtonClick?.();
    }
  };

  // Sort components by order
  const sortedComponents = useMemo(() => {
    return [...(config.components || [])].sort((a, b) => a.order - b.order);
  }, [config.components]);

  return (
    <div className={`cta-view ${embedded ? 'embedded' : ''}`} style={themeStyle}>
      <div className={`${layoutClass} ${positionClass}`}>
        {/* Render all CTA components */}
        {sortedComponents.map((component) =>
          renderCTAComponent(component, config, component.id)
        )}

        {/* Button Group */}
        {config.primaryButton && (
          <CTAButtonGroup
            primaryButton={config.primaryButton}
            secondaryButton={config.secondaryButton}
            onPrimaryClick={handlePrimaryClick}
            onSecondaryClick={handleSecondaryClick}
            layout={config.layout?.style === 'sidebar' ? 'vertical' : 'vertical'}
          />
        )}

        {/* Close button (if dismissible and not banner/sidebar) */}
        {config.settings?.dismissible && !['banner', 'sidebar'].includes(config.layout?.style || 'card') && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--cta-text)',
              opacity: 0.6,
              transition: 'opacity 0.2s ease',
              padding: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6';
            }}
            aria-label="Close"
            title="Close"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default CTAView;
