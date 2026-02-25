/**
 * EmbedChat Widget Script
 * 
 * This script is intended to be embedded on customer websites.
 * It injects an iframe containing the chatbot UI seamlessly into the bottom right corner of the page.
 */

(function () {
  // Prevent multiple initializations
  if (window.EmbedChatWidgetInitialized) {
    return;
  }
  window.EmbedChatWidgetInitialized = true;

  // Default configuration
  const config = {
    projectId: null,
    domain: 'http://localhost:3000', // Default to localhost for development
    position: 'bottom-right',
    primaryColor: '#000000',
    zIndex: 999999,
    // Allow overriding config via global `window.EmbedChatConfig`
    ...window.EmbedChatConfig
  };

  // Require projectId
  if (!config.projectId) {
    console.error('EmbedChat: Missing required parameter "projectId". Please set window.EmbedChatConfig.projectId.');
    return;
  }

  // Determine position styles
  const positionStyles = {
    'bottom-right': 'bottom: 20px; right: 20px;',
    'bottom-left': 'bottom: 20px; left: 20px;',
  }[config.position] || 'bottom: 20px; right: 20px;';

  // Build the iframe URL
  const embedUrl = `${config.domain}/embed/${config.projectId}`;

  // Create the container element (acts as a wrapper for toggle logic later if needed)
  const container = document.createElement('div');
  container.id = 'embedchat-widget-container';
  container.style.cssText = `
        position: fixed;
        ${positionStyles}
        width: 400px;
        height: 600px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 40px);
        z-index: ${config.zIndex};
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 10px 40px -10px rgba(0,0,0,0.2);
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        pointer-events: auto; /* Let clicks pass through if collapsed */
        display: none; /* Initially hidden until loaded */
    `;

  // Create the iframe
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl;
  iframe.title = 'AI Chatbot';
  iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        background: transparent;
        display: block; // Removes descender whitespace
    `;

  // Create a toggle button (launcher) - Minimal bubble
  const launcher = document.createElement('button');
  launcher.id = 'embedchat-widget-launcher';
  launcher.style.cssText = `
        position: fixed;
        ${positionStyles}
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${config.primaryColor};
        color: white;
        border: none;
        cursor: pointer;
        z-index: ${config.zIndex + 1};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
    `;

  // SVG Icons
  const chatIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  const closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  launcher.innerHTML = chatIcon;

  // Hover effects
  launcher.onmouseover = () => { launcher.style.transform = 'scale(1.05)'; };
  launcher.onmouseout = () => { launcher.style.transform = 'scale(1)'; };

  let isOpen = false;

  launcher.onclick = () => {
    isOpen = !isOpen;
    if (isOpen) {
      container.style.display = 'block';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
      launcher.innerHTML = closeIcon;

      // Post message to iframe that it opened (optional focus management)
      iframe.contentWindow?.postMessage({ type: 'WIDGET_OPENED' }, '*');
    } else {
      container.style.opacity = '0';
      container.style.transform = 'translateY(20px)';
      setTimeout(() => {
        if (!isOpen) container.style.display = 'none';
      }, 300);
      launcher.innerHTML = chatIcon;
    }
  };

  // Listen for messages from the iframe (e.g. to close the widget internally)
  window.addEventListener('message', (event) => {
    if (event.origin !== config.domain) return;

    if (event.data?.type === 'CLOSE_WIDGET') {
      if (isOpen) launcher.click();
    }
  });

  // Mount elements
  container.appendChild(iframe);
  document.body.appendChild(container);
  document.body.appendChild(launcher);

  // Initial setup - hide container slightly lower for animation 
  container.style.opacity = '0';
  container.style.transform = 'translateY(20px)';
})();
