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
      features: ["1 Chatbot", "100 messages/month", "Community support"],
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
        "1 Chatbot",
        "1,000 messages/month",
        "Basic support",
        "Email integration",
      ],
      isActive: true,
    },
    {
      name: "Premium",
      description: "Advanced features for growing businesses",
      stripePriceId: "price_premium", // Replace with actual Stripe price ID
      stripeProductId: "prod_premium", // Replace with actual Stripe product ID
      price: 2999, // $29.99
      currency: "eur",
      billingInterval: "month",
      maxBots: 3,
      maxMessagesPerMonth: 10000,
      features: [
        "3 Chatbots",
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
      stripePriceId: "price_ultra", // Replace with actual Stripe price ID
      stripeProductId: "prod_ultra", // Replace with actual Stripe product ID
      price: 9999, // $99.99
      currency: "eur",
      billingInterval: "month",
      maxBots: 5,
      maxMessagesPerMonth: 100000,
      features: [
        "5 Chatbots",
        "100,000 messages/month",
        "24/7 support",
        "White-label solution",
        "API access",
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
        console.log(`Plan "${planData.name}" already exists, skipping...`);
        continue;
      }

      // Create the plan
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
