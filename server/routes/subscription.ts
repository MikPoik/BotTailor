import express, { Router } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { z } from "zod";
import {
  insertSubscriptionPlanSchema,
  insertSubscriptionSchema,
} from "@shared/schema";
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
      apiVersion: "2025-08-27.basil",
    });
  }
  return stripe;
};

// Request schemas
const createCheckoutSessionSchema = z.object({
  planId: z.number(),
});

const modifySubscriptionSchema = z.object({
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

    const fullUserId = req.user.claims.sub;
    const userId = fullUserId.includes('|') ? fullUserId.split('|')[1] : fullUserId;
    const subscription = await storage.getUserSubscriptionWithPlan(userId);


    // Return null instead of 404 when no subscription exists
    res.json(subscription);
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

// Create Stripe checkout session
subscriptionRouter.post(
  "/create-checkout-session",
  isAuthenticated,
  async (req: any, res) => {
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

      // Handle Free plan special case - no Stripe integration needed
      if (plan.price === 0 || plan.stripePriceId === "price_free") {
        // Check if user has existing subscription
        const fullUserId = req.user.claims.sub;
        const userId = fullUserId.includes('|') ? fullUserId.split('|')[1] : fullUserId;
        const existingSubscription = await storage.getUserSubscription(
          userId,
        );

        if (existingSubscription) {
          // Update to Free plan
          await storage.updateSubscription(existingSubscription.id, {
            planId: planId,
            status: "active",
            stripeSubscriptionId: null,
            stripeCustomerId: existingSubscription.stripeCustomerId, // Keep customer ID
            currentPeriodStart: new Date(),
            currentPeriodEnd: null,
            messagesUsedThisMonth: 0,
          });
        } else {
          // Create new Free subscription
          await storage.createSubscription({
            userId: userId,
            planId: planId,
            status: "active",
            messagesUsedThisMonth: 0,
          });
        }

        return res.json({ message: "Successfully switched to Free plan" });
      }

      const stripeClient = initializeStripe();

      // Check if user already has a Stripe customer ID
      let customerId: string | undefined;
      const fullUserId = req.user.claims.sub;
      const userId = fullUserId.includes('|') ? fullUserId.split('|')[1] : fullUserId;
      const existingSubscription = await storage.getUserSubscription(
        userId,
      );

      if (existingSubscription?.stripeCustomerId) {
        customerId = existingSubscription.stripeCustomerId;
      } else {
        // Create new Stripe customer
        const customer = await stripeClient.customers.create({
          email: req.user.claims?.email || undefined,
          metadata: {
            userId: userId,
          },
        });
        customerId = customer.id;
      }

      // Create checkout session
      const session = await stripeClient.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${req.headers.origin}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/subscription?canceled=true`,
        metadata: {
          userId: userId,
          planId: planId.toString(),
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  },
);

// Modify existing subscription (upgrade/downgrade)
subscriptionRouter.post("/modify", isAuthenticated, async (req: any, res) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { planId } = modifySubscriptionSchema.parse(req.body);

    // Get current subscription
    const fullUserId = req.user.claims.sub;
    const userId = fullUserId.includes('|') ? fullUserId.split('|')[1] : fullUserId;
    const currentSubscription = await storage.getUserSubscription(
      userId,
    );
    if (!currentSubscription) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    // Get the new subscription plan
    const newPlan = await storage.getSubscriptionPlan(planId);
    if (!newPlan) {
      return res.status(404).json({ error: "Subscription plan not found" });
    }

    // Check if it's actually a different plan
    if (currentSubscription.planId === planId) {
      return res.status(400).json({ error: "Already on this plan" });
    }

    // Handle downgrading to Free plan
    if (newPlan.price === 0 || newPlan.stripePriceId === "price_free") {
      // If user has a paid Stripe subscription, cancel it
      if (currentSubscription.stripeSubscriptionId) {
        const stripeClient = initializeStripe();

        // Cancel the Stripe subscription immediately
        await stripeClient.subscriptions.cancel(
          currentSubscription.stripeSubscriptionId,
        );
        console.log(
          `[SUBSCRIPTION] Canceled Stripe subscription ${currentSubscription.stripeSubscriptionId} for downgrade to Free`,
        );
      }

      // Update database to Free plan
      await storage.updateSubscription(currentSubscription.id, {
        planId: planId,
        status: "active",
        stripeSubscriptionId: null,
        currentPeriodStart: new Date(),
        currentPeriodEnd: null,
        messagesUsedThisMonth: 0,
      });

      console.log(
        `[SUBSCRIPTION] Downgraded user ${userId} to Free plan`,
      );

      return res.json({
        message: "Successfully downgraded to Free plan",
        subscription: { planId, status: "active" },
      });
    }

    // Handle upgrading from Free to paid plan
    if (!currentSubscription.stripeSubscriptionId) {
      // User is on Free plan, redirect to checkout for paid plan
      return res.status(400).json({
        error: "Please use the checkout process to upgrade from Free plan",
        requiresCheckout: true,
      });
    }

    // Handle paid plan to paid plan changes
    const stripeClient = initializeStripe();

    // Retrieve the subscription from Stripe
    const stripeSubscription = await stripeClient.subscriptions.retrieve(
      currentSubscription.stripeSubscriptionId,
    );

    // Update the subscription with the new price
    const updatedSubscription = await stripeClient.subscriptions.update(
      currentSubscription.stripeSubscriptionId,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newPlan.stripePriceId,
          },
        ],
        proration_behavior: "create_prorations", // Safer and more widely supported
        cancel_at_period_end: false, // Clear any scheduled cancellations
      },
    );

    // Update our database with the new plan ID
    await storage.updateSubscription(currentSubscription.id, {
      planId: planId,
      status: "active", // Ensure status is active
    });

    console.log(
      `[SUBSCRIPTION] Modified subscription ${currentSubscription.stripeSubscriptionId} to plan ${planId}`,
    );

    res.json({
      message: "Subscription modified successfully",
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("Error modifying subscription:", error);
    res.status(500).json({ error: "Failed to modify subscription" });
  }
});

// Cancel subscription
subscriptionRouter.post("/cancel", isAuthenticated, async (req: any, res) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get current subscription
    const fullUserId = req.user.claims.sub;
    const userId = fullUserId.includes('|') ? fullUserId.split('|')[1] : fullUserId;
    const currentSubscription = await storage.getUserSubscription(
      userId,
    );
    if (!currentSubscription || !currentSubscription.stripeSubscriptionId) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    if (currentSubscription.status === "canceled") {
      return res
        .status(400)
        .json({ error: "Subscription is already canceled" });
    }

    const stripeClient = initializeStripe();

    // Cancel the subscription at the end of the current period
    const canceledSubscription = await stripeClient.subscriptions.update(
      currentSubscription.stripeSubscriptionId,
      {
        cancel_at_period_end: true,
      },
    );

    // Update our database
    await storage.updateSubscription(currentSubscription.id, {
      cancelAtPeriodEnd: true, // Track that subscription is canceled at period end
    });

    console.log(
      `[SUBSCRIPTION] Canceled subscription ${currentSubscription.stripeSubscriptionId} at period end`,
    );

    res.json({
      message:
        "Subscription will be canceled at the end of the current billing period",
      subscription: canceledSubscription,
      cancels_at: canceledSubscription.cancel_at,
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

// Resume subscription
subscriptionRouter.post("/resume", isAuthenticated, async (req: any, res) => {
  try {
    if (!req.user?.claims?.sub) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const fullUserId = req.user.claims.sub;
    const userId = fullUserId.includes('|') ? fullUserId.split('|')[1] : fullUserId;

    // Get current subscription
    const currentSubscription = await storage.getUserSubscription(userId);

    if (!currentSubscription || !currentSubscription.stripeSubscriptionId) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    if (!currentSubscription.cancelAtPeriodEnd) {
      return res.status(400).json({ error: "Subscription is not scheduled for cancellation" });
    }

    const stripeClient = initializeStripe();

    // Resume the subscription by removing cancel_at_period_end
    const resumedSubscription = await stripeClient.subscriptions.update(
      currentSubscription.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      },
    );

    // Update our database
    await storage.updateSubscription(currentSubscription.id, {
      cancelAtPeriodEnd: false,
    });

    console.log(
      `[SUBSCRIPTION] Resumed subscription ${currentSubscription.stripeSubscriptionId} for user ${userId}`,
    );

    res.json({
      message: "Subscription resumed successfully",
      subscription: resumedSubscription,
    });
  } catch (error) {
    console.error("Error resuming subscription:", error);
    res.status(500).json({ error: "Failed to resume subscription" });
  }
});

// Stripe webhook handler (exported for direct mounting at /api/webhook)
export const webhookHandler = express.Router();
webhookHandler.post("/", async (req, res) => {
  console.log(`[STRIPE_WEBHOOK] Received webhook request`);

  try {
    const stripeClient = initializeStripe();
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      console.error("[STRIPE_WEBHOOK] Missing signature or webhook secret");
      return res
        .status(400)
        .json({ error: "Missing signature or webhook secret" });
    }

    let event: Stripe.Event;

    try {
      event = stripeClient.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return res.status(400).json({ error: "Invalid signature" });
    }

    console.log(
      `[STRIPE_WEBHOOK] Processing event: ${event.type}, ID: ${event.id}`,
    );

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
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
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    if (!userId || !planId) {
      console.error("[STRIPE_WEBHOOK] Missing metadata in checkout session:", {
        userId,
        planId,
      });
      return;
    }

    // Get the subscription from Stripe
    const stripeClient = initializeStripe();
    if (!session.subscription) {
      console.error("No subscription ID in checkout session");
      return;
    }

    const stripeSubscription = await stripeClient.subscriptions.retrieve(
      session.subscription as string,
    );
    // Convert timestamps to dates (using snake_case property names from Stripe)
    const currentPeriodStart = (stripeSubscription as any).current_period_start
      ? new Date((stripeSubscription as any).current_period_start * 1000)
      : null;
    const currentPeriodEnd = (stripeSubscription as any).current_period_end
      ? new Date((stripeSubscription as any).current_period_end * 1000)
      : null;

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

    // Check if subscription already exists
    const existingSubscription = await storage.getUserSubscription(userId);

    if (existingSubscription) {
      await storage.updateSubscription(
        existingSubscription.id,
        subscriptionData,
      );
    } else {
      await storage.createSubscription(subscriptionData);
    }

    console.log(
      `[STRIPE_WEBHOOK] Subscription created/updated for user ${userId}`,
    );
  } catch (error) {
    console.error("Error handling checkout completed:", error);
    throw error; // Re-throw to ensure webhook returns error status
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Get current subscription from database to check if billing period changed
    const existingSubscription = await storage.getSubscriptionByStripeId(
      subscription.id,
    );

    const newPeriodStart = (subscription as any).current_period_start
      ? new Date((subscription as any).current_period_start * 1000)
      : null;
    const newPeriodEnd = (subscription as any).current_period_end
      ? new Date((subscription as any).current_period_end * 1000)
      : null;

    let shouldResetMessageCount = false;

    // Check if billing period has changed (new billing cycle started)
    if (
      existingSubscription &&
      existingSubscription.currentPeriodStart &&
      newPeriodStart
    ) {
      const existingPeriodStart = new Date(
        existingSubscription.currentPeriodStart,
      );
      if (newPeriodStart.getTime() !== existingPeriodStart.getTime()) {
        shouldResetMessageCount = true;
        console.log(
          `[STRIPE_WEBHOOK] New billing cycle detected - resetting message count`,
        );
        console.log(
          `[STRIPE_WEBHOOK] Previous period: ${existingPeriodStart}, New period: ${newPeriodStart}`,
        );
      }
    }

    // Read the actual cancelAtPeriodEnd status from Stripe
    const cancelAtPeriodEnd = Boolean((subscription as any).cancel_at_period_end);

    const updateData = {
      status: subscription.status,
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      cancelAtPeriodEnd, // Respect Stripe's cancel_at_period_end flag
      ...(shouldResetMessageCount && { messagesUsedThisMonth: 0 }),
    };

    console.log(
      `[STRIPE_WEBHOOK] Updating subscription with cancelAtPeriodEnd: ${cancelAtPeriodEnd} (from Stripe: ${(subscription as any).cancel_at_period_end})`,
    );

    await storage.updateSubscriptionByStripeId(subscription.id, updateData);
    console.log(
      `[STRIPE_WEBHOOK] Subscription ${subscription.id} updated${shouldResetMessageCount ? " (message count reset)" : ""}`,
    );
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log("[STRIPE_WEBHOOK] Processing customer.subscription.deleted");

    await storage.updateSubscriptionByStripeId(subscription.id, {
      status: "canceled",
    });

    console.log(`[STRIPE_WEBHOOK] Subscription ${subscription.id} canceled`);
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log("[STRIPE_WEBHOOK] Processing invoice.payment_succeeded");
    console.log(
      `[STRIPE_WEBHOOK] Billing reason: ${(invoice as any).billing_reason}`,
    );
    console.log(
      `[STRIPE_WEBHOOK] Invoice subscription: ${(invoice as any).subscription}`,
    );

    if ((invoice as any).subscription) {
      const subscriptionId = (invoice as any).subscription as string;

      // Check if this is a subscription renewal (billing_reason: subscription_cycle)
      const isRenewal =
        (invoice as any).billing_reason === "subscription_cycle";

      const updateData: any = {
        status: "active",
      };

      // Reset message count for renewals
      if (isRenewal) {
        updateData.messagesUsedThisMonth = 0;
        console.log(
          `[STRIPE_WEBHOOK] Subscription renewal detected - resetting message count`,
        );
      }

      await storage.updateSubscriptionByStripeId(subscriptionId, updateData);
      console.log(
        `[STRIPE_WEBHOOK] Subscription ${subscriptionId} updated${isRenewal ? " (message count reset for renewal)" : ""}`,
      );
    }
  } catch (error) {
    console.error("Error handling payment succeeded:", error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log("[STRIPE_WEBHOOK] Processing invoice.payment_failed");

    if ((invoice as any).subscription) {
      await storage.updateSubscriptionByStripeId(
        (invoice as any).subscription as string,
        {
          status: "past_due",
        },
      );
    }
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

// Seed subscription plans (development only)
subscriptionRouter.post("/seed-plans", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Not allowed in production" });
    }

    const plans = [
      {
        name: "Free",
        description: "Get started with basic chatbot functionality",
        stripePriceId: "price_free", // No actual Stripe price for free plan
        stripeProductId: "prod_free", // No actual Stripe product for free plan
        price: 0, // Free
        currency: "eur",
        billingInterval: "month",
        maxBots: 1,
        maxMessagesPerMonth: 100,
        features: ["1 chatbot", "100 messages/month", "Community support"],
        isActive: true,
      },
      {
        name: "Basic",
        description: "Essential features for small businesses",
        stripePriceId: process.env.PRICE_SUB_BASIC || "", // Replace with actual Stripe price ID
        stripeProductId: process.env.PROD_SUB_BASIC || "", // Replace with actual Stripe product ID
        price: 999, // $9.99
        currency: "eur",
        billingInterval: "month",
        maxBots: 1,
        maxMessagesPerMonth: 1000,
        features: [
          "1 chatbot",
          "1,000 messages/month",
          "Basic support",
          "Email integration",
        ],
        isActive: true,
      },
      {
        name: "Premium",
        description: "Advanced features for growing businesses",
        stripePriceId: process.env.PRICE_SUB_PREMIUM, // Replace with actual Stripe price ID
        stripeProductId: process.env.PROD_SUB_PREMIUM, // Replace with actual Stripe product ID
        price: 2999, // $29.99
        currency: "eur",
        billingInterval: "month",
        maxBots: 3,
        maxMessagesPerMonth: 10000,
        features: [
          "3 chatbots",
          "10,000 messages/month",
          "Priority support",
          "Advanced analytics",
          "Custom branding",
        ],
        isActive: true,
      },
      {
        name: "Ultra",
        description: "Complete solution for enterprises and agencies",
        stripePriceId: process.env.PRICE_SUB_ULTRA, // Replace with actual Stripe price ID
        stripeProductId: process.env.PROD_SUB_ULTRA, // Replace with actual Stripe product ID
        price: 9999, // $99.99
        currency: "eur",
        billingInterval: "month",
        maxBots: 5,
        maxMessagesPerMonth: 100000,
        features: [
          "5 chatbots",
          "100,000 messages/month",
          "24/7 support",
          "White-label solution",
          "API access",
        ],
        isActive: true,
      },
    ];

    for (const planData of plans) {
      if (planData.stripePriceId && planData.stripeProductId) {
        await storage.createSubscriptionPlan(planData);
      }
    }

    res.json({ message: "Subscription plans seeded successfully" });
  } catch (error) {
    console.error("Error seeding subscription plans:", error);
    res.status(500).json({ error: "Failed to seed subscription plans" });
  }
});