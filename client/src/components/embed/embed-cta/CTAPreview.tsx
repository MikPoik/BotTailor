import React, { useState } from 'react';
import { CTAConfig } from '@shared/schema';
import { CTAView } from './CTAView';

interface CTAPreviewProps {
  config: CTAConfig;
  isOpen: boolean;
  onClose: () => void;
  chatbotName?: string;
}

/**
 * CTAPreview - Modal component for previewing CTA layouts
 * 
 * Features:
 * - Preview in different device sizes (mobile, tablet, desktop)
 * - Full-screen preview mode
 * - Live updates as config changes
 */
export const CTAPreview: React.FC<CTAPreviewProps> = ({
  config,
  isOpen,
  onClose,
  chatbotName = 'Support',
}) => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!isOpen) return null;

  // Device dimensions
  const deviceDimensions = {
    mobile: { width: '375px', height: '667px' },
    tablet: { width: '768px', height: '1024px' },
    desktop: { width: '100%', height: '600px' },
  };

  const dims = deviceDimensions[deviceType];

  // Modal content
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: isFullScreen ? 'column' : 'row',
        gap: '24px',
        height: isFullScreen ? '100vh' : 'auto',
        backgroundColor: isFullScreen ? '#fff' : 'transparent',
      }}
    >
      {/* Controls - Hidden in fullscreen */}
      {!isFullScreen && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            width: '200px',
            flexShrink: 0,
          }}
        >
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Preview Options</h3>

          {/* Device Type Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 500 }}>
              Device
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(['mobile', 'tablet', 'desktop'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setDeviceType(type)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    backgroundColor: deviceType === type ? '#2563eb' : 'white',
                    color: deviceType === type ? 'white' : 'black',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                    transition: 'all 0.2s',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Full Screen Toggle */}
          <button
            onClick={() => setIsFullScreen(true)}
            style={{
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              backgroundColor: '#f3f4f6',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              marginTop: '8px',
            }}
          >
            Full Screen →
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#f3f4f6',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500,
              marginTop: 'auto',
            }}
          >
            Close Preview
          </button>
        </div>
      )}

      {/* Preview Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isFullScreen ? '#fff' : '#f9fafb',
          borderRadius: isFullScreen ? '0' : '8px',
          padding: isFullScreen ? '0' : '24px',
          minHeight: isFullScreen ? '100vh' : '600px',
          overflow: 'auto',
        }}
      >
        {/* Full Screen Header */}
        {isFullScreen && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '56px',
              backgroundColor: '#f3f4f6',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingLeft: '20px',
              paddingRight: '20px',
              zIndex: 100,
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              CTA Preview - {deviceType.charAt(0).toUpperCase() + deviceType.slice(1)}
            </div>
            <button
              onClick={() => setIsFullScreen(false)}
              style={{
                padding: '6px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              ← Back
            </button>
          </div>
        )}

        {/* Device Frame */}
        <div
          style={{
            width: dims.width,
            height: dims.height,
            border: deviceType === 'desktop' ? 'none' : '8px solid #1f2937',
            borderRadius: deviceType === 'desktop' ? '0' : '16px',
            overflow: 'hidden',
            backgroundColor: 'white',
            boxShadow:
              deviceType === 'desktop'
                ? 'none'
                : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            marginTop: isFullScreen ? '56px' : '0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* CTA Content */}
          {config.enabled ? (
            <CTAView
              config={config}
              chatbotName={chatbotName}
              onPrimaryButtonClick={() => {
                console.log('Primary button clicked in preview');
              }}
              onSecondaryButtonClick={() => {
                console.log('Secondary button clicked in preview');
              }}
              onClose={() => {
                console.log('CTA closed in preview');
              }}
            />
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9fafb',
                color: '#6b7280',
                fontSize: '14px',
                textAlign: 'center',
                padding: '24px',
              }}
            >
              <div>
                <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
                  CTA Disabled
                </p>
                <p style={{ margin: 0, fontSize: '13px' }}>
                  Enable CTA to see preview
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render as modal overlay
  return (
    <div
      style={{
        position: isFullScreen ? 'fixed' : 'absolute',
        top: isFullScreen ? 0 : '24px',
        left: isFullScreen ? 0 : '24px',
        right: isFullScreen ? 0 : '24px',
        bottom: isFullScreen ? 0 : 'auto',
        backgroundColor: isFullScreen ? 'white' : 'white',
        borderRadius: isFullScreen ? '0' : '8px',
        boxShadow: isFullScreen
          ? 'none'
          : '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        overflow: isFullScreen ? 'auto' : 'auto',
        maxHeight: isFullScreen ? '100vh' : 'calc(100vh - 100px)',
        padding: isFullScreen ? '0' : '24px',
        maxWidth: isFullScreen ? '100%' : '1200px',
        margin: isFullScreen ? '0' : '0 auto',
      }}
    >
      {content}
    </div>
  );
};

export default CTAPreview;
