import React, { useState, useCallback } from 'react';
import { useForm, FormProvider, useFieldArray } from 'react-hook-form';
import { CTAConfig, CTAConfigSchema } from '@shared/schema';

interface CTABuilderProps {
  initialConfig?: CTAConfig;
  chatbotName?: string;
  onConfigChange?: (config: CTAConfig) => void;
  onPreviewToggle?: (show: boolean) => void;
}

/**
 * CTABuilder - Interface for creating and editing CTA configurations
 * 
 * Features:
 * - Enable/disable CTA
 * - Configure layout (style, position, width)
 * - Add/remove/reorder components
 * - Edit button text and messages
 * - Customize colors
 * - Configure settings
 */
export const CTABuilder: React.FC<CTABuilderProps> = ({
  initialConfig,
  chatbotName = 'Support',
  onConfigChange,
  onPreviewToggle,
}) => {
  const defaultConfig: CTAConfig = initialConfig || {
    version: '1.0',
    enabled: false,
    layout: {
      style: 'card',
      position: 'center',
      width: 'wide',
    },
    components: [],
    primaryButton: {
      id: 'btn_1',
      text: 'Start Chat',
      variant: 'solid',
      predefinedMessage: 'Hi! I need help.',
      actionLabel: 'Start Chat',
    },
  };

  const methods = useForm<CTAConfig>({
    defaultValues: defaultConfig,
    mode: 'onChange',
  });

  const { control, watch, setValue, handleSubmit } = methods;
  const { fields: componentFields, append, remove, move } = useFieldArray({
    control,
    name: 'components',
  });

  const config = watch();

  // Notify parent of config changes
  React.useEffect(() => {
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  // Add component
  const handleAddComponent = (type: CTAConfig['components'][0]['type']) => {
    const newComponent = {
      id: `comp_${Date.now()}`,
      type,
      order: componentFields.length,
      visible: true,
      props: {
        title: 'New Component',
        subtitle: type === 'header' ? 'Add your subtitle' : undefined,
        description: type === 'description' ? 'Add your description here' : undefined,
        features: type === 'feature_list' ? [
          { icon: '⭐', title: 'Feature 1', description: 'Description' },
        ] : undefined,
      },
    };
    append(newComponent as any);
  };

  // Handle form submission (not typically needed since onChange handles updates)
  const onSubmit = useCallback((data: CTAConfig) => {
    onConfigChange?.(data);
  }, [onConfigChange]);

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="cta-builder-form">
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ marginTop: 0, marginBottom: '8px', fontSize: '20px', fontWeight: 600 }}>
            CTA Setup
          </h2>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            Create a call-to-action view that appears before the chat
          </p>
        </div>

        {/* Enable/Disable */}
        <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setValue('enabled', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '15px', fontWeight: 500 }}>Enable CTA View</span>
          </label>
        </div>

        {/* Show builder only if enabled */}
        {config.enabled && (
          <>
            {/* Layout Configuration */}
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '15px', fontWeight: 600 }}>
                Layout
              </h3>

              {/* Style */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                  Style
                </label>
                <select
                  value={config.layout?.style || 'card'}
                  onChange={(e) => setValue('layout.style', e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="banner">Banner</option>
                  <option value="card">Card</option>
                  <option value="modal">Modal</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>

              {/* Position */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                  Position
                </label>
                <select
                  value={config.layout?.position || 'center'}
                  onChange={(e) => setValue('layout.position', e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
              </div>

              {/* Width */}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                  Width
                </label>
                <select
                  value={config.layout?.width || 'wide'}
                  onChange={(e) => setValue('layout.width', e.target.value as any)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="narrow">Narrow</option>
                  <option value="wide">Wide</option>
                  <option value="full">Full</option>
                </select>
              </div>
            </div>

            {/* Components */}
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                  Components
                </h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleAddComponent('header')}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    + Header
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddComponent('feature_list')}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: 'white',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    + Features
                  </button>
                </div>
              </div>

              {componentFields.length === 0 ? (
                <p style={{ margin: 0, color: '#999', fontSize: '13px' }}>
                  No components added. Click buttons above to add.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {componentFields.map((field, index) => (
                    <div
                      key={field.id}
                      style={{
                        padding: '12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        backgroundColor: '#f9fafb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>
                        {config.components?.[index]?.type || 'Component'}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => index > 0 && move(index, index - 1)}
                          disabled={index === 0}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            backgroundColor: 'white',
                            opacity: index === 0 ? 0.5 : 1,
                          }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: '#fef2f2',
                            color: '#ef4444',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Button */}
            <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '15px', fontWeight: 600 }}>
                Primary Button
              </h3>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                  Button Text
                </label>
                <input
                  type="text"
                  value={config.primaryButton?.text || ''}
                  onChange={(e) => setValue('primaryButton.text', e.target.value)}
                  placeholder="Start Chat"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                  Predefined Message (sent when clicked)
                </label>
                <textarea
                  value={config.primaryButton?.predefinedMessage || ''}
                  onChange={(e) => setValue('primaryButton.predefinedMessage', e.target.value)}
                  placeholder="Hi! I need help."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '80px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            {/* Settings */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '15px', fontWeight: 600 }}>
                Settings
              </h3>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.settings?.dismissible ?? true}
                  onChange={(e) => setValue('settings.dismissible', e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px' }}>Allow users to dismiss CTA</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.settings?.showOncePerSession ?? false}
                  onChange={(e) => setValue('settings.showOncePerSession', e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px' }}>Show only once per session</span>
              </label>
            </div>

            {/* Preview Button */}
            <button
              type="button"
              onClick={() => onPreviewToggle?.(true)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Preview CTA
            </button>
          </>
        )}
      </form>
    </FormProvider>
  );
};

export default CTABuilder;
