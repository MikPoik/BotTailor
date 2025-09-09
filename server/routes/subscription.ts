import express, { Router } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { z } from "zod";
import { insertSubscriptionPlanSchema, insertSubscriptionSchema } from "@shared/schema";
import { isAuthenticated } from "../replitAuth";

// Initialize Stripe with secret key
let stripe: Stripe | null = null;

const initializeStripe = () => {
  if (!stripe) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripe = new Stripe(stripeKey, {
      apiVersion: '2025-08-27.basil',
    });
  }
  return stripe;
};

// Request schemas
const createCheckoutSessionSchema = z.object({
  planId: z.number(),
});

const webhookEventSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
});

export const subscriptionRouter = Router();

// Get all subscription plans
subscriptionRouter.get("/plans", async (req, res) => {
  try {
    const plans = await storage.getSubscriptionPlans();
    res.json(plans);
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ error: "Failed to fetch subscription plans" });
  }
});

// Get current user subscription
subscriptionRouter.get("/current", isAuthenticated, async (req: any, res) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const subscription = await storage.getUserSubscriptionWithPlan(req.user.claims.sub);
    
    if (!subscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    res.json(subscription);
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

// Create Stripe checkout session
subscriptionRouter.post("/create-checkout-session", isAuthenticated, async (req: any, res) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { planId } = createCheckoutSessionSchema.parse(req.body);
    
    // Get the subscription plan
    const plan = await storage.getSubscriptionPlan(planId);
    if (!plan) {
      return res.status(404).json({ error: "Subscription plan not found" });
    }

    const stripeClient = initializeStripe();

    // Check if user already has a Stripe customer ID
    let customerId: string | undefined;
    const existingSubscription = await storage.getUserSubscription(req.user.claims.sub);
    
    if (existingSubscription?.stripeCustomerId) {
      customerId = existingSubscription.stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await stripeClient.customers.create({
        email: req.user.claims?.email || undefined,
        metadata: {
          userId: req.user.claims.sub,
        },
      });
      customerId = customer.id;
    }

    // Create checkout session
    const session = await stripeClient.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/subscription?canceled=true`,
      metadata: {
        userId: req.user.claims.sub,
        planId: planId.toString(),
      },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Stripe webhook handler (exported for direct mounting at /api/webhook)
export const webhookHandler = express.Router();
webhookHandler.post("/", async (req, res) => {
  console.log(`[STRIPE_WEBHOOK] Received webhook request`);
  console.log(`[STRIPE_WEBHOOK] Headers:`, req.headers);
  console.log(`[STRIPE_WEBHOOK] Body length:`, req.body?.length);
  
  try {
    const stripeClient = initializeStripe();
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    console.log(`[STRIPE_WEBHOOK] Signature present:`, !!sig);
    console.log(`[STRIPE_WEBHOOK] Webhook secret present:`, !!webhookSecret);

    if (!sig || !webhookSecret) {
      console.error("[STRIPE_WEBHOOK] Missing signature or webhook secret");
      return res.status(400).json({ error: "Missing signature or webhook secret" });
    }

    let event: Stripe.Event;

    try {
      event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log(`[STRIPE_WEBHOOK] Signature verification successful`);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).json({ error: "Invalid signature" });
    }

    console.log(`[STRIPE_WEBHOOK] Processing event: ${event.type}, ID: ${event.id}`);
    console.log(`[STRIPE_WEBHOOK] Event data keys:`, Object.keys(event.data.object));

    switch (event.type) {
      case 'checkout.session.completed':
        console.log(`[STRIPE_WEBHOOK] Handling checkout.session.completed`);
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        console.log(`[STRIPE_WEBHOOK] Handling customer.subscription.updated`);
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        console.log(`[STRIPE_WEBHOOK] Handling customer.subscription.deleted`);
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        console.log(`[STRIPE_WEBHOOK] Handling invoice.payment_succeeded`);
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        console.log(`[STRIPE_WEBHOOK] Handling invoice.payment_failed`);
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[STRIPE_WEBHOOK] Unhandled event type: ${event.type}`);
    }

    console.log(`[STRIPE_WEBHOOK] Event ${event.type} processed successfully`);
    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Webhook event handlers
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('[STRIPE_WEBHOOK] Processing checkout.session.completed');
    console.log('[STRIPE_WEBHOOK] Session ID:', session.id);
    console.log('[STRIPE_WEBHOOK] Session metadata:', session.metadata);
    console.log('[STRIPE_WEBHOOK] Session subscription ID:', session.subscription);
    
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    console.log(`[STRIPE_WEBHOOK] Extracted userId: ${userId}, planId: ${planId}`);

    if (!userId || !planId) {
      console.error('Missing metadata in checkout session:', { userId, planId, metadata: session.metadata });
      return;
    }

    // Get the subscription from Stripe
    const stripeClient = initializeStripe();
    if (!session.subscription) {
      console.error('No subscription ID in checkout session');
      return;
    }

    console.log(`[STRIPE_WEBHOOK] Retrieving Stripe subscription: ${session.subscription}`);
    const stripeSubscription = await stripeClient.subscriptions.retrieve(
      session.subscription as string
    );
    console.log(`[STRIPE_WEBHOOK] Retrieved subscription status: ${stripeSubscription.status}`);

    // Create or update subscription in database
    console.log(`[STRIPE_WEBHOOK] Raw subscription data - current_period_start: ${(stripeSubscription as any).current_period_start}, current_period_end: ${(stripeSubscription as any).current_period_end}`);
    
    // Safely convert timestamps to dates (using snake_case property names from Stripe)
    const currentPeriodStart = (stripeSubscription as any).current_period_start 
      ? new Date((stripeSubscription as any).current_period_start * 1000)
      : null;
    const currentPeriodEnd = (stripeSubscription as any).current_period_end 
      ? new Date((stripeSubscription as any).current_period_end * 1000)
      : null;
      
    console.log(`[STRIPE_WEBHOOK] Converted dates - start: ${currentPeriodStart}, end: ${currentPeriodEnd}`);
    
    const subscriptionData = {
      userId,
      planId: parseInt(planId),
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: stripeSubscription.customer as string,
      status: stripeSubscription.status,
      currentPeriodStart,
      currentPeriodEnd,
      messagesUsedThisMonth: 0,
    };

    console.log(`[STRIPE_WEBHOOK] Subscription data to save:`, subscriptionData);

    // Check if subscription already exists
    console.log(`[STRIPE_WEBHOOK] Checking for existing subscription for user: ${userId}`);
    const existingSubscription = await storage.getUserSubscription(userId);
    console.log(`[STRIPE_WEBHOOK] Existing subscription found:`, !!existingSubscription);
    
    if (existingSubscription) {
      console.log(`[STRIPE_WEBHOOK] Updating existing subscription ID: ${existingSubscription.id}`);
      await storage.updateSubscription(existingSubscription.id, subscriptionData);
      console.log(`[STRIPE_WEBHOOK] Subscription updated successfully`);
    } else {
      console.log(`[STRIPE_WEBHOOK] Creating new subscription`);
      const newSubscription = await storage.createSubscription(subscriptionData);
      console.log(`[STRIPE_WEBHOOK] New subscription created with ID: ${newSubscription.id}`);
    }

    console.log(`[STRIPE_WEBHOOK] Subscription created/updated for user ${userId}`);
  } catch (error) {
    console.error('Error handling checkout completed:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    throw error; // Re-throw to ensure webhook returns error status
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log('[STRIPE_WEBHOOK] Processing customer.subscription.updated');
    console.log(`[STRIPE_WEBHOOK] Subscription periods - start: ${(subscription as any).current_period_start}, end: ${(subscription as any).current_period_end}`);
    
    // Get current subscription from database to check if billing period changed
    const existingSubscription = await storage.getSubscriptionByStripeId(subscription.id);
    
    const newPeriodStart = (subscription as any).current_period_start 
      ? new Date((subscription as any).current_period_start * 1000) 
      : null;
    const newPeriodEnd = (subscription as any).current_period_end 
      ? new Date((subscription as any).current_period_end * 1000) 
      : null;
    
    let shouldResetMessageCount = false;
    
    // Check if billing period has changed (new billing cycle started)
    if (existingSubscription && existingSubscription.currentPeriodStart && newPeriodStart) {
      const existingPeriodStart = new Date(existingSubscription.currentPeriodStart);
      if (newPeriodStart.getTime() !== existingPeriodStart.getTime()) {
        shouldResetMessageCount = true;
        console.log(`[STRIPE_WEBHOOK] New billing cycle detected - resetting message count`);
        console.log(`[STRIPE_WEBHOOK] Previous period: ${existingPeriodStart}, New period: ${newPeriodStart}`);
      }
    }
    
    const updateData = {
      status: subscription.status,
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      ...(shouldResetMessageCount && { messagesUsedThisMonth: 0 })
    };

    await storage.updateSubscriptionByStripeId(subscription.id, updateData);
    console.log(`[STRIPE_WEBHOOK] Subscription ${subscription.id} updated${shouldResetMessageCount ? ' (message count reset)' : ''}`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log('[STRIPE_WEBHOOK] Processing customer.subscription.deleted');
    
    await storage.updateSubscriptionByStripeId(subscription.id, {
      status: 'canceled',
    });
    
    console.log(`[STRIPE_WEBHOOK] Subscription ${subscription.id} canceled`);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('[STRIPE_WEBHOOK] Processing invoice.payment_succeeded');
    console.log(`[STRIPE_WEBHOOK] Billing reason: ${(invoice as any).billing_reason}`);
    console.log(`[STRIPE_WEBHOOK] Invoice subscription: ${(invoice as any).subscription}`);
    
    if ((invoice as any).subscription) {
      const subscriptionId = (invoice as any).subscription as string;
      
      // Check if this is a subscription renewal (billing_reason: subscription_cycle)
      const isRenewal = (invoice as any).billing_reason === 'subscription_cycle';
      
      const updateData: any = {
        status: 'active',
      };
      
      // Reset message count for renewals
      if (isRenewal) {
        updateData.messagesUsedThisMonth = 0;
        console.log(`[STRIPE_WEBHOOK] Subscription renewal detected - resetting message count`);
      }
      
      await storage.updateSubscriptionByStripeId(subscriptionId, updateData);
      console.log(`[STRIPE_WEBHOOK] Subscription ${subscriptionId} updated${isRenewal ? ' (message count reset for renewal)' : ''}`);
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('[STRIPE_WEBHOOK] Processing invoice.payment_failed');
    
    if (invoice.subscription) {
      await storage.updateSubscriptionByStripeId(invoice.subscription as string, {
        status: 'past_due',
      });
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

// Seed subscription plans (development only)
subscriptionRouter.post("/seed-plans", async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: "Not allowed in production" });
    }

    const plans = [
      {
        name: "Basic",
        description: "Perfect for getting started with chatbots",
        stripePriceId: process.env.PRICE_SUB_BASIC, // Replace with actual Stripe price ID
        stripeProductId: process.env.PROD_SUB_BASIC, // Replace with actual Stripe product ID
        price: 999, // $9.99
        currency: "usd",
        billingInterval: "month",
        maxBots: 1,
        maxMessagesPerMonth: 1000,
        features: ["1 Chatbot", "1,000 messages/month", "Basic support", "Email integration"],
        isActive: true,
      },
      {
        name: "Premium",
        description: "Best for growing businesses",
        stripePriceId: "price_premium", // Replace with actual Stripe price ID
        stripeProductId: "prod_premium", // Replace with actual Stripe product ID
        price: 2999, // $29.99
        currency: "usd",
        billingInterval: "month",
        maxBots: 3,
        maxMessagesPerMonth: 10000,
        features: ["3 Chatbots", "10,000 messages/month", "Priority support", "Advanced analytics", "Custom branding"],
        isActive: true,
      },
      {
        name: "Ultra",
        description: "For enterprises and power users",
        stripePriceId: "price_ultra", // Replace with actual Stripe price ID
        stripeProductId: "prod_ultra", // Replace with actual Stripe product ID
        price: 9999, // $99.99
        currency: "usd",
        billingInterval: "month",
        maxBots: 5,
        maxMessagesPerMonth: 100000,
        features: ["5 Chatbots", "100,000 messages/month", "24/7 support", "White-label solution", "API access"],
        isActive: true,
      },
    ];

    for (const planData of plans) {
      await storage.createSubscriptionPlan(planData);
    }

    res.json({ message: "Subscription plans seeded successfully" });
  } catch (error) {
    console.error("Error seeding subscription plans:", error);
    res.status(500).json({ error: "Failed to seed subscription plans" });
  }
});