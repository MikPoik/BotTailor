/**
 * Idempotent subscription plan seeder for billing domain.
 *
 * Responsibilities:
 * - Seeds all subscription plans in the DB, mapping to Stripe price/product IDs from env vars.
 * - Updates existing plans or creates new ones as needed (idempotent).
 * - Used by /seed-plans endpoint in dev and as a standalone script (see README).
 *
 * Constraints & Edge Cases:
 * - All plan/product IDs must match Stripe dashboard and env vars.
 * - STRIPE_SECRET_KEY and plan envs must be set for production use.
 * - Currency and billing interval are hardcoded (eur/month); update with care.
 * - Should be run in CI or staging before enabling production checkout flows.
 */
// Run with `npx tsx server/seed-plans.ts`

import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedSubscriptionPlans() {
  console.log("Starting subscription plans seeding...");

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
      features: [
        "1 chatbot",
        "100 messages",
        "Community support",
        "Email integration",
        "Analytics",
        "Custom Branding",
      ],
      isActive: true,
    },
    {
      name: "Basic",
      description: "Essential features for small businesses",
      stripePriceId: process.env.PRICE_SUB_BASIC || "price_basic", // Replace with actual Stripe price ID
      stripeProductId: process.env.PROD_SUB_BASIC || "prod_basic", // Replace with actual Stripe product ID
      price: 999, // $9.99
      currency: "eur",
      billingInterval: "month",
      maxBots: 1,
      maxMessagesPerMonth: 1000,
      features: [
        "1 chatbot",
        "1,000 messages/month",
        "Email integration",
        "Analytics",
        "Custom Branding",
      ],
      isActive: true,
    },
    {
      name: "Premium",
      description: "Advanced features for growing businesses",
      stripePriceId: process.env.PRICE_SUB_PREMIUM || "price_premium", // Replace with actual Stripe price ID
      stripeProductId: process.env.PROD_SUB_PREMIUM || "prod_premium", // Replace with actual Stripe product ID
      price: 2999, // $29.99
      currency: "eur",
      billingInterval: "month",
      maxBots: 3,
      maxMessagesPerMonth: 10000,
      features: [
        "3 chatbots",
        "10,000 messages/month",
        "Email integration",
        "Analytics",
        "Custom branding",
      ],
      isActive: true,
    },
    {
      name: "Ultra",
      description: "Complete solution for enterprises and agencies",
      stripePriceId: process.env.PRICE_SUB_ULTRA || "price_ultra", // Replace with actual Stripe price ID
      stripeProductId: process.env.PROD_SUB_ULTRA || "prod_ultra", // Replace with actual Stripe product ID
      price: 9999, // $99.99
      currency: "eur",
      billingInterval: "month",
      maxBots: 5,
      maxMessagesPerMonth: 100000,
      features: [
        "5 chatbots",
        "100,000 messages/month",
        "Email integration",
        "Analytics",
        "Custom Branding",
      ],
      isActive: true,
    },
  ];

  try {
    for (const planData of plans) {
      // Check if plan already exists
      const existingPlan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.name, planData.name))
        .limit(1);

      if (existingPlan.length > 0) {
        // Update the existing plan
        const [updatedPlan] = await db
          .update(subscriptionPlans)
          .set({ ...planData, updatedAt: new Date() })
          .where(eq(subscriptionPlans.name, planData.name))
          .returning();

        console.log(
          `Updated plan: ${updatedPlan.name} (ID: ${updatedPlan.id})`,
        );
        continue;
      }

      // Create the plan if it doesn't exist
      const [createdPlan] = await db
        .insert(subscriptionPlans)
        .values(planData)
        .returning();

      console.log(`Created plan: ${createdPlan.name} (ID: ${createdPlan.id})`);
    }

    console.log("Subscription plans seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding subscription plans:", error);
    throw error;
  }
}

// Run the seeding function
seedSubscriptionPlans()
  .then(() => {
    console.log("Seeding finished.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
