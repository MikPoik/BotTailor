/**
 * ToggleField Component
 * Boolean toggle switch for component properties
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface ToggleFieldProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  error?: string;
}

export const ToggleField: React.FC<ToggleFieldProps> = ({
  label,
  value,
  onChange,
  description,
  error,
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Checkbox
          checked={value}
          onCheckedChange={(checked) => onChange(checked as boolean)}
          id={`toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
        <Label
          htmlFor={`toggle-${label.toLowerCase().replace(/\s+/g, '-')}`}
          style={{ fontSize: '13px', fontWeight: 500, cursor: 'pointer', marginBottom: 0 }}
        >
          {label}
        </Label>
      </div>
      
      {description && (
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', marginLeft: '28px' }}>
          {description}
        </p>
      )}
      
      {error && (
        <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', marginLeft: '28px' }}>
          {error}
        </p>
      )}
    </div>
  );
};
