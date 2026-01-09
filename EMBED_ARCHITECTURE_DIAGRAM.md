# Embedding Architecture Diagram & Data Flow

## 🎯 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Website (External)                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Embed Code (Generated from Dashboard)               │  │
│  │                                                      │  │
│  │  <script src="https://yourdomain.com/embed.js">     │  │
│  │  <script>                                            │  │
│  │    ChatWidget.init({                                 │  │
│  │      apiUrl: 'https://yourdomain.com/widget/...',   │  │
│  │      primaryColor: '#2563eb'                         │  │
│  │    })                                                │  │
│  │  </script>                                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Floating Chat Bubble (embed.js)              │  │
│  │  ┌──────────────────────────────────────────┐       │  │
│  │  │ 💬 Chat Widget (clickable bubble)        │       │  │
│  │  │         [Click to Open]                  │       │  │
│  │  └──────────────────────────────────────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      iframe (Created dynamically on click)           │  │
│  │   src="https://yourdomain.com/widget/..."           │  │
│  │                                                      │  │
│  │  ┌─────────────────────────────────────────┐        │  │
│  │  │  Full Chat Interface (React Component)  │        │  │
│  │  │  - Messages                             │        │  │
│  │  │  - Input field                          │        │  │
│  │  │  - Theme colors applied                 │        │  │
│  │  └─────────────────────────────────────────┘        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕ postMessage
┌─────────────────────────────────────────────────────────────┐
│           Your BotTailor Backend (yourdomain.com)            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  GET /embed.js                                       │  │
│  │  - Returns JavaScript widget initializer             │  │
│  │  - Public, no auth required                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  GET /widget/:userId/:chatbotGuid                    │  │
│  │  - Validates chatbot exists & is active              │  │
│  │  - Injects session config into HTML                  │  │
│  │  - Applies theme colors                              │  │
│  │  - Serves React ChatWidget component                 │  │
│  │  - Public, no auth required                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Chat API Routes (Authenticated)                     │  │
│  │  - POST /api/chat/sessions                           │  │
│  │  - POST /api/chat/messages                           │  │
│  │  - GET  /api/chat/messages/:sessionId                │  │
│  │  - Uses session ID from embed config                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database (PostgreSQL)                               │  │
│  │  - Chat sessions                                     │  │
│  │  - Messages                                          │  │
│  │  - Chatbot configs                                   │  │
│  │  - User info                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  OpenAI Integration                                   │  │
│  │  - AI responses                                       │  │
│  │  - Streaming                                          │  │
│  │  - RAG (website content search)                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📡 Floating Widget Flow

```
1. USER VISITS WEBSITE
   ├─ Website loads: <script src="/embed.js"></script>
   └─ ChatWidget.init({ apiUrl, primaryColor, ... })

2. EMBED.JS INITIALIZES
   ├─ Validates configuration
   ├─ Creates DOM elements:
   │  ├─ Bubble div (floating button)
   │  ├─ iframe (hidden, for chat content)
   │  └─ overlay (mobile fullscreen background)
   ├─ Injects CSS variables for theming
   ├─ Fetches chatbot config from /api/public/chatbot/{userId}/{guid}
   └─ Displays initial message bubbles (if configured)

3. USER CLICKS BUBBLE
   ├─ openChat() function triggered
   ├─ Checks if mobile or desktop
   ├─ Sets iframe.src = /widget/{userId}/{guid}?embedded=true&sessionId=...
   ├─ iframe loads (server renders React component)
   └─ Sends THEME_CONFIG via postMessage

4. IFRAME LOADS
   ├─ App.tsx detects isEmbedded = true
   ├─ Skips authentication
   ├─ Renders ChatWidget component only (no navbar/footer)
   ├─ Receives config from window.__CHAT_WIDGET_CONFIG__
   └─ Listens for postMessage events

5. CHAT INTERFACE DISPLAYS
   ├─ Shows welcome message
   ├─ User can type messages
   ├─ Messages sent to backend via /api/chat/messages
   └─ Backend responds with AI-generated replies

6. USER CLOSES CHAT
   ├─ Click X button or overlay (mobile)
   ├─ iframe.src = postMessage(CLOSE_CHAT)
   ├─ Bubble reappears
   └─ Chat session persists (sessionStorage)
```

---

## 🔗 Request/Response Flow

### Step 1: Load embed.js
```
CLIENT                              SERVER
  │                                  │
  ├─ GET /embed.js ────────────────→ │
  │                                  │
  ← ───────── 200 + JavaScript ──────┤
  │                                  │
  Script executes in browser         │
```

