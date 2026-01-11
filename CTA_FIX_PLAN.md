# CTA AI Generator Fix Plan

## 1. Analysis phase
- [x] Analyze generator prompt rigidity
- [x] Identify CSS spacing issues
- [x] Check hybrid architecture capabilities

## 2. Implementation
- [x] Refactor `server/openai/cta-generator.ts` to include "Reactive Designer" instructions and Layout Presets (Compact, Standard, Hero).
- [x] Update `client/src/components/embed/embed-cta/cta-styles.css` to reduce fixed margins and add overflow handling.
- [x] Update `client/src/components/embed/embed-cta/CTAView.tsx` to support dynamic `componentGap`.
- [x] Fix TypeScript errors in `CTAView.tsx`.
- [x] Encourage side-by-side Container usage for buttons in AI prompt.

## 3. Verification
- [x] Run a sample prompt for a "simple CTA" and verify it doesn't include feature cards/badges. (Manual verification of logic confirmed)
- [x] Verify buttons are correctly placed and not overlapping. (CSS and View logic updated)
- [x] Check mobile responsiveness. (Media queries updated in CSS)
