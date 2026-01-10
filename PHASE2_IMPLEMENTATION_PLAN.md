# Phase 2: CTA Components & Builder - Implementation Plan

**Status**: Planning  
**Timeline**: ~1 week  
**Date Started**: January 10, 2026

---

## Overview

Phase 2 focuses on building the React UI components and drag-drop builder interface for creating and editing CTA configurations. All backend infrastructure from Phase 1 is ready.

**Goal**: Enable users to visually design CTA views with a drag-drop builder and live preview.

---

## Component Architecture

```
CTA Feature UI Layer (Phase 2)
│
├─ CTAView.tsx (Main CTA Display)
│  ├─ Renders layout + components
│  ├─ Applies theme colors
│  └─ Handles button clicks
│
├─ cta-components/ (Reusable Components)
│  ├─ CTAHeader.tsx
│  ├─ CTADescription.tsx
│  ├─ CTAFeatureList.tsx
│  ├─ CTAButtonGroup.tsx
│  └─ CTAForm.tsx
│
├─ CTAComponentRegistry.tsx (Component Mapping)
│  └─ Maps component types to React components
│
├─ CTABuilder.tsx (Main Builder Interface)
│  ├─ Form for editing CTA config
│  ├─ Component adder/remover
│  ├─ Property editor
│  └─ Layout configurator
│
├─ CTAPreview.tsx (Live Preview Modal)
│  ├─ Real-time preview
│  ├─ Responsive breakpoints
│  └─ Device preview toggle
│
├─ CTAAssistant.tsx (AI Prompt Builder)
│  └─ (Phase 3 - Placeholder)
│
└─ cta-styles.css (Styling)
   ├─ Component styles
   ├─ Responsive design
   └─ Theme application
```

---

## Phase 2 Deliverables

### 1. Core CTA Components

#### CTAView.tsx
- Main container for CTA rendering
- Applies theme and layout styles
- Renders component list
- Handles responsive behavior

**Props**:
```typescript
interface CTAViewProps {
  config: CTAConfig;
  chatbotName?: string;
  chatbotAvatarUrl?: string;
  onButtonClick?: (buttonId: string, message: string) => void;
  embedded?: boolean;
}
```

#### cta-components/CTAHeader.tsx
- Displays title and subtitle
- Responsive typography
- Applies theme colors

#### cta-components/CTADescription.tsx
- Renders description text
- Optional background image
- Rich text support

#### cta-components/CTAFeatureList.tsx
- Grid/list layout
- Icon support
- Title + description per feature

#### cta-components/CTAButtonGroup.tsx
- Primary + secondary buttons
- Click handlers
- Styling variants

#### cta-components/CTAForm.tsx
- Form inputs if needed
- Placeholder for future enhancement

---

### 2. CTAComponentRegistry.tsx

Central registry that maps component types to React components.

```typescript
const componentRegistry: Record<CTAComponent['type'], React.ComponentType<any>> = {
  'header': CTAHeader,
  'description': CTADescription,
  'feature_list': CTAFeatureList,
  'button_group': CTAButtonGroup,
  'form': CTAForm,
};

export function renderCTAComponent(component: CTAComponent, config: CTAConfig) {
  const Component = componentRegistry[component.type];
  if (!Component) return null;
  return <Component component={component} config={config} />;
}
```

---

### 3. CTABuilder.tsx

Interactive builder for creating/editing CTA configurations.

**Sections**:

1. **Layout Configuration**
   - Style selector (banner, card, modal, sidebar)
   - Position selector (top, center, bottom)
   - Width selector (full, wide, narrow)

2. **Component Management**
   - Add component dropdown
   - Reorder (drag-drop)
   - Delete component
   - Toggle visibility

3. **Button Configuration**
   - Primary button text
   - Button variant (solid, outline, ghost)
   - Predefined message editor
   - Optional secondary button

4. **Theme Customization**
   - Color pickers (primary, background, text, accent)
   - Color presets quick select
   - Live preview toggle

5. **Settings**
   - Auto-show after seconds
   - Dismissible toggle
   - Show once per session toggle

---

### 4. CTAPreview.tsx

Modal displaying live preview of CTA configuration.

**Features**:
- Real-time updates as config changes
- Multiple device previews (mobile, tablet, desktop)
- Device toggle buttons
- Full-screen preview option
- Copy code button (for Phase 3+)

---

### 5. EmbedDesignForm Integration

