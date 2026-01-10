# Phase 2 Architecture Diagram

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    EmbedDesignForm-v2                           │
│  (Tabbed form with Design & CTA Setup tabs)                     │
└────────────┬──────────────────────────────┬─────────────────────┘
             │                              │
             ▼                              ▼
      ┌─────────────┐            ┌──────────────────────┐
      │Design Tab   │            │CTA Setup Tab         │
      │(Chat UI)    │            ├──────────────────────┤
      └─────────────┘            │Left: CTABuilder      │
                                 │Right: Live Preview   │
                                 └──────────┬───────────┘
                                            │
                    ┌───────────────────────┴───────────────────┐
                    │                                           │
                    ▼                                           ▼
            ┌──────────────────┐                    ┌─────────────────┐
            │   CTABuilder     │                    │  CTAPreview     │
            │ (Form Interface) │                    │  (Modal)        │
            ├──────────────────┤                    ├─────────────────┤
            │- Enable/Disable  │                    │- Device Select  │
            │- Layout Config   │                    │- Full-Screen    │
            │- Components Mgmt │                    │- Device Frame   │
            │- Button Config   │                    │- CTAView Render │
            │- Settings Panel  │                    └─────────────────┘
            └────────┬─────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    onChange(config)    onPreviewToggle()
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
            ┌──────────────────┐
            │   CTAView        │
            │(Main Render)     │
            ├──────────────────┤
            │- Theme Inject    │
            │- Component Sort  │
            │- Registry Render │
            │- Button Handlers │
            └────────┬─────────┘
                     │
         ┌───────────┼───────────────────────────┐
         │           │                           │
         ▼           ▼                           ▼
    ┌────────┐  ┌───────────────┐        ┌──────────────┐
    │Registry │  │Components[]   │        │ButtonHandlers│
    │Mapping  │  │               │        │              │
    └────────┘  └────┬──────────┘        └──────────────┘
                     │
      ┌──────────────┼──────────────┬──────────────┐
      │              │              │              │
      ▼              ▼              ▼              ▼
 ┌────────┐   ┌──────────┐  ┌────────────┐  ┌────────┐
 │Header  │   │Description│  │FeatureList │  │Form    │
 │        │   │           │  │            │  │        │
 │- Title │   │- Text     │  │- Grid/List │  │        │
 │- Subtitle│  │- Styled   │  │- Icons     │  │        │
 │- BG    │   │           │  │- Features  │  │        │
 └────────┘   └──────────┘  └────────────┘  └────────┘

```

---

## Data Flow Diagram

```
User Input
   │
   ▼
CTABuilder Form
   │
   ├─ formData (React Hook Form)
   │
   ├─ onChange() callback
   │
   ▼
CTAConfig Object
   {
     version: '1.0',
     enabled: boolean,
     layout: { style, position, width },
     components: CTAComponent[],
     primaryButton: CTAButton,
     settings: CTASettings
   }
   │
   ├─ State Update
   │
   ▼
CTAView & CTAPreview
   │
   ├─ Apply Theme (CSS Variables)
   ├─ Sort Components
   ├─ Map Types to Components
   └─ Render Hierarchy
   │
   ▼
DOM Render
   │
   └─ User Interaction
      │
      ├─ Click Primary Button
      ├─ Click Secondary Button
      └─ Close Modal
         │
         ▼
      Callback (onPrimaryButtonClick, etc)
         │
         └─ Send predefinedMessage to Chat

