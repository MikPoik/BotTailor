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

  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    console.debug('[CTAView] mount', { embedded, components: config.components?.length });

    // MutationObserver to detect DOM-level changes that could cause flash
    const el = containerRef.current;
    if (el) {
      const logMutation = (mut: MutationRecord) => {
        try {
          const info: any = {
            type: mut.type,
            target: (mut.target as HTMLElement)?.id || (mut.target as HTMLElement)?.className || mut.target.nodeName,
            attributeName: mut.attributeName,
            addedNodes: mut.addedNodes ? Array.from(mut.addedNodes).map(n => (n as HTMLElement).nodeName + (n as HTMLElement && (n as HTMLElement).className ? ' ' + (n as HTMLElement).className : '')) : [],
            removedNodes: mut.removedNodes ? Array.from(mut.removedNodes).map(n => (n as HTMLElement).nodeName) : [],
          };
          console.debug('[CTAView][mutation]', info);
        } catch (e) {
          console.debug('[CTAView][mutation] error reading mutation', e);
        }
      };

      const observer = new MutationObserver((mutations) => {
        for (const m of mutations) logMutation(m);

        // Also log a lightweight snapshot of computed style changes
        try {
          const cs = window.getComputedStyle(el);
          console.debug('[CTAView][mutation] computed', { opacity: cs.opacity, display: cs.display, visibility: cs.visibility });
        } catch (e) {
          // ignore
        }
      });

      observer.observe(el, { attributes: true, childList: true, subtree: true, attributeOldValue: true });

      // Listen for postMessage events which might trigger rerenders from parent
      const onMessage = (ev: MessageEvent) => {
        console.debug('[CTAView][message] received', { data: ev.data, origin: ev.origin });
      };
      window.addEventListener('message', onMessage);

      return () => {
        observer.disconnect();
        window.removeEventListener('message', onMessage);
        console.debug('[CTAView] unmount');
      };
    }

    return () => {
      console.debug('[CTAView] unmount (no element)');
    };
  }, [embedded, config.components?.length]);

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

  // Get overlay opacity for rendering
  const overlayOpacity = (config.layout?.backgroundImage || config.layout?.backgroundPattern) && 
                         config.layout?.backgroundOverlay?.enabled
    ? config.layout.backgroundOverlay.opacity ?? 0.3
    : 0;

  // Theme CSS variables — set inline so they're available on first paint
  const themeStyle: React.CSSProperties & Record<string, string> = {};
  if (config.theme) {
    if (config.theme.primaryColor) themeStyle['--cta-primary'] = config.theme.primaryColor;
    if (config.theme.backgroundColor) themeStyle['--cta-bg'] = config.theme.backgroundColor;
    if (config.theme.textColor) themeStyle['--cta-text'] = config.theme.textColor;
  }

  // No global document-level mutation — theme vars are applied inline via `themeStyle`

  // Ensure animation runs only after client mount to avoid a flash on initial paint
  // For embedded CTAs we want instant visibility (no animation), so default to `true`
  const [animateIn, setAnimateIn] = React.useState<boolean>(embedded ? true : false);
  React.useEffect(() => {
    if (embedded) return; // already visible in embedded mode

    let id: number | undefined;
    if (typeof requestAnimationFrame !== 'undefined') {
      id = requestAnimationFrame(() => setAnimateIn(true));
      return () => {
        if (typeof cancelAnimationFrame !== 'undefined' && typeof id === 'number') {
          cancelAnimationFrame(id);
        }
      };
    } else {
      id = window.setTimeout(() => setAnimateIn(true), 0);
      return () => {
        if (typeof id === 'number') clearTimeout(id);
      };
    }
  }, [embedded]);


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
    return [...(config.components || [])].sort((a: any, b: any) => a.order - b.order);
  }, [config.components]);

  return (
    <div 
      className={`cta-view ${embedded ? 'embedded' : ''} ${animateIn && !embedded ? 'animate-in' : ''}`} 
      style={{
        ...themeStyle,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'auto',
        ...backgroundStyle,
        position: 'relative',
      }}
    >
      {/* Overlay layer for background images */}
      {overlayOpacity > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: config.layout?.backgroundOverlay?.color || 'rgba(0, 0, 0, 1)',
          opacity: overlayOpacity,
          pointerEvents: 'none',
          zIndex: 0,
        }} />
      )}
      
      <div 
        className={`${layoutClass} ${positionClass}`}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          gap: config.layout?.componentGap !== undefined ? `${config.layout.componentGap}px` : '16px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Render all CTA components with flexible layout support */}
        {sortedComponents.map((component: any) => {
          // Handle button_group component specially to wire up click handlers
          if (component.type === 'button_group' && component.props?.buttons) {
            return (
              <CTAButtonGroup
                key={component.id}
                primaryButton={component.props.buttons[0]}
                secondaryButton={component.props.buttons[1]}
                onPrimaryClick={() => {
                  const button = component.props.buttons?.[0];
                  if (button?.action === 'message' && button.predefinedMessage) {
                    onPrimaryButtonClick?.(button.predefinedMessage);
                  } else if (button?.action === 'link' && button.url) {
                    window.open(button.url, '_blank');
                  }
                }}
                onSecondaryClick={() => {
                  const button = component.props.buttons?.[1];
                  if (button?.action === 'close') {
                    onClose?.();
                  } else if (button?.action === 'link' && button.url) {
                    window.open(button.url, '_blank');
                  } else if (button?.action === 'message' && button.predefinedMessage) {
                    onSecondaryButtonClick?.(button.predefinedMessage);
                  } else {
                    onSecondaryButtonClick?.();
                  }
                }}
                layout={config.layout?.style === 'sidebar' ? 'vertical' : 'vertical'}
                componentStyle={component.style}
              />
            );
          }
          
          return renderCTAComponent(component, config, component.id);
        })}

        {/* Legacy: Button Group for backward compatibility (if primaryButton still exists) */}
        {config.primaryButton && !sortedComponents.some((c: any) => c.type === 'button_group') && (
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