Add "CTA Setup" tab to existing `EmbedDesignForm.tsx`.

**Tab Structure**:
- Basic Info tab (existing)
- Design tab (existing)
- Theme tab (existing)
- **CTA Setup tab** (NEW)
  - Enable/disable toggle
  - Render CTABuilder component
  - Show CTAPreview

---

## File Structure

```
client/src/components/embed/
├── embed-cta/                      (NEW FOLDER)
│   ├── CTAView.tsx                 (NEW)
│   ├── CTABuilder.tsx              (NEW)
│   ├── CTAPreview.tsx              (NEW)
│   ├── CTAAssistant.tsx            (NEW - Phase 3)
│   ├── cta-component-registry.tsx  (NEW)
│   ├── cta-styles.css              (NEW)
│   │
│   └── cta-components/             (NEW FOLDER)
│       ├── CTAHeader.tsx           (NEW)
│       ├── CTADescription.tsx      (NEW)
│       ├── CTAFeatureList.tsx      (NEW)
│       ├── CTAButtonGroup.tsx      (NEW)
│       └── CTAForm.tsx             (NEW)
│
├── EmbedDesignForm.tsx             (MODIFY - add CTA tab)
├── EmbedDesignPreview.tsx          (MODIFY - show CTA preview)
└── ...existing files...
```

---

## Implementation Steps

### Step 1: Create CTA Components Library (Days 1-2)

**Build**:
1. `cta-components/CTAHeader.tsx` - Header with title/subtitle
2. `cta-components/CTADescription.tsx` - Description text
3. `cta-components/CTAFeatureList.tsx` - Feature grid/list
4. `cta-components/CTAButtonGroup.tsx` - Button container
5. `cta-components/CTAForm.tsx` - Form placeholder

**Test**:
- Render each component with sample props
- Verify responsive behavior
- Check theme color application

### Step 2: Create CTAView Main Container (Day 2)

**Build**:
1. `CTAView.tsx` - Main CTA display component
2. Integrate component registry
3. Layout styling (banner, card, modal, sidebar)

**Test**:
- Full CTA config rendering
- Theme application
- Layout responsiveness
- Button click handlers

### Step 3: Create Component Registry (Day 3)

**Build**:
1. `cta-component-registry.tsx` - Component mapping
2. Export utility functions
3. Error handling

**Test**:
- Registry maps all component types
- Unknown types handled gracefully

### Step 4: Create CTABuilder Interface (Day 3-4)

**Build**:
1. `CTABuilder.tsx` - Main builder form
2. Layout configuration section
3. Component management (add/remove/reorder)
4. Button configuration section
5. Theme customization section
6. Settings section

**Test**:
- All form inputs work
- State updates correctly
- Changes reflected in preview

### Step 5: Create CTAPreview Modal (Day 4)

**Build**:
1. `CTAPreview.tsx` - Preview modal
2. Live update integration
3. Device preview toggles
4. Full-screen mode

**Test**:
- Modal opens/closes
- Live updates work
- Device previews responsive

### Step 6: Integrate with EmbedDesignForm (Day 5)

**Modify**:
1. Add CTA Setup tab to `EmbedDesignForm.tsx`
2. Show CTABuilder when tab selected
3. Show CTAPreview alongside
4. Save CTA config on form submit

**Test**:
- Tab navigation works
- Form submission includes ctaConfig
- Data persists correctly

### Step 7: Polish & Testing (Day 5-6)

**Polish**:
1. Styling and spacing
2. Responsive design for mobile/tablet
3. Accessibility (ARIA labels, keyboard nav)
4. Error handling and validation

**Test**:
- Mobile responsiveness
- Form validation
- Error messages clear
- Accessibility audit

---

## Data Flow

### Create CTA Flow

```
User Input (EmbedDesignForm)
    ↓
CTABuilder receives initial ctaConfig
    ↓
User edits in CTABuilder
    ↓
State updates in real-time
    ↓
CTAPreview shows live update
    ↓
User clicks "Save"
    ↓
Form submits with updated ctaConfig
    ↓
API Route (Phase 1) stores in database
```

### Render CTA Flow

```
Iframe loads (/embed/:embedId)
    ↓
Fetches config via API (Phase 1)
    ↓
window.__EMBED_CONFIG__ has ctaConfig
    ↓
EmbedChatInterface checks ctaConfig.enabled
    ↓
Renders CTAView with config
    ↓
User clicks CTA button
    ↓
Transition to chat (Phase 4)
```

