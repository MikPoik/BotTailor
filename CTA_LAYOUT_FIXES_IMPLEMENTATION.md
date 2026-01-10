# CTA Layout Flexibility - Implementation Roadmap

## Overview
The current CTA editor forces rigid layouts. This doc outlines concrete changes to make layouts flexible.

## Root Causes

### 1. Hardcoded CSS Classes Override Component Styles
```
CTAView.tsx renders components
  → Components try to apply component.style props
  → CSS classes (.cta-header, .cta-description) have !important or high specificity
  → Styles lost
```

### 2. Component Props Not Used
```
component.style = { textAlign: 'left', padding: '20px' }
  → CTAHeader.tsx ignores it
  → Only uses className="cta-header"
  → CSS defaults apply
```

### 3. No Layout Container
```
CTAView renders [Header, Description, FeatureList, ButtonGroup]
  → All stack vertically (flex-direction: column is implicit)
  → No way to say "put these 3 items in a row"
  → Must create sub-components and nest them
```

## Solution Strategy

### Step 1: Make Component Styles Actually Apply
Each component needs to use `applyComponentStyle` from style-utils.

**File**: `client/src/components/embed/embed-cta/style-utils.ts`
**Current**: Defines `applyComponentStyle` but not all components use it
**Action**: Ensure all components call it and inline the result

### Step 2: Remove CSS Forcing text-align: center
**File**: `client/src/components/embed/embed-cta/cta-styles.css`
**Action**: Remove hardcoded `text-align: center` from `.cta-header`, `.cta-description`
**Reason**: Let component style prop control it

### Step 3: Use CSS Variables for Layout Constraints
**Action**: Replace hardcoded pixels with CSS variables
```css
.cta-layout-card {
  max-width: var(--cta-layout-max-width, 600px);
  padding: var(--cta-layout-padding, 32px);
}
```

### Step 4: Add Layout Composition in Schema
Allow defining how components should layout.

```typescript
// In CTAConfig schema
layout: z.object({
  // ... existing fields ...
  
  // NEW: How components arrange themselves
  componentLayout: z.enum(['vertical', 'horizontal', 'grid']).optional(),
  componentGap: z.number().optional(), // pixels
  componentColumns: z.number().optional(), // for grid/horizontal
})
```

### Step 5: Modify CTAView to Respect componentLayout
Instead of always vertical, read `config.layout.componentLayout`.

```typescript
// Current: always vertical
<div style={{ flexDirection: 'column' }}>

// New: respect config
<div style={{ flexDirection: config.layout?.componentLayout === 'horizontal' ? 'row' : 'column' }}>
```

### Step 6: Update Components to Apply All Styles
Every component should have a pattern:
```typescript
const style = applyComponentStyle(component.style);
return <div style={style}>{content}</div>;
```

## Key Changes Needed

### 1. Update `applyComponentStyle` in style-utils.ts
Current implementation likely only handles certain style keys.
```typescript
export function applyComponentStyle(style?: ComponentStyle): React.CSSProperties {
  if (!style) return {};
  
  return {
    // Layout
    width: style.width,
    height: style.height,
    minHeight: style.minHeight,
    padding: style.padding,
    margin: style.margin,
    
    // Flexbox
    display: style.display || 'block',
    flexDirection: style.flexDirection,
    alignItems: style.alignItems,
    justifyContent: style.justifyContent,
    
    // Text
    textAlign: style.textAlign,
    fontSize: style.fontSize,
    
    // Colors
    backgroundColor: style.backgroundColor,
    color: style.color,
    
    // Borders
    borderRadius: style.borderRadius,
    border: style.border,
    
    // Effects
    boxShadow: style.boxShadow,
    opacity: style.opacity,
  };
}
```

### 2. Update Each Component to Use Styles

**CTAHeader.tsx** - Before:
```tsx
return <div className={headerClass} style={headerStyle}>{title}</div>;
```

**CTAHeader.tsx** - After:
```tsx
const baseStyle = applyComponentStyle(component.style);
return (
  <div 
    className={headerClass} 
    style={{ ...baseStyle, ...headerStyle }}
  >
    {title}
  </div>
);
```

### 3. Update CTAView to Support Component Layout

Current:
```tsx
<div className={`${layoutClass} ${positionClass}`}
     style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
```

New:
```tsx
const componentLayout = config.layout?.componentLayout || 'vertical';
const componentGap = config.layout?.componentGap ?? 16;

<div className={`${layoutClass} ${positionClass}`}
     style={{ 
       flex: 1, 
       display: 'flex', 
       flexDirection: componentLayout === 'horizontal' ? 'row' : 'column',
       gap: `${componentGap}px`,
       flexWrap: 'wrap',
     }}>
```

