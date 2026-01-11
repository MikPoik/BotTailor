/**
 * Component Property Metadata
 * Defines editable properties for each CTA component type
 */

import { ComponentTypeMetadata, ComponentPropertyGroup } from './types';

// ============================================
// Common Property Definitions
// ============================================

const commonTextProperties = {
  textColor: {
    type: 'color' as const,
    label: 'Text Color',
    description: 'Override theme text color for this component',
  },
  fontSize: {
    type: 'number' as const,
    label: 'Font Size',
    min: 10,
    max: 72,
    step: 1,
  },
  fontWeight: {
    type: 'number' as const,
    label: 'Font Weight',
    min: 100,
    max: 900,
    step: 100,
  },
  textAlign: {
    type: 'select' as const,
    label: 'Text Align',
    options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
      { value: 'justify', label: 'Justify' },
    ],
  },
};

const commonLayoutProperties = {
  display: {
    type: 'select' as const,
    label: 'Display',
    options: [
      { value: 'block', label: 'Block' },
      { value: 'flex', label: 'Flex' },
      { value: 'grid', label: 'Grid' },
      { value: 'inline-block', label: 'Inline Block' },
    ],
  },
  flexDirection: {
    type: 'select' as const,
    label: 'Flex Direction',
    options: [
      { value: 'row', label: 'Row (horizontal)' },
      { value: 'column', label: 'Column (vertical)' },
      { value: 'row-reverse', label: 'Row Reverse' },
      { value: 'column-reverse', label: 'Column Reverse' },
    ],
  },
  gap: {
    type: 'number' as const,
    label: 'Gap (px)',
    min: 0,
    max: 100,
    step: 4,
  },
  padding: {
    type: 'number' as const,
    label: 'Padding (px)',
    min: 0,
    max: 100,
    step: 4,
  },
  marginBottom: {
    type: 'number' as const,
    label: 'Margin Bottom (px)',
    min: 0,
    max: 100,
    step: 4,
  },
};

const commonBackgroundProperties = {
  backgroundColor: {
    type: 'color' as const,
    label: 'Background Color',
    description: 'Override theme background color',
  },
};

// ============================================
// Header Component
// ============================================

const headerMetadata: ComponentTypeMetadata = {
  type: 'header',
  label: 'Header',
  icon: '📋',
  description: 'Title and subtitle section',
  defaultProps: {
    title: 'Welcome!',
    subtitle: 'How can we help you today?',
  },
  defaultStyle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  propertyGroups: [
    {
      category: 'content',
      label: 'Content',
      properties: {
        title: {
          type: 'text',
          label: 'Title',
          required: true,
          maxLength: 100,
          placeholder: 'Enter title...',
        },
        subtitle: {
          type: 'textarea',
          label: 'Subtitle',
          maxLength: 200,
          placeholder: 'Enter subtitle...',
        },
      },
    },
    {
      category: 'appearance',
      label: 'Appearance',
      properties: {
        ...commonTextProperties,
        ...commonBackgroundProperties,
      },
    },
    {
      category: 'layout',
      label: 'Layout',
      properties: {
        ...commonLayoutProperties,
      },
    },
  ],
};

// ============================================
// Description Component
// ============================================

const descriptionMetadata: ComponentTypeMetadata = {
  type: 'description',
  label: 'Description',
  icon: '📝',
  description: 'Text paragraph section',
  defaultProps: {
    description: 'Add your description here...',
  },
  defaultStyle: {
    marginBottom: 16,
  },
  propertyGroups: [
    {
      category: 'content',
      label: 'Content',
      properties: {
        description: {
          type: 'textarea',
          label: 'Description',
          required: true,
          maxLength: 500,
          placeholder: 'Enter description...',
        },
      },
    },
    {
      category: 'appearance',
      label: 'Appearance',
      properties: {
        ...commonTextProperties,
        ...commonBackgroundProperties,
        lineHeight: {
          type: 'number',
          label: 'Line Height',
          min: 1,
          max: 3,
          step: 0.1,
        },
      },
    },
    {
      category: 'layout',
      label: 'Layout',
      properties: {
        ...commonLayoutProperties,
      },
    },
  ],
};

// ============================================
// Feature List Component
// ============================================

