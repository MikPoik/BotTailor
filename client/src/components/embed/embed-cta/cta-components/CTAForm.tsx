import React from 'react';
import { CTAComponent } from '@shared/schema';

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
 */
export const CTAForm: React.FC<CTAFormProps> = ({ component }) => {
  if (!component.visible) return null;

  // Placeholder for form implementation
  return (
    <div className="cta-form">
      <p style={{ textAlign: 'center', color: '#999', fontSize: '14px' }}>
        Form component - Coming soon
      </p>
    </div>
  );
};

export default CTAForm;
