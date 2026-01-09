# Quick Start: Embedding Your Chat Widget

## ⚡ Quick Summary
You have **2 ways** to embed your chat on external websites:

### 1️⃣ Floating Widget (Recommended)
A floating chat bubble that appears in the corner - clicks to open the full chat.

```html
<script src="https://yourdomain.com/embed.js"></script>
<script>
  ChatWidget.init({
    apiUrl: 'https://yourdomain.com/widget/{userId}/{chatbotGuid}',
    position: 'bottom-right',
    primaryColor: '#2563eb',
    backgroundColor: '#ffffff',
    textColor: '#1f2937'
  });
</script>
```

**Best for**: Blogs, product pages, customer support sites

---

### 2️⃣ Direct iframe (Simple)
Embeds the chat interface directly inline on your page.

```html
<iframe 
  src="https://yourdomain.com/widget/{userId}/{chatbotGuid}" 
  width="400" 
  height="600" 
  frameborder="0"
  style="border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
</iframe>
```

**Best for**: Custom dashboards, support portals, embedded tools

---

## 🎨 Customization

### Floating Widget Options

```javascript
ChatWidget.init({
  apiUrl: 'https://yourdomain.com/widget/{userId}/{chatbotGuid}',
  
  // Position on screen
  position: 'bottom-right',  // or 'bottom-left'
  
  // Colors (hex codes)
  primaryColor: '#2563eb',        // Button/accent color
  backgroundColor: '#ffffff',      // Chat background
  textColor: '#1f2937',           // Text color
  
  // Advanced options
  zIndex: 1000                    // Stack order if overlapping elements
});
```

### Direct iframe Options
```html
<!-- Resize to fit your layout -->
<iframe 
  src="https://yourdomain.com/widget/{userId}/{chatbotGuid}" 
  width="500"      <!-- Adjust width -->
  height="800"     <!-- Adjust height -->
  frameborder="0"
  style="border-radius: 12px;">
</iframe>
```

---

## 📍 Where to Get the Embed Code

1. Log in to your dashboard
2. Go to **Chatbots**
3. Click on your chatbot
4. Click the **Embed** button
5. Choose **Floating Widget** or **Inline iframe**
6. Click **Copy Code**
7. Paste into your website's HTML

---

## ✅ What You Need

- **userId**: Your account ID (auto-included in generated code)
- **chatbotGuid**: Your chatbot's ID (auto-included in generated code)
- **Your Domain**: Should work on any domain (https://yourdomain.com)

---

## 🔍 How It Works Behind the Scenes

### Floating Widget Flow
```
1. Your website loads embed.js
2. ChatWidget.init() runs
3. Floating bubble appears in corner
4. User clicks bubble
5. iframe loads with your chat at /widget/{userId}/{chatbotGuid}
6. Configuration (colors, theme) sent via postMessage
7. Chat opens with your custom styling
```

### Direct iframe Flow
```
1. Your page loads iframe tag
2. iframe.src points to /widget/{userId}/{chatbotGuid}
3. Chat interface renders immediately
4. Uses default colors (or customize via URL params)
```

---

## 🚀 Testing Your Embed

### Before Going Live
1. ✅ Chatbot must be **Active** (enabled in dashboard)
2. ✅ Test on **external domain** (not localhost)
3. ✅ Check **mobile view** looks good
4. ✅ Verify **colors** are applied correctly
5. ✅ Test **chat functionality** (sending messages)
6. ✅ Check **console** for any errors (F12 → Console)

### Debug Mode
If something isn't working, enable debug logs:
```javascript
localStorage.setItem('chat_debug', '1');
// Reload the page and check Console (F12)
// Look for [EMBED_DEBUG] messages
```

---

## ⚠️ Common Issues & Fixes

| Problem | Cause | Fix |
|---------|-------|-----|
| Widget doesn't appear | Chatbot not active | Enable chatbot in dashboard |
| Colors don't apply | Embed.js cached | Hard refresh (Ctrl+Shift+R) |
| Cross-origin errors | Wrong domain | Use full domain with protocol |
| Chat won't open | iframe sandbox issue | Allow-same-origin permission set |
| Session resets | sessionStorage cleared | Normal behavior, reload page |

---

## 📝 Advanced: URL Parameters for Direct iframe

You can add theme colors directly to the URL:

```html
<iframe 
  src="https://yourdomain.com/widget/{userId}/{chatbotGuid}?primaryColor=%232563eb&backgroundColor=%23ffffff"
  width="400" 
  height="600">
</iframe>
```

Parameters:
- `primaryColor` = hex color (URL encoded, e.g., %23 = #)
- `backgroundColor` = hex color
- `textColor` = hex color
- `mobile=true` = force mobile view
- `sessionId=xyz` = use custom session ID

---

## 🔐 Security Notes

✅ **Safe**: Both embedding methods use sandboxed iframes
✅ **No API Keys**: Public chatbots don't need authentication
✅ **Cross-Origin Safe**: Uses postMessage API (secure communication)
✅ **HTTPS Only**: Production enforces HTTPS

---

## 📞 Support

If embed code isn't showing or not working:
1. Check if chatbot is Active
2. Verify you're copying code from the Embed page
3. Test on external domain (not localhost)
4. Enable debug mode and check browser console
5. Check that sessionId is being generated correctly

---

## Next Steps

1. **Copy your embed code** from the dashboard
2. **Paste it** into your website HTML
3. **Test it** on an external domain
4. **Customize colors** if needed via embed parameters
5. **Go live!** Share your link with customers