### 4. Update CSS to Remove Rigid Constraints

Current `.cta-layout-card`:
```css
.cta-layout-card {
  width: 90%;
  max-width: 500px;
  padding: 32px;
  border-radius: 12px;
  background-color: var(--cta-bg);
  box-shadow: var(--cta-shadow);
}
```

New:
```css
.cta-layout-card {
  width: 90%;
  max-width: var(--cta-card-max-width, 700px);
  padding: var(--cta-card-padding, 32px);
  border-radius: 12px;
  background-color: var(--cta-bg);
  box-shadow: var(--cta-shadow);
}
```

### 5. Update Component Styles in CSS

Remove forced centering:
```css
/* BEFORE */
.cta-header {
  margin-bottom: 24px;
  text-align: center;
}

/* AFTER */
.cta-header {
  margin-bottom: 24px;
  text-align: var(--cta-header-text-align, center);
}

.cta-description {
  margin-bottom: 24px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--cta-text);
  text-align: var(--cta-desc-text-align, center);
}
```

## Example JSON Config That Would Now Work

```json
{
  "version": "1.0",
  "enabled": true,
  "layout": {
    "style": "card",
    "position": "center",
    "width": "wide",
    "componentLayout": "vertical",
    "componentGap": 24,
    "containerMaxWidth": "800px",
    "containerPadding": "40px"
  },
  "components": [
    {
      "id": "header_1",
      "type": "header",
      "order": 1,
      "visible": true,
      "props": {
        "title": "Kuinka voimme olla avuksi?",
        "subtitle": "Alta voit näppärästi varata ajan, tutustua palveluihimme tai kysy liää yrityskynnneistä."
      },
      "style": {
        "textAlign": "center",
        "marginBottom": "32px"
      }
    },
    {
      "id": "features_1",
      "type": "feature_list",
      "order": 2,
      "visible": true,
      "props": {
        "features": [
          {
            "icon": "📅",
            "title": "Varaa aika",
            "description": "Nopea ja helppo ajanvaraus"
          },
          {
            "icon": "👥",
            "title": "Tutustu palveluihin",
            "description": "Lue lisää palveluista"
          },
          {
            "icon": "❓",
            "title": "Kysy lisää",
            "description": "Ratkaisut yrityksellesi"
          }
        ]
      },
      "style": {
        "display": "grid",
        "gridTemplateColumns": "repeat(3, 1fr)",
        "gap": "16px",
        "marginBottom": "32px"
      }
    },
    {
      "id": "buttons_1",
      "type": "button_group",
      "order": 3,
      "visible": true,
      "style": {
        "display": "flex",
        "gap": "12px",
        "justifyContent": "center"
      }
    }
  ],
  "primaryButton": {
    "id": "btn_1",
    "text": "Varaa aika",
    "variant": "solid",
    "predefinedMessage": "Haluan varata ajan"
  },
  "secondaryButton": {
    "id": "btn_2",
    "text": "Tutustu palveluihin",
    "action": "link",
    "url": "#"
  }
}
```

## Testing Checklist

After implementing:
- [ ] Header textAlign can be changed to 'left'
- [ ] Feature list displays in 3 columns (not auto-fit)
- [ ] Buttons display side-by-side instead of stacked
- [ ] Component widths respect style prop
- [ ] Card max-width can be increased
- [ ] Gap between components is configurable
- [ ] Color/padding applied from component.style
- [ ] Responsive behavior still works
- [ ] Existing JSON configs still render (backward compatible)

## Backward Compatibility

All changes should be non-breaking:
- If `component.style` not provided → use CSS defaults (same as before)
- If `componentLayout` not in config → default to 'vertical' (same as before)
- CSS variables have fallbacks to old hardcoded values
- Existing JSON configs render identically

## Files to Change (in order)

1. `shared/schema.ts` - Add new style fields
2. `style-utils.ts` - Enhance `applyComponentStyle`
3. `cta-styles.css` - Remove hardcoded constraints
4. `CTAView.tsx` - Support componentLayout
5. `cta-components/CTAHeader.tsx` - Apply styles
6. `cta-components/CTADescription.tsx` - Apply styles
7. `cta-components/CTAFeatureList.tsx` - Apply styles
8. `cta-components/CTAButtonGroup.tsx` - Apply styles
9. `cta-component-registry.tsx` - Pass style props
