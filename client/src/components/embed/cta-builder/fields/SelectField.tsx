/**
 * SelectField Component
 * Dropdown selector for predefined options
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SelectFieldProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options: Array<{ value: string | number; label: string }>;
  description?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  description,
  required,
  error,
  placeholder = 'Select an option...',
}) => {
  const handleValueChange = (newValue: string) => {
    // Try to convert back to number if original was number
    const firstOption = options[0]?.value;
    if (typeof firstOption === 'number') {
      onChange(parseFloat(newValue));
    } else {
      onChange(newValue);
    }
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <Label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
      </Label>
      
      {description && (
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
          {description}
        </p>
      )}
      
      <Select value={String(value)} onValueChange={handleValueChange}>
        <SelectTrigger style={{ borderColor: error ? '#ef4444' : undefined }}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {error && (
        <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
          {error}
        </p>
      )}
    </div>
  );
};
