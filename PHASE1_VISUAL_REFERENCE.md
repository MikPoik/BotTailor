# CTA Feature - Phase 1 Visual Reference

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (React)                       │
│                   (Phase 2 - Coming Next)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ EmbedDesignForm  │ CTABuilder │ CTAPreview │ CTAAssistant│  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ POST/PUT with ctaConfig
                         │
┌─────────────────────────▼────────────────────────────────────────┐
│                    API ROUTES (Express)                          │
│              ✅ Phase 1 - IMPLEMENTED                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ POST   /api/chatbots/:guid/embeds         ✅ Updated     │  │
│  │ PUT    /api/chatbots/:guid/embeds/:id     ✅ Updated     │  │
│  │ GET    /api/public/embed/:embedId         ✅ Updated     │  │
│  │ GET    /embed/:embedId                    ✅ Updated     │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ createEmbedDesign / updateEmbedDesign
                         │
┌─────────────────────────▼────────────────────────────────────────┐
│              SERVICE LAYER (embed-service.ts)                    │
│              ✅ Phase 1 - IMPLEMENTED                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • createEmbedDesign()     → accepts ctaConfig ✅         │  │
│  │ • updateEmbedDesign()     → accepts ctaConfig ✅         │  │
│  │ • getEmbedDesignByEmbedId()  → returns ctaConfig ✅      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ INSERT/UPDATE/SELECT
                         │
┌─────────────────────────▼────────────────────────────────────────┐
│           DATABASE LAYER (PostgreSQL)                            │
│              ✅ Phase 1 - MIGRATION READY                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Table: embed_designs                                     │  │
│  │ ┌────────────────────────────────────────────────────┐  │  │
│  │ │ id                   INTEGER (PK)                  │  │  │
│  │ │ chatbot_config_id    INTEGER (FK)                  │  │  │
│  │ │ user_id              VARCHAR (FK)                  │  │  │
│  │ │ embed_id             VARCHAR (UNIQUE)              │  │  │
│  │ │ design_type          VARCHAR                       │  │  │
│  │ │ primary_color        VARCHAR                       │  │  │
│  │ │ background_color     VARCHAR                       │  │  │
│  │ │ text_color           VARCHAR                       │  │  │
│  │ │ welcome_message      TEXT                          │  │  │
│  │ │ cta_config           JSONB         ✅ NEW          │  │  │
│  │ │ created_at           TIMESTAMP                     │  │  │
│  │ │ updated_at           TIMESTAMP                     │  │  │
│  │ └────────────────────────────────────────────────────┘  │  │
│  │                                                          │  │
│  │ Index: idx_embed_designs_cta_config (GIN) ✅ NEW       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Schema Composition

```
CTAConfig
├── version: "1.0"
├── enabled: boolean
├── layout: CTALayout
│   ├── style: "banner" | "card" | "modal" | "sidebar"
│   ├── position: "top" | "center" | "bottom"
│   └── width: "full" | "wide" | "narrow"
├── components: CTAComponent[]
│   └── CTAComponent
│       ├── id: string
│       ├── type: "header" | "description" | "form" | "button_group" | "feature_list"
│       ├── order: number
│       ├── visible: boolean
│       └── props: object
├── primaryButton: CTAButton
│   ├── id: string
│   ├── text: string
│   ├── variant: "solid" | "outline" | "ghost"
│   ├── predefinedMessage: string
│   └── actionLabel?: string
├── secondaryButton?: CTAButton
├── theme?: CTATheme
│   ├── primaryColor?: string
│   ├── backgroundColor?: string
│   ├── textColor?: string
│   └── accentColor?: string
├── generatedBy?: CTAGeneration
│   ├── prompt: string
│   ├── model: string
│   └── timestamp: Date
└── settings?: CTASettings
    ├── autoShowAfterSeconds?: number
    ├── dismissible: boolean
    └── showOncePerSession: boolean
```

---

## API Request/Response Cycle

### Create Embed with CTA

