/**
 * ComponentListPanel Component
 * Left sidebar showing all CTA components with add/delete/reorder controls
 */

import React, { useState } from 'react';
import { CTAComponent, CTAConfig } from '@shared/schema';
import { EditorActions } from './types';
import { getComponentMetadata, getAllComponentTypes } from './component-metadata';
import { Plus, Trash2, Copy, Eye, EyeOff, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContainerSettings } from './ContainerSettings';

interface ComponentListPanelProps {
  components: CTAComponent[];
  selectedId: string | null;
  config: CTAConfig;
  actions: EditorActions;
}

export const ComponentListPanel: React.FC<ComponentListPanelProps> = ({
  components,
  selectedId,
  config,
  actions,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [containerSettingsExpanded, setContainerSettingsExpanded] = useState(false);

  const handleAddComponent = (type: CTAComponent['type']) => {
    actions.addComponent(type);
    setShowAddMenu(false);
  };

  return (
    <div style={{
      width: '280px',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fafafa',
    }}>
      {/* Iframe Container Settings */}
      <div style={{
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#fff',
      }}>
        <button
          type="button"
          onClick={() => setContainerSettingsExpanded(!containerSettingsExpanded)}
          style={{
            width: '100%',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            color: '#374151',
          }}
        >
          <span>⚙️ Iframe Container Settings</span>
          {containerSettingsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        
        {containerSettingsExpanded && (
          <div style={{
            padding: '0 16px 16px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}>
            <ContainerSettings
              config={config}
              onChange={(newConfig) => actions.updateConfig(newConfig)}
            />
          </div>
        )}
      </div>

      {/* Component List Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#fff',
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
          Components
        </h3>
        
        {/* Add Component Button */}
        <div style={{ position: 'relative' }}>
          <Button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
            }}
            variant="outline"
            size="sm"
          >
            <Plus size={14} />
            Add Component
          </Button>
          
          {/* Dropdown Menu */}
          {showAddMenu && (
            <>
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 40,
                }}
                onClick={() => setShowAddMenu(false)}
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                zIndex: 50,
                maxHeight: '300px',
                overflowY: 'auto',
              }}>
                {getAllComponentTypes().map((metadata) => (
                  <button
                    key={metadata.type}
                    type="button"
                    onClick={() => handleAddComponent(metadata.type)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{metadata.icon}</span>
                    <div>
                      <div style={{ fontWeight: 500 }}>{metadata.label}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280' }}>
                        {metadata.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Component List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
      }}>
        {components.length === 0 ? (
          <div style={{
            padding: '24px 12px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '13px',
          }}>
            No components yet.
            <br />
            Click "Add Component" to start.
          </div>
        ) : (
          components.map((component, index) => {
            const metadata = getComponentMetadata(component.type);
            const isSelected = component.id === selectedId;
            const isVisible = component.visible !== false;
            
            return (
              <div
                key={component.id}
                style={{
                  marginBottom: '6px',
                  padding: '10px',
                  backgroundColor: isSelected ? '#eff6ff' : '#fff',
                  border: `1px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  opacity: isVisible ? 1 : 0.5,
                }}
                onClick={() => actions.selectComponent(component.id)}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}>
                  <span style={{ fontSize: '16px' }}>{metadata?.icon || '📦'}</span>
                  <span style={{
                    flex: 1,
                    fontSize: '13px',
                    fontWeight: 500,
                    color: isVisible ? '#1f2937' : '#9ca3af',
                  }}>
                    {metadata?.label || component.type}
                  </span>
                  
                  {/* Visibility Toggle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.toggleComponentVisibility(component.id);
                    }}
                    style={{
                      padding: '4px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      color: '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={isVisible ? 'Hide component' : 'Show component'}
                  >
                    {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>

                {/* Action Buttons */}
                {isSelected && (
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    paddingTop: '8px',
                    borderTop: '1px solid #e5e7eb',
                  }}>
                    {/* Move Up */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.moveComponent(component.id, 'up');
                      }}
                      disabled={index === 0}
                      style={{
                        flex: 1,
                        padding: '6px',
                        fontSize: '11px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        opacity: index === 0 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                      title="Move up"
                    >
                      <ChevronUp size={12} />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.moveComponent(component.id, 'down');
                      }}
                      disabled={index === components.length - 1}
                      style={{
                        flex: 1,
                        padding: '6px',
                        fontSize: '11px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        cursor: index === components.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: index === components.length - 1 ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                      title="Move down"
                    >
                      <ChevronDown size={12} />
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.duplicateComponent(component.id);
                      }}
                      style={{
                        flex: 1,
                        padding: '6px',
                        fontSize: '11px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                      title="Duplicate"
                    >
                      <Copy size={12} />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${metadata?.label || component.type}?`)) {
                          actions.removeComponent(component.id);
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '6px',
                        fontSize: '11px',
                        border: '1px solid #fca5a5',
                        borderRadius: '4px',
                        backgroundColor: '#fff',
                        color: '#dc2626',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                      }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
