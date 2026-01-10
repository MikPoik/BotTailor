# Quick Reference: CTA Styling & Theme Overrides

## Theme Color Override - QUICK ANSWER

**YES! Per-component theme overrides are fully supported.**

### How It Works

**1. Set Global Theme Colors:**
```json
{
  "theme": {
    "primaryColor": "#2563eb",
    "backgroundColor": "#ffffff", 
    "textColor": "#1f2937"
  }
}
```

**2. Override Specific Colors Per Component:**
```json
{
  "components": [
    {
      "type": "header",
      "style": {
        "textColor": "#ff0000"      // ← Overrides global textColor
      }
    },
    {
      "type": "description",
      "style": {
        "backgroundColor": "#f0f0f0" // ← Overrides for this component
      }
    }
  ]
}
```

**Priority Order:**
1. Component `style.textColor/backgroundColor` ✓ Highest
2. Global `theme.textColor/backgroundColor`
3. CSS defaults

---

## Styling Properties Reference

### Colors (Theme Overrides) 🎨
```json
"style": {
  "textColor": "#1f2937",        // Text color override
  "backgroundColor": "#ffffff",  // Background override
  "borderColor": "#e5e7eb",      // Border color
  "color": "#1f2937"             // Alias for textColor
}
```

### Layout (Flexbox) 📐
```json
"style": {
  "display": "flex",
  "flexDirection": "row",        // row | column
  "flexWrap": "wrap",            // wrap | nowrap
  "gap": 16,                     // Space between items (px)
  "alignItems": "center",        // Vertical alignment
  "justifyContent": "space-between"  // Horizontal alignment
}
```

### Layout (Grid) 🔲
```json
"style": {
  "display": "grid",
  "gridTemplateColumns": "repeat(3, 1fr)",  // 3 equal columns
  "gridGap": 20,                            // Space between items
  "gridAutoFlow": "row"                     // row | column
}
```

### Sizing 📏
```json
"style": {
  "width": "100%",
  "height": "auto",
  "minWidth": "200px",
  "maxWidth": "600px",
  "minHeight": "100px",
  "maxHeight": "500px",
  "aspectRatio": "16/9"
}
```

### Spacing 📦
```json
"style": {
  "padding": 20,                 // All sides
  "paddingTop": 10,
  "paddingRight": 15,
  "paddingBottom": 10,
  "paddingLeft": 15,
  "margin": 16,                  // All sides
  "marginTop": 8,
  "marginBottom": 24,
  "gap": 12                      // Space between children
}
```

### Typography 🔤
```json
"style": {
  "fontSize": 16,
  "fontWeight": 600,
  "fontStyle": "italic",
  "lineHeight": 1.5,
  "letterSpacing": 0.5,
  "textAlign": "center",        // left | center | right | justify
  "textDecoration": "underline"  // underline | overline | line-through
}
```

### Borders & Radius 🔲
```json
"style": {
  "borderWidth": 1,
  "borderRadius": 8,
  "borderStyle": "solid",       // solid | dashed | dotted
  "borderColor": "#e5e7eb",
  "border": "1px solid #ccc"    // Shorthand
}
```

### Effects & Shadows ✨
```json
"style": {
  "opacity": 0.8,
  "boxShadow": "0 4px 6px rgba(0,0,0,0.1)",
  "textShadow": "2px 2px 4px rgba(0,0,0,0.2)",
  "filter": "blur(1px)",
  "transform": "scale(1.1)",
  "transition": "all 0.3s ease"
}
```

### Positioning 📍
```json
"style": {
  "position": "relative",   // static | relative | absolute | fixed
  "top": "10px",
  "right": "20px",
  "bottom": "10px",
  "left": "20px",
  "zIndex": 100
}
```

### Overflow & Visibility 👁️
```json
"style": {
  "overflow": "hidden",     // visible | hidden | scroll | auto
  "overflowX": "auto",
  "overflowY": "hidden",
  "cursor": "pointer"       // pointer | default | text | wait | help
}
```

---

## Common Patterns

### 3-Column Grid
```json
{
  "type": "feature_list",
  "style": {
    "display": "grid",
    "gridTemplateColumns": "repeat(3, 1fr)",
    "gap": 20
  }
}
```