```
┌─ Client (Frontend)
│
├─ Prepares Request
│  ├── name: "My Widget"
│  ├── designType: "compact"
│  ├── theme: { primaryColor: "#2563eb", ... }
│  └── ctaConfig: {
│      enabled: true,
│      layout: { style: "card", ... },
│      primaryButton: { text: "Start", ... }
│    }
│
├─ POST /api/chatbots/abc123/embeds
│
├─ Server Receives
│  ├── Validates ctaConfig with CTAConfigSchema
│  ├── Passes to createEmbedDesign()
│  └── Service layer stores in DB
│
├─ Database Stores
│  ├── INSERT into embed_designs
│  │   VALUES (id, chatbot_id, user_id, ..., cta_config: JSON)
│  └── JSONB column stores configuration
│
├─ Server Response
│  ├── Returns 201 Created
│  └── Includes full design with ctaConfig
│
└─ Client Receives
   ├── ID: 1
   ├── embedId: "uuid-123"
   ├── ctaConfig: { ... }
   └── Success!
```

---

## TypeScript Type Flow

```
┌─ Zod Schema Definition
│  │
│  ├─ CTAButtonSchema
│  ├─ CTAComponentSchema
│  ├─ CTAThemeSchema
│  ├─ CTASettingsSchema
│  ├─ CTAGenerationSchema
│  └─ CTAConfigSchema
│
├─ Type Inference (z.infer)
│  │
│  ├─ type CTAButton = z.infer<typeof CTAButtonSchema>
│  ├─ type CTAComponent = z.infer<typeof CTAComponentSchema>
│  ├─ type CTATheme = z.infer<typeof CTAThemeSchema>
│  ├─ type CTASettings = z.infer<typeof CTASettingsSchema>
│  ├─ type CTAGeneration = z.infer<typeof CTAGenerationSchema>
│  └─ type CTAConfig = z.infer<typeof CTAConfigSchema>
│
├─ Export from shared/schema
│  │
│  └─ export type CTAConfig { ... }
│
├─ Import in Services
│  │
│  ├─ embed-service.ts
│  └─ routes/embeds.ts
│
├─ Use in Functions
│  │
│  ├─ createEmbedDesign(input: CreateEmbedDesignInput)
│  │   where CreateEmbedDesignInput.ctaConfig?: CTAConfig
│  │
│  └─ updateEmbedDesign(input: UpdateEmbedDesignInput)
│      where UpdateEmbedDesignInput.ctaConfig?: CTAConfig
│
└─ Full Type Safety ✅
   ├─ Compile-time validation
   ├─ Runtime validation via Zod
   └─ Zero errors
```

---

## Database Migration Timeline

```
┌─ Before Migration
│  │
│  ├─ Table: embed_designs
│  └─ Columns: id, chatbot_config_id, user_id, ..., (no cta_config)
│
├─ Migration Execution
│  │
│  ├─ ALTER TABLE embed_designs ADD COLUMN cta_config jsonb;
│  ├─ CREATE INDEX idx_embed_designs_cta_config ON embed_designs USING GIN(cta_config);
│  └─ ✅ Success
│
└─ After Migration
   │
   ├─ Table: embed_designs
   ├─ Columns: id, chatbot_config_id, user_id, ..., cta_config
   ├─ Index: idx_embed_designs_cta_config (GIN)
   └─ Ready for CTA data ✅
```

---

## API Endpoint Summary

```
┌─────────────────────────────────────────────────────────────┐
│               EMBED DESIGN API ENDPOINTS                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. CREATE EMBED DESIGN                                      │
│    POST /api/chatbots/:guid/embeds                          │
│    ├─ Requires: Authentication                             │
│    ├─ Accepts: name, designType, theme, ui, ctaConfig ✅   │
│    └─ Returns: Created design with embedId                 │
│                                                              │
│ 2. GET ALL EMBED DESIGNS                                    │
│    GET /api/chatbots/:guid/embeds                           │
│    ├─ Requires: Authentication                             │
│    └─ Returns: Array of designs with ctaConfig ✅          │
│                                                              │
│ 3. GET SPECIFIC EMBED DESIGN                                │
│    GET /api/chatbots/:guid/embeds/:embedId                  │
│    ├─ Requires: Authentication                             │
│    └─ Returns: Design detail with ctaConfig ✅             │
│                                                              │
│ 4. UPDATE EMBED DESIGN                                      │
│    PUT /api/chatbots/:guid/embeds/:embedId                  │
│    ├─ Requires: Authentication                             │
│    ├─ Accepts: name, designType, theme, ui, ctaConfig ✅   │
│    └─ Returns: Updated design                              │
│                                                              │
│ 5. DELETE EMBED DESIGN                                      │
│    DELETE /api/chatbots/:guid/embeds/:embedId               │
│    ├─ Requires: Authentication                             │
│    └─ Returns: Success confirmation                        │
│                                                              │
│ 6. GET PUBLIC EMBED CONFIG (FOR IFRAME)                     │
│    GET /api/public/embed/:embedId                           │
│    ├─ Requires: None (public)                              │
│    └─ Returns: Design config including ctaConfig ✅        │
│                                                              │
│ 7. RENDER EMBED PAGE                                        │
│    GET /embed/:embedId                                      │
│    ├─ Requires: None (public)                              │
│    ├─ Injects: ctaConfig into window.__EMBED_CONFIG__ ✅   │
│    └─ Returns: HTML with React SPA                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘

✅ = Updated for Phase 1
```

