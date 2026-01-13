/**
 * VisualCTAEditor Component
 * Main visual editor for CTA components - combines list panel and property editor
 */

import React from 'react';
import { CTAConfig } from '@shared/schema';
import { useComponentEditor } from './useComponentEditor';
import { ComponentListPanel } from './ComponentListPanel';
import { ComponentPropertyEditor } from './ComponentPropertyEditor';

interface VisualCTAEditorProps {
  config: CTAConfig;
  onChange: (config: CTAConfig) => void;
}

export const VisualCTAEditor: React.FC<VisualCTAEditorProps> = ({
  config,
  onChange,
}) => {
  const { state, actions, selectedComponent } = useComponentEditor({
    initialConfig: config,
    onChange,
  });

  return (
    <div style={{
      display: 'flex',
      height: '600px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#fff',
    }}>
      {/* Left Panel - Component List */}
      <ComponentListPanel
        components={state.config.components}
        selectedId={state.selectedComponentId}
        config={state.config}
        actions={actions}
      />

      {/* Right Panel - Property Editor */}
      <ComponentPropertyEditor
        component={selectedComponent ?? undefined}
        config={state.config}
        actions={actions}
        expandedGroups={state.expandedGroups}
      />
    </div>
  );
};
