# Widget Architecture Analysis & Refactoring Plan

## Executive Summary
The current flash/re-render issue is a **symptom of fundamental architectural flaws** in how the chat widget integrates with the Home page. The widget is tightly coupled to the Home component's React tree, causing unwanted re-renders and state interference. A comprehensive refactoring is needed to decouple the widget completely.

---

## Current Architecture Problems

### 1. **Tight Coupling: ChatWidget in Home's React Tree**
```
Home (re-renders for any reason)
└── ChatWidget (unmounts/remounts when parent re-renders)
    └── TabbedChatInterface
        └── useChat (chat state)
```

**Problem**: When Home re-renders for ANY reason, ChatWidget gets unmounted and remounted, losing state and triggering animations.

### 2. **Root Cause: Home Re-renders on Unknown Trigger**
From logs: `reason: 'unknown'` - Home is re-rendering but we can't explain why.

**Likely culprits**:
- `useAuth()` query being invalidated by selectOptionMutation API call
- React Query global refetches triggered by mutation
- Parent router component re-rendering
- Context provider re-rendering

### 3. **State Bubbling Through Query Client**
- `useChat` uses `useMutation` with React Query
- `selectOptionMutation` makes API call to `/api/chat/{sessionId}/select-option`
- This API call might invalidate queries that Home's `useAuth()` uses
- If queries share similar cache keys or if React Query does global refetches, Home's query cache changes
- Home re-renders due to query cache change
- ChatWidget unmounts → remounts → animations replay → **FLASH**

### 4. **sessionStorage Race Conditions**
- `useGlobalChatSession` uses `useState` with sessionStorage fallback
- First call to useGlobalChatSession gets value from sessionStorage
- Subsequent calls get value from closure
- If sessionStorage is cleared or multiple tabs, inconsistency can occur

### 5. **No Isolation Between Pages**
- Home page, Dashboard, and other pages all share the same React Query client
- Mutations from one page can affect queries in another
- No per-page or per-widget isolation of state

---

## Symptoms vs Root Causes

| Symptom | Apparent Cause | Real Cause |
|---------|---|---|
| Flash on menu click | Component remounting | Home re-renders → ChatWidget unmounts → remounts |
| Homepage scrolls to top | Scroll position lost | Home re-renders resets DOM |
| Only happens on Home, not Dashboard | Widget-specific issue | Home's useAuth/useQuery interference |
| Doesn't happen on 2nd click from same menu | First click differs | Menu state vs other difference? |

---

## Solution Options Analysis

### **Option 1: ChatSessionProvider Context Isolation** ⭐⭐

**Architecture**:
```
Home
├── useAuth
├── useQuery(defaultChatbot)
└── ChatSessionProvider
    └── ChatWidget
        ├── useChat (from context, not Home)
        └── TabbedChatInterface
```

**How it works**:
- Create `ChatSessionContext` that holds `sessionId`
- ChatWidget renders its own Provider at mount
- ChatWidget never receives sessionId as prop from Home
- Home's re-renders only affect the Provider boundary, not ChatWidget children

**Pros**:
✅ Minimal refactoring (15-20 files)
✅ No new dependencies
✅ Easy to test
✅ Backwards compatible with current query setup
✅ Solves state bubbling partially

