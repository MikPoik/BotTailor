/**
 * TextareaField Component
 * Multiline text input for longer content
 */

import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  rows?: number;
  error?: string;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  value,
  onChange,
  description,
  placeholder,
  required,
  maxLength,
  rows = 3,
  error,
}) => {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      
      <Textarea
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        style={{
          borderColor: error ? '#ef4444' : undefined,
          resize: 'vertical',
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
