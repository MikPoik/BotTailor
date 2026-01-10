-- Migration: Add CTA (Call-to-Action) configuration support to embed designs
-- This migration adds a ctaConfig JSONB column to the embed_designs table
-- to support the new CTA view feature that displays before the chat interface

ALTER TABLE embed_designs 
ADD COLUMN cta_config jsonb;

-- Add index for CTA-enabled designs for faster querying
CREATE INDEX idx_embed_designs_cta_config 
ON embed_designs USING GIN(cta_config);

-- Add comment explaining the new column
COMMENT ON COLUMN embed_designs.cta_config IS 'JSON configuration for CTA (Call-to-Action) view. Structure includes: enabled, layout, components, primaryButton, secondaryButton, theme, settings, and generatedBy metadata.';
