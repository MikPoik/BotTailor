/**
 * PropertyFieldRenderer Component
 * Dynamically renders the appropriate field component based on property definition
 */

import React from 'react';
import { PropertyFieldDefinition } from '../types';
import { TextField } from './TextField';
import { TextareaField } from './TextareaField';
import { ColorField } from './ColorField';
import { SelectField } from './SelectField';
import { NumberField } from './NumberField';
import { ToggleField } from './ToggleField';
import { ArrayItemEditor } from './ArrayItemEditor';

interface PropertyFieldRendererProps {
  definition: PropertyFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export const PropertyFieldRenderer: React.FC<PropertyFieldRendererProps> = ({
  definition,
  value,
  onChange,
  error,
}) => {
  // Handle different field types
  switch (definition.type) {
    case 'text':
      return (
        <TextField
          label={definition.label}
          value={value || ''}
          onChange={onChange}
          description={definition.description}
          placeholder={definition.placeholder}
          required={definition.required}
          maxLength={definition.maxLength}
          error={error}
        />
      );

    case 'textarea':
      return (
        <TextareaField
          label={definition.label}
          value={value || ''}
          onChange={onChange}
          description={definition.description}
          placeholder={definition.placeholder}
          required={definition.required}
          maxLength={definition.maxLength}
          error={error}
        />
      );

    case 'color':
      return (
        <ColorField
          label={definition.label}
          value={value || ''}
          onChange={onChange}
          description={definition.description}
          error={error}
          allowClear={!definition.required}
        />
      );

    case 'select':
      if (!definition.options) {
        console.error('Select field missing options:', definition.label);
        return null;
      }
      return (
        <SelectField
          label={definition.label}
          value={value || definition.options[0]?.value || ''}
          onChange={onChange}
          options={definition.options}
          description={definition.description}
          required={definition.required}
          error={error}
        />
      );

    case 'number':
      return (
        <NumberField
          label={definition.label}
          value={value !== undefined ? value : 0}
          onChange={onChange}
          description={definition.description}
          required={definition.required}
          min={definition.min}
          max={definition.max}
          step={definition.step}
          error={error}
        />
      );

    case 'toggle':
      return (
        <ToggleField
          label={definition.label}
          value={value !== undefined ? value : false}
          onChange={onChange}
          description={definition.description}
          error={error}
        />
      );

    case 'array':
      // Array fields use dedicated array editor
      if (!definition.properties) {
        console.error('Array field missing properties schema:', definition.label);
        return null;
      }
      return (
        <ArrayItemEditor
          items={value || []}
          onChange={onChange}
          itemSchema={definition.properties}
          itemLabel={definition.label.replace(/s$/, '')} // Remove trailing 's' for singular
          addButtonText={`Add ${definition.label.replace(/s$/, '')}`}
        />
      );

    case 'object':
      // Object fields are handled separately by component-specific editors
      return (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Object editing is handled by the component editor
          </p>
        </div>
      );

    default:
      console.warn('Unknown field type:', definition.type);
      return null;
  }
};
