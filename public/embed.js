(function() {
  'use strict';

  // Chatbot Widget Embedder
  const ChatWidget = {
    config: {
      apiUrl: window.location.origin,
      sessionId: null,
      position: 'bottom-right',
      primaryColor: '#2563eb',
      zIndex: 1000,
    },

    init: function(options = {}) {
      // Merge options with default config
      this.config = { ...this.config, ...options };
      
      // Generate session ID if not provided
      if (!this.config.sessionId) {
        this.config.sessionId = this.generateSessionId();
      }

      // Load CSS if not already loaded
      this.loadCSS();
      
      // Create widget container
      this.createWidget();
      
      // Set up event listeners
      this.setupEventListeners();
    },

    generateSessionId: function() {
      return `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    loadCSS: function() {
      if (document.getElementById('chatwidget-css')) return;
      
      const link = document.createElement('link');
      link.id = 'chatwidget-css';
      link.rel = 'stylesheet';
      link.href = this.config.apiUrl + '/static/chatwidget.css';
      document.head.appendChild(link);
    },

    createWidget: function() {
      // Create iframe container
      const container = document.createElement('div');
      container.id = 'chatwidget-container';
      container.style.cssText = `
        position: fixed;
        ${this.config.position === 'bottom-right' ? 'bottom: 24px; right: 24px;' : 'bottom: 24px; left: 24px;'}
        z-index: ${this.config.zIndex};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      // Create chat bubble
      const bubble = document.createElement('div');
      bubble.id = 'chatwidget-bubble';
      bubble.style.cssText = `
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background-color: ${this.config.primaryColor};
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        animation: pulse 2s infinite;
      `;
      
      bubble.innerHTML = `
        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      `;

      // Create notification badge
      const badge = document.createElement('div');
      badge.id = 'chatwidget-badge';
      badge.style.cssText = `
        position: absolute;
        top: -4px;
        right: -4px;
        width: 24px;
        height: 24px;
        background-color: #ef4444;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: 500;
      `;
      badge.textContent = '1';
      bubble.appendChild(badge);

      // Create iframe for chat interface
      const iframe = document.createElement('iframe');
      iframe.id = 'chatwidget-iframe';
      iframe.src = `${this.config.apiUrl}/widget?sessionId=${this.config.sessionId}&embedded=true`;
      iframe.style.cssText = `
        position: absolute;
        bottom: 0;
        right: 0;
        width: 384px;
        height: 600px;
        border: none;
        border-radius: 12px;
        box-shadow: 0 25px 50px rgba(0,0,0,0.15);
        background: white;
        display: none;
        z-index: 1001;
      `;

      // Mobile overlay for small screens
      const overlay = document.createElement('div');
      overlay.id = 'chatwidget-overlay';
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background-color: rgba(0,0,0,0.5);
        display: none;
        z-index: 999;
      `;

      // Mobile iframe
      const mobileIframe = document.createElement('iframe');
      mobileIframe.id = 'chatwidget-mobile-iframe';
      mobileIframe.src = `${this.config.apiUrl}/widget?sessionId=${this.config.sessionId}&embedded=true&mobile=true`;
      mobileIframe.style.cssText = `
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        border: none;
        background: white;
        display: none;
        z-index: 1001;
      `;

      container.appendChild(bubble);
      container.appendChild(iframe);
      document.body.appendChild(overlay);
      document.body.appendChild(mobileIframe);
      document.body.appendChild(container);

      // Add CSS animations
      this.addAnimations();
    },

    addAnimations: function() {
      if (document.getElementById('chatwidget-animations')) return;
      
      const style = document.createElement('style');
      style.id = 'chatwidget-animations';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        #chatwidget-bubble:hover {
          transform: scale(1.05);
          animation: none;
        }
        
        #chatwidget-iframe.show {
          display: block !important;
          animation: fadeIn 0.3s ease-out;
        }
        
        #chatwidget-mobile-iframe.show {
          display: block !important;
          animation: slideUp 0.3s ease-out;
        }
      `;
      document.head.appendChild(style);
    },

    setupEventListeners: function() {
      const bubble = document.getElementById('chatwidget-bubble');
      const iframe = document.getElementById('chatwidget-iframe');
      const overlay = document.getElementById('chatwidget-overlay');
      const mobileIframe = document.getElementById('chatwidget-mobile-iframe');
      const badge = document.getElementById('chatwidget-badge');

      let isOpen = false;

      const isMobile = () => window.innerWidth < 1024;

      const openChat = () => {
        isOpen = true;
        badge.style.display = 'none';
        
        if (isMobile()) {
          overlay.style.display = 'block';
          mobileIframe.classList.add('show');
        } else {
          bubble.style.display = 'none';
          iframe.classList.add('show');
        }
      };

      const closeChat = () => {
        isOpen = false;
        
        if (isMobile()) {
          overlay.style.display = 'none';
          mobileIframe.classList.remove('show');
        } else {
          bubble.style.display = 'flex';
          iframe.classList.remove('show');
        }
      };

      // Event listeners
      bubble.addEventListener('click', openChat);
      overlay.addEventListener('click', closeChat);

      // Listen for messages from iframe
      window.addEventListener('message', (event) => {
        if (event.data.type === 'CLOSE_CHAT') {
          closeChat();
        } else if (event.data.type === 'NEW_MESSAGE') {
          if (!isOpen) {
            badge.style.display = 'flex';
          }
        }
      });

      // Handle window resize
      window.addEventListener('resize', () => {
        if (!isMobile() && overlay.style.display !== 'none') {
          // Switch from mobile to desktop view
          overlay.style.display = 'none';
          mobileIframe.classList.remove('show');
          bubble.style.display = 'none';
          iframe.classList.add('show');
        }
      });
    },

    // Public API methods
    open: function() {
      document.getElementById('chatwidget-bubble').click();
    },

    close: function() {
      const closeEvent = new Event('click');
      if (window.innerWidth < 1024) {
        document.getElementById('chatwidget-overlay').dispatchEvent(closeEvent);
      } else {
        // Send close message to iframe
        const iframe = document.getElementById('chatwidget-iframe');
        if (iframe) {
          iframe.contentWindow.postMessage({ type: 'CLOSE_CHAT' }, '*');
        }
      }
    },

    setConfig: function(options) {
      this.config = { ...this.config, ...options };
    }
  };

  // Auto-initialize if config is provided
  if (window.ChatWidgetConfig) {
    ChatWidget.init(window.ChatWidgetConfig);
  }

  // Expose global API
  window.ChatWidget = ChatWidget;

})();