```

---

## File Dependency Graph

```
┌─────────────────────────────────────────────────┐
│ shared/schema.ts (Phase 1)                      │
│ - CTAConfigSchema (Zod)                         │
│ - TypeScript Type Exports                       │
└────────────┬────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────┬───────────────┐
             │                                             │               │
             ▼                                             ▼               ▼
    ┌──────────────────────┐              ┌──────────────────┐   ┌────────────┐
    │server/embed-service  │              │EmbedDesignForm-v2│   │CTABuilder  │
    │(Phase 1)             │              │                  │   │            │
    │- createEmbedDesign() │              │                  │   │            │
    │  (with ctaConfig)    │              │                  │   │            │
    │- updateEmbedDesign() │              │                  │   │            │
    │  (with ctaConfig)    │              │                  │   │            │
    └──────────────────────┘              └──────────────────┘   └────────────┘
             │                                    │                   │
             │                                    │                   │
             ▼                                    │                   │
    ┌──────────────────────┐                     │                   │
    │server/routes/embeds  │                     │                   │
    │(Phase 1)             │                     │                   │
    │- POST /embeds        │                     │                   │
    │- PUT /embeds         │                     │                   │
    │- GET /embeds         │                     │                   │
    └──────────────────────┘                     │                   │
             │                                    │                   │
             └────────────┬───────────────────────┘                   │
                          │                                           │
                          ▼                                           │
                   Database (PostgreSQL)                              │
                   embed_designs.cta_config                           │
                   (JSONB Column)                                     │
                                                                      │
                                                                      ▼
                                                                ┌──────────────┐
                                                                │cta-component-│
                                                                │registry.tsx  │
                                                                │              │
                                                                │Type Mapping  │
                                                                └──────────────┘
                                                                      │
                      ┌───────────────────────────────────────────────┘
                      │
                      ▼
                ┌──────────────────┐
                │   CTAView        │
                │                  │
                └────────┬─────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌────────┐      ┌──────────┐   ┌──────────────┐
    │cta-    │      │Component  │   │CTAPreview    │
    │styles  │      │Library    │   │(Modal)       │
    │.css    │      │(5 files)  │   │              │
    └────────┘      └──────────┘   └──────────────┘
                          │
                          ├─ CTAHeader
                          ├─ CTADescription
                          ├─ CTAFeatureList
                          ├─ CTAButtonGroup
                          └─ CTAForm

```

---

## Component State Management

```
┌────────────────────────────────────────────────┐
│            EmbedDesignForm-v2                  │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │  React Hook Form                         │ │
│  │  - Design fields (Phase 2)               │ │
│  │  - CTA Config field                      │ │
│  └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
        │
        ├─────────────────────────────────┐
        │                                 │
        ▼                                 ▼
   ┌──────────────┐            ┌──────────────────┐
   │Design Tab    │            │CTA Tab           │
   │(Chat UI)     │            │                  │
   └──────────────┘            ├──────────────────┤
                               │  CTABuilder      │
                               │  ┌────────────┐  │
                               │  │useForm()   │  │
                               │  │- state     │  │
                               │  │- watch     │  │
                               │  │- setValue  │  │
                               │  │- useFieldArray│
                               │  └────────────┘  │
                               └────────┬─────────┘
                                        │
                                   onChange()
                                        │
                                        ▼
                               CTAConfig (Local State)
                                        │
                                        │ Set in form
                                        │
                                        ▼
                               EmbedDesignForm
                               (ctaConfig field)
                                        │
                                        │ onSubmit()
                                        │
                                        ▼
                               API Call
                               POST /api/.../embeds
                               { ctaConfig: {...} }
```

---

## Styling Layer

```
┌─────────────────────────────────────────────────┐
│         cta-styles.css (480 lines)              │
│                                                 │
├─────────────────────────────────────────────────┤
│ CSS Variables                                   │
│ - --cta-primary                                 │
│ - --cta-bg                                      │
│ - --cta-text                                    │
│ - --cta-accent                                  │
└──────────────┬────────────────────┬─────────────┘
               │                    │
               ▼                    ▼
      ┌────────────────┐  ┌──────────────────┐
      │Layout Styles   │  │Component Styles  │
      │                │  │                  │
      │- banner        │  │- header          │
      │- card          │  │- description     │
      │- modal         │  │- feature-list    │
      │- sidebar       │  │- button-group    │
      │                │  │- button-primary  │
      │- Positioning   │  │- button-secondary│
      │  (top/center   │  │- button-variants │
      │   /bottom)     │  │  (solid, outline,│
      │                │  │   ghost)         │
      │- Responsive    │  │                  │
      │  (mobile,      │  │- Interactive     │
      │   tablet,      │  │  (hover, focus)  │
      │   desktop)     │  │                  │
      └────────────────┘  └──────────────────┘
               │                    │
               └─────────┬──────────┘
                         │
                         ▼
              HTML Element Classes
              (Applied by CTAView)
              ┌──────────────────┐
              │cta-layout-card   │
              │cta-position-center
              │cta-header        │
              │cta-button-primary│
              └──────────────────┘