### Side-by-Side Buttons
```json
{
  "type": "button_group",
  "style": {
    "display": "flex",
    "flexDirection": "row",
    "gap": 12,
    "justifyContent": "center"
  }
}
```

### Left-Aligned Text
```json
{
  "type": "description",
  "style": {
    "textAlign": "left",
    "fontSize": 16,
    "lineHeight": 1.6,
    "maxWidth": "600px"
  }
}
```

### Custom Colors on Component
```json
{
  "type": "header",
  "style": {
    "textColor": "#ffffff",
    "backgroundColor": "#1f2937",
    "padding": 24,
    "borderRadius": 12
  }
}
```

### Responsive-ish Sizing
```json
{
  "style": {
    "width": "90%",           // Responsive width
    "maxWidth": "800px",      // Cap at 800px
    "margin": "0 auto"        // Center it
  }
}
```

---

## Custom HTML Component

For layouts impossible with structured components:

```json
{
  "id": "custom_1",
  "type": "custom_html",
  "props": {
    "htmlContent": "<div style='display: grid; grid-template-columns: 1fr 1fr;'>...</div>"
  },
  "style": {
    "padding": 20,
    "backgroundColor": "#f5f5f5",
    "textColor": "#1f2937"  // ← Can override theme here too!
  }
}
```

**Security:** HTML is sanitized. Only safe tags allowed.

---

## Component Style Support

All components support `component.style`:

| Component | Styling Support | Best For |
|-----------|-----------------|----------|
| header | Full | Title/subtitle with custom styling |
| description | Full | Body text with custom alignment/colors |
| feature_list | Full | Grids, lists, custom layouts |
| badge | Full | Icons with custom sizing/colors |
| button_group | Full | Custom button arrangement/spacing |
| divider | Full | Custom divider styling |
| richtext | Full | Custom formatted content |
| form | Full | Form container styling |
| custom_html | Full | Custom HTML with theme overrides |
| container | Full | Layout wrapper with flex/grid |

---

## Real-World Example: Dark Mode CTA

```json
{
  "version": "1.0",
  "enabled": true,
  "theme": {
    "primaryColor": "#8b5cf6",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937"
  },
  "components": [
    {
      "id": "header_dark",
      "type": "header",
      "order": 1,
      "props": {
        "title": "Welcome to Our Platform"
      },
      "style": {
        "backgroundColor": "#1f2937",    // ← Dark background
        "textColor": "#ffffff",          // ← White text
        "padding": 32,
        "textAlign": "center",
        "borderRadius": 12
      }
    },
    {
      "id": "features_grid",
      "type": "feature_list",
      "order": 2,
      "props": {
        "features": [...]
      },
      "style": {
        "display": "grid",
        "gridTemplateColumns": "repeat(auto-fit, minmax(250px, 1fr))",
        "gap": 20,
        "backgroundColor": "#f9fafb",    // ← Light gray background
        "padding": 24,
        "borderRadius": 8
      }
    }
  ]
}
```

---

## AI Prompt Template

Tell your AI to use this pattern:

```
Generate a CTA with:
- A centered header with custom color
- 3-column grid of features
- Side-by-side buttons
- Theme color overrides for header to be #1f2937 text on #f5f5f5 background

Use the component.style property for all layout and color customization.
```

---

## Validation

All styles are validated with Zod. Invalid values are caught at parse time:

```typescript
// Valid
{ "display": "flex" }           // ✅ Valid enum value

// Invalid
{ "display": "flexbox" }        // ❌ Invalid enum - will fail validation
```

---

## CSS Variables (Advanced)

If you need to override defaults globally, use CSS variables:

```css
:root {
  --cta-layout-card-max-width: 800px;
  --cta-header-text-align: center;
  --cta-feature-list-gap: 24px;
}
```

But **component.style overrides these**, so use that for component-specific changes.

---

## Summary

✅ **Theme colors**: Global + per-component overrides  
✅ **Layouts**: Full flexbox/grid support  
✅ **Colors**: Complete control per component  
✅ **Typography**: All properties supported  
✅ **Spacing**: Padding, margin, gap control  
✅ **Effects**: Shadows, opacity, transforms  
✅ **Edge cases**: Custom HTML with sanitization  
✅ **Backward compatible**: Old configs still work  

**Everything you need to give AI complete layout & styling freedom!**
