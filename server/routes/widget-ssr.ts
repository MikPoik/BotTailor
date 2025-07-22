import { Request, Response } from 'express';

// Server-side rendered widget template
export function renderWidgetSSR(req: Request, res: Response) {
  const { userId, chatbotGuid } = req.params;
  const { sessionId } = req.query;

  // Generate basic SSR HTML with loading skeleton
  const ssrHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat Widget</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
      background: white;
      height: 100vh;
      overflow: hidden;
    }
    .widget-container { 
      height: 100vh;
      display: flex; 
      flex-direction: column;
      background: white;
      border-radius: 16px;
    }
    .widget-header { 
      background: #2563eb; 
      padding: 16px; 
      display: flex; 
      align-items: center; 
      justify-content: space-between;
      border-radius: 16px 16px 0 0;
      color: white;
    }
    .header-info { 
      display: flex; 
      align-items: center; 
      gap: 12px;
    }
    .avatar { 
      width: 40px; 
      height: 40px; 
      background: rgba(255,255,255,0.2); 
      border-radius: 50%; 
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    }
    .bot-info h3 { 
      font-size: 16px; 
      font-weight: 600; 
      margin: 0;
    }
    .bot-info p { 
      font-size: 12px; 
      opacity: 0.8; 
      margin: 0;
    }
    .close-btn { 
      background: rgba(255,255,255,0.2); 
      border: none; 
      border-radius: 6px; 
      width: 32px; 
      height: 32px; 
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .widget-tabs { 
      border-bottom: 1px solid #e5e7eb; 
      display: flex; 
      background: white;
    }
    .tab { 
      flex: 1; 
      padding: 12px; 
      text-align: center; 
      background: #f8fafc;
      border: none;
      cursor: pointer;
      font-size: 14px;
      border-bottom: 2px solid transparent;
    }
    .tab.active { 
      background: white;
      border-bottom-color: #2563eb;
      color: #2563eb;
    }
    .widget-content { 
      flex: 1; 
      padding: 24px; 
      background: #f9fafb; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      gap: 20px;
      text-align: center;
    }
    .welcome-icon { 
      width: 64px; 
      height: 64px; 
      background: #dbeafe; 
      border-radius: 50%; 
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }
    .welcome-text h2 { 
      font-size: 20px; 
      font-weight: 600; 
      color: #1f2937;
      margin-bottom: 8px;
    }
    .welcome-text p { 
      font-size: 14px; 
      color: #6b7280;
      line-height: 1.5;
    }
    .action-buttons { 
      width: 100%; 
      max-width: 280px;
      display: flex; 
      flex-direction: column; 
      gap: 12px;
    }
    .action-btn { 
      padding: 12px 20px; 
      background: white; 
      border: 1px solid #e5e7eb; 
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      text-align: left;
      transition: all 0.2s ease;
    }
    .action-btn:hover {
      border-color: #2563eb;
      background: #f8fafc;
    }
    .widget-input { 
      padding: 16px; 
      border-top: 1px solid #e5e7eb; 
      background: white; 
      display: flex; 
      gap: 12px;
      border-radius: 0 0 16px 16px;
    }
    .input-field { 
      flex: 1; 
      padding: 12px 16px; 
      border: 1px solid #e5e7eb;
      border-radius: 24px;
      font-size: 14px;
      outline: none;
    }
    .input-field:focus {
      border-color: #2563eb;
    }
    .send-btn { 
      width: 48px; 
      height: 48px; 
      background: #2563eb; 
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .loading-spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .loading-spinner.show {
      opacity: 1;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Mobile styles */
    @media (max-width: 640px) {
      .widget-container {
        height: 100vh;
        border-radius: 0;
      }
      .widget-header {
        border-radius: 0;
      }
      .widget-input {
        border-radius: 0;
      }
    }
  </style>
</head>
<body>
  <div class="widget-container">
    <div class="widget-header">
      <div class="header-info">
        <div class="avatar">🤖</div>
        <div class="bot-info">
          <h3>SimpleAssistant</h3>
          <p>Online now</p>
        </div>
      </div>
      <button class="close-btn" onclick="parent.postMessage({type: 'close'}, '*')">
        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
    
    <div class="widget-tabs">
      <button class="tab active" onclick="showTab('home')">🏠 Home</button>
      <button class="tab" onclick="showTab('chat')">💬 Chat</button>
    </div>
    
    <div class="widget-content" id="content">
      <div class="welcome-icon">👋</div>
      <div class="welcome-text">
        <h2>How can I help you?</h2>
        <p>I'm here to assist you with any questions or tasks you might have.</p>
      </div>
      <div class="action-buttons">
        <button class="action-btn" onclick="startChat('Tell me about your services')">
          ❓ Tell me about your services
        </button>
        <button class="action-btn" onclick="startChat('I need technical support')">
          🔧 I need technical support  
        </button>
        <button class="action-btn" onclick="startChat('I want to learn more')">
          📚 I want to learn more
        </button>
      </div>
      
      <div class="loading-spinner" id="loadingSpinner">
        <div class="spinner"></div>
      </div>
    </div>
    
    <div class="widget-input">
      <input type="text" class="input-field" placeholder="Type your message..." 
             onkeypress="handleKeyPress(event)" id="messageInput">
      <button class="send-btn" onclick="sendMessage()">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  </div>

  <script>
    // Initialize React app loading
    let reactAppLoaded = false;
    let pendingMessage = null;
    
    // Start loading React app immediately
    window.addEventListener('load', function() {
      loadReactApp();
    });
    
    function showTab(tab) {
      // Visual tab switching (before React loads)
      const tabs = document.querySelectorAll('.tab');
      tabs.forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');
      
      if (reactAppLoaded) {
        // Delegate to React app
        window.ReactApp?.showTab?.(tab);
      }
    }
    
    function startChat(message) {
      if (reactAppLoaded) {
        // Delegate to React app
        window.ReactApp?.startChat?.(message);
      } else {
        // Queue message for when React loads
        pendingMessage = message;
        showLoading();
      }
    }
    
    function sendMessage() {
      const input = document.getElementById('messageInput');
      const message = input.value.trim();
      if (!message) return;
      
      if (reactAppLoaded) {
        // Delegate to React app
        window.ReactApp?.sendMessage?.(message);
        input.value = '';
      } else {
        // Queue message for when React loads
        pendingMessage = message;
        input.value = '';
        showLoading();
      }
    }
    
    function handleKeyPress(event) {
      if (event.key === 'Enter') {
        sendMessage();
      }
    }
    
    function showLoading() {
      const spinner = document.getElementById('loadingSpinner');
      spinner.classList.add('show');
    }
    
    function hideLoading() {
      const spinner = document.getElementById('loadingSpinner');
      spinner.classList.remove('show');
    }
    
    function loadReactApp() {
      // For now, keep the SSR interface - no React loading
      // This eliminates the white screen completely
      console.log('SSR interface active - no React transition needed');
      
      // Future enhancement: Progressive enhancement with React
      // - Load React app in background
      // - Smoothly transition from SSR to React when ready
      // - Keep all functionality working in SSR-only mode
    }
    
    // Listen for React app ready signal
    window.addEventListener('message', function(event) {
      if (event.data.type === 'reactAppReady') {
        reactAppLoaded = true;
        hideLoading();
      }
    });
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(ssrHtml);
}