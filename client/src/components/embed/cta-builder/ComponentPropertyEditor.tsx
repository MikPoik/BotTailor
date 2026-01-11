/**
 * ComponentPropertyEditor Component
 * Right panel that shows editable properties for the selected component
 */

import React from 'react';
import { CTAComponent, CTAConfig } from '@shared/schema';
import { EditorActions, ComponentPropertyCategory } from './types';
import { getComponentMetadata } from './component-metadata';
import { PropertyFieldRenderer } from './fields/PropertyFieldRenderer';
import { ContainerSettings } from './ContainerSettings';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ComponentPropertyEditorProps {
  component: CTAComponent | undefined;
  config: CTAConfig;
  actions: EditorActions;
  expandedGroups: Set<ComponentPropertyCategory>;
}

export const ComponentPropertyEditor: React.FC<ComponentPropertyEditorProps> = ({
  component,
  config,
  actions,
  expandedGroups,
}) => {
  // Show container settings when no component is selected
  if (!component) {
    return (
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        backgroundColor: '#f9fafb',
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: '16px',
          color: '#111827',
        }}>
          Container Settings
        </div>
        
        <ContainerSettings
          config={config}
          onChange={(newConfig) => {
            actions.updateConfig(newConfig);
          }}
        />
      </div>
    );
  }

  const metadata = getComponentMetadata(component.type);

  if (!metadata) {
    return (
      <div style={{
        flex: 1,
        padding: '24px',
        color: '#ef4444',
      }}>
        Unknown component type: {component.type}
      </div>
    );
  }

  // Helper to get nested property value
  const getPropertyValue = (path: string): any => {
    const pathParts = path.split('.');
    let current: any = component;
    
    for (const part of pathParts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  };

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      padding: '24px',
      backgroundColor: '#fff',
    }}>
      {/* Component Header */}
      <div style={{ marginBottom: '32px', paddingBottom: '16px', borderBottom: '2px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <span style={{ fontSize: '32px' }}>{metadata.icon}</span>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
              {metadata.label}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
              {metadata.description}
            </p>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>
          ID: {component.id}
        </div>
      </div>

      {/* Property Groups */}
      {metadata.propertyGroups.map((group) => {
        const isExpanded = expandedGroups.has(group.category);
        const propertyCount = Object.keys(group.properties).length;

        return (
          <div key={group.category} style={{ marginBottom: '24px' }}>
            {/* Group Header */}
            <button
              type="button"
              onClick={() => actions.toggleGroup(group.category)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                marginBottom: isExpanded ? '16px' : 0,
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span style={{ flex: 1, fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {group.label}
              </span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
              </span>
            </button>

            {/* Group Properties */}
            {isExpanded && (
              <div style={{
                padding: '16px',
                backgroundColor: '#fafafa',
                border: '1px solid #e5e7eb',
                borderTop: 'none',
                borderRadius: '0 0 6px 6px',
                marginTop: '-6px',
              }}>
                {Object.entries(group.properties).map(([key, definition]) => {
                  const basePath = group.category === 'appearance' || group.category === 'layout' || group.category === 'advanced'
                    ? 'style'
                    : 'props';
                  const fullPath = `${basePath}.${key}`;
                  const value = getPropertyValue(fullPath);

                  return (
                    <PropertyFieldRenderer
                      key={key}
                      definition={definition}
                      value={value}
                      onChange={(newValue) => {
                        actions.updateComponentProperty(component.id, fullPath, newValue);
                      }}
                      error={undefined}
                    />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Visibility Toggle */}
      <div style={{
        marginTop: '32px',
        padding: '16px',
        backgroundColor: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '6px',
      }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
        }}>
          <input
            type="checkbox"
            checked={component.visible !== false}
            onChange={(e) => actions.toggleComponentVisibility(component.id)}
            style={{ cursor: 'pointer' }}
          />
          Component is visible in preview
        </label>
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#92400e' }}>
          Hidden components won't appear in the final CTA but can be edited here.
        </p>
      </div>
    </div>
  );
};
