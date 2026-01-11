/**
 * ArrayItemEditor Component
 * Generic editor for array items (features, buttons, etc.)
 */

import React, { useState } from 'react';
import { PropertyFieldDefinition } from '../types';
import { PropertyFieldRenderer } from './PropertyFieldRenderer';
import { Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

interface ArrayItemEditorProps {
  items: any[];
  onChange: (items: any[]) => void;
  itemSchema: Record<string, PropertyFieldDefinition>;
  itemLabel: string;
  addButtonText?: string;
}

export const ArrayItemEditor: React.FC<ArrayItemEditorProps> = ({
  items = [],
  onChange,
  itemSchema,
  itemLabel,
  addButtonText = 'Add Item',
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));

  const handleAddItem = () => {
    const newItem: any = {};
    // Initialize with defaults or empty values
    Object.entries(itemSchema).forEach(([key, def]) => {
      if (def.type === 'text' || def.type === 'textarea') {
        newItem[key] = '';
      } else if (def.type === 'number') {
        newItem[key] = def.min || 0;
      } else if (def.type === 'toggle') {
        newItem[key] = false;
      } else if (def.type === 'select' && def.options) {
        newItem[key] = def.options[0]?.value || '';
      }
    });
    
    onChange([...items, newItem]);
    setExpandedItems(new Set(Array.from(expandedItems).concat([items.length])));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
    // Update expanded items
    const newExpanded = new Set<number>();
    expandedItems.forEach(i => {
      if (i < index) newExpanded.add(i);
      if (i > index) newExpanded.add(i - 1);
    });
    setExpandedItems(newExpanded);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    onChange(newItems);

    // Update expanded state
    const newExpanded = new Set<number>();
    expandedItems.forEach(i => {
      if (i === index) newExpanded.add(newIndex);
      else if (i === newIndex) newExpanded.add(index);
      else newExpanded.add(i);
    });
    setExpandedItems(newExpanded);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(Array.from(expandedItems));
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  // Get display text for item
  const getItemDisplayText = (item: any, index: number): string => {
    // Try common fields for display
    if (item.text) return item.text;
    if (item.title) return item.title;
    if (item.name) return item.name;
    return `${itemLabel} ${index + 1}`;
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
          {itemLabel}s
        </label>
        <button
          type="button"
          onClick={handleAddItem}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: 500,
            backgroundColor: '#f3f4f6',
            border: '1px dashed #9ca3af',
            borderRadius: '6px',
            cursor: 'pointer',
            color: '#4b5563',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e5e7eb';
            e.currentTarget.style.borderColor = '#6b7280';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.borderColor = '#9ca3af';
          }}
        >
          + {addButtonText}
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{
          padding: '24px',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: '13px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          border: '1px dashed #e5e7eb',
        }}>
          No {itemLabel.toLowerCase()}s yet. Click "{addButtonText}" to add one.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item, index) => {
            const isExpanded = expandedItems.has(index);
            const displayText = getItemDisplayText(item, index);

            return (
              <div
                key={index}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                  overflow: 'hidden',
                }}
              >
                {/* Item Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 12px',
                    backgroundColor: isExpanded ? '#f9fafb' : '#fff',
                    borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleExpanded(index)}
                >
                  <GripVertical size={14} style={{ color: '#9ca3af', marginRight: '8px' }} />
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}>
                    {displayText}
                  </span>
                  
                  <div style={{ display: 'flex', gap: '4px', marginRight: '8px' }} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleMoveItem(index, 'up')}
                      disabled={index === 0}
                      style={{
                        padding: '4px',
                        backgroundColor: 'transparent',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        opacity: index === 0 ? 0.5 : 1,
                      }}
                      title="Move up"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveItem(index, 'down')}
                      disabled={index === items.length - 1}
                      style={{
                        padding: '4px',
                        backgroundColor: 'transparent',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: index === items.length - 1 ? 'not-allowed' : 'pointer',
                        opacity: index === items.length - 1 ? 0.5 : 1,
                      }}
                      title="Move down"
                    >
                      <ChevronDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete ${displayText}?`)) {
                          handleRemoveItem(index);
                        }
                      }}
                      style={{
                        padding: '4px',
                        backgroundColor: 'transparent',
                        border: '1px solid #fca5a5',
                        borderRadius: '4px',
                        color: '#dc2626',
                        cursor: 'pointer',
                      }}
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {/* Item Fields */}
                {isExpanded && (
                  <div style={{ padding: '16px' }}>
                    {Object.entries(itemSchema).map(([fieldKey, fieldDef]) => (
                      <PropertyFieldRenderer
                        key={fieldKey}
                        definition={fieldDef}
                        value={item[fieldKey]}
                        onChange={(value) => handleUpdateItem(index, fieldKey, value)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
