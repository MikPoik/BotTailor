import React, { useMemo } from 'react';
import { CTAConfig } from '@shared/schema';
import { renderCTAComponent } from './cta-component-registry';
import { CTAButtonGroup } from './cta-components/CTAButtonGroup';
import { getBackgroundPattern } from './style-utils';
import './cta-styles.css';

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
 * - Components (header, description, features, etc.) with flexible layout
 * - Primary and secondary buttons with style customization
 * - Theme application with per-component color overrides
 * - Background images & patterns
 * - Responsive layouts
 * 
 * Layout Features:
 * - Supports vertical (default), horizontal, and grid component layouts
 * - Component gaps controlled via config.layout.componentGap
 * - Theme colors can be overridden per-component via component.style.textColor/backgroundColor
 * - Full flexbox/grid support for complex layouts
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
  const positionClass = embedded ? '' : `cta-position-${config.layout?.position || 'center'}`;

  // Build background style
  const backgroundStyle: React.CSSProperties = {};
  if (config.layout?.backgroundImage) {
    backgroundStyle.backgroundImage = `url(${config.layout.backgroundImage})`;
    backgroundStyle.backgroundSize = 'cover';
    backgroundStyle.backgroundPosition = 'center';
  } else if (config.layout?.backgroundPattern) {
    const pattern = getBackgroundPattern(config.layout.backgroundPattern, '#e5e7eb');
    if (pattern) {
      backgroundStyle.backgroundImage = pattern;
      backgroundStyle.backgroundSize = config.layout.backgroundPattern === 'grid' ? '20px 20px' : 'auto';
    }
  }

  // Apply overlay if background exists
  if ((config.layout?.backgroundImage || config.layout?.backgroundPattern) && 
      config.layout?.backgroundOverlay?.enabled) {
    const overlayColor = config.layout.backgroundOverlay.color || 'rgba(0, 0, 0, 0.3)';
    const overlayOpacity = config.layout.backgroundOverlay.opacity ?? 0.5;
    backgroundStyle.backgroundColor = overlayColor;
    backgroundStyle.opacity = overlayOpacity;
  }

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
    <div 
      className={`cta-view ${embedded ? 'embedded' : ''}`} 
      style={{
        ...themeStyle,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'auto',
        ...backgroundStyle,
      }}
    >
      <div 
        className={`${layoutClass} ${positionClass}`}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          gap: config.layout?.componentGap ? `${config.layout.componentGap}px` : 'var(--cta-component-gap, 16px)',
        }}
      >
        {/* Render all CTA components with flexible layout support */}
        {sortedComponents.map((component) =>
          renderCTAComponent(component, config, component.id)
        )}

        {/* Button Group with style support */}
        {config.primaryButton && (
          <CTAButtonGroup
            primaryButton={config.primaryButton}
            secondaryButton={config.secondaryButton}
            onPrimaryClick={handlePrimaryClick}
            onSecondaryClick={handleSecondaryClick}
            layout={config.layout?.style === 'sidebar' ? 'vertical' : 'vertical'}
            componentStyle={config.primaryButton.style}
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
