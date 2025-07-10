import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Phone
} from "lucide-react";

interface HomeTabProps {
  onStartChat: (topic: string, message?: string) => void;
  isMobile: boolean;
}

interface ChatTopic {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  message?: string;
  category: 'support' | 'sales' | 'billing';
  popular?: boolean;
}

const chatTopics: ChatTopic[] = [
  {
    id: 'product_info',
    title: 'Product Information',
    description: 'Learn about our products and features',
    icon: <MessageCircle className="h-5 w-5" />,
    message: 'Hi! I would like to learn more about your products and features.',
    category: 'sales',
    popular: true
  },
  {
    id: 'order_status',
    title: 'Order Status',
    description: 'Check your order status and tracking',
    icon: <Truck className="h-5 w-5" />,
    message: 'I need help checking my order status and tracking information.',
    category: 'support'
  },
  {
    id: 'billing_help',
    title: 'Billing Support',
    description: 'Questions about billing and payments',
    icon: <CreditCard className="h-5 w-5" />,
    message: 'I have questions about my billing and payment options.',
    category: 'billing'
  },
  {
    id: 'returns',
    title: 'Returns & Exchanges',
    description: 'Return or exchange your purchase',
    icon: <RotateCcw className="h-5 w-5" />,
    message: 'I need help with returning or exchanging my purchase.',
    category: 'support',
    popular: true
  },
  {
    id: 'shopping_help',
    title: 'Shopping Assistance',
    description: 'Get help finding the right product',
    icon: <ShoppingCart className="h-5 w-5" />,
    message: 'I need assistance finding the right product for my needs.',
    category: 'sales'
  },
  {
    id: 'technical_support',
    title: 'Technical Support',
    description: 'Troubleshoot technical issues',
    icon: <Shield className="h-5 w-5" />,
    message: 'I am experiencing technical issues and need support.',
    category: 'support'
  },
  {
    id: 'promotions',
    title: 'Deals & Promotions',
    description: 'Current offers and discounts',
    icon: <Gift className="h-5 w-5" />,
    message: 'What deals and promotions do you currently have available?',
    category: 'sales',
    popular: true
  },
  {
    id: 'contact_agent',
    title: 'Talk to Human Agent',
    description: 'Connect with a human representative',
    icon: <Phone className="h-5 w-5" />,
    message: 'I would like to speak with a human agent please.',
    category: 'support'
  }
];

const quickActions = [
  {
    id: 'free_chat',
    title: 'Start Free Chat',
    description: 'Ask anything you want',
    action: () => {}
  },
  {
    id: 'live_agent',
    title: 'Request Live Agent',
    description: 'Talk to a human',
    action: () => {}
  }
];

export default function HomeTab({ onStartChat, isMobile }: HomeTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'support' | 'sales' | 'billing'>('all');

  const filteredTopics = selectedCategory === 'all' 
    ? chatTopics 
    : chatTopics.filter(topic => topic.category === selectedCategory);

  const popularTopics = chatTopics.filter(topic => topic.popular);

  const handleTopicClick = (topic: ChatTopic) => {
    onStartChat(topic.title, topic.message);
  };

  const categoryColors = {
    support: 'bg-blue-50 text-blue-700 border-blue-200',
    sales: 'bg-green-50 text-green-700 border-green-200', 
    billing: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50">
      {/* Welcome Header */}
      <div className="bg-white border-b border-neutral-200 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome! How can we help you today?
          </h2>
          <p className="text-gray-600">
            Choose a topic below or start a free conversation
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={() => onStartChat('Free Chat')}
              className="h-auto p-4 justify-start bg-primary hover:bg-primary/90 text-white"
            >
              <MessageCircle className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Start Free Chat</div>
                <div className="text-xs opacity-90">Ask anything you want</div>
              </div>
            </Button>
            <Button
              onClick={() => onStartChat('Live Agent', 'I would like to speak with a human agent please.')}
              variant="outline"
              className="h-auto p-4 justify-start"
            >
              <Phone className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Request Live Agent</div>
                <div className="text-xs text-gray-600">Talk to a human representative</div>
              </div>
            </Button>
          </div>
        </div>

        {/* Popular Topics */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
              Popular Topics
            </h3>
            <Star className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            {popularTopics.map((topic) => (
              <div 
                key={topic.id} 
                className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary rounded-lg border bg-white shadow-sm p-4"
                onClick={() => handleTopicClick(topic)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-primary mt-1">
                    {topic.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{topic.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[topic.category]}`}>
                        {topic.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{topic.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
            Browse by Category
          </h3>
          <div className="flex flex-wrap gap-2">
            {(['all', 'support', 'sales', 'billing'] as const).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category === 'all' ? 'All Topics' : category}
              </Button>
            ))}
          </div>
        </div>

        {/* All Topics */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
            {selectedCategory === 'all' ? 'All Topics' : `${selectedCategory} Topics`}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {filteredTopics.map((topic) => (
              <div 
                key={topic.id} 
                className="cursor-pointer hover:shadow-md transition-shadow rounded-lg border bg-white shadow-sm p-4"
                onClick={() => handleTopicClick(topic)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-gray-600 mt-1">
                    {topic.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{topic.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full border ${categoryColors[topic.category]}`}>
                        {topic.category}
                      </span>
                      {topic.popular && (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{topic.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}