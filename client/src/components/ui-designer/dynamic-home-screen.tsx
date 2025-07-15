import React from "react";
import { renderComponent } from "./component-registry";
import type { HomeScreenConfig } from "@shared/schema";

interface DynamicHomeScreenProps {
  config: HomeScreenConfig;
  onTopicClick?: (topic: any) => void;
  onActionClick?: (action: any) => void;
  className?: string;
}

export default function DynamicHomeScreen({ 
  config, 
  onTopicClick, 
  onActionClick, 
  className 
}: DynamicHomeScreenProps) {
  if (!config || !config.components) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No home screen configuration found
      </div>
    );
  }

  // Sort components by order
  const sortedComponents = [...config.components]
    .filter(component => component.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div 
      className={`h-full overflow-y-auto ${className || ''}`}
      style={{
        backgroundColor: config.theme?.backgroundColor,
        color: config.theme?.textColor,
        '--primary': config.theme?.primaryColor || 'var(--chat-primary-color, var(--primary))',
        '--chat-primary-color': config.theme?.primaryColor || 'var(--chat-primary-color, var(--primary))'
      } as React.CSSProperties}
    >
      {sortedComponents.map((component) => 
        renderComponent(component, onTopicClick, onActionClick)
      )}
      <div className="pb-8"></div>
    </div>
  );
}