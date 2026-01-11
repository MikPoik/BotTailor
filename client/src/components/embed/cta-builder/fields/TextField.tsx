/**
 * TextField Component
 * Text input field for component properties
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  error?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  description,
  placeholder,
  required,
  maxLength,
  error,
}) => {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
  };

  const handleBlur = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const charCount = localValue.length;
  const showCharCount = maxLength && maxLength > 0;

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
      
      <Input
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        style={{
          borderColor: error ? '#ef4444' : undefined,
        }}
      />
      
      {showCharCount && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          fontSize: '11px',
          color: charCount > maxLength! * 0.9 ? '#ef4444' : '#9ca3af',
          marginTop: '4px',
        }}>
          {charCount} / {maxLength}
        </div>
      )}
      
      {error && (
        <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
          {error}
        </p>
      )}
    </div>
  );
};
