(function() {
  'use strict';

  // Chatbot Widget Embedder
  const ChatWidget = {
    config: {
      apiUrl: null, // Must be provided
      sessionId: null,
      position: 'bottom-right',
      primaryColor: '#2563eb',
      zIndex: 1000,
    },
    _initialized: false,

    init: function(options = {}) {
      // Prevent multiple initializations
      if (this._initialized) {
        return;
      }

      // Merge options with default config
      this.config = { ...this.config, ...options };

      // Validate required config
      if (!this.config.apiUrl) {
        // Silent fail in production - widget won't initialize
        return;
      }

      // Session ID will be generated server-side if not provided
      // We'll let the server handle generation when the iframe loads

      this._initialized = true;

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.loadStyles();
          this.createWidget();
          this.setupEventListeners();
        });
      } else {
        this.loadStyles();
        this.createWidget();
        this.setupEventListeners();
      }
    },

    loadStyles: function() {
      // Check if styles are already loaded
      if (document.getElementById('chatwidget-styles')) {
        return;
      }

      // Load CSS file
      const link = document.createElement('link');
      link.id = 'chatwidget-styles';
      link.rel = 'stylesheet';
      link.type = 'text/css';

      // Determine the CSS URL based on the API URL
      let baseUrl;
      try {
        if (this.config.apiUrl.includes('/widget/')) {
          baseUrl = this.config.apiUrl.split('/widget/')[0];
        } else {
          // Extract base URL from full API URL
          const url = new URL(this.config.apiUrl);
          baseUrl = `${url.protocol}//${url.host}`;
        }
      } catch (error) {
        // Fallback to current origin if URL parsing fails
        baseUrl = window.location.origin;
      }
      
      // Force HTTPS for CSS loading
      baseUrl = this.forceHttps(baseUrl);
      link.href = `${baseUrl}/embed.css`;

      document.head.appendChild(link);
    },

    generateSessionId: function() {
      return `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    createWidget: function() {
      // Create iframe container
      const container = document.createElement('div');
      container.id = 'chatwidget-container';
      container.className = `chatwidget-container ${this.config.position}`;
      container.style.zIndex = this.config.zIndex;

      // Create initial message bubble
      const messageBubble = document.createElement('div');
      messageBubble.id = 'chatwidget-message-bubble';
      messageBubble.className = `chatwidget-message-bubble ${this.config.position}`;

      // Message bubble content
      messageBubble.innerHTML = `
        <div class="chatwidget-message-content">
          <div class="chatwidget-avatar" style="background-color: ${this.config.primaryColor};">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <div class="chatwidget-message-text">
            <div class="chatwidget-speech-bubble">
              <p class="chatwidget-message-main">Hello there! Need any help?</p>
            </div>
            <p class="chatwidget-message-sub">Click the chat button to get started!</p>
          </div>
          <button id="chatwidget-message-close" class="chatwidget-close-btn">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      `;

      // Create chat bubble
      const bubble = document.createElement('div');
      bubble.id = 'chatwidget-bubble';
      bubble.className = 'chatwidget-bubble';
      bubble.style.backgroundColor = this.config.primaryColor;

      bubble.innerHTML = `
        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      `;

      // Create notification badge
      const badge = document.createElement('div');
      badge.id = 'chatwidget-badge';
      badge.className = 'chatwidget-badge';
      badge.textContent = '1';
      bubble.appendChild(badge);

      // Create iframe placeholder for chat interface (lazy load)
      const iframe = document.createElement('iframe');
      iframe.id = 'chatwidget-iframe';
      iframe.className = 'chatwidget-iframe';
      iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-same-origin');

      // Mobile overlay for small screens
      const overlay = document.createElement('div');
      overlay.id = 'chatwidget-overlay';
      overlay.className = 'chatwidget-overlay';

      // Mobile iframe placeholder (lazy load)
      const mobileIframe = document.createElement('iframe');
      mobileIframe.id = 'chatwidget-mobile-iframe';
      mobileIframe.className = 'chatwidget-mobile-iframe';
      mobileIframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-same-origin');

      container.appendChild(messageBubble);
      container.appendChild(bubble);
      container.appendChild(iframe);
      document.body.appendChild(overlay);
      document.body.appendChild(mobileIframe);
      document.body.appendChild(container);

      // Fetch and display initial messages or show default
      this.loadInitialMessages(messageBubble);

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

        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(10px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }

        .chatwidget-bubble:hover {
          transform: scale(1.05);
          animation: none;
        }

        .chatwidget-iframe.show {
          display: block !important;
          animation: fadeIn 0.3s ease-out;
        }

        .chatwidget-mobile-iframe.show {
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
      const messageBubble = document.getElementById('chatwidget-message-bubble');
      const messageClose = document.getElementById('chatwidget-message-close');

      let isOpen = false;
      let messageVisible = true;

      const isMobile = () => window.innerWidth < 1024;

      const openChat = () => {
        isOpen = true;
        badge.style.display = 'none';

        // Hide message bubble when chat opens
        if (messageVisible && messageBubble) {
          messageBubble.classList.remove('visible');
          messageVisible = false;
        }

        if (isMobile()) {
          // Lazy load mobile iframe if not already loaded
          if (!mobileIframe.src) {
            try {
              // Build URL with sessionId if provided, otherwise let server generate it
              const sessionParam = this.config.sessionId ? `sessionId=${this.config.sessionId}&` : '';

              // Check if apiUrl already contains a specific widget path
              let widgetUrl;
              if (this.config.apiUrl.includes('/widget/')) {
                // Specific widget URL - use as-is with query parameters
                const separator = this.config.apiUrl.includes('?') ? '&' : '?';
                widgetUrl = `${this.config.apiUrl}${separator}${sessionParam}mobile=true&embedded=true`;
              } else {
                // Base URL - append /chat-widget path
                widgetUrl = `${this.config.apiUrl}/chat-widget?${sessionParam}mobile=true&embedded=true`;
              }

              // Force HTTPS for iframe URL
              mobileIframe.src = this.forceHttps(widgetUrl);
            } catch (error) {
              // Fallback URL construction
              mobileIframe.src = this.forceHttps(`${this.config.apiUrl}?mobile=true&embedded=true`);
            }
          }
          overlay.style.display = 'block';
          mobileIframe.style.visibility = 'visible';
          mobileIframe.classList.add('show');
        } else {
          // Lazy load desktop iframe if not already loaded
          if (!iframe.src) {
            try {
              // Build URL with sessionId if provided, otherwise let server generate it
              const sessionParam = this.config.sessionId ? `sessionId=${this.config.sessionId}&` : '';

              // Check if apiUrl already contains a specific widget path
              let widgetUrl;
              if (this.config.apiUrl.includes('/widget/')) {
                // Specific widget URL - use as-is with query parameters
                const separator = this.config.apiUrl.includes('?') ? '&' : '?';
                widgetUrl = `${this.config.apiUrl}${separator}${sessionParam}mobile=false&embedded=true`;
              } else {
                // Base URL - append /chat-widget path
                widgetUrl = `${this.config.apiUrl}/chat-widget?${sessionParam}mobile=false&embedded=true`;
              }

              // Force HTTPS for iframe URL
              iframe.src = this.forceHttps(widgetUrl);
            } catch (error) {
              // Fallback URL construction
              iframe.src = this.forceHttps(`${this.config.apiUrl}?mobile=false&embedded=true`);
            }
          }
          bubble.style.display = 'none';
          iframe.style.visibility = 'visible';
          iframe.classList.add('show');
        }
      };

      const closeChat = () => {
        isOpen = false;

        if (isMobile()) {
          overlay.style.display = 'none';
          mobileIframe.classList.remove('show');
          mobileIframe.style.visibility = 'hidden';
        } else {
          bubble.style.display = 'flex';
          iframe.classList.remove('show');
          iframe.style.visibility = 'hidden';
        }
      };

      // Close message bubble function
      const closeMessageBubble = () => {
        if (messageBubble && messageVisible) {
          messageBubble.classList.remove('visible');
          messageVisible = false;
        }
      };

      // Event listeners
      bubble.addEventListener('click', openChat);
      overlay.addEventListener('click', closeChat);
      if (messageClose) {
        messageClose.addEventListener('click', closeMessageBubble);
      }
      if (messageBubble) {
        // Also allow clicking the message bubble itself to open chat
        messageBubble.addEventListener('click', (e) => {
          // Don't trigger if clicking the close button
          if (e.target !== messageClose && !messageClose.contains(e.target)) {
            openChat();
          }
        });
      }

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
          mobileIframe.style.visibility = 'hidden';
          bubble.style.display = 'none';
          iframe.style.visibility = 'visible';
          iframe.classList.add('show');
        }
      });
    },

    forceHttps: function(url) {
      // Force HTTPS for all API requests
      if (url.startsWith('http://')) {
        return url.replace('http://', 'https://');
      }
      return url;
    },

    loadInitialMessages: function(messageBubble) {
      // Extract userId and chatbotGuid from apiUrl if available
      const urlMatch = this.config.apiUrl.match(/\/widget\/([^\/]+)\/([^\/\?]+)/);

      if (urlMatch && urlMatch[1] && urlMatch[2]) {
        const userId = urlMatch[1];
        const chatbotGuid = urlMatch[2];

        // Fetch chatbot configuration to get initial messages
        let baseUrl;
        try {
          baseUrl = this.config.apiUrl.split('/widget/')[0];
        } catch (error) {
          baseUrl = window.location.origin;
        }
        
        // Force HTTPS for API requests
        baseUrl = this.forceHttps(baseUrl);
        
        fetch(`${baseUrl}/api/public/chatbot/${userId}/${chatbotGuid}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            if (data.initialMessages && data.initialMessages.length > 0) {
              this.displayInitialMessages(messageBubble, data.initialMessages);
            } else {
              this.showDefaultMessage(messageBubble);
            }
          })
          .catch(error => {
            // Silent fallback in production
            this.showDefaultMessage(messageBubble);
          });
      } else {
        this.showDefaultMessage(messageBubble);
      }
    },

    displayInitialMessages: function(messageBubble, messages) {
      if (messages.length === 0) {
        this.showDefaultMessage(messageBubble);
        return;
      }

      let currentMessageIndex = 0;
      const showNextMessage = () => {
        if (currentMessageIndex >= messages.length) {
          // Auto-hide after showing all messages
          setTimeout(() => {
            if (messageBubble.classList.contains('visible')) {
              messageBubble.classList.remove('visible');
            }
          }, 8000);
          return;
        }

        const message = messages[currentMessageIndex];
        messageBubble.innerHTML = `
          <div class="chatwidget-message-content">
            <img src="${this.config.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32'}" 
                 style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;" alt="Bot">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 600; font-size: 14px; color: #1f2937;">${this.config.botName || 'Assistant'}</span>
                <button onclick="ChatWidget.hideInitialMessage()" style="margin-left: auto; background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 18px; line-height: 1; padding: 0;">&times;</button>
              </div>
              <div style="color: #4b5563; font-size: 14px; line-height: 1.4;">${message.content || message}</div>
            </div>
          </div>
        `;

        messageBubble.classList.add('visible');

        currentMessageIndex++;

        // Show next message after delay if there are more
        if (currentMessageIndex < messages.length) {
          setTimeout(showNextMessage, 4000);
        } else {
          // Auto-hide after last message
          setTimeout(() => {
            if (messageBubble.classList.contains('visible')) {
              messageBubble.classList.remove('visible');
            }
          }, 8000);
        }
      };

      // Start showing messages after a delay
      setTimeout(showNextMessage, 3000);
    },

    showDefaultMessage: function(messageBubble) {
      // Show default message bubble after a short delay
      setTimeout(() => {
        messageBubble.classList.add('visible');

        // Auto-hide after 10 seconds unless user interacts
        setTimeout(() => {
          if (messageBubble.classList.contains('visible')) {
            messageBubble.classList.remove('visible');
          }
        }, 10000);
      }, 3000);
    },

    // Global method to hide initial message (called from inline onclick)
    hideInitialMessage: function() {
      const messageBubble = document.getElementById('chatwidget-message-bubble');
      if (messageBubble) {
        messageBubble.classList.remove('visible');
      }
    },

    // Public API methods
    open: function() {
      if (this._initialized) {
        document.getElementById('chatwidget-bubble').click();
      }
    },

    close: function() {
      if (!this._initialized) return;

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

  // Expose global API immediately
  window.ChatWidget = ChatWidget;

  // Auto-initialize function
  function autoInitialize() {
    if (window.ChatWidgetConfig && !ChatWidget._initialized) {
      ChatWidget.init(window.ChatWidgetConfig);
    }
  }

  // Try to initialize immediately
  autoInitialize();

  // Try again when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInitialize);
  } else {
    // DOM is already ready, try in next tick
    setTimeout(autoInitialize, 0);
  }

  // Final fallback after a short delay
  setTimeout(autoInitialize, 100);

})();