---

## CTA Configuration Example

```json
{
  "version": "1.0",
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
        "title": "Welcome to Our Support",
        "subtitle": "Get instant answers from our AI"
      }
    },
    {
      "id": "features_1",
      "type": "feature_list",
      "order": 1,
      "visible": true,
      "props": {
        "features": [
          {
            "icon": "⚡",
            "title": "Instant Responses",
            "description": "Get answers in seconds"
          },
          {
            "icon": "🤖",
            "title": "AI Powered",
            "description": "Smart, context-aware replies"
          },
          {
            "icon": "👥",
            "title": "Human Handoff",
            "description": "Escalate to agents anytime"
          }
        ]
      }
    }
  ],
  "primaryButton": {
    "id": "btn_start_chat",
    "text": "Start Chat Now",
    "variant": "solid",
    "predefinedMessage": "Hi! I'd like to get some help with...",
    "actionLabel": "Ask a Question"
  },
  "theme": {
    "primaryColor": "#2563eb",
    "backgroundColor": "#f8f9fa",
    "textColor": "#1f2937",
    "accentColor": "#dbeafe"
  },
  "settings": {
    "dismissible": true,
    "showOncePerSession": true
  }
}
```

---

## Deployment Sequence

```
                    ┌─────────────────────────┐
                    │   Code Review Done ✅   │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  DB Backup Created ✅   │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │     Migration Applied to Database ✅             │
        │  • Column added: cta_config JSONB              │
        │  • Index created: idx_embed_designs_cta_config │
        └────────────────────────┬────────────────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │     Migration Verified ✅                        │
        │  • Column exists and type correct               │
        │  • Index created successfully                   │
        │  • No data corruption                           │
        └────────────────────────┬────────────────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │     Code Deployed ✅                             │
        │  • Service layer updated                        │
        │  • Routes updated                               │
        │  • Schema types available                       │
        └────────────────────────┬────────────────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │     API Testing ✅                               │
        │  • Create with CTA                              │
        │  • Retrieve with CTA                            │
        │  • Update CTA config                            │
        │  • Backward compatibility verified              │
        └────────────────────────┬────────────────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │     Phase 1 Complete ✅                          │
        │     Ready for Phase 2: Components & Builder     │
        └─────────────────────────────────────────────────┘
```

---

## File Organization

```
Workspace Root
│
├── 📁 migrations/
│   └── 0001_add_cta_config.sql ✅
│
├── 📁 shared/
│   └── schema.ts ✅
│       ├── embedDesigns table + ctaConfig
│       ├── CTAButtonSchema
│       ├── CTAComponentSchema
│       ├── CTAThemeSchema
│       ├── CTASettingsSchema
│       ├── CTAGenerationSchema
│       └── CTAConfigSchema
│
├── 📁 server/
│   ├── embed-service.ts ✅
│   │   ├── CreateEmbedDesignInput (updated)
│   │   ├── UpdateEmbedDesignInput (updated)
│   │   ├── createEmbedDesign() (updated)
│   │   └── updateEmbedDesign() (updated)
│   │
│   └── 📁 routes/
│       └── embeds.ts ✅
│           ├── POST /api/chatbots/:guid/embeds (updated)
│           ├── PUT /api/chatbots/:guid/embeds/:id (updated)
│           ├── GET /api/public/embed/:embedId (updated)
│           └── GET /embed/:embedId (updated)
│
└── 📁 Documentation/
    ├── PHASE1_SUMMARY.md ✅
    ├── PHASE1_CTA_IMPLEMENTATION.md ✅
    ├── CTA_MIGRATION_GUIDE.md ✅
    ├── PHASE1_DEPLOYMENT_CHECKLIST.md ✅
    └── CTA_EMBED_FEATURE_INDEX.md ✅
```

---

**Status**: ✅ Phase 1 Complete

