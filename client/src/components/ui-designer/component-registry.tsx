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
      className="text-center py-6 px-4"
      style={{
        backgroundColor: style?.backgroundColor,
        color: style?.textColor,
      }}
    >
      {title && (
        <h1 className="text-2xl font-bold mb-2">
          {title}
        </h1>
      )}
      {subtitle && (
        <p className="text-muted-foreground">
          {subtitle}
        </p>
      )}
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
    ? `grid grid-cols-1 md:grid-cols-${columns} gap-4`
    : 'space-y-2';
  
  return (
    <div className="px-4 py-4">
      <div className={gridClass}>
        {topics.map((topic) => (
          <Card 
            key={topic.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onTopicClick?.(topic)}
            style={{
              backgroundColor: style?.backgroundColor,
              color: style?.textColor,
            }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                {getIcon(topic.icon)}
                <div className="flex-1">
                  <CardTitle className="text-sm">{topic.title}</CardTitle>
                  {topic.popular && (
                    <Badge variant="secondary" className="ml-2 text-xs">Popular</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                {topic.description}
              </CardDescription>
            </CardContent>
          </Card>
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
    <div className="px-4 py-4">
      <div className="space-y-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            className="w-full justify-start"
            onClick={() => onActionClick?.(action)}
            style={{
              backgroundColor: style?.backgroundColor,
              color: style?.textColor,
            }}
          >
            <div className="text-left">
              <div className="font-medium">{action.title}</div>
              <div className="text-xs text-muted-foreground">{action.description}</div>
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