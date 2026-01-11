# Phase 4 Implementation Plan: Two-Stage Rendering & Transition Logic

## 🎯 Objective
Implement the logic to transition from the CTA (Call-To-Action) landing view to the actual Chat Interface. This phase transforms the static CTA into a functional entry point for the AI assistant.

---

## 🏗️ Architecture: The Stage Manager

We will introduce a `stage` state to orchestrate the transition.

### 1. New Hook: `useEmbedStage.ts`
Manage the current visibility state.
- **Stages:** `cta` | `chat`
- **Initial State Logic:**
    - If `ctaConfig.enabled` is false → `chat`
    - If `ctaConfig.settings.showOncePerSession` is true AND session flag exists → `chat`
    - Otherwise → `cta`
- **Transitions:** `transitionToChat(predefinedMessage?: string)`

### 2. Orchestrator: `EmbedStageManager.tsx`
A wrapper component that replaces the direct rendering of `CTAView` or `EmbedMessages`.
- Renders `CTAView` when stage is `cta`.
- Renders `EmbedMessages` + `EmbedInput` when stage is `chat`.
- Handles the "Fade Out" animation during transition.

---

## 📋 Implementation Steps

### Step 1: Create `useEmbedStage` Hook
**Path:** `client/src/hooks/useEmbedStage.ts`
- Implement `useState` for stage.
- Add `useEffect` to check `sessionStorage` for "show once" logic.
- Expose `setStage` and `completeCTA` functions.

### Step 2: Update `EmbedChatInterface.tsx`
**Path:** `client/src/components/embed/EmbedChatInterface.tsx`
- Integrate `useEmbedStage`.
- Wrap the main content in a conditional renderer based on `stage`.
- Pass `transitionToChat` callback to `CTAView`.

### Step 3: Enhance `CTAView.tsx` logic
**Path:** `client/src/components/embed/embed-cta/CTAView.tsx`
- Ensure `onPrimaryButtonClick` and `onSecondaryButtonClick` trigger the stage transition.
- Ensure the `predefinedMessage` is passed back to the stage manager.

### Step 4: Message Injection Logic
When transitioning from `cta` to `chat`:
- Use the existing `useChat` hook's `sendMessage` or `append` function (from TanStack Query or local state).
- If a `predefinedMessage` exists in the button config, trigger it immediately upon entering the `chat` stage.

### Step 5: Dismissal Logic (Show Once)
- Use `sessionStorage.setItem('cta_dismissed_' + embedId, 'true')` when the user clicks a button or dismisses the CTA.
- The hook should prevent the CTA from appearing if this key exists.

---

## 🧪 Verification Plan

1.  **Transition Test:** Click CTA primary button -> CTA disappears, Chat appears, message is sent.
2.  **Dismissal Test:** Click "Close" on CTA -> Chat appears without sending message.
3.  **Persistence Test:** Refresh page -> Should skip CTA and go straight to Chat (if "show once" is enabled).
4.  **Disabled Test:** Set `enabled: false` in config -> Should never show CTA.

---

## ⏭️ Next Steps
After Phase 4 is verified, we will proceed to **Phase 5: Polish & Optimization** (Animations and CSS refinements).
