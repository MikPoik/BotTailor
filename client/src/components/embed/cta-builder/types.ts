/**
 * CTA Visual Editor Types
 * Type definitions for the visual component editor system
 */

import { CTAComponent, CTAConfig, ComponentStyle } from '@shared/schema';

// ============================================
// Property Field Types
// ============================================

export type PropertyFieldType = 
  | 'text'
  | 'textarea'
  | 'color'
  | 'select'
  | 'number'
  | 'toggle'
  | 'array'
  | 'object';

export interface PropertyFieldDefinition {
  type: PropertyFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  
  // Type-specific options
  min?: number;
  max?: number;
  step?: number;
  maxLength?: number;
  options?: Array<{ value: string | number; label: string }>;
  
  // Validation
  validation?: (value: any) => string | null;
  
  // Nested properties (for objects/arrays)
  properties?: Record<string, PropertyFieldDefinition>;
}

// ============================================
// Component Property Schemas
// ============================================

export type ComponentPropertyCategory = 'content' | 'appearance' | 'layout' | 'advanced';

export interface ComponentPropertyGroup {
  category: ComponentPropertyCategory;
  label: string;
  properties: Record<string, PropertyFieldDefinition>;
}

export interface ComponentTypeMetadata {
  type: CTAComponent['type'];
  label: string;
  icon: string;
  description: string;
  propertyGroups: ComponentPropertyGroup[];
  defaultProps: Partial<CTAComponent['props']>;
  defaultStyle?: Partial<ComponentStyle>;
}

// ============================================
// Editor State
// ============================================

export interface EditorState {
  config: CTAConfig;
  selectedComponentId: string | null;
  expandedGroups: Set<ComponentPropertyCategory>;
  validationErrors: Record<string, string>;
}

export interface EditorActions {
  selectComponent: (id: string | null) => void;
  updateComponentProperty: (id: string, path: string, value: any) => void;
  updateComponentStyle: (id: string, styleKey: keyof ComponentStyle, value: any) => void;
  addComponent: (type: CTAComponent['type'], afterId?: string) => void;
  removeComponent: (id: string) => void;
  duplicateComponent: (id: string) => void;
  moveComponent: (id: string, direction: 'up' | 'down') => void;
  toggleComponentVisibility: (id: string) => void;
  toggleGroup: (category: ComponentPropertyCategory) => void;
  validateProperty: (id: string, path: string, value: any) => string | null;
  updateConfig: (config: CTAConfig) => void; // For updating entire config (container settings)
}

// ============================================
// Array Item Types (for nested editors)
// ============================================

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  style?: Partial<ComponentStyle>;
}

export interface ButtonItem {
  id: string;
  text: string;
  variant?: 'solid' | 'outline' | 'ghost';
  action?: string;
  url?: string;
  predefinedMessage?: string;
  style?: Partial<ComponentStyle>;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  action: string;
  actionType?: 'message' | 'survey' | 'custom';
  surveyId?: number;
  itemStyle?: 'filled' | 'outlined';
}

// ============================================
// Component Type Guards
// ============================================

export function isHeaderComponent(component: CTAComponent): boolean {
  return component.type === 'header';
}

export function isFeatureListComponent(component: CTAComponent): boolean {
  return component.type === 'feature_list';
}

export function isDescriptionComponent(component: CTAComponent): boolean {
  return component.type === 'description';
}

export function isButtonGroupComponent(component: CTAComponent): boolean {
  return component.type === 'button_group';
}

export function isBadgeComponent(component: CTAComponent): boolean {
  return component.type === 'badge';
}

export function isDividerComponent(component: CTAComponent): boolean {
  return component.type === 'divider';
}

export function isRichTextComponent(component: CTAComponent): boolean {
  return component.type === 'richtext';
}

export function isCustomHTMLComponent(component: CTAComponent): boolean {
  return component.type === 'custom_html';
}

export function isContainerComponent(component: CTAComponent): boolean {
  return component.type === 'container';
}

export function isFormComponent(component: CTAComponent): boolean {
  return component.type === 'form';
}

// ============================================
// Utility Types
// ============================================

export type PropertyPath = string; // e.g., "props.title" or "style.textColor"

export interface ValidationError {
  path: PropertyPath;
  message: string;
}

export interface ComponentUpdate {
  componentId: string;
  path: PropertyPath;
  value: any;
}
