/**
 * Component registry and dynamic renderer for UI Designer home screen components.
 *
 * Responsibilities:
 * - Maps HomeScreenComponent types to React components for dynamic rendering.
 * - Provides icon mapping and prop validation for all supported component types.
 * - Used by DynamicHomeScreen to render designer artifacts.
 *
 * Contracts & Edge Cases:
 * - All component types/props must match artifact contract (see docs/agents/ui-designer.md).
 * - Registry must be updated when adding new component types or props.
 * - Handles missing/invalid component types or props gracefully.
 * - Must remain compatible with evolving artifact/component schema.
 */
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  ShoppingCart, 
  CreditCard, 
  Truck, 
  RotateCcw, 
  HelpCircle,
  Star,
  Gift,
  Shield,
  Phone,
  Search,
  Grid,
  List,
  Home,
  BarChart,
  PieChart
} from "lucide-react";
import type { HomeScreenComponent } from "@shared/schema";

// Icon mapping for dynamic rendering
const iconMap = {
  MessageCircle,
  ShoppingCart,
  CreditCard,
  Truck,
  RotateCcw,
  HelpCircle,
  Star,
  Gift,
  Shield,
  Phone,
  Search,
  Grid,
  List,
  Home,
  BarChart,
  PieChart
};

export function getIcon(iconName: string) {
  const IconComponent = iconMap[iconName as keyof typeof iconMap];
  return IconComponent ? <IconComponent className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />;
}

interface ComponentRegistryProps {
  component: HomeScreenComponent;
  onTopicClick?: (topic: any) => void;
  onActionClick?: (action: any) => void;
  resolvedColors?: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    backgroundImageUrl?: string; // Added for background image check
    titleFontSize?: string;
    descriptionFontSize?: string;
  };
}

