import React, { useState, useEffect } from 'react';
import { CTAConfig, CTAConfigSchema } from '@shared/schema';

interface CTABuilderProps {
  initialConfig?: CTAConfig;
  chatbotName?: string;
  themeColors?: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  onConfigChange?: (config: CTAConfig) => void;
  onPreviewToggle?: (show: boolean) => void;
}

/**
 * CTABuilder - JSON editor for CTA configurations
 */
export const CTABuilder: React.FC<CTABuilderProps> = ({
  initialConfig,
  onConfigChange,
}) => {
  const defaultConfig: CTAConfig = {
    version: '1.0',
    enabled: false,
    layout: {
      style: 'card',
      position: 'center',
      width: 'wide',
    },
    components: [],
    theme: undefined,
    primaryButton: {
      id: 'btn_1',
      text: 'Start Chat',
      variant: 'solid',
      predefinedMessage: 'Hi! I need help.',
      actionLabel: 'Start Chat',
    },
  };

  const config = initialConfig || defaultConfig;
  
  // State for JSON editor
  const [jsonText, setJsonText] = useState<string>(JSON.stringify(config, null, 2));

  // Update jsonText when initialConfig changes
  useEffect(() => {
    setJsonText(JSON.stringify(config, null, 2));
  }, [config]);

  const mergePartialConfig = (base: CTAConfig, overrides: Record<string, unknown>) => {
    const clone = JSON.parse(JSON.stringify(base)) as Record<string, unknown>;

    const merge = (target: Record<string, unknown>, source: Record<string, unknown>) => {
      Object.entries(source).forEach(([key, value]) => {
        const existing = target[key];
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          existing &&
          typeof existing === 'object'
        ) {
          target[key] = merge({ ...(existing as Record<string, unknown>) }, value as Record<string, unknown>);
        } else {
          target[key] = value;
        }
      });
      return target;
    };

    return merge(clone, overrides) as CTAConfig;
  };

  // Handle manual JSON save
  const handleSaveJsonEdit = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const merged = mergePartialConfig(config, parsed);
      const validated = CTAConfigSchema.parse(merged);
      onConfigChange?.(validated);
      setJsonText(JSON.stringify(validated, null, 2));
    } catch (err) {
      alert(`Invalid CTA config: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div>
      {/* JSON Configuration Editor */}
      <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
            Configuration (JSON)
          </h3>
          <span style={{ fontSize: '12px', color: '#666' }}>✅ Config applied! Customize in the builder.</span>
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '12px',
            fontFamily: 'monospace',
            minHeight: '400px',
            maxHeight: '600px',
            boxSizing: 'border-box',
            resize: 'vertical',
            lineHeight: '1.5',
            backgroundColor: '#f9fafb',
          }}
          spellCheck={false}
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <button
            type="button"
            onClick={handleSaveJsonEdit}
            style={{
              backgroundColor: '#0066cc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Save Edit
          </button>
        </div>
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
          Edit the JSON directly for full control. Click "Save Edit" to apply changes.
        </p>
      </div>
    </div>
  );
};

export default CTABuilder;
