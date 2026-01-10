# Phase 1: Core Data Model & API - COMPLETE ✅

**Date**: January 10, 2026
**Duration**: Single session
**Status**: Ready for deployment

---

## Summary

Phase 1 establishes the complete backend infrastructure for the CTA embed system. All database schema changes, Zod validation schemas, and API routes have been implemented with full TypeScript type safety.

---

## Changes Implemented

### 1. ✅ Database Schema (`shared/schema.ts`)

**Added `ctaConfig` column to `embedDesigns` table:**
```typescript
ctaConfig: jsonb("cta_config"), // CTA view configuration
```

**Created comprehensive CTA configuration schemas:**

- **`CTAButtonSchema`**: Button configuration with predefined message
  - `id`, `text`, `variant` (solid|outline|ghost)
  - `predefinedMessage`: Automatically sent when button clicked
  - `actionLabel`: Optional custom action label

- **`CTAComponentSchema`**: Reusable CTA components
  - `type`: header | description | form | button_group | feature_list
  - `props`: Title, description, background image, features
  - Order and visibility control

- **`CTAThemeSchema`**: Color customization
  - Inherits from or overrides embed design colors
  - Primary, background, text, and accent colors

- **`CTASettingsSchema`**: CTA behavior settings
  - `autoShowAfterSeconds`: Optional auto-trigger
  - `dismissible`: Allow users to close
  - `showOncePerSession`: Prevent redundancy

- **`CTAGenerationSchema`**: Track AI-generated CTAs
  - `prompt`: Original generation prompt
  - `model`: AI model used (for audit trail)
  - `timestamp`: When generated

- **`CTAConfigSchema`**: Complete configuration object
  - Composable from above schemas
  - `enabled`: Toggle CTA feature
  - `layout`: Style, position, width
  - `components`: Array of CTA components
  - `primaryButton` + optional `secondaryButton`
  - `theme` + `settings` + `generatedBy`

### 2. ✅ Database Migration (`migrations/0001_add_cta_config.sql`)

**Migration adds:**
- `cta_config` JSONB column to `embed_designs` table
- GIN index on `cta_config` for efficient querying
- Documentation comment explaining the schema

**To apply migration:**
```bash
npm run db:migrate
# or
drizzle-kit push
```

### 3. ✅ Embed Service Updates (`server/embed-service.ts`)

**Updated interface signatures:**
- `CreateEmbedDesignInput`: Added optional `ctaConfig?: CTAConfig`
- `UpdateEmbedDesignInput`: Added optional `ctaConfig?: CTAConfig`

**Updated `createEmbedDesign()` function:**
```typescript
ctaConfig: input.ctaConfig || null, // NEW: CTA config
```

Function now accepts and stores CTA configuration during creation.

### 4. ✅ API Routes Updates (`server/routes/embeds.ts`)

**POST /api/chatbots/:guid/embeds**
- Accepts `ctaConfig` in request body
- Passes to `createEmbedDesign()` service

**PUT /api/chatbots/:guid/embeds/:embedId**
- Accepts `ctaConfig` in request body
- Passes to `updateEmbedDesign()` service
- Allows partial updates (only provided fields)

**GET /api/public/embed/:embedId** (Public API)
- Returns `ctaConfig` in response
- Enables iframe to access CTA configuration
- Maintains backward compatibility (CTA is optional)

**Embed rendering route (/embed/:embedId)**
- Injects `ctaConfig` into `window.__EMBED_CONFIG__` for frontend
- Supports both production and development modes
- Ensures CTA config available to React component

---

## Type Safety & Validation

✅ **Full TypeScript compilation**: No errors
✅ **Zod schema validation**: All schemas compile correctly
✅ **Type inference**: Automatic type generation from schemas
✅ **Optional fields**: CTA is optional, backward compatible

---

## API Examples

### Create Embed with CTA