// Header Component
export function HeaderComponent({ component, resolvedColors }: ComponentRegistryProps) {
  const { title, subtitle, style } = component.props;

  // Use resolved colors
  const backgroundColor = resolvedColors?.backgroundColor || 'var(--background)';
  const textColor = resolvedColors?.textColor || 'var(--foreground)';

  // Check if we should use transparent background (when background image exists and transparent is enabled)
  const hasBackgroundImage = resolvedColors?.backgroundImageUrl;
  const useTransparentBackground = hasBackgroundImage && (style as any)?.transparentBackground;

  // Header colors
  const headerBgColor = useTransparentBackground ? 'transparent' : backgroundColor;
  const headerTextColor = textColor;

  return (
    <div 
      className="border-b border-neutral-200 p-6 relative"
      style={{
        backgroundColor: headerBgColor,
        color: headerTextColor,
        borderBottomColor: useTransparentBackground ? 'rgba(255,255,255,0.2)' : undefined,
      }}
    >
      {/* Optional overlay for better text readability when background image is present and not transparent */}
      {hasBackgroundImage && !useTransparentBackground && (
        <div 
          className="absolute inset-0 bg-black/10 pointer-events-none"
          style={{
            backgroundColor: `${backgroundColor}30`, // 12.5% opacity background
          }}
        />
      )}

      <div className="text-center relative z-10">
        {title && (
          <h2 
            className="text-2xl font-bold mb-2 drop-shadow-sm" 
            style={{ 
              color: headerTextColor,
              textShadow: useTransparentBackground ? '1px 1px 1px rgba(0,0,0,0.2)' : undefined
            }}
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p 
            className="drop-shadow-sm" 
            style={{ 
              color: headerTextColor, 
              opacity: useTransparentBackground ? 1 : 0.9,
              textShadow: useTransparentBackground ? '1px 1px 1px rgba(0,0,0,0.1)' : undefined
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// Category Tabs Component
export function CategoryTabsComponent({ component, resolvedColors }: ComponentRegistryProps) {
  const { categories } = component.props;
  const [selectedCategory, setSelectedCategory] = React.useState(categories?.[0] || 'all');

  if (!categories || categories.length === 0) return null;

  // Use resolved colors
  const primaryColor = resolvedColors?.primaryColor || 'var(--primary)';
  const textColor = resolvedColors?.textColor || 'inherit';

  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto">
      {['all', ...categories].map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          size="sm"
          className="flex-shrink-0"
          onClick={() => setSelectedCategory(category)}
          style={{
            backgroundColor: selectedCategory === category ? primaryColor : 'transparent',
            color: selectedCategory === category ? 'white' : textColor,
            borderColor: primaryColor,
          }}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </Button>
      ))}
    </div>
  );
}

// Topic Grid Component
export function TopicGridComponent({ component, onTopicClick, resolvedColors }: ComponentRegistryProps) {
  const { topics, style, title } = component.props;

  // Use resolved colors
  const primaryColor = resolvedColors?.primaryColor || 'var(--primary)';
  const backgroundColor = resolvedColors?.backgroundColor || 'var(--background)';
  const textColor = resolvedColors?.textColor || 'var(--foreground)';

  // Check if there's a background image
  const hasBackgroundImage = resolvedColors?.backgroundImageUrl;

  // Determine style variant and font sizes
  const itemStyle = style?.itemStyle || 'filled';
  const titleFontSize = resolvedColors?.titleFontSize || (style as any)?.titleFontSize || '16px';
  const descriptionFontSize = resolvedColors?.descriptionFontSize || (style as any)?.descriptionFontSize || '14px';

  // Helper function to determine if a color is light or dark
  const isLightColor = (color: string) => {
    // Remove # if present and convert to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 127;
  };

  // Generate theme-aware colors for background image overlay
  const getOverlayColors = () => {
    if (!hasBackgroundImage) {
      return {
        backgroundColor: itemStyle === 'filled' ? primaryColor : backgroundColor,
        textColor: itemStyle === 'filled' ? 'white' : textColor,
        borderColor: itemStyle === 'outlined' ? primaryColor : 'transparent'
      };
    }

    // When there's a background image, use theme colors with transparency
    const isPrimaryLight = isLightColor(primaryColor);
    const isTextLight = isLightColor(textColor);
    const overlayOpacity = itemStyle === 'filled' ? '0.85' : '0.5';
    
    return {
      backgroundColor: itemStyle === 'filled' 
        ? `${primaryColor}${Math.round(255 * parseFloat(overlayOpacity)).toString(16).padStart(2, '0')}`
        : `${backgroundColor}${Math.round(255 * parseFloat(overlayOpacity)).toString(16).padStart(2, '0')}`, // Use background color for outlined
      textColor: itemStyle === 'filled'
        ? (isPrimaryLight ? '#000000' : '#ffffff')
        : textColor, // Use theme text color for outlined items
      borderColor: itemStyle === 'outlined' 
        ? `${primaryColor}${Math.round(255 * 0.6).toString(16).padStart(2, '0')}` // Use primary color for border
        : 'transparent',
      textShadow: hasBackgroundImage && itemStyle === 'outlined' ? '0px 0px 1px rgba(0,0,0,0.1)' : undefined,
      backdropFilter: hasBackgroundImage ? 'blur(8px)' : undefined
    };
  };

  const overlayColors = getOverlayColors();

  if (!topics || topics.length === 0) return null;

  return (
    <div className="p-4 space-y-3" style={{ backgroundColor: hasBackgroundImage ? 'transparent' : backgroundColor, color: textColor }}>
      {title && (
        <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: textColor }}>
          {title}
        </h3>
      )}
      <div className="grid gap-3">
        {topics.map((topic: any) => (
          <button
            key={topic.id}
            onClick={() => onTopicClick?.(topic)}
            className={`w-full p-2 rounded-lg text-left ${
              itemStyle === 'filled' 
                ? 'shadow-md hover:shadow-lg' 
                : 'border-2 shadow-sm hover:shadow-md'
            }`}
            style={{
              backgroundColor: overlayColors.backgroundColor,
              color: overlayColors.textColor,
              borderColor: overlayColors.borderColor,
              textShadow: overlayColors.textShadow,
              backdropFilter: overlayColors.backdropFilter,
              transition: 'box-shadow 600ms cubic-bezier(0.4, 0.0, 0.2, 1)',
            }}
          >
            <div className="flex items-center gap-3">
              {topic.icon && (
                <div className="flex-shrink-0">
                  {getIcon(topic.icon)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div 
                  className="line-clamp-1"
                  style={{ 
                    color: overlayColors.textColor,
                    fontWeight: 500,
                    fontSize: titleFontSize,
                  }}
                >
                  {topic.title}
                </div>
                {topic.description && (
                  <div 
                    className="line-clamp-2"
                    style={{
                      color: overlayColors.textColor,
                      opacity: 0.8,
                      fontSize: descriptionFontSize,
                    }}
                  >
                    {topic.description}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Quick Actions Component
export function QuickActionsComponent({ component, onActionClick, resolvedColors }: ComponentRegistryProps) {
  const { actions, style, title } = component.props;

  if (!actions || actions.length === 0) return null;

  // Use resolved colors with fallback to component style
  const backgroundColor = resolvedColors?.backgroundColor || style?.backgroundColor || 'white';
  const textColor = resolvedColors?.textColor || style?.textColor || 'inherit';
  const primaryColor = resolvedColors?.primaryColor || 'var(--primary)';
  
  // Get the itemStyle from component style (same as topic grid)
  const itemStyle = style?.itemStyle || 'filled';

  // Check if there's a background image
  const hasBackgroundImage = resolvedColors?.backgroundImageUrl;

  // Helper function to determine if a color is light or dark
  const isLightColor = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 127;
  };

  // Generate colors with opacity like topic grid
  const getActionColors = (actionStyle: string) => {
    if (!hasBackgroundImage) {
      const overlayOpacity = '0.85'; // Same as topic grid
      const isPrimaryLight = isLightColor(primaryColor);
      
      return {
        backgroundColor: actionStyle === 'filled' 
          ? `${primaryColor}${Math.round(255 * parseFloat(overlayOpacity)).toString(16).padStart(2, '0')}`
          : backgroundColor,
        textColor: actionStyle === 'filled'
          ? (isPrimaryLight ? '#000000' : '#ffffff')
          : textColor,
        borderColor: actionStyle === 'outlined' ? primaryColor : 'transparent',
      };
    }

    // When there's a background image, use same logic as topic grid
    const isPrimaryLight = isLightColor(primaryColor);
    const overlayOpacity = actionStyle === 'filled' ? '0.85' : '0.5';
    
    return {
      backgroundColor: actionStyle === 'filled' 
        ? `${primaryColor}${Math.round(255 * parseFloat(overlayOpacity)).toString(16).padStart(2, '0')}`
        : `${backgroundColor}${Math.round(255 * parseFloat(overlayOpacity)).toString(16).padStart(2, '0')}`,
      textColor: actionStyle === 'filled'
        ? (isPrimaryLight ? '#000000' : '#ffffff')
        : textColor,
      borderColor: actionStyle === 'outlined' 
        ? `${primaryColor}${Math.round(255 * 0.6).toString(16).padStart(2, '0')}`
        : 'transparent',
      backdropFilter: hasBackgroundImage ? 'blur(8px)' : undefined
    };
  };

  return (
    <div className="p-4 space-y-3">
      {title && (
        <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: textColor }}>
          {title}
        </h3>
      )}
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action: any) => {
          // Check if action has its own itemStyle override
          const actionStyle = action.itemStyle || itemStyle;
          const actionColors = getActionColors(actionStyle);
          
          return (
            <Button
              key={action.id}
              className={`h-auto p-4 justify-start ${
                actionStyle === 'filled' 
                  ? 'shadow-md hover:shadow-lg' 
                  : 'border-2 shadow-sm hover:shadow-md'
              }`}
              onClick={() => onActionClick?.(action)}
              style={{
                backgroundColor: actionColors.backgroundColor,
                color: actionColors.textColor,
                borderColor: actionColors.borderColor,
                backdropFilter: actionColors.backdropFilter,
                transition: 'box-shadow 600ms cubic-bezier(0.4, 0.0, 0.2, 1)',
              }}
            >
              <div className="flex-shrink-0">
                {getIcon(action.icon || 'MessageCircle')}
              </div>
              <div className="text-left ml-3">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs font-normal" style={{ opacity: 0.8 }}>
                  {action.description}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// Footer Component
export function FooterComponent({ component, resolvedColors }: ComponentRegistryProps) {
  const { title, style } = component.props;

  // Use resolved colors with fallback to component style
  const backgroundColor = resolvedColors?.backgroundColor || style?.backgroundColor;
  const textColor = resolvedColors?.textColor || style?.textColor || 'inherit';

  return (
    <div 
      className="text-center py-4 px-4 border-t mt-auto"
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {title && (
        <p className="text-sm" style={{ color: textColor, opacity: 0.7 }}>
          {title}
        </p>
      )}
    </div>
  );
}

// Main component registry
const ComponentRegistry = {
  header: HeaderComponent,
  category_tabs: CategoryTabsComponent,
  topic_grid: TopicGridComponent,
  quick_actions: QuickActionsComponent,
  footer: FooterComponent,
};

export function renderComponent(
  component: HomeScreenComponent, 
  onTopicClick?: (topic: any) => void,
  onActionClick?: (action: any) => void,
  resolvedColors?: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    backgroundImageUrl?: string;
    titleFontSize?: string;
    descriptionFontSize?: string;
  }
) {
  const ComponentToRender = ComponentRegistry[component.type];

  if (!ComponentToRender) {
    console.warn(`Component type "${component.type}" not found in registry`);
    return null;
  }

  return (
    <ComponentToRender
      key={component.id}
      component={component}
      onTopicClick={onTopicClick}
      onActionClick={onActionClick}
      resolvedColors={resolvedColors}
    />
  );
}

export default ComponentRegistry;