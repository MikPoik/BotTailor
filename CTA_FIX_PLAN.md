# CTA AI Generator Fix Plan

## 1. Analysis phase
- [x] Analyze generator prompt rigidity
- [x] Identify CSS spacing issues
- [x] Check hybrid architecture capabilities

## 2. Implementation
- [x] Refactor `server/openai/cta-generator.ts` to include "Complexity Matching" instructions.
- [x] Update `client/src/components/embed/embed-cta/cta-styles.css` to reduce fixed margins and add overflow handling.
- [x] Update `client/src/components/embed/embed-cta/CTAView.tsx` to support dynamic `componentGap`.
- [x] Fix TypeScript errors in `CTAView.tsx`.

## 3. Verification
- [ ] Run a sample prompt for a "simple CTA" and verify it doesn't include feature cards/badges.
- [ ] Verify buttons are correctly placed and not overlapping.
- [ ] Check mobile responsiveness.
