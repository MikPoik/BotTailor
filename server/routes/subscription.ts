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

// Stripe webhook handler
subscriptionRouter.post("/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const stripeClient = initializeStripe();
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(400).json({ error: "Missing signature or webhook secret" });
    }

    let event: Stripe.Event;

    try {
      event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).json({ error: "Invalid signature" });
    }

    console.log(`[STRIPE_WEBHOOK] Processing event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[STRIPE_WEBHOOK] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Webhook event handlers
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('[STRIPE_WEBHOOK] Processing checkout.session.completed');
    
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (!userId || !planId) {
      console.error('Missing metadata in checkout session');
      return;
    }

    // Get the subscription from Stripe
    const stripeClient = initializeStripe();
    if (!session.subscription) {
      console.error('No subscription ID in checkout session');
      return;
    }

    const stripeSubscription = await stripeClient.subscriptions.retrieve(
      session.subscription as string
    );

    // Create or update subscription in database
    const subscriptionData = {
      userId,
      planId: parseInt(planId),
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: stripeSubscription.customer as string,
      status: stripeSubscription.status,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      messagesUsedThisMonth: 0,
    };

    // Check if subscription already exists
    const existingSubscription = await storage.getUserSubscription(userId);
    
    if (existingSubscription) {
      await storage.updateSubscription(existingSubscription.id, subscriptionData);
    } else {
      await storage.createSubscription(subscriptionData);
    }

    console.log(`[STRIPE_WEBHOOK] Subscription created/updated for user ${userId}`);
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log('[STRIPE_WEBHOOK] Processing customer.subscription.updated');
    
    const updateData = {
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };

    await storage.updateSubscriptionByStripeId(subscription.id, updateData);
    console.log(`[STRIPE_WEBHOOK] Subscription ${subscription.id} updated`);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
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
    
    if (invoice.subscription) {
      await storage.updateSubscriptionByStripeId(invoice.subscription as string, {
        status: 'active',
      });
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
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