const featureListMetadata: ComponentTypeMetadata = {
  type: 'feature_list',
  label: 'Feature List',
  icon: '⭐',
  description: 'Grid or list of features with icons',
  defaultProps: {
    features: [
      { icon: '📅', title: 'Feature 1', description: 'Description 1' },
      { icon: '💬', title: 'Feature 2', description: 'Description 2' },
      { icon: '🎯', title: 'Feature 3', description: 'Description 3' },
    ],
  },
  defaultStyle: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 20,
    marginBottom: 32,
  },
  propertyGroups: [
    {
      category: 'content',
      label: 'Content',
      properties: {
        features: {
          type: 'array',
          label: 'Features',
          description: 'List of features to display',
          properties: {
            icon: {
              type: 'text',
              label: 'Icon (emoji)',
              maxLength: 10,
              placeholder: '📅',
            },
            title: {
              type: 'text',
              label: 'Title',
              required: true,
              maxLength: 50,
            },
            description: {
              type: 'textarea',
              label: 'Description',
              maxLength: 150,
            },
          },
        },
      },
    },
    {
      category: 'appearance',
      label: 'Appearance',
      properties: {
        ...commonTextProperties,
        ...commonBackgroundProperties,
      },
    },
    {
      category: 'layout',
      label: 'Layout',
      properties: {
        display: {
          type: 'select',
          label: 'Display',
          options: [
            { value: 'grid', label: 'Grid' },
            { value: 'flex', label: 'Flex (list)' },
          ],
        },
        gridTemplateColumns: {
          type: 'text',
          label: 'Grid Columns',
          description: 'e.g., "repeat(3, 1fr)" for 3 columns',
          placeholder: 'repeat(3, 1fr)',
        },
        gap: {
          type: 'number',
          label: 'Gap (px)',
          min: 0,
          max: 100,
          step: 4,
        },
      },
    },
  ],
};

// ============================================
// Button Group Component
// ============================================

const buttonGroupMetadata: ComponentTypeMetadata = {
  type: 'button_group',
  label: 'Button Group',
  icon: '🔘',
  description: 'Group of action buttons',
  defaultProps: {
    buttons: [
      {
        id: 'btn_1',
        text: 'Click me',
        variant: 'solid',
        action: 'message',
        predefinedMessage: 'Hello!',
      },
    ],
  },
  defaultStyle: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  propertyGroups: [
    {
      category: 'content',
      label: 'Content',
      properties: {
        buttons: {
          type: 'array',
          label: 'Buttons',
          description: 'Action buttons in this group',
          properties: {
            text: {
              type: 'text',
              label: 'Button Text',
              required: true,
              maxLength: 50,
            },
            variant: {
              type: 'select',
              label: 'Style',
              options: [
                { value: 'solid', label: 'Solid' },
                { value: 'outline', label: 'Outline' },
                { value: 'ghost', label: 'Ghost' },
              ],
            },
            action: {
              type: 'select',
              label: 'Action',
              options: [
                { value: 'message', label: 'Send Message' },
                { value: 'link', label: 'Open Link' },
                { value: 'custom', label: 'Custom' },
              ],
            },
            predefinedMessage: {
              type: 'textarea',
              label: 'Message to Send',
              description: 'For "Send Message" action',
              maxLength: 200,
            },
            url: {
              type: 'text',
              label: 'URL',
              description: 'For "Open Link" action',
              placeholder: 'https://...',
            },
          },
        },
      },
    },
    {
      category: 'layout',
      label: 'Layout',
      properties: {
        flexDirection: {
          type: 'select',
          label: 'Direction',
          options: [
            { value: 'row', label: 'Horizontal (row)' },
            { value: 'column', label: 'Vertical (column)' },
          ],
        },
        gap: {
          type: 'number',
          label: 'Gap (px)',
          min: 0,
          max: 50,
          step: 4,
        },
        justifyContent: {
          type: 'select',
          label: 'Alignment',
          options: [
            { value: 'flex-start', label: 'Start' },
            { value: 'center', label: 'Center' },
            { value: 'flex-end', label: 'End' },
            { value: 'space-between', label: 'Space Between' },
          ],
        },
      },
    },
  ],
};

// ============================================
// Badge Component
// ============================================

const badgeMetadata: ComponentTypeMetadata = {
  type: 'badge',
  label: 'Badge',
  icon: '🏷️',
  description: 'Small label or tag',
  defaultProps: {
    icon: '✨',
  },
  defaultStyle: {
    padding: 8,
    borderRadius: 12,
  },
  propertyGroups: [
    {
      category: 'content',
      label: 'Content',
      properties: {
        title: {
          type: 'text',
          label: 'Text',
          required: true,
          maxLength: 30,
          placeholder: 'Badge text...',
        },
        icon: {
          type: 'text',
          label: 'Icon (emoji)',
          maxLength: 10,
          placeholder: '✨',
        },
      },
    },
    {
      category: 'appearance',
      label: 'Appearance',
      properties: {
        ...commonTextProperties,
        ...commonBackgroundProperties,
        badgeStyle: {
          type: 'select',
          label: 'Style',
          options: [
            { value: 'circle', label: 'Circle' },
            { value: 'rounded', label: 'Rounded' },
            { value: 'square', label: 'Square' },
          ],
        },
      },
    },
  ],
};