### Step 2: Fetch Chatbot Config
```
CLIENT (embed.js)                   SERVER
  │                                  │
  ├─ GET /api/public/chatbot/       │
  │     {userId}/{chatbotGuid} ─────→│
  │                                  │ Check database
  │                                  │ Validate active
  ← ─ 200 + chatbot config ──────────┤
  │  {                                │
  │    id, name, description,         │
  │    welcomeMessage,                │
  │    initialMessages,               │
  │    isActive                       │
  │  }                                │
```

### Step 3: Load iframe with Widget
```
CLIENT (bubble click)               SERVER
  │                                  │
  ├─ GET /widget/{userId}           │
  │          /{chatbotGuid}          │
  │     ?embedded=true               │
  │     &sessionId=...  ─────────────→│
  │                                  │ Validate chatbot
  │                                  │ Generate session
  │                                  │ Render HTML
  ← ─── 200 + HTML + Config ────────┤
  │  <html>                           │
  │  <script>                         │
  │    window.__CHAT_WIDGET_CONFIG__  │
  │  </script>                        │
  │  <div id="root">...</div>         │
  │  <script src="/client.js">        │
  │  </html>                          │
```

### Step 4: Send Message
```
CLIENT (Chat)                       SERVER
  │                                  │
  ├─ POST /api/chat/messages ───────→│
  │  {                                │
  │    sessionId,                     │
  │    content,                       │
  │    messageType                    │
  │  }                                │
  │                                  │ Create message
  │                                  │ Get AI response
  │                                  │ Save to DB
  ← ─── 200 + response ──────────────┤
  │  {                                │
  │    id,                            │
  │    role: 'assistant',             │
  │    content,                       │
  │    metadata                       │
  │  }                                │
```

### Step 5: Theme Configuration via postMessage
```
PARENT WINDOW                       IFRAME
  │                                  │
  │ postMessage({                    │
  │   type: 'THEME_CONFIG',          │
  │   theme: {                       │
  │     primaryColor,                │
  │     backgroundColor,             │
  │     textColor                    │
  │   }                              │
  │ }, '*')                          │
  ├─────────────────────────────────→│
  │                                  │ window.addEventListener('message', ...)
  │                                  │ Apply CSS variables
  │                                  │ Re-render components
```

---

## 🎨 Theme Color Application Flow

```
┌─────────────────────────────────────────┐
│ Embed Code Configuration (Highest Prio) │
│ ChatWidget.init({                       │
│   primaryColor: '#2563eb'               │
│ })                                      │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ embed.js injectThemeVariables()          │
│ Creates <style> with CSS variables:     │
│ --chat-primary-color: #2563eb           │
│ --chat-background: #ffffff              │
│ --chat-text: #1f2937                    │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ postMessage(THEME_CONFIG) → iframe      │
│ Sends theme object to iframe            │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ iframe applies CSS variables:           │
│ :root {                                 │
│   --background: #ffffff                 │
│   --foreground: #1f2937                 │
│   --primary: #2563eb                    │
│ }                                       │
│ Tailwind components use these vars      │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│ Chat UI Renders with Custom Colors      │
│ - Buttons: primary color                │
│ - Background: background color          │
│ - Text: text color                      │
│ - Accents: primary color variations     │
└─────────────────────────────────────────┘
```

---

## 📱 Mobile vs Desktop Rendering

```
VIEWPORT SIZE CHECK (embed.js)
           │
    ┌──────┴──────┐
    │             │
    ↓ mobile      ↓ desktop
  <1024px        ≥1024px
    │             │
    │             ├─ Floating bubble in corner
    │             ├─ 550px wide iframe
    │             ├─ Positioned bottom-right
    │             └─ Can see website behind
    │
    ├─ Full-screen overlay (mobile)
    ├─ Full viewport iframe
    ├─ 100% width/height
    └─ No website visible while open
```

---

## 🔐 Security & Isolation

```
EXTERNAL WEBSITE (Untrusted Context)
┌───────────────────────────────────────┐
│ Your website code                      │
│ - Can access: window, document, etc.   │
│ - Cannot access: iframe internals      │
│                                        │
│  ┌────────────────────────────────┐   │
│  │ Sandboxed iframe               │   │
│  │ sandbox="allow-scripts         │   │
│  │          allow-forms           │   │
│  │          allow-popups          │   │
│  │          allow-same-origin"    │   │
│  │                                │   │
│  │ React App (Chat)               │   │
│  │ - Can access: own DOM only     │   │
│  │ - Cannot access: parent window │   │
│  │ - Communication: postMessage   │   │
│  │   (one-way by default)         │   │
│  └────────────────────────────────┘   │
│           ↕ postMessage                │
│  Communication: { type, data }         │
└───────────────────────────────────────┘
```