```http
POST /api/chatbots/abc123/embeds
Content-Type: application/json

{
  "name": "Lead Capture Widget",
  "description": "Collects leads before showing chat",
  "designType": "compact",
  "theme": {
    "primaryColor": "#2563eb",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937"
  },
  "ui": {
    "headerText": "Need Help?",
    "welcomeMessage": "Welcome to our chat!"
  },
  "ctaConfig": {
    "enabled": true,
    "layout": {
      "style": "card",
      "position": "center",
      "width": "wide"
    },
    "components": [
      {
        "id": "header_1",
        "type": "header",
        "order": 0,
        "visible": true,
        "props": {
          "title": "Discover How We Can Help",
          "subtitle": "Get personalized insights in seconds"
        }
      },
      {
        "id": "desc_1",
        "type": "description",
        "order": 1,
        "visible": true,
        "props": {
          "description": "Chat with our AI assistant to explore solutions tailored to your needs."
        }
      }
    ],
    "primaryButton": {
      "id": "btn_start",
      "text": "Start Chat",
      "variant": "solid",
      "predefinedMessage": "Hi! I'm interested in learning more about your services.",
      "actionLabel": "Ask Now"
    },
    "theme": {
      "primaryColor": "#2563eb",
      "backgroundColor": "#f8f9fa",
      "textColor": "#1f2937"
    },
    "settings": {
      "dismissible": true,
      "showOncePerSession": false
    }
  }
}

Response: 201
{
  "id": 1,
  "embedId": "uuid...",
  "name": "Lead Capture Widget",
  "ctaConfig": { ... },
  "createdAt": "2026-01-10T00:00:00.000Z"
}
```

### Retrieve Embed with CTA

```http
GET /api/public/embed/uuid123

Response: 200
{
  "embedId": "uuid123",
  "designType": "compact",
  "theme": { ... },
  "ui": { ... },
  "ctaConfig": {
    "enabled": true,
    "layout": { ... },
    "components": [ ... ],
    "primaryButton": { ... },
    "settings": { ... }
  },
  "chatbotConfigId": 1,
  "chatbotGuid": "abc123",
  "chatbotName": "Customer Support Bot"
}
```

### Update Embed CTA

```http
PUT /api/chatbots/abc123/embeds/uuid123
Content-Type: application/json

{
  "ctaConfig": {
    "enabled": true,
    "primaryButton": {
      "text": "Start Conversation",
      "predefinedMessage": "I need help with my account"
    }
  }
}

Response: 200
{ updated design object }
```

---

## Files Modified

### Schema & Types
- ✅ [shared/schema.ts](shared/schema.ts)
  - Added 6 new Zod schemas (CTAButton, CTAComponent, CTATheme, CTASettings, CTAGeneration, CTAConfig)
  - Updated embedDesigns table definition
  - Exported TypeScript types for all schemas

### Backend Services
- ✅ [server/embed-service.ts](server/embed-service.ts)
  - Updated CreateEmbedDesignInput interface
  - Updated UpdateEmbedDesignInput interface
  - Modified createEmbedDesign() to handle ctaConfig

### API Routes
- ✅ [server/routes/embeds.ts](server/routes/embeds.ts)
  - Updated POST /api/chatbots/:guid/embeds
  - Updated PUT /api/chatbots/:guid/embeds/:embedId
  - Updated GET /api/public/embed/:embedId
  - Updated /embed/:embedId rendering for both prod and dev

### Database
- ✅ [migrations/0001_add_cta_config.sql](migrations/0001_add_cta_config.sql)
  - NEW: SQL migration file to add ctaConfig column

---

## Backward Compatibility

✅ **Fully backward compatible**
- CTA is optional (`ctaConfig?: CTAConfig`)
- Existing embeds without CTA continue to work
- CTA disabled by default (`enabled: false`)
- No breaking changes to existing APIs
- Default to `null` for existing records

---

## Testing Checklist

### Manual API Tests (Ready)
- [ ] Create embed with CTA config
- [ ] Create embed without CTA config (backward compat)
- [ ] Retrieve embed and verify CTA config returned
- [ ] Update embed CTA config
- [ ] Partial update CTA config
- [ ] Verify public API returns CTA config