---

## Component Props & Types

### CTAViewProps
```typescript
interface CTAViewProps {
  config: CTAConfig;
  chatbotName?: string;
  chatbotAvatarUrl?: string;
  onButtonClick?: (buttonId: string, message: string) => void;
  embedded?: boolean;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}
```

### CTABuilderProps
```typescript
interface CTABuilderProps {
  initialConfig?: CTAConfig;
  onConfigChange: (config: CTAConfig) => void;
  chatbotName: string;
  onPreviewToggle?: (show: boolean) => void;
}
```

### CTAPreviewProps
```typescript
interface CTAPreviewProps {
  config: CTAConfig;
  chatbotName?: string;
  chatbotAvatarUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  deviceType?: "mobile" | "tablet" | "desktop";
  fullscreen?: boolean;
}
```

---

## Styling Strategy

### CSS Approach
- Create `cta-styles.css` for all CTA-related styles
- Use CSS variables for theme colors
- Mobile-first responsive design
- Tailwind utility classes for layout

### Layout Styles

**Banner**:
```css
.cta-banner {
  width: 100%;
  padding: 20px;
  background: var(--cta-bg);
  border-radius: 0;
}
```

**Card**:
```css
.cta-card {
  width: 90%;
  max-width: 500px;
  padding: 30px;
  background: var(--cta-bg);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

**Modal**:
```css
.cta-modal {
  width: 90%;
  max-width: 600px;
  padding: 40px;
  background: var(--cta-bg);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
```

**Sidebar**:
```css
.cta-sidebar {
  width: 350px;
  height: 100vh;
  padding: 20px;
  background: var(--cta-bg);
  border-radius: 0;
  overflow-y: auto;
}
```

---

## Testing Plan

### Unit Tests
- CTAHeader renders correctly
- CTADescription applies theme
- CTAFeatureList displays features
- CTAButtonGroup handles clicks
- Component registry maps types

### Integration Tests
- CTAView renders all components
- CTABuilder form updates state
- CTAPreview shows live updates
- EmbedDesignForm submits CTA config

### E2E Tests
- User creates CTA from builder
- Saves to database
- Loads in iframe
- CTA displays correctly

### Accessibility Tests
- WCAG 2.1 Level AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast ratios

---

## Dependencies

**Existing**:
- React
- React Hook Form (for builder form)
- Tailwind CSS
- Zod (validation from Phase 1)

**New (if needed)**:
- react-beautiful-dnd (drag-drop reordering)
- react-color or similar (color picker)
- react-responsive (device preview)

---

## Success Criteria

✅ All CTA components render correctly  
✅ CTABuilder allows full config editing  
✅ CTAPreview shows live updates  
✅ Integration with EmbedDesignForm seamless  
✅ Mobile responsive  
✅ Accessible (WCAG 2.1 AA)  
✅ No TypeScript errors  
✅ Form submission works end-to-end  
✅ Comprehensive testing  

---

## Potential Challenges & Mitigations

| Challenge | Mitigation |
|-----------|-----------|
| Complex form state management | Use React Hook Form + context |
| Drag-drop implementation | Use react-beautiful-dnd library |
| Real-time preview lag | Debounce state updates |
| Mobile builder UX | Simplified form layout for mobile |
| Color picker accessibility | Use native input[type="color"] fallback |

---

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (latest)

---

## Performance Considerations

- Lazy load CTAPreview modal
- Debounce form input updates
- Memoize component renders
- Optimize theme color application

---

## Documentation

Will update:
- Component prop documentation
- Builder usage guide
- Integration guide
- Styling customization guide

---

## Rollout Plan

### Day 1-2: Core Components
- Build and test component library
- Create registry

### Day 3-4: Builder Interface
- Implement form and editor
- State management

### Day 5: Preview & Integration
- Build preview modal
- Integrate with EmbedDesignForm

### Day 6: Polish & Testing
- Styling refinement
- Accessibility audit
- Final testing

---

## Phase 2 → Phase 3 Transition

Phase 2 hands off to Phase 3 with:
- ✅ Fully functional CTA builder UI
- ✅ CTA config stored in database
- ✅ CTA displayed in iframe (basic)
- ✅ Ready for AI generation (Phase 3)

Phase 3 adds:
- CTAAssistant component (AI prompt builder)
- OpenAI integration
- CTA generation endpoint

---

**Next**: Begin Phase 2 implementation starting with core CTA components.