---

## 📊 Session Management

```
SESSION LIFECYCLE
│
├─ New User Visits Website
│  ├─ embed.js generates sessionId
│  │  sessionId = `embed_${timestamp}_${random}`
│  ├─ Stores in sessionStorage
│  │  key: 'embed-session-id'
│  │  value: sessionId
│  └─ If sessionStorage unavailable:
│     └─ Fallback: Pass sessionId in URL
│
├─ User Opens Chat
│  ├─ iframe loads with sessionId in URL
│  ├─ Server creates new session in DB
│  │  INSERT INTO chat_sessions
│  │  (sessionId, chatbotId, createdAt)
│  └─ Client receives session config
│
├─ User Sends Messages
│  ├─ Include sessionId with request
│  ├─ Server validates sessionId
│  ├─ Links message to session
│  └─ Maintains conversation context
│
├─ Page Refresh
│  ├─ sessionStorage persists (same tab)
│  ├─ Session continues
│  └─ Message history visible
│
└─ User Closes Browser/Tab
   ├─ sessionStorage cleared
   ├─ New sessionId on revisit
   ├─ Old messages lost (can be retrieved from DB if user logs in)
   └─ Fresh chat session starts
```

---

## 🔄 Message Flow with AI

```
USER                    BROWSER              SERVER             OPENAI
 │                        │                    │                  │
 ├─ Types message ─→      │                    │                  │
 │                        │                    │                  │
 │                    ├─ Stores locally        │                  │
 │                    ├─ Shows in chat UI      │                  │
 │                    │                        │                  │
 │                    ├─ POST /api/chat/      │                  │
 │                    │     messages ────────→│                  │
 │                    │                        │                  │
 │                    │                    ├─ Save message        │
 │                    │                    ├─ Build context       │
 │                    │                    │  (history, RAG,      │
 │                    │                    │   system prompt)     │
 │                    │                    │                      │
 │                    │                    ├─ Call createChatCompletion ──→│
 │                    │                    │                      │
 │                    │                    │                  ├─ Generate response
 │                    │                    │                  ├─ Stream or respond
 │                    │                    │                  └─ Return
 │                    │                    │                      │
 │                    │                    ├─ Parse AI response ←─┤
 │                    │                    ├─ Save to DB          │
 │                    │                    │                      │
 │                    │ ← 200 + response ──│                      │
 │                    │                        │                  │
 │                    ├─ Show AI message       │                  │
 │                    ├─ Display in chat UI    │                  │
 │                    │                        │                  │
 ← ────────────── Chat updates ─────────────┤                  │
```

---

## 📈 Embed Code Lifecycle

```
DEVELOPER DASHBOARD
│
├─ Create Chatbot
│  ├─ Configure settings (model, prompt, etc.)
│  ├─ Set UI Designer colors
│  └─ Activate chatbot
│
├─ Visit Embed Page
│  ├─ URL: /chatbots/{guid}/embed
│  │
│  └─ Page generates code:
│     ├─ Widget Code:
│     │  <script src="/embed.js"></script>
│     │  <script>
│     │    ChatWidget.init({
│     │      apiUrl: '/widget/{userId}/{guid}',
│     │      colors: (from UI Designer)
│     │    })
│     │  </script>
│     │
│     └─ iframe Code:
│        <iframe
│          src="/widget/{userId}/{guid}"
│          width="400"
│          height="600">
│        </iframe>
│
├─ Copy & Share Code
│  └─ Developer pastes into their website
│
└─ Website Loads Code
   ├─ embed.js initializes
   ├─ Floating bubble appears
   ├─ User can chat
   └─ Conversations stored in database
```

---

## ✨ Summary

The embedding system is built on:

1. **Server-side rendering** (`/widget/:userId/:chatbotGuid`)
2. **Client-side initialization** (`embed.js`)
3. **Safe cross-origin communication** (`postMessage`)
4. **Session persistence** (`sessionStorage`)
5. **Dynamic theming** (CSS variables)
6. **Responsive design** (mobile/desktop detection)
7. **Security isolation** (sandboxed iframes)

All components work together to provide a seamless, secure embedding experience for end users while maintaining the integrity of the chat system.
