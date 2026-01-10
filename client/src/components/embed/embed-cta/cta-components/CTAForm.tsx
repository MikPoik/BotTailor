import React from 'react';
import { CTAComponent } from '@shared/schema';
import { applyComponentStyle } from '../style-utils';

interface CTAFormProps {
  component: CTAComponent;
  onSubmit?: (data: any) => void;
  config?: any;
}

/**
 * CTAForm - Form component for CTA
 * 
 * Placeholder for future form submission support.
 * Can be extended to collect user data in CTA stage.
 * 
 * Styling via component.style:
 * - display, flexDirection, gap for form layout
 * - backgroundColor, textColor for theming
 * - padding, margin for spacing
 */
export const CTAForm: React.FC<CTAFormProps> = ({ component }) => {
  const componentStyle = applyComponentStyle(component.style);

  if (!component.visible) return null;

  // Placeholder for form implementation
  return (
    <div className="cta-form" style={componentStyle}>
      <p style={{ textAlign: 'center', color: '#999', fontSize: '14px' }}>
        Form component - Coming soon
      </p>
    </div>
  );
};

export default CTAForm;
