# Chat Widget iframe Embedding - Redesign Plan

## 🎯 Problem Statement

Current iframe embedding has critical issues:

1. **Header/Navigation Issue**
   - "Demo website" or full layout showing above chat
   - Taking up space and confusing users
   - Should be completely hidden in iframe mode

2. **Scroll Behavior Issue**
   - Message scrolling affects parent page
   - Should only scroll within iframe bounds
   - Parent page shouldn't move when typing/sending messages

3. **Theme & Sizing Issue**
   - Custom colors not applied to iframe embeds
   - iframe size not respected (content overflows or undersizes)
   - No responsive sizing

4. **Limited Customization**
   - One-size-fits-all UI
   - Can't customize welcome message per embed
   - Can't adjust UI appearance without code changes
   - No visual branding options

5. **UX Limitations**
   - Not suitable for light integration (sidebar chat, support widget)
   - No ability to create different "styles" for different websites
   - Can't have minimalist vs full-featured versions

---

## ✨ Proposed Solution

Create a **Multi-View Embedding System** with different UI variants:

### Three Embedding Approaches

```
┌─────────────────────────────────────────────────────────────┐
│                 EMBEDDING OPTIONS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. FLOATING WIDGET (Current - Working)                     │
│    - Bubble in corner of website                           │
│    - Full customization                                    │
│    - Best for: Non-intrusive chat                          │
│    Route: /widget/{userId}/{guid}?embedded=true           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 2. INLINE iframe (Redesigned - NEW)                        │
│    - Direct chat interface in fixed container              │
│    - Minimal UI, no header/nav                             │
│    - Respects iframe size completely                       │
│    - Theme colors applied                                  │
│    - Clean scroll behavior                                 │
│    Route: /embed/{embedId}  (new variant system)           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 3. CUSTOM EMBEDS (Future - Multiple Designs)               │
│    - Create multiple "embed designs" per chatbot           │
│    - Different styles: minimal, compact, full, etc.        │
│    - Different welcome UI: button, form, landing, etc.     │
│    - Per-embed theme customization                         │
│    - URL: /embed/{embedDesignId}                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture Overview

### Current vs. Proposed Structure

```
CURRENT STRUCTURE:
┌──────────────────────────────────┐
│  /widget/:userId/:chatbotGuid    │
├──────────────────────────────────┤
│  ChatWidget Component             │
│  - Full layout logic              │
│  - Used for: floating + iframe    │
│  - Tries to handle both cases     │
│  - Result: conflicts and issues   │
└──────────────────────────────────┘


