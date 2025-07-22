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
        console.error('ChatWidget: apiUrl is required');
        return;
      }

      // Session ID will be generated server-side if not provided
      // We'll let the server handle generation when the iframe loads

      this._initialized = true;

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.createWidget();
          this.setupEventListeners();
        });
      } else {
        this.createWidget();
        this.setupEventListeners();
      }
    },

    generateSessionId: function() {
      return `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

      // Create initial message bubble
      const messageBubble = document.createElement('div');
      messageBubble.id = 'chatwidget-message-bubble';
      messageBubble.style.cssText = `
        position: absolute;
        bottom: 80px;
        ${this.config.position === 'bottom-right' ? 'right: 0;' : 'left: 0;'}
        max-width: 280px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        padding: 16px;
        transform: translateY(10px) scale(0.95);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        border: 1px solid rgba(0,0,0,0.08);
      `;

      // Message bubble content
      messageBubble.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: ${this.config.primaryColor};
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          ">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <div style="flex: 1;">
            <div style="
              background: #f8f9fa;
              border-radius: 12px;
              padding: 12px;
              margin-bottom: 8px;
              position: relative;
            ">
              <p style="
                margin: 0;
                color: #2d3748;
                font-size: 14px;
                line-height: 1.4;
                font-weight: 500;
              ">Hello there! Need any help?</p>
              <div style="
                position: absolute;
                bottom: -6px;
                left: 12px;
                width: 12px;
                height: 12px;
                background: #f8f9fa;
                transform: rotate(45deg);
              "></div>
            </div>
            <p style="
              margin: 0;
              color: #718096;
              font-size: 12px;
              line-height: 1.3;
            ">Click the chat button to get started!</p>
          </div>
          <button id="chatwidget-message-close" style="
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            color: #a0aec0;
            border-radius: 4px;
            transition: all 0.2s ease;
            flex-shrink: 0;
          " onmouseover="this.style.background='#f7fafc'; this.style.color='#4a5568';" onmouseout="this.style.background='none'; this.style.color='#a0aec0';">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
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

      // Create iframe placeholder for chat interface (lazy load)
      const iframe = document.createElement('iframe');
      iframe.id = 'chatwidget-iframe';
      iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups');
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
        visibility: hidden;
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

      // Mobile iframe placeholder (lazy load)
      const mobileIframe = document.createElement('iframe');
      mobileIframe.id = 'chatwidget-mobile-iframe';
      mobileIframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups');
      mobileIframe.style.cssText = `
        position: fixed;
        inset: 0;
        width: 100%;
        height: 100%;
        border: none;
        background: white;
        display: none;
        visibility: hidden;
        z-index: 1001;
      `;

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
          messageBubble.style.opacity = '0';
          messageBubble.style.visibility = 'hidden';
          messageBubble.style.transform = 'translateY(10px) scale(0.95)';
          messageVisible = false;
        }

        // Note: Configuration now passed via URL parameters to avoid CORS issues

        if (isMobile()) {
                // Lazy load mobile iframe if not already loaded
                if (!mobileIframe.src) {
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

                  mobileIframe.src = widgetUrl;
                  // Note: Removed cross-origin config setting due to protocol differences
                }
                overlay.style.display = 'block';
                mobileIframe.style.visibility = 'visible';
                mobileIframe.classList.add('show');
              } else {
                // Lazy load desktop iframe if not already loaded
                if (!iframe.src) {
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

                  iframe.src = widgetUrl;
                  // Note: Removed cross-origin config setting due to protocol differences
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
          messageBubble.style.opacity = '0';
          messageBubble.style.visibility = 'hidden';
          messageBubble.style.transform = 'translateY(10px) scale(0.95)';
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

    loadInitialMessages: function(messageBubble) {
      // Extract userId and chatbotGuid from apiUrl if available
      const urlMatch = this.config.apiUrl.match(/\/widget\/([^\/]+)\/([^\/\?]+)/);

      if (urlMatch && urlMatch[1] && urlMatch[2]) {
        const userId = urlMatch[1];
        const chatbotGuid = urlMatch[2];

        // Fetch chatbot configuration to get initial messages
        fetch(`${this.config.apiUrl.split('/widget/')[0]}/api/public/chatbot/${userId}/${chatbotGuid}`)
          .then(response => response.json())
          .then(data => {
            if (data.initialMessages && data.initialMessages.length > 0) {
              this.displayInitialMessages(messageBubble, data.initialMessages);
            } else {
              this.showDefaultMessage(messageBubble);
            }
          })
          .catch(error => {
            console.log('Could not load initial messages, showing default');
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
            if (messageBubble.style.visibility === 'visible') {
              messageBubble.style.opacity = '0';
              messageBubble.style.visibility = 'hidden';
              messageBubble.style.transform = 'translateY(10px) scale(0.95)';
            }
          }, 8000);
          return;
        }

        const message = messages[currentMessageIndex];
        messageBubble.innerHTML = `
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <img src="${this.config.avatarUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=32&h=32'}" 
                 style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;" alt="Bot">
            <span style="font-weight: 600; font-size: 14px; color: #1f2937;">${this.config.botName || 'Assistant'}</span>
            <button onclick="ChatWidget.hideInitialMessage()" style="margin-left: auto; background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 18px; line-height: 1; padding: 0;">&times;</button>
          </div>
          <div style="color: #4b5563; font-size: 14px; line-height: 1.4;">${message.content || message}</div>
        `;

        messageBubble.style.opacity = '1';
        messageBubble.style.visibility = 'visible';
        messageBubble.style.transform = 'translateY(0) scale(1)';

        currentMessageIndex++;

        // Show next message after delay if there are more
        if (currentMessageIndex < messages.length) {
          setTimeout(showNextMessage, 4000);
        } else {
          // Auto-hide after last message
          setTimeout(() => {
            if (messageBubble.style.visibility === 'visible') {
              messageBubble.style.opacity = '0';
              messageBubble.style.visibility = 'hidden';
              messageBubble.style.transform = 'translateY(10px) scale(0.95)';
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
        messageBubble.style.opacity = '1';
        messageBubble.style.visibility = 'visible';
        messageBubble.style.transform = 'translateY(0) scale(1)';

        // Auto-hide after 10 seconds unless user interacts
        setTimeout(() => {
          if (messageBubble.style.visibility === 'visible') {
            messageBubble.style.opacity = '0';
            messageBubble.style.visibility = 'hidden';
            messageBubble.style.transform = 'translateY(10px) scale(0.95)';
          }
        }, 10000);
      }, 3000);
    },

    // Global method to hide initial message (called from inline onclick)
    hideInitialMessage: function() {
      const messageBubble = document.getElementById('chatwidget-message-bubble');
      if (messageBubble) {
        messageBubble.style.opacity = '0';
        messageBubble.style.visibility = 'hidden';
        messageBubble.style.transform = 'translateY(10px) scale(0.95)';
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