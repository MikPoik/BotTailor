/**
 * useComponentEditor Hook
 * State management for CTA visual component editor
 */

import { useState, useCallback } from 'react';
import { CTAConfig, CTAComponent, ComponentStyle, CTAConfigSchema } from '@shared/schema';
import { EditorState, EditorActions, ComponentPropertyCategory, PropertyPath } from './types';
import { v4 as uuidv4 } from 'uuid';

interface UseComponentEditorOptions {
  initialConfig: CTAConfig;
  onChange?: (config: CTAConfig) => void;
}

export function useComponentEditor({ initialConfig, onChange }: UseComponentEditorOptions) {
  const [state, setState] = useState<EditorState>({
    config: initialConfig,
    selectedComponentId: initialConfig.components?.[0]?.id || null,
    expandedGroups: new Set<ComponentPropertyCategory>(['content', 'appearance']),
    validationErrors: {},
  });

  // Helper to update config and notify parent
  const updateConfig = useCallback((newConfig: CTAConfig) => {
    try {
      const validated = CTAConfigSchema.parse(newConfig);
      setState(prev => ({ ...prev, config: validated, validationErrors: {} }));
      onChange?.(validated);
    } catch (error: any) {
      console.error('Config validation error:', error);
      // Still update state but keep validation errors
      setState(prev => ({ 
        ...prev, 
        config: newConfig,
        validationErrors: { _root: error.message }
      }));
    }
  }, [onChange]);

  // Select a component
  const selectComponent = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, selectedComponentId: id }));
  }, []);

  // Update a component property by path (e.g., "props.title" or "style.textColor")
  const updateComponentProperty = useCallback((id: string, path: PropertyPath, value: any) => {
    setState(prev => {
      const newConfig = { ...prev.config };
      const componentIndex = newConfig.components.findIndex(c => c.id === id);
      
      if (componentIndex === -1) return prev;

      const component = { ...newConfig.components[componentIndex] };
      const pathParts = path.split('.');
      
      // Navigate to the property
      let current: any = component;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = {};
        } else {
          current[part] = { ...current[part] };
        }
        current = current[part];
      }
      
      // Set the value
      const lastPart = pathParts[pathParts.length - 1];
      current[lastPart] = value;
      
      // Update the component
      newConfig.components = [...newConfig.components];
      newConfig.components[componentIndex] = component;
      
      updateConfig(newConfig);
      return { ...prev, config: newConfig };
    });
  }, [updateConfig]);

  // Update component style property
  const updateComponentStyle = useCallback((id: string, styleKey: keyof ComponentStyle, value: any) => {
    updateComponentProperty(id, `style.${styleKey}`, value);
  }, [updateComponentProperty]);

  // Add a new component
  const addComponent = useCallback((type: CTAComponent['type'], afterId?: string) => {
    setState(prev => {
      const newConfig = { ...prev.config };
      const newComponent: CTAComponent = {
        id: `${type}_${uuidv4().slice(0, 8)}`,
        type,
        order: newConfig.components.length + 1,
        visible: true,
        props: {},
        style: {},
      };

      if (afterId) {
        const index = newConfig.components.findIndex(c => c.id === afterId);
        newConfig.components = [
          ...newConfig.components.slice(0, index + 1),
          newComponent,
          ...newConfig.components.slice(index + 1),
        ];
      } else {
        newConfig.components = [...newConfig.components, newComponent];
      }

      // Reorder components
      newConfig.components = newConfig.components.map((c, i) => ({ ...c, order: i + 1 }));

      updateConfig(newConfig);
      return { ...prev, config: newConfig, selectedComponentId: newComponent.id };
    });
  }, [updateConfig]);

  // Remove a component
  const removeComponent = useCallback((id: string) => {
    setState(prev => {
      const newConfig = { ...prev.config };
      newConfig.components = newConfig.components.filter(c => c.id !== id);
      
      // Reorder remaining components
      newConfig.components = newConfig.components.map((c, i) => ({ ...c, order: i + 1 }));

      const newSelectedId = prev.selectedComponentId === id 
        ? (newConfig.components[0]?.id || null)
        : prev.selectedComponentId;

      updateConfig(newConfig);
      return { ...prev, config: newConfig, selectedComponentId: newSelectedId };
    });
  }, [updateConfig]);

  // Duplicate a component
  const duplicateComponent = useCallback((id: string) => {
    setState(prev => {
      const newConfig = { ...prev.config };
      const componentIndex = newConfig.components.findIndex(c => c.id === id);
      
      if (componentIndex === -1) return prev;

      const original = newConfig.components[componentIndex];
      const duplicate: CTAComponent = {
        ...JSON.parse(JSON.stringify(original)),
        id: `${original.type}_${uuidv4().slice(0, 8)}`,
      };

      newConfig.components = [
        ...newConfig.components.slice(0, componentIndex + 1),
        duplicate,
        ...newConfig.components.slice(componentIndex + 1),
      ];

      // Reorder components
      newConfig.components = newConfig.components.map((c, i) => ({ ...c, order: i + 1 }));

      updateConfig(newConfig);
      return { ...prev, config: newConfig, selectedComponentId: duplicate.id };
    });
  }, [updateConfig]);

  // Move component up or down
  const moveComponent = useCallback((id: string, direction: 'up' | 'down') => {
    setState(prev => {
      const newConfig = { ...prev.config };
      const index = newConfig.components.findIndex(c => c.id === id);
      
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === newConfig.components.length - 1) return prev;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const components = [...newConfig.components];
      
      // Swap
      [components[index], components[newIndex]] = [components[newIndex], components[index]];
      
      // Reorder
      newConfig.components = components.map((c, i) => ({ ...c, order: i + 1 }));

      updateConfig(newConfig);
      return { ...prev, config: newConfig };
    });
  }, [updateConfig]);

  // Toggle component visibility
  const toggleComponentVisibility = useCallback((id: string) => {
    setState(prev => {
      const newConfig = { ...prev.config };
      const componentIndex = newConfig.components.findIndex(c => c.id === id);
      
      if (componentIndex === -1) return prev;

      newConfig.components = [...newConfig.components];
      newConfig.components[componentIndex] = {
        ...newConfig.components[componentIndex],
        visible: !newConfig.components[componentIndex].visible,
      };

      updateConfig(newConfig);
      return { ...prev, config: newConfig };
    });
  }, [updateConfig]);

  // Toggle property group expansion
  const toggleGroup = useCallback((category: ComponentPropertyCategory) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedGroups);
      if (newExpanded.has(category)) {
        newExpanded.delete(category);
      } else {
        newExpanded.add(category);
      }
      return { ...prev, expandedGroups: newExpanded };
    });
  }, []);

  // Validate a property value
  const validateProperty = useCallback((id: string, path: PropertyPath, value: any): string | null => {
    // Basic validation - extend as needed
    if (value === undefined || value === null || value === '') {
      return null; // Allow empty values (unless required)
    }
    
    // Type-specific validation
    if (path.includes('Color') && typeof value === 'string') {
      if (!/^#[0-9A-F]{6}$/i.test(value)) {
        return 'Invalid hex color format (use #RRGGBB)';
      }
    }
    
    return null;
  }, []);

  // Get currently selected component (safely handle missing config/components)
  const selectedComponent = state.config?.components?.find(
    c => c.id === state.selectedComponentId
  ) ?? null;

  const actions: EditorActions = {
    selectComponent,
    updateComponentProperty,
    updateComponentStyle,
    addComponent,
    removeComponent,
    duplicateComponent,
    moveComponent,
    toggleComponentVisibility,
    toggleGroup,
    validateProperty,
    updateConfig: (newConfig: CTAConfig) => {
      setState(prev => ({ ...prev, config: newConfig }));
      onChange?.(newConfig);
    },
  };

  return {
    state,
    actions,
    selectedComponent,
  };
}