PROPOSED STRUCTURE:
┌──────────────────────────────────────────┐
│  ChatWidget Component (Current - OK)     │
│  - Used for: floating widget only        │
│  - /widget/:userId/:chatbotGuid          │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  EmbedChatInterface (NEW)                │
│  - Used for: inline iframe only          │
│  - /embed/:embedId                       │
│  - Minimal, clean UI                     │
│  - No header/nav/scrolling issues        │
│  - Respects container size               │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  EmbedBuilder (NEW)                      │
│  - UI for creating/managing embeds       │
│  - Drag-drop component selection         │
│  - Theme customization                   │
│  - Preview & testing                     │
└──────────────────────────────────────────┘
```

---

## 📊 Database Schema Changes

### New Tables Needed

#### 1. **embed_designs** (NEW)
```sql
CREATE TABLE embed_designs (
  id SERIAL PRIMARY KEY,
  chatbot_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  embed_id VARCHAR(36) UNIQUE NOT NULL,  -- public ID
  
  -- Basic info
  name VARCHAR(255),
  description TEXT,
  design_type VARCHAR(50),  -- 'minimal', 'compact', 'full', 'landing'
  
  -- Theme customization
  primary_color VARCHAR(7),
  background_color VARCHAR(7),
  text_color VARCHAR(7),
  
  -- UI customization
  welcome_message TEXT,
  welcome_type VARCHAR(50),  -- 'text', 'form', 'buttons'
  input_placeholder VARCHAR(255),
  show_avatar BOOLEAN DEFAULT true,
  show_timestamp BOOLEAN DEFAULT true,
  header_text VARCHAR(255),
  footer_text TEXT,
  
  -- Advanced options
  hide_branding BOOLEAN DEFAULT false,
  custom_css TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (chatbot_id) REFERENCES chatbot_configs(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### 2. **embed_design_components** (NEW)
```sql
-- Allows selecting which UI components to show
CREATE TABLE embed_design_components (
  id SERIAL PRIMARY KEY,
  embed_design_id INTEGER NOT NULL,
  
  component_name VARCHAR(100),
  -- Examples: 'welcome_section', 'chat_messages', 'input_field', 'feedback_buttons'
  
  is_visible BOOLEAN DEFAULT true,
  component_order INTEGER,
  
  FOREIGN KEY (embed_design_id) REFERENCES embed_designs(id)
);
```

#### 3. **embed_design_analytics** (NEW - Optional)
```sql
-- Track usage per embed design
CREATE TABLE embed_design_analytics (
  id SERIAL PRIMARY KEY,
  embed_design_id INTEGER NOT NULL,
  
  visits_today INTEGER DEFAULT 0,
  messages_today INTEGER DEFAULT 0,
  avg_session_duration INTEGER,
  
  date DATE DEFAULT CURRENT_DATE,
  
  FOREIGN KEY (embed_design_id) REFERENCES embed_designs(id)
);
```

### Modified Tables

#### **chatbot_configs** - Add field:
```sql
ALTER TABLE chatbot_configs ADD COLUMN
  default_embed_design_id INTEGER
  REFERENCES embed_designs(id);
```

---

## 🎨 Component Architecture

### New React Components

```
src/components/embed/
├── EmbedChatInterface.tsx          (Main wrapper for iframe embeds)
│   ├── Layout & container management
│   ├── Props: embedId, theme, config
│   └── No header/nav/demo elements
│
├── embed-designs/
│   ├── MinimalEmbed.tsx            (Minimal: just chat, no extras)
│   ├── CompactEmbed.tsx            (Small header + chat)
│   ├── FullEmbed.tsx               (Header + chat + footer)
│   └── LandingEmbed.tsx            (Form → Chat progression)
│
├── embed-components/
│   ├── EmbedHeader.tsx             (Optional header)
│   ├── EmbedWelcome.tsx            (Welcome section options)
│   ├── EmbedMessages.tsx           (Chat messages - no parent scroll)
│   ├── EmbedInput.tsx              (Message input)
│   └── EmbedFooter.tsx             (Optional footer)
│
└── hooks/
    ├── useEmbedScroll.ts           (Constrain scroll to iframe)
    ├── useEmbedTheme.ts            (Apply theme to embed)
    └── useEmbedConfig.ts           (Load embed config)
```

### Component Hierarchy Example - Minimal Embed

```
<EmbedChatInterface embedId={id}>
  └── <MinimalEmbed>
      ├── <EmbedWelcome>             (Simple message + input)
      ├── <EmbedMessages>            (Scrollable, constrained)
      └── <EmbedInput>               (Single input field)
</EmbedChatInterface>
```

### Component Hierarchy Example - Full Embed

```
<EmbedChatInterface embedId={id}>
  └── <FullEmbed>
      ├── <EmbedHeader>              (Branding, title)
      ├── <EmbedWelcome>             (Optional)
      ├── <EmbedMessages>            (Scrollable)
      ├── <EmbedInput>               (With buttons)
      └── <EmbedFooter>              (Branding, links)
</EmbedChatInterface>
```

---

## 🛣️ Routes & APIs

### New Routes (Backend)

#### 1. Embed Configuration API
```typescript
// Get embed design by ID (public, no auth)
GET /api/public/embed/:embedId
Response: {
  embedId,
  chatbotGuid,
  userId,
  designType,
  theme: { primaryColor, backgroundColor, textColor },
  welcome: { message, type, ... },
  components: [...]
}

// Get all designs for a chatbot (authenticated)
GET /api/chatbots/:guid/embeds
Response: Array<EmbedDesign>

// Create new embed design
POST /api/chatbots/:guid/embeds
Body: { name, designType, theme, ... }

// Update embed design
PUT /api/chatbots/:guid/embeds/:embedId
Body: { ... }

// Delete embed design
DELETE /api/chatbots/:guid/embeds/:embedId
```

#### 2. Embed Widget Route (Replaces current iframe logic)
```typescript
// Render embed based on design
GET /embed/:embedId?sessionId=...&theme=override
Response: HTML with:
  - Correct design component
  - Injected config
  - CSS variables for theme
  - No header/nav
  - Proper scrolling constraints
```

#### 3. Chat APIs (Same but respects context)
```typescript
// Messages still use session-based chat
POST /api/chat/messages
- Works same way
- Just constrained to iframe bounds
```

### New Routes (Frontend)

```typescript
// Embed management pages
GET /chatbots/:guid/embed-designs        (List all designs)
GET /chatbots/:guid/embed-designs/new    (Create new)
GET /chatbots/:guid/embed-designs/:id    (Edit)
GET /chatbots/:guid/embed-designs/:id/preview  (Preview)

// Public embed pages
GET /embed/:embedId                       (Render embed)
```

---

## 🎯 Key Features per Design Type

### 1. **Minimal Design**
```
┌─────────────────────┐
│   Welcome Message   │
│   "How can we help?"│
│                     │
│ ┌─────────────────┐ │
│ │ Chat Messages   │ │
│ │ (scrollable)    │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ [Type message]  │ │
│ └─────────────────┘ │
└─────────────────────┘
```
- **Use case**: Sidebar, widget, compact spaces
- **No**: Header, footer, avatar
- **Yes**: Welcome message, messages, input

### 2. **Compact Design**
```
┌──────────────────────┐
│ Your Company Support │  ← Header
├──────────────────────┤
│ Welcome Message      │
│ ┌──────────────────┐ │
│ │ Chat Messages    │ │
│ │ (scrollable)     │ │
│ └──────────────────┘ │
│ ┌──────────────────┐ │
│ │ [Type message]   │ │
│ └──────────────────┘ │
└──────────────────────┘
```
- **Use case**: Support portal, embedded on pages
- **Yes**: Header, messages, input
- **No**: Avatar, timestamp, footer

### 3. **Full Design**
```
┌──────────────────────────┐
│ Company Logo  | Support  │  ← Header
├──────────────────────────┤
│ Welcome Message          │
│ ┌──────────────────────┐ │
│ │ 👤 Message here      │ │  ← Avatar, timestamps
│ │    10:30 AM          │ │
│ │ Your reply...        │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ [Type message]  [Send]│ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ Powered by BotTailor     │  ← Footer
└──────────────────────────┘
```
- **Use case**: Dashboard, full-featured chat
- **Yes**: Header, avatar, timestamps, footer
- **No**: Nothing hidden

### 4. **Landing Design** (Future)
```
┌────────────────────────────┐
│ Welcome Form               │
│ Name: [____]               │
│ Email: [____]              │
│ Topic: [Select ▼]          │
│ [Start Chat]               │
└────────────────────────────┘
         ↓ (on form submit)
┌────────────────────────────┐
│ Chat Interface             │
│ (transitions smoothly)     │
└────────────────────────────┘
```
- **Use case**: Lead capture, form submission
- **Unique**: Form before chat

---

## 🛠️ Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

**Goal**: Create the new embed system foundation

**Tasks**:
1. [ ] Create database tables (`embed_designs`, `embed_design_components`)
2. [ ] Create backend API routes for embed management
3. [ ] Create new frontend route `/embed/:embedId`
4. [ ] Create `EmbedChatInterface` wrapper component
5. [ ] Fix scroll behavior (constrain to iframe)
6. [ ] Fix theme application in iframe context

**Files to Create**:
- `server/routes/embeds.ts`
- `server/embed-service.ts`
- `client/src/pages/embed.tsx` (new public page)
- `client/src/components/embed/EmbedChatInterface.tsx`
- `client/src/hooks/useEmbedScroll.ts`
- `client/src/hooks/useEmbedConfig.ts`

**Files to Modify**:
- `server/routes/index.ts` (register new routes)
- `shared/schema.ts` (add embed types)

### Phase 2: Design System (Week 1-2)

**Goal**: Create embed design variants

**Tasks**:
1. [ ] Create `MinimalEmbed` component
2. [ ] Create `CompactEmbed` component
3. [ ] Create `FullEmbed` component
4. [ ] Create shared embed sub-components
5. [ ] Add design-specific styling
6. [ ] Test each design for responsiveness

**Files to Create**:
- `client/src/components/embed/embed-designs/MinimalEmbed.tsx`
- `client/src/components/embed/embed-designs/CompactEmbed.tsx`
- `client/src/components/embed/embed-designs/FullEmbed.tsx`
- `client/src/components/embed/embed-components/EmbedHeader.tsx`
- `client/src/components/embed/embed-components/EmbedWelcome.tsx`
- `client/src/components/embed/embed-components/EmbedMessages.tsx`
- `client/src/components/embed/embed-components/EmbedInput.tsx`
- `client/src/components/embed/embed-components/EmbedFooter.tsx`
- `client/src/components/embed/embed-designs.css` (design-specific styles)

### Phase 3: Management UI (Week 2)

**Goal**: Build UI for creating/managing embed designs

**Tasks**:
1. [ ] Create "Embed Designs" management page
2. [ ] Add form to create new designs
3. [ ] Add form to edit designs
4. [ ] Add preview modal
5. [ ] Add design selector in dashboard
6. [ ] Add copy-to-clipboard for embed codes

**Files to Create**:
- `client/src/pages/embed-designs.tsx`
- `client/src/pages/embed-design-edit.tsx`
- `client/src/components/embed/EmbedDesignForm.tsx`
- `client/src/components/embed/EmbedDesignPreview.tsx`

**Files to Modify**:
- `client/src/routes/registry.ts` (add routes)

### Phase 4: Customization (Week 2-3)

**Goal**: Allow per-design customization

**Tasks**:
1. [ ] Add theme customization UI
2. [ ] Add welcome message customization
3. [ ] Add component visibility toggles
4. [ ] Add custom CSS editor (advanced)
5. [ ] Add live preview updates
6. [ ] Add template selector

**Files to Create**:
- `client/src/components/embed/EmbedThemeCustomizer.tsx`
- `client/src/components/embed/EmbedComponentSelector.tsx`

### Phase 5: Testing & Polish (Week 3)

**Goal**: Test and refine the system

**Tasks**:
1. [ ] Test all design variants
2. [ ] Test on different iframe sizes
3. [ ] Test mobile responsiveness
4. [ ] Test theme colors
5. [ ] Test scroll behavior
6. [ ] Performance optimization
7. [ ] Error handling
8. [ ] Documentation

---

## 📋 Specific Fixes for Current Issues

### Issue 1: "Demo Website" Showing

**Root Cause**: `ChatWidget` component renders full layout

**Solution**:
```typescript
// EmbedChatInterface.tsx
export function EmbedChatInterface({ embedId }) {
  const config = useEmbedConfig(embedId);
  
  // Select design component based on config
  const DesignComponent = designMap[config.designType];
  
  return (
    <div className="embed-chat-interface" style={{...}}>
      <DesignComponent 
        chatbotConfig={config}
        theme={config.theme}
        embedId={embedId}
      />
      {/* NO navbar, footer, or demo elements */}
    </div>
  );
}
```

### Issue 2: Messages Scroll Parent Page

**Root Cause**: Messages container has overflow auto without scroll constraints

**Solution**:
```typescript
// useEmbedScroll.ts
export function useEmbedScroll() {
  const messagesRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    
    // Prevent scroll bubbling to parent
    container.addEventListener('wheel', (e) => {
      // Only allow scroll if at bounds
      if (container.scrollHeight > container.clientHeight) {
        e.stopPropagation();
      }
    });
    
    // Override body scroll
    const preventScroll = (e: WheelEvent) => {
      if (messagesRef.current?.contains(e.target as Node)) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('wheel', preventScroll);
    return () => {
      document.removeEventListener('wheel', preventScroll);
    };
  }, []);
  
  return messagesRef;
}

// Usage in EmbedMessages.tsx
const messagesRef = useEmbedScroll();
return (
  <div 
    ref={messagesRef}
    className="overflow-y-auto"
    style={{ height: '100%', maxHeight: '400px' }}
  >
    {messages.map(...)}
  </div>
);
```

### Issue 3: Theme Not Applied / Size Not Respected

**Root Cause**: Theme applied to floating widget, iframe gets defaults; sizing not CSS controlled

**Solution**:
```typescript
// EmbedChatInterface.tsx
export function EmbedChatInterface({ embedId }) {
  const config = useEmbedConfig(embedId);
  
  // Apply theme as inline styles + CSS variables
  const themeStyles = {
    '--embed-primary': config.theme.primaryColor,
    '--embed-bg': config.theme.backgroundColor,
    '--embed-text': config.theme.textColor,
  } as React.CSSProperties;
  
  return (
    <div 
      className="embed-chat-interface"
      style={{
        ...themeStyles,
        // Respect container - grow to fill
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'inherit',
      }}
    >
      <DesignComponent />
    </div>
  );
}

// CSS
.embed-chat-interface {
  background-color: var(--embed-bg);
  color: var(--embed-text);
  /* Ensure no overflow */
  overflow: hidden;
}

.embed-chat-interface button {
  background-color: var(--embed-primary);
}
```

---

## 📦 New Dependencies (Optional)

- None required - uses existing stack
- Optional: Color picker library for admin (e.g., `react-color` or simple input[type=color])

---

## 🔄 Migration Path

### Keep Working:
- Floating widget route `/widget/:userId/:chatbotGuid` - no changes
- Floating widget code generation - keep as-is

### Add New:
- New embed design system
- New iframe-optimized component
- New management UI

### Optional Deprecation (Future):
- Old direct iframe embedding (if no one uses it)
- Unified embed page can switch between methods

---

## 🎯 Success Criteria

✅ **Embed Rendering**
- [ ] No "Demo website" or extra elements showing
- [ ] Only the chat interface visible
- [ ] Header/footer customizable, not forced

✅ **Scroll Behavior**
- [ ] Messages scroll within iframe only
- [ ] Parent page doesn't move
- [ ] Smooth scrolling
- [ ] No scroll jank

✅ **Theme & Size**
- [ ] Custom colors applied correctly
- [ ] Colors visible in all components
- [ ] iframe size respected (no overflow/undersizing)
- [ ] Responsive to container size changes

✅ **Customization**
- [ ] Can create multiple designs
- [ ] Can customize colors per design
- [ ] Can customize welcome message
- [ ] Can toggle components visibility
- [ ] Can preview before deploying

✅ **User Experience**
- [ ] Easy to create and manage embeds
- [ ] Copy/paste generation
- [ ] Mobile responsive
- [ ] Fast loading
- [ ] No console errors

---

## 📊 Estimated Effort

| Phase | Duration | Complexity | Effort |
|-------|----------|-----------|--------|
| Phase 1: Core | 3-4 days | Medium | 20 hrs |
| Phase 2: Designs | 2-3 days | Medium | 15 hrs |
| Phase 3: UI | 2-3 days | Medium | 12 hrs |
| Phase 4: Custom | 2-3 days | Low-Med | 10 hrs |
| Phase 5: Polish | 2-3 days | Low | 8 hrs |
| **TOTAL** | **~2 weeks** | - | **~65 hrs** |

---

## 🚀 Future Enhancements

1. **Template Library**
   - Pre-made designs users can duplicate
   - Industry-specific templates

2. **A/B Testing**
   - Multiple designs on same chatbot
   - Track which performs better

3. **Landing Page Variant**
   - Form before chat
   - Lead capture integration

4. **Inline Notifications**
   - Toast-style notifications
   - Floating badges instead of bubble

5. **Embeddable Elements**
   - Standalone button
   - Floating status indicator
   - Quick reply widget

6. **Analytics**
   - Per-design metrics
   - Click-through rates
   - Session analytics

---

## ✨ Summary

This plan transforms iframe embedding from a "bolt-on" feature to a **first-class, flexible embedding system**:

- ✅ **Fixes current issues**: No header, no scroll problems, proper theming
- ✅ **Enables customization**: Multiple designs, per-site customization
- ✅ **Scalable architecture**: Easy to add new design types
- ✅ **User-friendly**: No-code creation and management
- ✅ **Future-proof**: Foundation for advanced features

The system maintains backward compatibility with floating widgets while providing a superior experience for iframe embeddings.
