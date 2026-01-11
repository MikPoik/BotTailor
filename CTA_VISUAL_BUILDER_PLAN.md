# CTA Visual Component Builder Plan

## Objective
Add a visual component layout editor to the CTA setup tab that allows users to easily edit component properties (text, colors, layout) without manually writing JSON.

---

## Current State Analysis

### What Exists:
1. **AI Generator** - Generates CTA config from prompt → preview
2. **Manual Builder (JSON Editor)** - Raw JSON editing → preview
3. **Preview Panel** - Shows the rendered CTA

### What's Missing:
- **Visual Component Editor** - Browse, edit, and manage components in a user-friendly UI
- Component property management (text fields, color pickers, layout options)
- Component-level styling controls (colors, text, spacing)
- Component reordering/deletion

---

## Logic Steps

### Phase 1: Component Registry & Property Extraction
**Goal:** Understand what's editable on each component type

**Steps:**
1. Map all CTA component types to their editable properties:
   - `header` → title, subtitle, textColor, fontSize, textAlign
   - `feature_list` → features (array: icon, title, description), columns (grid layout)
   - `description` → description text, textColor, fontSize, textAlign
   - `button_group` → buttons array, layout direction (flex row/column)
   - `badge` → text, color, badgeStyle
   - `divider` → dividerStyle, dividerColor
   - `rich_text` → htmlContent (read-only reference)
   - `custom_html` → htmlContent (read-only reference)
   - `container` → layout (column/row/grid), columns count

2. Create property schema for each component type:
   - Text fields (title, description, content)
   - Color fields (backgroundColor, textColor, borderColor)
   - Select fields (textAlign, flexDirection, badgeStyle, dividerStyle)
   - Number fields (fontSize, fontWeight, gap, columns)
   - Toggle fields (visible, allowMultiple)

3. Categorize properties:
   - **Content Properties** - text/content that affects meaning
   - **Appearance Properties** - colors, sizing, fonts
   - **Layout Properties** - display, flex, grid settings
   - **Structure Properties** - items count, columns, order

