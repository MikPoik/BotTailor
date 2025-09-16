import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Crown, Zap, Rocket, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

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

interface UserSubscription {
  id: number;
  status: string;
  currentPeriodEnd: string;
  messagesUsedThisMonth: number;
  plan: SubscriptionPlan;
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

export default function Subscription() {
  const { toast, dismiss } = useToast();
  const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null);

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription/plans"],
  });

  // Fetch current user subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery<UserSubscription>({
    queryKey: ["/api/subscription/current"],
  });

  // Create checkout session mutation
  const createCheckoutMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await apiRequest('POST', '/api/subscription/create-checkout-session', { planId });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoadingPlanId(null);
    },
  });

  // Modify subscription mutation (upgrade/downgrade)
  const modifySubscriptionMutation = useMutation({
    mutationFn: async (planId: number) => {
      const response = await apiRequest('POST', '/api/subscription/modify', { planId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Subscription updated successfully",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
    },
    onError: (error) => {
      console.error('Error modifying subscription:', error);
      toast({
        title: "Error",
        description: "Failed to modify subscription. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setLoadingPlanId(null);
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/cancel', {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Subscription Canceled",
        description: data.message || "Your subscription will be canceled at the end of the current billing period.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
    },
    onError: (error) => {
      console.error('Error canceling subscription:', error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (planId: number) => {
    // If user has an existing subscription, confirm before modifying it
    if (currentSubscription && currentSubscription.status === 'active') {
      const targetPlan = (plans || []).find((p) => p.id === planId);
      const currentPlan = currentSubscription.plan;

      if (!targetPlan) return;

      const isUpgrade = targetPlan.price > currentPlan.price;
      const actionVerb = isUpgrade ? "upgrade" : "downgrade";

      const t = toast({
        title: `Confirm ${isUpgrade ? "Upgrade" : "Downgrade"}`,
        description:
          `You are about to ${actionVerb} to ${targetPlan.name}. A prorated charge or credit may apply for the remainder of your billing period.`,
        className: "fixed top-1/2 left-1/2 max-w-md w-full mx-auto z-[200] !transform-none",
        style: { 
          marginTop: '-100px', 
          marginLeft: '-200px',
          transform: 'none !important',
          animation: 'none !important'
        },
      });

      t.update({
        action: (
          <ToastAction
            altText="Confirm plan change"
            onClick={() => {
              // Close the toast and proceed with modification
              dismiss(t.id);
              setLoadingPlanId(planId);
              modifySubscriptionMutation.mutate(planId);
            }}
          >
            Confirm
          </ToastAction>
        ),
      });
    } else {
      // No existing subscription, create new checkout session
      setLoadingPlanId(planId);
      createCheckoutMutation.mutate(planId);
    }
  };

  const handleCancelSubscription = () => {
    const t = toast({
      title: "Confirm Cancellation",
      description: "Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.",
      className: "fixed top-1/2 left-1/2 max-w-md w-full mx-auto z-[200] !transform-none",
      style: { 
        marginTop: '-100px', 
        marginLeft: '-200px',
        transform: 'none !important',
        animation: 'none !important'
      },
    });

    t.update({
      action: (
        <ToastAction
          altText="Confirm cancellation"
          onClick={() => {
            dismiss(t.id);
            cancelSubscriptionMutation.mutate();
          }}
        >
          Cancel Subscription
        </ToastAction>
      ),
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100);
  };

  const formatUsage = (used: number, total: number) => {
    if (total === -1) return "Unlimited";
    return `${used.toLocaleString()} / ${total.toLocaleString()}`;
  };

  if (plansLoading || subscriptionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Select the perfect plan for your chatbot needs. Upgrade or downgrade anytime.
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <div className="mb-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge 
                  variant={currentSubscription.cancelAtPeriodEnd ? "destructive" : "outline"} 
                  className="capitalize"
                >
                  {currentSubscription.cancelAtPeriodEnd ? 'Canceled' : currentSubscription.status}
                </Badge>
                Current Plan: {currentSubscription.plan.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Message Usage:</span>
                <span className="font-medium">
                  {formatUsage(
                    currentSubscription.messagesUsedThisMonth,
                    currentSubscription.plan.maxMessagesPerMonth
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Bot Limit:</span>
                <span className="font-medium">{currentSubscription.plan.maxBots}</span>
              </div>
              {currentSubscription.currentPeriodEnd && (
                <div className="flex justify-between">
                  <span>{(currentSubscription as any).cancelAtPeriodEnd ? 'Active until:' : 'Renews:'}</span>
                  <span className="font-medium">
                    {new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>
              )}
              {(currentSubscription as any).cancelAtPeriodEnd && (
                <div className="text-sm text-orange-600 font-medium">
                  Your subscription will be canceled at the end of the current billing period.
                </div>
              )}
            </CardContent>
            {currentSubscription.status === 'active' && !(currentSubscription as any).cancelAtPeriodEnd && currentSubscription.plan.name !== 'Free' && (
              <CardFooter>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancelSubscription}
                  disabled={cancelSubscriptionMutation.isPending}
                  className="w-full"
                  data-testid="button-cancel-subscription"
                >
                  {cancelSubscriptionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <X className="mr-2 h-4 w-4" />
                  Cancel Subscription
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.name as keyof typeof PLAN_ICONS] || Crown;
          const isPremium = plan.name === 'Premium';
          const isCurrentPlan = currentSubscription?.plan.id === plan.id;
          const isLoading = loadingPlanId === plan.id;

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
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">
                    {formatPrice(plan.price, plan.currency)}
                  </span>
                  <span className="text-muted-foreground">/month</span>
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
                {plan.name !== 'Free' && (
                  <Button
                    className="w-full"
                    variant={isPremium ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentPlan || isLoading}
                    data-testid={isCurrentPlan ? "button-current-plan" : `button-${currentSubscription && currentSubscription.status === 'active' && currentSubscription.plan.name !== 'Free' ? (plan.price > currentSubscription.plan.price ? 'upgrade' : 'downgrade') : 'subscribe'}-${plan.name.toLowerCase()}`}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isCurrentPlan 
                      ? 'Current Plan' 
                      : currentSubscription && currentSubscription.status === 'active' && currentSubscription.plan.name !== 'Free'
                        ? (plan.price > currentSubscription.plan.price ? 'Upgrade' : 'Downgrade')
                        : 'Subscribe Now'
                    }
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Additional Information */}
      <div className="text-center mt-12 text-sm text-muted-foreground">
        <p>All plans include 24/7 support and a 14-day free trial.</p>
        <p>Cancel anytime. No hidden fees.</p>
      </div>
    </div>
  );
}
