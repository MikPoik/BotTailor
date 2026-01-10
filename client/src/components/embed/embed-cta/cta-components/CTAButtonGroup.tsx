import React from 'react';
import { CTAButton, CTAConfig } from '@shared/schema';

type SecondaryButtonConfig = CTAConfig['secondaryButton'] | CTAButton;

interface CTAButtonGroupProps {
  primaryButton: CTAButton;
  secondaryButton?: SecondaryButtonConfig;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  layout?: 'vertical' | 'horizontal';
  config?: CTAConfig;
}

/**
 * CTAButtonGroup - Displays primary and optional secondary button
 * 
 * Handles button clicks and styling
 */
export const CTAButtonGroup: React.FC<CTAButtonGroupProps> = ({
  primaryButton,
  secondaryButton,
  onPrimaryClick,
  onSecondaryClick,
  layout = 'vertical',
}) => {
  const buttonGroupClass = `cta-button-group ${layout === 'horizontal' ? 'horizontal' : ''}`;

  return (
    <div className={buttonGroupClass}>
      {/* Primary Button */}
      <button
        className={`cta-button ${primaryButton.variant || 'solid'}`}
        onClick={onPrimaryClick}
        title={primaryButton.actionLabel}
        aria-label={primaryButton.actionLabel || primaryButton.text}
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
        >
          {secondaryButton.text}
        </button>
      )}
    </div>
  );
};

export default CTAButtonGroup;