**Cons**:
❌ ChatWidget still mounted in Home's tree
❌ Home re-renders still happen (just don't cascade to ChatWidget)
❌ Doesn't address useAuth query interference
❌ If Home re-renders frequently, Context Provider still updates

**Edge Cases**:
- Context memoization must be perfect or defeats purpose
- useCallback dependencies in ChatWidget must exclude external props
- Session ID changes need special handling

**Estimated Complexity**: Medium (3-5 days)

---

### **Option 2: Separate React Query Client for Widget** ⭐⭐⭐

**Architecture**:
```
Root
├── Home (queryClient1)
│   └── useAuth, useQuery(defaultChatbot)
└── ChatWidgetRoot (queryClient2)
    └── ChatWidget
        ├── useChat (isolated queries)
        └── TabbedChatInterface
```

**How it works**:
- Create separate `QueryClientProvider` wrapping ChatWidget
- Widget has its own cache, separate from Home's cache
- Mutations in widget don't affect Home's queries
- Home's queries don't affect widget

**Pros**:
✅ Complete isolation of queries
✅ No cross-page query interference
✅ Mutations never trigger unexpected refetches
✅ Cleaner architecture
✅ Solves the real root cause

**Cons**:
❌ Moderate refactoring (20-25 files)
❌ May duplicate network requests if both clients fetch same data
❌ Cache management complexity
❌ Need to sync auth state between clients

**Edge Cases**:
- User logs out in Home, widget needs to know
- Share certain queries (like defaultChatbot) across clients
- Network requests might be duplicated
- SSR complications

**Estimated Complexity**: High (5-7 days)

---

### **Option 3: Portal-Based Widget (Recommended)** ⭐⭐⭐⭐⭐

**Architecture**:
```
Root
├── Home
│   └── <div id="chat-widget-portal-root"> (empty)
├── ChatWidgetPortal (renders via createPortal into #chat-widget-portal-root)
    ├── ChatSessionProvider
    │   └── ChatWidget
    │       └── TabbedChatInterface
    └── Separate QueryClient for widget
```

**How it works**:
- ChatWidget mounts OUTSIDE React tree via `createPortal`
- Widget renders into its own DOM subtree
- Home can re-render infinitely, widget unaffected
- ChatWidget gets its own QueryClient for complete isolation
- ChatSessionProvider keeps sessionId accessible to widget

**Pros**:
✅ **Complete isolation** - ChatWidget never affected by Home
✅ **Solves all re-render issues** - Home re-renders don't cascade
✅ **True independence** - Widget could be removed/readded without unmounting
✅ **Cleaner separation** - Home and ChatWidget are separate applications
✅ **Future-proof** - Widget could be embedded anywhere
✅ **Real root cause fix** - Not a patch

**Cons**:
❌ Larger refactoring (30-35 files)
❌ CSS/z-index management required
❌ Event delegation considerations
❌ SSR complexity (portals don't work in SSR)
❌ Need to ensure portal target element exists before rendering

**Edge Cases**:
- Modal z-index conflicts with page modals
- Event bubbling from widget to parent page
- CSS inheritance (fonts, colors might not inherit)
- SSR: Widget rendered in browser only
- Multiple portals if multiple widgets
- Scroll restoration with portal (more complex)

**Estimated Complexity**: High (7-10 days) but most robust

---

### **Option 4: Zustand/External State Management** ⭐⭐

**Architecture**:
```
Zustand Store (outside React tree)
├── chatStore (sessionId, messages, isStreaming)
├── Home (reads/writes to store)
└── ChatWidget (reads/writes to store)
    └── TabbedChatInterface
```

**How it works**:
- Move chat state to Zustand
- ChatWidget subscribes to store, not React state
- Home changes don't affect widget at all
- Store updates are external to React's render cycle

**Pros**:
✅ Easy to understand
✅ Single source of truth
✅ DevTools support (Zustand DevTools)
✅ Predictable updates

**Cons**:
❌ New dependency (Zustand)
❌ Still doesn't solve Home's re-render issue (just doesn't matter)
❌ Query management still complex
❌ Not idiomatic React

**Estimated Complexity**: Medium-High (5-7 days)

---

## Recommended Solution: Portal + Separate QueryClient

### Why This Approach?

1. **Solves the root cause**, not symptoms
2. **Widget becomes truly independent** - can be deployed anywhere
3. **No mystery re-renders** - Home doesn't affect widget at all
4. **Future-proof** - foundation for true plugin system
5. **Cleaner codebase** - clear responsibility boundaries

### Implementation Strategy

```
Phase 1: Create Infrastructure (2 days)
├── Create ChatWidgetPortal component wrapper
├── Create separate QueryClient for widget
├── Create ChatSessionProvider context
├── Create portal target element in Home

Phase 2: Refactor ChatWidget (3 days)
├── Move ChatWidget to use Context for sessionId
├── Update useChat to accept context
├── Remove prop-based sessionId
├── Update all child components

Phase 3: Query Client Migration (2 days)
├── Move chat queries to widget's QueryClient
├── Handle auth state sharing between clients
├── Implement fallback for shared data (defaultChatbot)

Phase 4: Testing & Edge Cases (2 days)
├── Test re-render isolation
├── Test modal stacking
├── Test SSR fallback
├── Test multi-page navigation

Phase 5: Cleanup (1 day)
├── Remove old logging
├── Update types
├── Documentation
```

---

## Edge Cases & Mitigations

### **1. Z-Index / Modal Stacking**
**Issue**: Widget portal might be behind other modals

**Mitigation**:
```javascript
// Widget container has higher z-index
const ChatWidgetPortal = () => (
  <div style={{ position: 'fixed', zIndex: 2000 }}>
    <ChatWidget />
  </div>
)
```

### **2. CSS Inheritance**
**Issue**: Widget might not inherit fonts/colors from parent

**Mitigation**:
- Use CSS custom properties (--primary-color) instead of inheritance
- Portal wrapper explicitly sets font/color
- Theme passed via context

### **3. Event Bubbling**
**Issue**: Widget clicks might bubble to Home

**Mitigation**:
```javascript
<div onClick={e => e.stopPropagation()}>
  <ChatWidget />
</div>
```

### **4. Auth State Sharing**
**Issue**: Widget needs to know when user logs out

**Mitigation**:
- Create shared `AuthContext` at root
- Both Home and Widget subscribe to single AuthContext
- QueryClients can be separate, but AuthContext is shared

### **5. SSR Compatibility**
**Issue**: createPortal doesn't work in SSR

**Mitigation**:
```javascript
if (typeof window === 'undefined') {
  // SSR: render inline, not portal
  return <ChatWidget />
}
// Browser: render via portal
return <Portal><ChatWidget /></Portal>
```

### **6. Multiple Instances**
**Issue**: Multiple widgets on same page

**Mitigation**:
- Each widget gets unique portal ID
- Separate QueryClient per widget
- Separate sessionStorage key per widget

### **7. Page Navigation**
**Issue**: Widget state lost on navigation

**Mitigation**:
- Option A: Clear widget on route change
- Option B: Persist widget state to localStorage
- Option C: Keep widget mounted across routes using layout pattern

---

## Comparison Matrix

| Criterion | Context | Separate QC | Portal | Zustand |
|-----------|---------|-------------|--------|---------|
| **Solves flash** | Partial | Yes | ✅ **Yes** | Yes |
| **Root cause fix** | No | Yes | ✅ **Yes** | Partial |
| **Implementation** | 3-5 days | 5-7 days | ✅ **7-10 days** | 5-7 days |
| **Query isolation** | No | ✅ **Yes** | ✅ **Yes** | No |
| **True independence** | No | Partial | ✅ **Yes** | No |
| **Future-proof** | No | Partial | ✅ **Yes** | Partial |
| **SSR compatible** | ✅ **Yes** | ✅ **Yes** | Partial | ✅ **Yes** |
| **Learning curve** | Low | Medium | ✅ **Medium** | Low |
| **Dependencies** | 0 | 0 | ✅ **0** | 1 |

---

## Migration Path (Least Disruptive)

If refactoring everything at once is risky, use this step approach:

### **Phase 1: Context Isolation (Safe, 2-3 days)**
- Implement ChatSessionProvider
- Move sessionId to context
- Test thoroughly
- *Result*: Some improvement, but not complete fix

### **Phase 2: Separate Query Client (Incremental, 2-3 days)**
- Add widget's QueryClient
- Migrate chat queries only
- Keep Home's queries separate
- *Result*: Widget queries won't interfere

### **Phase 3: Portal (Final, 3-4 days)**
- Wrap ChatWidget in portal
- Move to portal root after steps 1-2 work
- Remove from Home's tree
- *Result*: Complete isolation

**Total**: 7-10 days vs 7-10 days for full portal rebuild, but lower risk

---

## Recommendation

**Go with Portal + Separate QueryClient** because:

1. **Highest ROI**: Completely eliminates the class of issues
2. **Scalable**: Foundation for future widget improvements
3. **Clean**: Clear architectural boundaries
4. **Testable**: Easy to verify isolation
5. **Worth the investment**: 7-10 days now prevents months of debugging later

---

## Next Steps

1. **Approval**: Confirm Portal + Separate QC approach
2. **Planning**: Break down Phase 1 work
3. **Setup**: Create infrastructure (Portal, QueryClient, Context)
4. **Migration**: Move ChatWidget piece by piece
5. **Testing**: Verify flash is gone
6. **Documentation**: Update architecture docs