### Phase 2: UI Architecture Design
**Goal:** Create a clean, intuitive editor interface

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ CTA Setup Tab                                               │
├─────────────┬───────────────────────────────────────────────┤
│ Component   │ Property Editor Panel                          │
│ List        │ (changes based on selected component)          │
│             │                                                │
│ ✓ Header 1  │ [Component Type] Component 1                   │
│             │ ┌─────────────────────────────────────────┐   │
│ ✓ Features  │ │ CONTENT PROPERTIES                       │   │
│             │ │ [text] Title: ________                   │   │
│ ✓ Desc 1    │ │ [text] Subtitle: ________                │   │
│             │ │                                          │   │
│ ○ Button    │ │ APPEARANCE PROPERTIES                    │   │
│             │ │ [color] Text Color: [###] 🎨            │   │
│ + Add Comp  │ │ [select] Text Align: Center ▼           │   │
│             │ │ [number] Font Size: 16                   │   │
│ - Delete    │ │                                          │   │
│ ↑↓ Reorder  │ │ LAYOUT PROPERTIES                        │   │
│             │ │ [select] Display: flex ▼                 │   │
│             │ │ [select] Direction: row ▼                │   │
│             │ │ [number] Gap: 16                         │   │
│             │ └─────────────────────────────────────────┘   │
│             │ [Delete Component] [Duplicate]                │
└─────────────┴───────────────────────────────────────────────┘
```

**Components:**
1. `ComponentListPanel` - Tree/list view of all components
2. `ComponentPropertyEditor` - Dynamic form based on selected component
3. `ComponentTypeSelector` - Dropdown to add new component
4. `PropertyFieldRenderer` - Renders different field types (text, color, select, etc.)

### Phase 3: Data Flow & State Management
**Goal:** Seamlessly sync visual edits with JSON config

**Flow:**
```
User edits component name in PropertyEditor
    ↓
setState(property, value)
    ↓
Build updated config object
    ↓
Validate with CTAConfigSchema
    ↓
onConfigChange(updatedConfig) → parent
    ↓
Preview updates automatically
```

**State Structure:**
```typescript
interface EditorState {
  config: CTAConfig;
  selectedComponentId: string | null;
  editingComponentProperty: string | null;
  validationErrors: Record<string, string>;
}
```

### Phase 4: Component Editor Implementation
**Goal:** Build individual component property editors

**For each component type, create:**
1. Property extraction function - get all editable props
2. Property update function - update single property
3. Property renderer - show appropriate form fields
4. Validation - type-safe updates

**Example - Header Component:**
```typescript
const headerProperties = {
  title: { type: 'text', label: 'Title', maxLength: 100 },
  subtitle: { type: 'text', label: 'Subtitle', maxLength: 200 },
  textColor: { type: 'color', label: 'Text Color' },
  fontSize: { type: 'number', label: 'Font Size', min: 12, max: 48 },
  textAlign: { type: 'select', label: 'Alignment', 
    options: ['left', 'center', 'right'] },
};
```

### Phase 5: Integration with Existing System
**Goal:** Add visual editor tab alongside JSON editor

**Changes:**
1. Add "Component Layout" tab to CTA Setup section
2. Keep JSON editor as fallback/export option
3. Sync state bidirectionally (visual ↔ JSON)
4. Warn if JSON and visual editors diverge

---

## Edge Cases & Challenges

### 1. **Property Type Mismatches**
- **Issue:** Different components might have similar but slightly different properties
- **Solution:** Create generic `PropertySchema` that adapts based on component type
- **Implementation:** Use type guards and component type-specific schemas

### 2. **Nested/Complex Objects**
- **Issue:** Some properties are nested (e.g., features array with icon/title/description)
- **Solution:** Create sub-editors for complex types
  - `FeaturesArrayEditor` for feature_list items
  - `ButtonArrayEditor` for button configurations
  - `FeatureItemEditor` for individual feature editing
- **Implementation:** Recursive editor pattern

### 3. **Array Management (Add/Remove/Reorder)**
- **Issue:** Features, buttons, etc. are arrays that users need to manipulate
- **Solution:** 
  - Add buttons: "Add Feature", "Remove Feature"
  - Drag-to-reorder or arrow buttons for reordering
  - Show index/count to help users manage arrays
- **Implementation:** Use React drag-and-drop library or custom drag handlers

### 4. **Style Cascade & Theme Overrides**
- **Issue:** Component.style overrides theme colors, but users might not understand priority
- **Solution:**
  - Show theme color as "fallback" in UI
  - Highlight when component override is active
  - Checkbox to "Use theme color" vs "Custom color"
- **Implementation:** Display conditional UI based on whether override is set

### 5. **Color Picker Accessibility**
- **Issue:** Users need intuitive color selection
- **Solution:**
  - Use shadcn/ui color picker or similar
  - Show hex value + RGB
  - Allow pasting hex codes
  - Theme color swatches for quick selection
- **Implementation:** Component wrapper around color input

### 6. **Validation & Error Handling**
- **Issue:** Invalid values could break preview
- **Solution:**
  - Real-time validation as user types
  - Show error messages inline
  - Prevent save if validation fails
  - Auto-revert to last valid state on error
- **Implementation:** Zod validation on each property change

### 7. **Large Arrays (Many Features/Buttons)**
- **Issue:** Lists can become unwieldy with many items
- **Solution:**
  - Virtualization for very long lists
  - Collapsible sections for array items
  - Search/filter within arrays
- **Implementation:** Optional pagination or collapsible groups

### 8. **Content Overflow & Text Truncation**
- **Issue:** Users might enter very long text
- **Solution:**
  - Show character count
  - Preview text truncation in editor
  - Warning for content that won't fit in preview
- **Implementation:** Character counter component

### 9. **Global Theme vs Component Overrides**
- **Issue:** Users might not realize global theme applies unless no override
- **Solution:**
  - Show visual hierarchy: Global theme → Component override
  - "Reset to theme" button for each property
  - Highlight differences from theme
- **Implementation:** Side-by-side display of theme vs override

### 10. **Component Visibility & Ordering**
- **Issue:** Users need to reorder components, hide unused ones
- **Solution:**
  - Drag-to-reorder with visual feedback
  - Eye icon to toggle visibility
  - Clear section separators between components
- **Implementation:** React Beautiful DND or similar

### 11. **Adding New Components**
- **Issue:** UI needs to support adding arbitrary component types
- **Solution:**
  - Type selector dropdown showing all valid types
  - Default props pre-filled based on type
  - Quick templates for common patterns
- **Implementation:** CTAComponentType enum + component factory

### 12. **HTML Content (Custom HTML / Rich Text)**
- **Issue:** htmlContent is code - can't edit visually
- **Solution:**
  - Show as read-only reference
  - Provide "Edit in JSON" shortcut
  - Warn that visual editor can't modify HTML content
- **Implementation:** Special read-only display mode

---

## Implementation Order (What to Build First)

1. **Foundation Components** (highest ROI, least complex)
   - `ComponentListPanel` - list all components
   - `ComponentPropertyEditor` - basic form framework
   - `PropertyFieldRenderer` - text/color/select inputs

2. **Simple Property Types** (80% of use cases)
   - Text fields (title, subtitle, description)
   - Color pickers
   - Text alignment / font size selectors
   - Basic flex layout options

3. **Array Management** (needed for features/buttons)
   - Add/remove items
   - Reorder (arrow buttons, not drag yet)
   - Nested editors for complex items

4. **Advanced Features** (polish)
   - Drag-to-reorder with React DND
   - Component duplication
   - Visibility toggle
   - Advanced layout controls

5. **Sync & Validation** (production-ready)
   - Real-time validation
   - Error display
   - JSON ↔ Visual sync warnings
   - Save/load state

---

## File Structure

```
client/src/components/embed/cta-builder/
├── index.ts                           # Export all components
├── ComponentListPanel.tsx             # Component list sidebar
├── ComponentPropertyEditor.tsx        # Main property editor
├── ComponentTypeSelector.tsx          # Add new component dropdown
├── PropertyFieldRenderer.tsx          # Generic field renderer
├── useComponentEditor.ts              # State management hook
├── types.ts                           # TypeScript types for editor
├── hooks/
│   ├── useComponentProperties.ts      # Extract/update component props
│   ├── usePropertyValidation.ts       # Validate property changes
│   └── useArrayManagement.ts          # Add/remove/reorder array items
├── editors/
│   ├── HeaderComponentEditor.tsx      # Header-specific editor
│   ├── FeatureListComponentEditor.tsx # Features with sub-editor
│   ├── DescriptionComponentEditor.tsx # Description editor
│   ├── ButtonGroupComponentEditor.tsx # Buttons with sub-editor
│   ├── BadgeComponentEditor.tsx       # Badge editor
│   ├── DividerComponentEditor.tsx     # Divider editor
│   └── CustomHTMLComponentEditor.tsx  # Read-only HTML reference
├── fields/
│   ├── TextField.tsx                  # Text input with char count
│   ├── ColorField.tsx                 # Color picker
│   ├── SelectField.tsx                # Dropdown selector
│   ├── NumberField.tsx                # Number input with min/max
│   ├── ToggleField.tsx                # Boolean toggle
│   └── ArrayItemEditor.tsx            # Nested object editor
└── styles/
    └── editor.css                     # Editor-specific styles
```

---

## Key Design Decisions

### 1. **Separate Component Editors vs Generic Editor**
- **Decision:** Create type-specific editors (HeaderComponentEditor, etc.)
- **Rationale:** Allows customized UX for each component type (e.g., FeatureListEditor with array subeditors)
- **Alternative:** Generic form builder - simpler but less polished

### 2. **Tab-Based Layout (Design → CTA Setup Tab Navigation)**
- **Decision:** Add "Component Layout" and "JSON" sub-tabs within CTA Setup
- **Rationale:** Familiar pattern, users choose their preferred workflow
- **Alternative:** Single view with both options - cluttered

### 3. **Property Grouping (Content/Appearance/Layout)**
- **Decision:** Group properties into sections
- **Rationale:** Cleaner UI, easier to find properties
- **Alternative:** Alphabetical list - less organized

### 4. **Real-Time Validation**
- **Decision:** Validate as user types, show errors inline
- **Rationale:** Immediate feedback, prevents invalid saves
- **Alternative:** Validation on save - delayed feedback, worse UX

### 5. **Two-Way Sync (Visual ↔ JSON)**
- **Decision:** Keep both in sync, warn if they diverge
- **Rationale:** Power users can use JSON, beginners use visual
- **Alternative:** JSON as export only - limits flexibility

---

## Success Criteria

✅ Users can:
1. See all CTA components in a list/tree
2. Click a component and edit its properties via forms (no JSON)
3. Change text, colors, fonts, alignment without code
4. Add/remove/reorder components without JSON
5. See changes reflected immediately in preview
6. Switch between visual and JSON editors without data loss
7. Understand which properties override theme colors

✅ Technical:
1. Visual editor in separate components
2. Type-safe property updates via Zod validation
3. Bidirectional sync with JSON config
4. No breaking changes to existing CTA system
5. Clean, maintainable code with proper TypeScript types

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Complex feature structures (array of objects) | High | Build dedicated array editors, not a single form |
| Too many properties to edit | High | Group properties, show advanced options on demand |
| Visual editor complexity | High | Start simple (text/colors), add advanced features later |
| Sync bugs between visual/JSON | High | Comprehensive tests, clear error handling |
| Performance with many components | Medium | Virtualization, React memoization, lazy loading |
| User doesn't understand property priority | Medium | Clear labeling, visual hierarchy, help text |

---

## Next Steps (After Approval)

1. ✅ Approve plan
2. 📋 Create TypeScript types and interfaces
3. 🏗️ Build foundation components
4. 🎨 Implement property field renderers
5. 📝 Build component-specific editors
6. 🔄 Implement array management
7. ✔️ Validation and error handling
8. 🎯 Integration with EmbedDesignForm-v2
9. 🧪 Testing and refinement
10. 📚 Documentation

