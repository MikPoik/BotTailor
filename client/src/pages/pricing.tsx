
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, Rocket } from "lucide-react";
import { Link } from "wouter";
import ChatWidget from "@/components/chat/chat-widget";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  stripePriceId: string;
  price: number;
  currency: string;
  maxBots: number;
  maxMessagesPerMonth: number;
  features: string[];
}

const PLAN_ICONS = {
  Basic: Crown,
  Premium: Zap,
  Ultra: Rocket,
};

const PLAN_COLORS = {
  Basic: "border-blue-200 bg-blue-50",
  Premium: "border-purple-200 bg-purple-50 ring-2 ring-purple-500",
  Ultra: "border-orange-200 bg-orange-50",
};

export default function Pricing() {
  const { isAuthenticated } = useAuth();
  const [sessionId, setSessionId] = useState<string>("");

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription/plans"],
  });

  // Fetch the site default chatbot for chat widget
  const { data: defaultChatbot } = useQuery({
    queryKey: ['/api/public/default-chatbot'],
    enabled: true,
    retry: false,
  });

  useEffect(() => {
    // Set page title and meta description for SEO
    document.title = "Pricing - BotTailor | Affordable AI Chatbot Plans";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Choose the perfect AI chatbot plan for your business. Flexible pricing with powerful features starting free.');
    }

    // Generate session ID only once per component mount
    if (!sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
    }
  }, [sessionId]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100);
  };

  const formatPlanName = (name: string) => {
    return name === 'Free' ? 'Trial' : name;
  };

  if (plansLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading pricing plans...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Choose the perfect plan for your chatbot needs. Start free and scale as you grow.
        </p>
      </div>

      {/* Subscription Plans */}
      <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.name as keyof typeof PLAN_ICONS] || Crown;
          const isPremium = plan.name === 'Premium';

          return (
            <Card
              key={plan.id}
              className={`relative ${PLAN_COLORS[plan.name as keyof typeof PLAN_COLORS] || 'border-gray-200'}`}
            >
              {isPremium && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="text-xl">{formatPlanName(plan.name)}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
                <div className="mt-4 p-2">
                  <span className="text-3xl font-bold">
                    {plan.name === 'Free' ? 'Free' : formatPrice(plan.price, plan.currency)}
                  </span>
                  {plan.name !== 'Free' && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {plan.features?.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                {plan.name === 'Free' ? (
                  isAuthenticated ? (
                    <Button className="w-full" variant="outline" asChild>
                      <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                  ) : (
                    <Button className="w-full" variant="outline" asChild>
                      <a href="/api/login">Get Started Free</a>
                    </Button>
                  )
                ) : (
                  isAuthenticated ? (
                    <Button
                      className="w-full"
                      variant={isPremium ? "default" : "outline"}
                      asChild
                    >
                      <Link href="/subscription">Choose Plan</Link>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isPremium ? "default" : "outline"}
                      asChild
                    >
                      <a href="/api/login">Get Started</a>
                    </Button>
                  )
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="mt-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">What's Included</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-blue-500" />
                Core Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">• AI-powered conversations</p>
              <p className="text-sm text-muted-foreground">• Customizable appearance</p>
              <p className="text-sm text-muted-foreground">• Website embedding</p>
              <p className="text-sm text-muted-foreground">• Basic analytics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-500" />
                Advanced Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">• Survey & form builder</p>
              <p className="text-sm text-muted-foreground">• Lead generation</p>
              <p className="text-sm text-muted-foreground">• Email notifications</p>
              <p className="text-sm text-muted-foreground">• Advanced analytics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-orange-500" />
                Enterprise Ready
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">• Priority support</p>
              <p className="text-sm text-muted-foreground">• White-label options</p>
              <p className="text-sm text-muted-foreground">• API access</p>
              <p className="text-sm text-muted-foreground">• Custom integrations</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16 max-w-3xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <div className="grid gap-6 text-left">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately with prorated billing.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What happens if I exceed my message limit?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your chatbot will continue to work but will show upgrade prompts. You can upgrade anytime to restore full functionality.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Is there a free trial?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Yes! Our Free plan lets you try all core features with 1 chatbot and 100 messages per month. No credit card required.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center mt-12">
        <p className="text-muted-foreground mb-4">Ready to get started?</p>
        {isAuthenticated ? (
          <Button size="lg" asChild>
            <Link href="/dashboard">Create Your Chatbot</Link>
          </Button>
        ) : (
          <Button size="lg" asChild>
            <a href="/api/login">Start Building for Free</a>
          </Button>
        )}
      </div>

      {/* Additional Information */}
      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>All plans include unlimited websites • Cancel anytime • No hidden fees</p>
      </div>

      {/* Chat Widget */}
      {sessionId && defaultChatbot && defaultChatbot.isActive && (
        <ChatWidget 
          sessionId={sessionId}
          position="bottom-right"
          primaryColor={defaultChatbot.homeScreenConfig?.theme?.primaryColor || "#3b82f6"}
          backgroundColor={defaultChatbot.homeScreenConfig?.theme?.backgroundColor || "#ffffff"}
          textColor={defaultChatbot.homeScreenConfig?.theme?.textColor || "#1f2937"}
          chatbotConfig={defaultChatbot}
        />
      )}
    </div>
  );
}
