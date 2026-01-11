/**
 * ColorField Component
 * Color picker with hex input for component styling
 */

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  error?: string;
  allowClear?: boolean;
}

export const ColorField: React.FC<ColorFieldProps> = ({
  label,
  value,
  onChange,
  description,
  error,
  allowClear = true,
}) => {
  const [localValue, setLocalValue] = useState(value || '#000000');
  const [hexInput, setHexInput] = useState(value || '#000000');

  useEffect(() => {
    const normalized = value || '#000000';
    setLocalValue(normalized);
    setHexInput(normalized);
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setLocalValue(newColor);
    setHexInput(newColor);
    onChange(newColor);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newHex = e.target.value;
    
    // Auto-add # if missing
    if (newHex && !newHex.startsWith('#')) {
      newHex = '#' + newHex;
    }
    
    setHexInput(newHex);
  };

  const handleHexBlur = () => {
    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(hexInput)) {
      setLocalValue(hexInput);
      onChange(hexInput);
    } else {
      // Revert to last valid value
      setHexInput(localValue);
    }
  };

  const handleClear = () => {
    onChange('');
    setLocalValue('#000000');
    setHexInput('#000000');
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <Label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
        {label}
      </Label>
      
      {description && (
        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
          {description}
        </p>
      )}
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {/* Color picker */}
        <input
          type="color"
          value={localValue}
          onChange={handleColorChange}
          style={{
            width: '48px',
            height: '38px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            padding: '2px',
          }}
        />
        
        {/* Hex input */}
        <Input
          value={hexInput}
          onChange={handleHexChange}
          onBlur={handleHexBlur}
          placeholder="#000000"
          maxLength={7}
          style={{
            flex: 1,
            fontFamily: 'monospace',
            fontSize: '13px',
            borderColor: error ? '#ef4444' : undefined,
          }}
        />
        
        {/* Clear button */}
        {allowClear && value && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              color: '#6b7280',
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Reset
          </button>
        )}
      </div>
      
      {error && (
        <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
          {error}
        </p>
      )}
    </div>
  );
};
