import React from 'react';
import { CTAButton, CTAConfig, ComponentStyle } from '@shared/schema';
import { applyComponentStyle } from '../style-utils';

type SecondaryButtonConfig = CTAConfig['secondaryButton'] | CTAButton;

interface CTAButtonGroupProps {
  primaryButton: CTAButton;
  secondaryButton?: SecondaryButtonConfig;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  layout?: 'vertical' | 'horizontal';
  config?: CTAConfig;
  componentStyle?: ComponentStyle;
}

/**
 * CTAButtonGroup - Displays primary and optional secondary button
 * 
 * Handles button clicks and styling
 * 
 * Styling via componentStyle:
 * - display: 'flex', 'grid', etc.
 * - flexDirection: 'row', 'column' for button arrangement
 * - gap: Control spacing between buttons
 * - justifyContent: 'center', 'space-between', etc.
 * - backgroundColor: Background color (theme override)
 * - textColor: Text color (theme override)
 * - padding, margin: Component spacing
 */
export const CTAButtonGroup: React.FC<CTAButtonGroupProps> = ({
  primaryButton,
  secondaryButton,
  onPrimaryClick,
  onSecondaryClick,
  layout = 'vertical',
  componentStyle,
}) => {
  const customStyles = applyComponentStyle(componentStyle);
  const buttonGroupClass = `cta-button-group ${layout === 'horizontal' ? 'horizontal' : ''}`;

  return (
    <div className={buttonGroupClass} style={{ 
      justifyContent: 'center', 
      alignItems: 'center',
      gap: '16px',
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
      ...customStyles 
    }}>
      {/* Primary Button */}
      <button
        className={`cta-button ${primaryButton.variant || 'solid'}`}
        onClick={onPrimaryClick}
        title={primaryButton.actionLabel}
        aria-label={primaryButton.actionLabel || primaryButton.text}
        style={{
          backgroundColor: '#000',
          color: '#fff',
          borderRadius: '9999px',
          ...applyComponentStyle(primaryButton.style)
        }}
      >
        {primaryButton.text}
      </button>

      {/* Secondary Button (optional) */}
      {secondaryButton && (
        <button
          className={`cta-button ${('variant' in secondaryButton ? (secondaryButton.variant || 'outline') : 'outline')}`}
          onClick={onSecondaryClick}
          title={('actionLabel' in secondaryButton ? secondaryButton.actionLabel : undefined) as string}
          aria-label={(('actionLabel' in secondaryButton ? secondaryButton.actionLabel : secondaryButton.text) as string) || secondaryButton.text}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            borderRadius: '9999px',
            ...applyComponentStyle(('style' in secondaryButton ? secondaryButton.style : undefined))
          }}
        >
          {secondaryButton.text}
        </button>
      )}
    </div>
  );
};

export default CTAButtonGroup;
