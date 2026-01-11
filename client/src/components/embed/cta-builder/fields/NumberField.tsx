/**
 * NumberField Component
 * Number input with min/max/step controls
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  onChange,
  description,
  required,
  min,
  max,
  step = 1,
  error,
}) => {
  const [localValue, setLocalValue] = useState(String(value || 0));

  useEffect(() => {
    setLocalValue(String(value || 0));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    let numValue = parseFloat(localValue);
    
    if (isNaN(numValue)) {
      numValue = value || 0;
    }
    
    // Apply min/max constraints
    if (min !== undefined && numValue < min) {
      numValue = min;
    }
    if (max !== undefined && numValue > max) {
      numValue = max;
    }
    
    setLocalValue(String(numValue));
    if (numValue !== value) {
      onChange(numValue);
    }
  };

  const handleIncrement = () => {
    const numValue = parseFloat(localValue) || 0;
    const newValue = numValue + step;
    if (max === undefined || newValue <= max) {
      setLocalValue(String(newValue));
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const numValue = parseFloat(localValue) || 0;
    const newValue = numValue - step;
    if (min === undefined || newValue >= min) {
      setLocalValue(String(newValue));
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
      
      <div style={{ display: 'flex', gap: '4px' }}>
        <Input
          type="number"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          style={{
            flex: 1,
            borderColor: error ? '#ef4444' : undefined,
          }}
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <button
            type="button"
            onClick={handleIncrement}
            disabled={max !== undefined && parseFloat(localValue) >= max}
            style={{
              padding: '2px 8px',
              fontSize: '12px',
              lineHeight: 1,
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
          >
            ▴
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            disabled={min !== undefined && parseFloat(localValue) <= min}
            style={{
              padding: '2px 8px',
              fontSize: '12px',
              lineHeight: 1,
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
          >
            ▾
          </button>
        </div>
      </div>
      
      {error && (
        <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
          {error}
        </p>
      )}
    </div>
  );
};