// ============================================
// Divider Component
// ============================================

const dividerMetadata: ComponentTypeMetadata = {
  type: 'divider',
  label: 'Divider',
  icon: '➖',
  description: 'Horizontal line separator',
  defaultProps: {},
  defaultStyle: {
    marginTop: 16,
    marginBottom: 16,
  },
  propertyGroups: [
    {
      category: 'appearance',
      label: 'Appearance',
      properties: {
        dividerStyle: {
          type: 'select',
          label: 'Style',
          options: [
            { value: 'solid', label: 'Solid' },
            { value: 'dashed', label: 'Dashed' },
            { value: 'dotted', label: 'Dotted' },
          ],
        },
        dividerColor: {
          type: 'color',
          label: 'Color',
        },
        borderWidth: {
          type: 'number',
          label: 'Thickness (px)',
          min: 1,
          max: 10,
          step: 1,
        },
      },
    },
    {
      category: 'layout',
      label: 'Layout',
      properties: {
        marginTop: {
          type: 'number',
          label: 'Margin Top (px)',
          min: 0,
          max: 100,
          step: 4,
        },
        marginBottom: {
          type: 'number',
          label: 'Margin Bottom (px)',
          min: 0,
          max: 100,
          step: 4,
        },
      },
    },
  ],
};

// ============================================
// Container Component
// ============================================

const containerMetadata: ComponentTypeMetadata = {
  type: 'container',
  label: 'Container',
  icon: '📦',
  description: 'Layout wrapper for grouping components',
  defaultProps: {
    layout: 'column',
  },
  defaultStyle: {
    padding: 16,
  },
  propertyGroups: [
    {
      category: 'layout',
      label: 'Layout',
      properties: {
        layout: {
          type: 'select',
          label: 'Layout Type',
          options: [
            { value: 'column', label: 'Column (vertical)' },
            { value: 'row', label: 'Row (horizontal)' },
            { value: 'grid', label: 'Grid' },
          ],
        },
        columns: {
          type: 'number',
          label: 'Grid Columns',
          description: 'For grid layout only',
          min: 1,
          max: 6,
          step: 1,
        },
        gap: {
          type: 'number',
          label: 'Gap (px)',
          min: 0,
          max: 100,
          step: 4,
        },
        padding: {
          type: 'number',
          label: 'Padding (px)',
          min: 0,
          max: 100,
          step: 4,
        },
      },
    },
    {
      category: 'appearance',
      label: 'Appearance',
      properties: {
        ...commonBackgroundProperties,
        borderRadius: {
          type: 'number',
          label: 'Border Radius (px)',
          min: 0,
          max: 50,
          step: 4,
        },
      },
    },
  ],
};

// ============================================
// Custom HTML Component (Read-Only)
// ============================================

const customHTMLMetadata: ComponentTypeMetadata = {
  type: 'custom_html',
  label: 'Custom HTML',
  icon: '⚙️',
  description: 'Custom HTML content (edit in JSON only)',
  defaultProps: {
    htmlContent: '<div>Custom HTML here</div>',
  },
  propertyGroups: [
    {
      category: 'content',
      label: 'Content',
      properties: {
        htmlContent: {
          type: 'textarea',
          label: 'HTML Content',
          description: 'Warning: HTML is sanitized for security',
          maxLength: 5000,
          placeholder: '<div>Your HTML here</div>',
        },
      },
    },
  ],
};

// ============================================
// Rich Text Component (Read-Only)
// ============================================

const richTextMetadata: ComponentTypeMetadata = {
  type: 'richtext',
  label: 'Rich Text',
  icon: '📄',
  description: 'Rich formatted text (edit in JSON only)',
  defaultProps: {
    htmlContent: '<p>Rich text content</p>',
  },
  propertyGroups: [
    {
      category: 'content',
      label: 'Content',
      properties: {
        htmlContent: {
          type: 'textarea',
          label: 'HTML Content',
          maxLength: 5000,
          placeholder: '<p>Your content here</p>',
        },
      },
    },
  ],
};

// ============================================
// Export All Metadata
// ============================================

export const componentMetadataRegistry: Record<string, ComponentTypeMetadata> = {
  header: headerMetadata,
  description: descriptionMetadata,
  feature_list: featureListMetadata,
  button_group: buttonGroupMetadata,
  badge: badgeMetadata,
  divider: dividerMetadata,
  container: containerMetadata,
  custom_html: customHTMLMetadata,
  richtext: richTextMetadata,
};

export function getComponentMetadata(type: string): ComponentTypeMetadata | undefined {
  return componentMetadataRegistry[type];
}

export function getAllComponentTypes(): ComponentTypeMetadata[] {
  return Object.values(componentMetadataRegistry);
}
