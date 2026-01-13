# Documentation for shared/schema.ts

Neon Auth managed schema - reference only, not for migrations
App-specific user data (references Neon Auth users by ID)
AI Chatbot Configuration table
Email configuration for form submissions
Content Sources table for storing website URLs, text content, and metadata
Website Content table for storing parsed content with embeddings
Survey Configuration table for storing survey definitions
Survey Sessions table for tracking user progress through surveys
Subscription Plans table for defining available subscription tiers
User Subscriptions table for tracking user subscription status
Embed Designs table for managing iframe embedding variants
Basic info
Theme customization
UI customization
CTA configuration (NEW)
Advanced options
Embed Design Components table to control which UI elements are shown
User upsert schema for Neon Auth
Chatbot config schemas
Content sources schemas
Make url optional for text sources
Add validation for sourceType
Type exports
Content source types
Survey schemas
Survey types
Subscription schemas
Subscription types
Rich message types
Rating specific metadata
Multiselect specific metadata
Home Screen UI Designer schemas
Survey Configuration schemas
Rating specific metadata
Multiselect specific metadata
Streaming support
Follow-up message support
============================================
CTA Configuration Schemas (NEW)
============================================
Extended styling system for rich CTA design
Supports comprehensive CSS properties for AI layout generation
========== COLORS & OPACITY ==========
Theme color overrides - allows per-component customization
========== BORDERS ==========
========== SHADOWS & EFFECTS ==========
========== SPACING ==========
========== TYPOGRAPHY ==========
========== SIZING ==========
========== DISPLAY & FLEX ==========
========== GRID ==========
========== POSITIONING ==========
========== OVERFLOW ==========
========== TRANSFORMS ==========
========== TRANSITIONS & ANIMATIONS ==========
========== BACKGROUND ==========
========== GRADIENTS & EFFECTS ==========
Feature list
Button group
Badge component
Divider component
Container component (layout wrapper)
RichText component
Layout
Components (similar to homeScreenConfig)
CTA Button Configuration (DEPRECATED - use button_group component instead)
Kept for backward compatibility
Theming
AI Generation tracking
Settings