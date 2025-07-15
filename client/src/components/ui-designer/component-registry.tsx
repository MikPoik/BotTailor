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
}

// Header Component
export function HeaderComponent({ component }: ComponentRegistryProps) {
  const { title, subtitle, style } = component.props;

  return (
    <div 
      className="bg-white border-b border-neutral-200 p-6"
      style={{
        backgroundColor: style?.backgroundColor || 'white',
        color: style?.textColor,
      }}
    >
      <div className="text-center">
        {title && (
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-gray-600">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// Category Tabs Component
export function CategoryTabsComponent({ component }: ComponentRegistryProps) {
  const { categories } = component.props;
  const [selectedCategory, setSelectedCategory] = React.useState(categories?.[0] || 'all');

  if (!categories || categories.length === 0) return null;

  return (
    <div className="flex gap-2 px-4 py-2 overflow-x-auto">
      {['all', ...categories].map((category) => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          size="sm"
          className="flex-shrink-0"
          onClick={() => setSelectedCategory(category)}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </Button>
      ))}
    </div>
  );
}

// Topic Grid Component
export function TopicGridComponent({ component, onTopicClick }: ComponentRegistryProps) {
  const { topics, style } = component.props;
  const layout = style?.layout || 'grid';
  const columns = style?.columns || 2;

  if (!topics || topics.length === 0) return null;

  const gridClass = layout === 'grid' 
    ? `grid grid-cols-1 gap-3`
    : 'space-y-3';

  // Category colors similar to original design
  const categoryColors = {
    support: 'bg-blue-50 text-blue-700 border-blue-200',
    sales: 'bg-green-50 text-green-700 border-green-200', 
    billing: 'bg-purple-50 text-purple-700 border-purple-200',
    general: 'bg-gray-50 text-gray-700 border-gray-200'
  };

  return (
    <div className="p-4 space-y-3">
      <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
        Topics
      </h3>
      <div className={gridClass}>
        {topics.map((topic) => (
          <div 
            key={topic.id}
            className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary rounded-lg border bg-white shadow-sm p-4"
            onClick={() => onTopicClick?.(topic)}
            style={{
              backgroundColor: style?.backgroundColor || 'white',
              color: style?.textColor,
            }}
          >
            <div className="flex items-start gap-3">
              <div className="text-primary mt-1">
                {getIcon(topic.icon)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{topic.title}</h4>
                  {topic.category && (
                    <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[topic.category as keyof typeof categoryColors] || categoryColors.general}`}>
                      {topic.category}
                    </span>
                  )}
                  {topic.popular && (
                    <Badge variant="secondary" className="text-xs">Popular</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{topic.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Quick Actions Component
export function QuickActionsComponent({ component, onActionClick }: ComponentRegistryProps) {
  const { actions, style } = component.props;

  if (!actions || actions.length === 0) return null;

  return (
    <div className="p-4 space-y-3">
      <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
        Quick Actions
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, index) => (
          
          <Button
            key={action.id}
            variant={index === 0 ? "default" : "outline"}
            className={`h-auto p-4 justify-start ${
              index === 0 
                ? "bg-primary hover:bg-primary/90 text-white" 
                : ""
            }`}
            onClick={() => onActionClick?.(action)}
            style={{
              backgroundColor: index === 0 ? undefined : style?.backgroundColor,
              color: index === 0 ? undefined : style?.textColor,
            }}
          >
            {getIcon(action.icon || 'MessageCircle')}
            <div className="text-left ml-3">
              <div className="font-medium">{action.title}</div>
              <div className={`text-xs ${index === 0 ? 'opacity-90' : 'text-gray-600'}`}>
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
export function FooterComponent({ component }: ComponentRegistryProps) {
  const { title, style } = component.props;

  return (
    <div 
      className="text-center py-4 px-4 border-t"
      style={{
        backgroundColor: style?.backgroundColor,
        color: style?.textColor,
      }}
    >
      {title && (
        <p className="text-sm text-muted-foreground">
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
  onActionClick?: (action: any) => void
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
    />
  );
}

export default ComponentRegistry;