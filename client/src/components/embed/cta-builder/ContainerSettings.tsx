/**
 * ContainerSettings Component
 * Panel for editing container-level settings (background, layout, spacing)
 */

import React from 'react';
import { CTAConfig } from '@shared/schema';
import { BackgroundImageUpload } from '@/components/ui/background-image-upload';

interface ContainerSettingsProps {
  config: CTAConfig;
  onChange: (config: CTAConfig) => void;
}

export const ContainerSettings: React.FC<ContainerSettingsProps> = ({
  config,
  onChange,
}) => {
  const handleLayoutChange = (field: string, value: any) => {
    onChange({
      ...config,
      layout: {
        style: config.layout?.style || 'card',
        position: config.layout?.position || 'center',
        width: config.layout?.width || 'wide',
        ...config.layout,
        [field]: value,
      },
    });
  };

  const handleBackgroundOverlayChange = (field: string, value: any) => {
    onChange({
      ...config,
      layout: {
        style: config.layout?.style || 'card',
        position: config.layout?.position || 'center',
        width: config.layout?.width || 'wide',
        ...config.layout,
        backgroundOverlay: {
          enabled: config.layout?.backgroundOverlay?.enabled || false,
          ...config.layout?.backgroundOverlay,
          [field]: value,
        },
      },
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      fontSize: '12px',
    }}>
      {/* Background Color */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 500,
          marginBottom: '6px',
          color: '#374151',
        }}>
          Background Color
        </label>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="color"
            value={config.theme?.backgroundColor || '#ffffff'}
            onChange={(e) => onChange({
              ...config,
              theme: {
                ...config.theme,
                backgroundColor: e.target.value,
              },
            })}
            style={{
              width: '40px',
              height: '30px',
              border: '1px solid #d1d5db',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          />
          <input
            type="text"
            value={config.theme?.backgroundColor || '#ffffff'}
            onChange={(e) => onChange({
              ...config,
              theme: {
                ...config.theme,
                backgroundColor: e.target.value,
              },
            })}
            placeholder="#ffffff"
            style={{
              flex: 1,
              padding: '5px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '3px',
              fontSize: '11px',
            }}
          />
        </div>
        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>
          Main background color of the CTA
        </div>
      </div>

      {/* Component Gap */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 500,
          marginBottom: '6px',
          color: '#374151',
        }}>
          Component Gap (px)
        </label>
        <input
          type="number"
          min={0}
          max={100}
          value={config.layout?.componentGap ?? 16}
          onChange={(e) => handleLayoutChange('componentGap', parseInt(e.target.value) || 0)}
          style={{
            width: '100%',
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '12px',
          }}
        />
        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>
          Space between components (0 = no gap)
        </div>
      </div>

      {/* Background Image */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 500,
          marginBottom: '6px',
          color: '#374151',
        }}>
          Background Image
        </label>
        <div style={{ fontSize: '11px' }}>
          <BackgroundImageUpload
            value={config.layout?.backgroundImage}
            onValueChange={(url) => handleLayoutChange('backgroundImage', url)}
          />
        </div>
        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>
          Optional background image for the CTA
        </div>
      </div>

      {/* Background Image Transparency */}
      {config.layout?.backgroundImage && (
        <div>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 500,
            marginBottom: '6px',
            color: '#374151',
          }}>
            Background Image Transparency: {Math.round((config.layout?.backgroundOverlay?.opacity ?? 0.3) * 100)}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={(config.layout?.backgroundOverlay?.opacity ?? 0.3) * 100}
            onChange={(e) => {
              const newOpacity = parseInt(e.target.value) / 100;
              onChange({
                ...config,
                layout: {
                  style: config.layout?.style || 'card',
                  position: config.layout?.position || 'center',
                  width: config.layout?.width || 'wide',
                  ...config.layout,
                  backgroundOverlay: {
                    enabled: true, // Auto-enable when slider is used
                    color: config.layout?.backgroundOverlay?.color || 'rgba(0, 0, 0, 1)',
                    opacity: newOpacity,
                  },
                },
              });
            }}
            style={{
              width: '100%',
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '9px',
            color: '#6b7280',
            marginTop: '3px',
          }}>
            <span>No overlay</span>
            <span>Full overlay</span>
          </div>
          <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>
            Controls overlay opacity for text readability
          </div>
        </div>
      )}

      {/* Background Pattern */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 500,
          marginBottom: '6px',
          color: '#374151',
        }}>
          Background Pattern
        </label>
        <select
          value={config.layout?.backgroundPattern || 'none'}
          onChange={(e) => handleLayoutChange('backgroundPattern', e.target.value === 'none' ? undefined : e.target.value)}
          style={{
            width: '100%',
            padding: '6px 10px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '12px',
            backgroundColor: 'white',
          }}
        >
          <option value="none">None</option>
          <option value="dots">Dots</option>
          <option value="grid">Grid</option>
          <option value="waves">Waves</option>
          <option value="stripes">Stripes</option>
        </select>
      </div>

      {/* Background Overlay */}
      {(config.layout?.backgroundImage || config.layout?.backgroundPattern) && (
        <div style={{
          padding: '12px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 500,
            marginBottom: '10px',
            color: '#374151',
          }}>
            Background Overlay
          </div>

          {/* Enable Overlay */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={config.layout?.backgroundOverlay?.enabled || false}
              onChange={(e) => handleBackgroundOverlayChange('enabled', e.target.checked)}
              style={{ marginRight: '6px' }}
            />
            <span style={{ fontSize: '11px', color: '#374151' }}>
              Enable overlay
            </span>
          </label>

          {config.layout?.backgroundOverlay?.enabled && (
            <>
              {/* Overlay Color */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  marginBottom: '4px',
                  color: '#6b7280',
                }}>
                  Overlay Color
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="color"
                    value={config.layout?.backgroundOverlay?.color || '#000000'}
                    onChange={(e) => handleBackgroundOverlayChange('color', e.target.value)}
                    style={{
                      width: '40px',
                      height: '30px',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  />
                  <input
                    type="text"
                    value={config.layout?.backgroundOverlay?.color || '#000000'}
                    onChange={(e) => handleBackgroundOverlayChange('color', e.target.value)}
                    placeholder="#000000"
                    style={{
                      flex: 1,
                      padding: '5px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '3px',
                      fontSize: '11px',
                    }}
                  />
                </div>
              </div>

              {/* Overlay Opacity */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '10px',
                  marginBottom: '4px',
                  color: '#6b7280',
                }}>
                  Overlay Opacity: {((config.layout?.backgroundOverlay?.opacity ?? 0.5) * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={(config.layout?.backgroundOverlay?.opacity ?? 0.5) * 100}
                  onChange={(e) => handleBackgroundOverlayChange('opacity', parseInt(e.target.value) / 100)}
                  style={{
                    width: '100%',
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
