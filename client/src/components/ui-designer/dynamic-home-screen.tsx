import React from "react";
import { renderComponent } from "./component-registry";
import type { HomeScreenConfig } from "@shared/schema";

interface DynamicHomeScreenProps {
  config: HomeScreenConfig;
  onTopicClick?: (topic: any) => void;
  onActionClick?: (action: any) => void;
  className?: string;
}

// Color resolution function that prioritizes embed parameters over UI Designer theme
function resolveColors(config: HomeScreenConfig) {
  // Get CSS variables from the embed parameters (these take priority)
  const embedPrimaryColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-primary-color').trim();
  const embedBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-background').trim();
  const embedTextColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-text').trim();
  
  // Helper function to check if a color value is valid (not empty and not just fallback CSS var)
  const isValidColor = (color: string) => {
    return color && color !== '' && !color.startsWith('var(--') && color !== 'var(--primary)' && color !== 'var(--background)' && color !== 'var(--foreground)';
  };
  
  // Resolve final colors with embed parameters taking priority
  const resolvedColors = {
    primaryColor: (isValidColor(embedPrimaryColor) ? embedPrimaryColor : config.theme?.primaryColor) || 'var(--primary)',
    backgroundColor: (isValidColor(embedBackgroundColor) ? embedBackgroundColor : config.theme?.backgroundColor) || 'var(--background)',
    textColor: (isValidColor(embedTextColor) ? embedTextColor : config.theme?.textColor) || 'var(--foreground)'
  };
  
  return resolvedColors;
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

  // Resolve colors with embed parameters taking priority
  const colors = resolveColors(config);

  return (
    <div 
      className={`h-full overflow-y-auto ${className || ''}`}
      style={{
        backgroundColor: colors.backgroundColor,
        color: colors.textColor,
        '--primary': colors.primaryColor,
        '--chat-primary-color': colors.primaryColor
      } as React.CSSProperties}
    >
      {sortedComponents.map((component) => 
        renderComponent(component, onTopicClick, onActionClick, colors)
      )}
      <div className="pb-8"></div>
    </div>
  );
}