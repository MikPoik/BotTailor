import React, { useState, useEffect } from 'react';
import { renderComponent } from "./component-registry";
import { Skeleton } from "@/components/ui/skeleton";
import type { HomeScreenConfig } from "@shared/schema";

interface DynamicHomeScreenProps {
  config: HomeScreenConfig;
  onTopicClick?: (topic: any) => void;
  onActionClick?: (action: any) => void;
  className?: string;
  previewFontSizes?: { titleFontSize?: string; descriptionFontSize?: string };
}

// Color and style resolution function that prioritizes embed parameters over UI Designer theme
function resolveColors(config: HomeScreenConfig, previewFontSizes?: { titleFontSize?: string; descriptionFontSize?: string }) {
  // Get CSS variables from the embed parameters (these take priority)
  const embedPrimaryColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-primary-color').trim();
  const embedBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-background').trim();
  const embedTextColor = getComputedStyle(document.documentElement).getPropertyValue('--chat-text').trim();

  // Helper function to check if a color value is valid (not empty and not just fallback CSS var)
  const isValidColor = (color: string) => {
    return color && color !== '' && !color.startsWith('var(--') && color !== 'var(--primary)' && color !== 'var(--background)' && color !== 'var(--foreground)';
  };

  // Extract font sizes from topic grid component or use preview values
  const topicGridComponent = config.components?.find(c => c.type === 'topic_grid');
  let titleFontSize = '16px';
  let descriptionFontSize = '14px';

  if (previewFontSizes) {
    // Use preview font sizes (from Theme tab)
    titleFontSize = previewFontSizes.titleFontSize || '16px';
    descriptionFontSize = previewFontSizes.descriptionFontSize || '14px';
  } else if (topicGridComponent?.props) {
    // Use saved font sizes from component props
    titleFontSize = (topicGridComponent.props as any).titleFontSize || '16px';
    descriptionFontSize = (topicGridComponent.props as any).descriptionFontSize || '14px';
  }

  // Resolve final colors with embed parameters taking priority
  const resolvedColors = {
    primaryColor: (isValidColor(embedPrimaryColor) ? embedPrimaryColor : config.theme?.primaryColor) || 'var(--primary)',
    backgroundColor: (isValidColor(embedBackgroundColor) ? embedBackgroundColor : config.theme?.backgroundColor) || 'var(--background)',
    textColor: (isValidColor(embedTextColor) ? embedTextColor : config.theme?.textColor) || 'var(--foreground)',
    backgroundImageUrl: config.theme?.backgroundImageUrl,
    backgroundImageTransparency: config.theme?.backgroundImageTransparency || 20,
    titleFontSize,
    descriptionFontSize
  };

  return resolvedColors;
}

export default function DynamicHomeScreen({
  config,
  onTopicClick,
  onActionClick,
  className,
  previewFontSizes
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

  // Resolve colors and font sizes with embed parameters taking priority
  const colors = resolveColors(config, previewFontSizes);

  return (
    <div
      className={`h-full overflow-y-auto ${className || ''} relative flex flex-col min-h-full`}
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
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: `${colors.backgroundColor}${Math.round((colors.backgroundImageTransparency / 100) * 255).toString(16).padStart(2, '0')}`,
            opacity: imageLoaded ? 1 : 0,
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

      <div className="relative z-10 flex flex-col h-full min-h-full">
        <div className="flex-1 overflow-y-auto">
          {sortedComponents
          .filter((component) => component.visible !== false && component.type !== 'footer' && component.type !== 'category_tabs')
          .map((component) =>
            renderComponent(component, onTopicClick, onActionClick, colors)
          )}
        </div>
        {/* Render footer separately to ensure proper positioning */}
        <div className="mt-auto">
          {sortedComponents
            .filter((component) => component.visible !== false && component.type === 'footer')
            .map((component) =>
              renderComponent(component, onTopicClick, onActionClick, colors)
            )}
        </div>
      </div>
    </div>
  );
}