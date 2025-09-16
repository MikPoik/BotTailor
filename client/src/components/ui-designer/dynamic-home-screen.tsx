import React, { useState, useEffect } from 'react';
import { renderComponent } from "./component-registry";
import { Skeleton } from "@/components/ui/skeleton";
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
  const sortedComponents = [...(config.components || [])].sort((a, b) => a.order - b.order);

  const backgroundImageUrl = config.theme?.backgroundImageUrl;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Preload background image
  useEffect(() => {
    if (backgroundImageUrl) {
      const img = new Image();
      img.onload = () => {
        setImageLoaded(true);
        setImageError(false);
      };
      img.onerror = () => {
        setImageError(true);
        setImageLoaded(false);
      };
      img.src = backgroundImageUrl;
    } else {
      setImageLoaded(true); // No image to load
    }
  }, [backgroundImageUrl]);

  // Resolve colors with embed parameters taking priority
  const colors = resolveColors(config);

  return (
    <div 
      className={`h-full overflow-y-auto ${className || ''} relative`}
      style={{
        backgroundColor: colors.backgroundColor,
        color: colors.textColor,
        '--primary': colors.primaryColor,
        '--chat-primary-color': colors.primaryColor,
        ...(backgroundImageUrl && {
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: imageLoaded || imageError ? 1 : 0, // Apply opacity based on image load state
          transition: 'opacity 0.5s ease-in-out' // Fade-in transition
        })
      } as React.CSSProperties}
    >
      {/* Background overlay for better text readability when background image is present */}
      {backgroundImageUrl && !imageError && (
        <div 
          className="absolute inset-0 bg-black/20 pointer-events-none"
          style={{
            backgroundColor: `${colors.backgroundColor}80`, // 50% opacity background
            opacity: imageLoaded ? 1 : 0, // Apply opacity to overlay as well
            transition: 'opacity 0.5s ease-in-out' 
          }}
        />
      )}

      {/* Skeleton loader while image is loading */}
      {backgroundImageUrl && !imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-full h-full bg-gray-200 dark:bg-gray-700" />
        </div>
      )}

      <div className="relative z-10">
        {sortedComponents
        .filter((component) => component.visible !== false)
        .map((component) => 
          renderComponent(component, onTopicClick, onActionClick, colors)
        )}
        <div className="pb-8"></div>
      </div>
    </div>
  );
}