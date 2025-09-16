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
  Home
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
  Home
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
  };
}

// Header Component
export function HeaderComponent({ component, resolvedColors }: ComponentRegistryProps) {
  const { title, subtitle, style } = component.props;
  
  // Use resolved colors with fallback to component style
  const textColor = resolvedColors?.textColor || style?.textColor || 'inherit';

  return (
    <div 
      className="border-b border-neutral-200 p-6 relative"
      style={{
        backgroundColor: 'transparent',
        color: textColor,
      }}
    >
      {/* Optional overlay for better text readability when background image is present */}
      <div 
        className="absolute inset-0 bg-black/10 pointer-events-none"
        style={{
          backgroundColor: `${resolvedColors?.backgroundColor || 'white'}20`, // 12.5% opacity background
        }}
      />
      
      <div className="text-center relative z-10">
        {title && (
          <h2 className="text-2xl font-bold mb-2 drop-shadow-sm" style={{ color: textColor }}>
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="drop-shadow-sm" style={{ color: textColor, opacity: 0.9 }}>
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
  const { topics, style } = component.props;
  const layout = style?.layout || 'grid';
  const columns = style?.columns || 2;

  // Ensure topics is an array
  const topicsArray = Array.isArray(topics) ? topics : [];
  
  if (!topicsArray || topicsArray.length === 0) return null;

  const gridClass = layout === 'grid' 
    ? `grid grid-cols-1 gap-3`
    : 'space-y-3';
    
  // Use resolved colors with fallback to component style
  const backgroundColor = resolvedColors?.backgroundColor || style?.backgroundColor || 'white';
  const textColor = resolvedColors?.textColor || style?.textColor || 'inherit';
  const primaryColor = resolvedColors?.primaryColor || 'var(--primary)';

  // Category colors similar to original design
  const categoryColors = {
    support: 'bg-blue-50 text-blue-700 border-blue-200',
    sales: 'bg-green-50 text-green-700 border-green-200', 
    billing: 'bg-purple-50 text-purple-700 border-purple-200',
    general: 'bg-gray-50 text-gray-700 border-gray-200'
  };

  return (
    <div className="p-4 space-y-3">

      <div className={gridClass}>
        {topicsArray.map((topic) => (
          <div 
            key={topic.id}
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 rounded-lg border shadow-sm p-3"
            onClick={() => onTopicClick?.(topic)}
            style={{
              backgroundColor: primaryColor,
              color: 'white',
              borderLeftColor: primaryColor,
            }}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1" style={{ color: 'white' }}>
                {getIcon(topic.icon)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium" style={{ color: 'white' }}>{topic.title}</h4>
                  {topic.category && (
                    <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[topic.category as keyof typeof categoryColors] || categoryColors.general}`}>
                      {topic.category}
                    </span>
                  )}
                  {topic.popular && (
                    <Badge variant="secondary" className="text-xs">Popular</Badge>
                  )}
                </div>
                <p className="text-sm" style={{ color: 'white', opacity: 0.9 }}>{topic.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Quick Actions Component
export function QuickActionsComponent({ component, onActionClick, resolvedColors }: ComponentRegistryProps) {
  const { actions, style } = component.props;

  if (!actions || actions.length === 0) return null;
  
  // Use resolved colors with fallback to component style
  const backgroundColor = resolvedColors?.backgroundColor || style?.backgroundColor || 'white';
  const textColor = resolvedColors?.textColor || style?.textColor || 'inherit';
  const primaryColor = resolvedColors?.primaryColor || 'var(--primary)';

  return (
    <div className="p-4 space-y-3">
      <h3 className="font-semibold text-sm uppercase tracking-wide" style={{ color: textColor }}>
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, index) => (
          <Button
            key={action.id}
            variant={index === 0 ? "default" : "outline"}
            className="h-auto p-4 justify-start shadow-sm"
            onClick={() => onActionClick?.(action)}
            style={{
              backgroundColor: index === 0 ? primaryColor : backgroundColor,
              color: index === 0 ? 'white' : textColor,
              borderColor: index === 0 ? primaryColor : textColor,
            }}
          >
            {getIcon('MessageCircle')}
            <div className="text-left ml-3">
              <div className="font-medium">{action.title}</div>
              <div className="text-xs" style={{ opacity: 0.8 }}>
                {action.description}
              </div>
            </div>
          </Button>
        ))}
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
      className="text-center py-4 px-4 border-t"
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