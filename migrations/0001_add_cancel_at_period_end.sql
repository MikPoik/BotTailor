-- Migration: add cancel_at_period_end to subscriptions
ALTER TABLE IF EXISTS subscriptions
ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false;
