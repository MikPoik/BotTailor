# CTA Layout Flexibility Analysis & Improvement Plan

## Current Issues

Based on review of the embed design CTA editor, the layout system has several rigidity constraints:

### 1. **Fixed Container Constraints**
- **Problem**: `cta-layout-card` has fixed max-width (500px) and padding (32px) that can't be easily overridden
- **Impact**: All card layouts are cramped with no ability to stretch or compress based on content
- **File**: [cta-styles.css](client/src/components/embed/embed-cta/cta-styles.css#L46-L53)

```css
.cta-layout-card {
  width: 90%;
  max-width: 500px;  /* Fixed limit */
  padding: 32px;      /* Fixed padding */
  border-radius: 12px;
}
```

### 2. **Center-Aligned Everything**
- **Problem**: `.cta-header`, `.cta-description`, and all main components default to `text-align: center`
- **Impact**: Cannot create left-aligned, right-aligned, or asymmetric layouts
- **Files**: 
  - [cta-styles.css#L108](client/src/components/embed/embed-cta/cta-styles.css#L108) - Header
  - [cta-styles.css#L128](client/src/components/embed/embed-cta/cta-styles.css#L128) - Description

### 3. **No Layout Grid System**
- **Problem**: Components stack vertically with hardcoded margin-bottom, no way to create columns or complex grids
- **Impact**: Your Finnish CTA screenshot shows components should be side-by-side or in a grid, but current system forces vertical stacking
- **Files**: [CTAView.tsx](client/src/components/embed/embed-cta/CTAView.tsx#L120) only renders components sequentially

### 4. **Feature List Has Fixed Grid Template**
- **Problem**: Feature list uses `grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))` which is hardcoded
- **Impact**: Can't control number of columns, gap size, or item sizing dynamically
- **File**: [cta-styles.css#L175-L181](client/src/components/embed/embed-cta/cta-styles.css#L175-L181)

### 5. **Button Group Inflexible**
- **Problem**: Buttons have `flex: 1` with `max-width: 280px` hardcoded
- **Impact**: Can't create single-column button layouts or side-by-side button arrangements
- **File**: [cta-styles.css#L207-L218](client/src/components/embed/embed-cta/cta-styles.css#L207-L218)

### 6. **Component Styling Not Exposed**
- **Problem**: While schema has `ComponentStyleSchema`, most components don't accept or apply style props
- **Impact**: [CTAHeader.tsx](client/src/components/embed/embed-cta/cta-components/CTAHeader.tsx) doesn't use `component.style`
- **Files**: All component files in `cta-components/` folder need updates

### 7. **No Width/Height Controls in Schema**
- **Problem**: `ComponentStyleSchema` has width/height fields but they're never applied to actual DOM elements
- **Location**: [schema.ts#L635-L637](shared/schema.ts#L635-L637) defines them but components ignore them

## Visual Problems from Your Screenshots

Your Finnish CTA should show:
1. **Header** - "Kuinka voimme olla avuksi?" (centered, large)
2. **Three cards/badges** - Side by side (not stacking)
3. **Two buttons** - "Varaa aika" (solid) and "Tutustu palveluihin" (outline) on same row

Currently getting:
- ❌ Cards/badges stacking vertically
- ❌ All text centered
- ❌ No control over card widths
- ❌ Buttons may wrap incorrectly

## Recommended Fixes (Priority Order)

### Phase 1: Core Layout Controls
1. **Add `alignment` prop to components** - allow left/center/right/justify
2. **Add `layout` prop to CTAView** - allow component positioning
3. **Make width/height/padding dynamic** - read from component.style
4. **Remove hardcoded text-align: center** - make it configurable

### Phase 2: Container Improvements
1. **Enhance Container component** - support flex-wrap, gap control, alignment properties
2. **Add grid layout support** - define rows/columns in JSON
3. **Create Row/Col abstractions** - simpler than generic Container

### Phase 3: Component Styling
1. **Update all components to apply style props** - Header, Description, FeatureList, etc.
2. **Add responsive sizing** - allow min-width, max-width per component
3. **Theme-aware styling** - inherit colors properly

### Phase 4: UI Designer Integration
1. **Visual layout builder** - drag-and-drop component positioning
2. **Alignment picker** - quick align buttons
3. **Spacing controls** - gap/margin/padding editors
4. **Live layout preview** - WYSIWYG feedback

## Technical Recommendations

### Schema Updates Needed

```typescript
// Add alignment to ComponentStyle
export const ComponentStyleSchema = z.object({
  // ... existing ...
  alignment: z.enum(['left', 'center', 'right', 'justify']).optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  display: z.enum(['block', 'flex', 'grid', 'inline-block']).optional(),
  flexDirection: z.enum(['row', 'column']).optional(),
});

// Add to CTALayout
layout: z.object({
  // ... existing ...
  componentLayout: z.enum(['vertical', 'horizontal', 'grid']).optional(),
  componentSpacing: z.number().optional(), // gap in px
  componentColumns: z.number().optional(), // for grid layout
  containerMaxWidth: z.string().optional(), // allow override
  containerPadding: z.string().optional(),
});
```

### Component Updates Needed

Every component in `cta-components/` should:
1. Accept `style` prop and apply it
2. Use `applyComponentStyle` utility (already exists!)
3. Respect `width`, `height`, `padding`, `margin` from style

Example (CTAHeader.tsx):
```tsx
// Before
export const CTAHeader = ({ component }) => {
  return <div className="cta-header">{title}</div>; // Only CSS class
};

// After
export const CTAHeader = ({ component }) => {
  const baseStyle = applyComponentStyle(component.style);
  return <div className={headerClass} style={baseStyle}>{title}</div>;
};
```

### CSS Refactoring

Remove hardcoded constraints:
```css
/* OLD - Rigid */
.cta-layout-card {
  width: 90%;
  max-width: 500px;
  padding: 32px;
}

/* NEW - Flexible with fallbacks */
.cta-layout-card {
  width: var(--cta-card-width, 90%);
  max-width: var(--cta-card-max-width, 600px); /* Increase default */
  padding: var(--cta-card-padding, 32px);
}

/* Remove forced center alignment */
.cta-header {
  text-align: var(--cta-header-align, center);
  margin-bottom: 24px;
}
```

## Quick Wins

These can be done immediately:

1. **Increase default max-widths** in CSS (500px → 600-800px)
2. **Allow text-align override** via style prop on components
3. **Make button group responsive** - wrap buttons intelligently
4. **Add gap control to feature lists** via component props
5. **Make Container component actually work** with flex-wrap and grow

## Files to Modify

### High Priority
- `cta-styles.css` - Remove hardcoded constraints, add CSS variables
- `cta-components/CTAHeader.tsx` - Apply style props
- `cta-components/CTADescription.tsx` - Apply style props, text-align
- `cta-components/CTAFeatureList.tsx` - Add grid column control
- `cta-components/CTAButtonGroup.tsx` - Better responsiveness
- `cta-component-registry.tsx` - Pass style props to all components

### Medium Priority
- `shared/schema.ts` - Extend ComponentStyleSchema
- `CTAView.tsx` - Support different component layouts
- `style-utils.ts` - Enhance applyComponentStyle

### Lower Priority
- `CTABuilder.tsx` - UI for layout controls
- `CTAPreview.tsx` - Live layout preview updates