```

---

## API Integration Points

```
┌──────────────────────────────────────────────────┐
│         REST API Endpoints                       │
│         (from Phase 1)                           │
└──────────┬──────────────────────────────┬────────┘
           │                              │
           ▼                              ▼
    ┌─────────────────┐          ┌────────────────┐
    │POST /embeds     │          │PUT /embeds     │
    │Create Design    │          │Update Design   │
    │                 │          │                │
    │Request:         │          │Request:        │
    │{                │          │{               │
    │ name,           │          │ ctaConfig: {   │
    │ designType,     │          │  enabled,      │
    │ ctaConfig: {    │          │  layout,       │
    │  enabled,       │          │  components    │
    │  layout,        │          │ }              │
    │  components,    │          │}               │
    │  primaryButton  │          │                │
    │ }               │          │Response:       │
    │}                │          │{ id, updated }│
    │                 │          │                │
    │Response:        │          └────────────────┘
    │{ id, ctaConfig }│
    └─────────────────┘
             │
             │
             └──────────┬───────────┐
                        │           │
                        ▼           ▼
                  ┌──────────┐  ┌──────────────┐
                  │Drizzle   │  │PostgreSQL    │
                  │ORM       │  │embed_designs │
                  └──────────┘  │cta_config:   │
                                │JSONB         │
                                └──────────────┘
```

---

## Type System Flow

```
┌──────────────────────────────────┐
│ shared/schema.ts                 │
│                                  │
│ const CTAConfigSchema =          │
│   z.object({...})                │
│                                  │
│ type CTAConfig =                 │
│   z.infer<CTAConfigSchema>       │
└──────────────┬───────────────────┘
               │
         ┌─────┴──────────────────┐
         │                        │
         ▼                        ▼
   ┌──────────────┐         ┌─────────────────┐
   │Runtime       │         │TypeScript       │
   │Validation    │         │Type Inference   │
   │(Zod)         │         │                 │
   │              │         │- Props types    │
   │parseAsync()  │         │- Event types    │
   │safeParse()   │         │- State types    │
   │              │         │- Return types   │
   │Handles       │         │                 │
   │↓ strings     │         │Zero Runtime     │
   │↓ objects     │         │Overhead         │
   │↓ arrays      │         │                 │
   │              │         │Compile-time     │
   │Error msgs    │         │Checking         │
   └──────────────┘         └─────────────────┘
         │                        │
         └─────────┬──────────────┘
                   │
                   ▼
            ┌──────────────────┐
            │React Components  │
            │Type-Safe Props   │
            │& Events          │
            └──────────────────┘
```

---

## Phase 2 Timeline

```
┌──────────────────────────────────────────────────────┐
│  Phase 2: CTA Components & Builder                   │
│  Duration: 1 Session (~4 hours)                      │
└──────────────────────────────────────────────────────┘

Hour 1: Planning & Structure
├─ Create PHASE2_IMPLEMENTATION_PLAN.md
├─ Create directory structure
└─ Plan component architecture

Hour 2: Component Library
├─ Create cta-styles.css
├─ Create 5 core components (Header, Description, Features, Buttons, Form)
├─ Create component registry
└─ Create CTAView orchestrator

Hour 3: Builder & Preview
├─ Create CTABuilder.tsx (Form Interface)
├─ Create CTAPreview.tsx (Device Preview Modal)
└─ Test React Hook Form integration

Hour 4: Integration & Documentation
├─ Create EmbedDesignForm-v2.tsx (Tabbed Version)
├─ Create PHASE2_COMPLETION_REPORT.md
├─ Create CTA_FEATURE_COMPLETE_INDEX.md
└─ Create PHASE2_FINAL_SUMMARY.md

Result: 11 Files, 2000+ Lines, ✅ COMPLETE
```

---

## Dependencies & Imports

```
React Library Stack
├─ react (FC, useState, useEffect, useCallback)
├─ react-hook-form (useForm, FormProvider, useFieldArray, useWatch)
├─ @hookform/resolvers (zodResolver)
└─ zod (schema validation)

Component Imports
├─ CTAView imports all components
├─ CTABuilder imports React Hook Form
├─ CTAPreview imports CTAView
├─ EmbedDesignForm-v2 imports CTABuilder & CTAPreview
└─ All import from shared/schema (Zod types)

Styling
└─ cta-styles.css (imported by CTAView)

Type Imports
└─ CTAConfig, CTAComponent, CTAButton, etc from shared/schema
```

---

**Last Updated:** 2025-01-10  
**Version:** Phase 2 Complete (v2.0)