### TypeScript Checks (✅ Passing)
- [x] No type errors in shared/schema.ts
- [x] No type errors in server/embed-service.ts
- [x] No type errors in server/routes/embeds.ts
- [x] All imports resolve correctly

### Database Migration (Ready)
- [ ] Apply migration to dev database
- [ ] Verify ctaConfig column exists
- [ ] Verify GIN index created
- [ ] Test querying with CTA filter

---

## Next Steps

**Phase 2**: CTA Components & Builder
- Create CTAView component (basic layout)
- Create CTAComponentRegistry (component mapping)
- Create CTABuilder (drag-drop editor)
- Create CTAPreview (live preview modal)
- Add "CTA Setup" tab to EmbedDesignForm

**Phase 3**: AI Assistant Integration
- Create CTAAssistant component (prompt form)
- Implement OpenAI integration for CTA generation
- Add `/api/chatbots/:guid/embeds/cta-assistant` endpoint
- Response parser for CTA generation
- Error handling & fallbacks

**Phase 4**: Stage Management & Transitions
- Update EmbedChatInterface with stage state
- Implement CTA → Chat view transition
- Auto-send predefined message on transition
- Add session-level tracking (ctaShown, ctaClicked)
- Add optional dismiss/close functionality

**Phase 5**: Styling & Polish
- Responsive design for all CTA layouts
- Smooth transitions/animations
- Mobile optimization
- Accessibility audit (WCAG 2.1 AA)
- Theme color application

**Phase 6**: Testing & Deployment
- Unit tests for CTA components
- E2E tests for workflows
- Performance testing
- Security audit
- Documentation

---

## Database Details

**Table**: `embed_designs`
**Column**: `cta_config`
**Type**: JSONB
**Nullable**: Yes (NULL for designs without CTA)
**Index**: GIN index on cta_config for efficient queries
**Default**: NULL (CTA disabled)

**Schema Structure**:
```sql
ALTER TABLE embed_designs ADD COLUMN cta_config jsonb;
CREATE INDEX idx_embed_designs_cta_config ON embed_designs USING GIN(cta_config);
```

---

## Deployment Notes

1. **Database Migration**: Must be run before deploying code
   ```bash
   npm run db:migrate
   ```

2. **TypeScript Compilation**: All changes compile without errors

3. **No Breaking Changes**: Existing code continues to work

4. **Feature Flag**: CTA is disabled by default (`enabled: false`)

5. **Rollback**: If needed, drop the column:
   ```sql
   ALTER TABLE embed_designs DROP COLUMN cta_config;
   ```

---

## Architecture Overview

```
Phase 1: Core Infrastructure (✅ COMPLETE)
├── Database Schema
│   ├── embedDesigns table + ctaConfig column
│   └── GIN index for performance
├── Zod Schemas
│   ├── CTAButton, CTAComponent, CTATheme, CTASettings
│   ├── CTAGeneration, CTAConfig
│   └── TypeScript type exports
├── Service Layer
│   ├── createEmbedDesign() - supports CTA
│   └── updateEmbedDesign() - supports CTA
└── API Routes
    ├── POST /api/chatbots/:guid/embeds - create with CTA
    ├── PUT /api/chatbots/:guid/embeds/:embedId - update CTA
    ├── GET /api/public/embed/:embedId - return CTA config
    └── /embed/:embedId - inject CTA into frontend

Phase 2: Components (Coming Next)
├── CTAView - render CTA view
├── CTABuilder - edit CTA config
├── CTAPreview - live preview
└── EmbedDesignForm - CTA tab integration

Phase 3: AI Integration (Coming Next)
├── CTAAssistant - prompt interface
├── cta-generator - OpenAI service
├── response-parser - parse CTA responses
└── /api/chatbots/:guid/embeds/cta-assistant - endpoint

Phase 4: Stage Management (Coming Next)
├── EmbedChatInterface - stage state
├── Transition logic - CTA → Chat
├── Auto message sending
└── Session tracking
```

---

**Status**: ✅ Phase 1 COMPLETE - Ready for Phase 2 (Components & Builder)

