# Documentation for server/routes/subscription.ts

Initialize Stripe with secret key
Request schemas
Get all subscription plans
Set cache headers for better performance
Get current user subscription
Return null instead of 404 when no subscription exists
Create Stripe checkout session
Get the subscription plan
Handle Free plan special case - no Stripe integration needed
Check if user has existing subscription
Update to Free plan
Create new Free subscription
Check if user already has a Stripe customer ID
Create new Stripe customer
Create checkout session
Modify existing subscription (upgrade/downgrade)
Get current subscription
Get the new subscription plan
Check if it's actually a different plan
Handle downgrading to Free plan
If user has a paid Stripe subscription, cancel it
Cancel the Stripe subscription immediately
Update database to Free plan
Handle upgrading from Free to paid plan
User is on Free plan, redirect to checkout for paid plan
Handle paid plan to paid plan changes
Retrieve the subscription from Stripe
Update the subscription with the new price
Update our database with the new plan ID
Cancel subscription
Get current subscription
Cancel the subscription at the end of the current period
Update our database
Resume subscription
Get current subscription
Resume the subscription by removing cancel_at_period_end
Update our database
Stripe webhook handler (exported for direct mounting at /api/webhook)
Webhook event handlers
Get the subscription from Stripe
Convert timestamps to dates (using snake_case property names from Stripe)
Check if subscription already exists
Get current subscription from database to check if billing period changed
Check if billing period has changed (new billing cycle started)
Use >= comparison to handle cases where the new period start is equal or later
First time subscription update - don't reset for initial setup
Read the actual cancelAtPeriodEnd status from Stripe
Check if this is a subscription renewal or cycle
Reset message count for renewals and subscription updates
Seed subscription plans (development only)
Only create plans that have valid Stripe IDs (not undefined)