(function () {
    const scriptTag = document.currentScript;
    const agentId = scriptTag.getAttribute('data-agent-id');
    const baseUrl = new URL(scriptTag.src).origin;

    if (!agentId) {
        console.error('Antigravity Chatbot: Missing data-agent-id');
        return;
    }

    // Create Float Button
    const button = document.createElement('div');
    button.id = 'ag-chat-button';
    button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #3b82f6;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999999;
    transition: transform 0.3s ease;
  `;
    button.innerHTML = `
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;

    // Create Chat Container (Iframe)
    const container = document.createElement('div');
    container.id = 'ag-chat-container';
    container.style.cssText = `
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 400px;
    height: 600px;
    max-height: calc(100vh - 120px);
    max-width: calc(100vw - 40px);
    background: white;
    box-shadow: 0 12px 24px rgba(0,0,0,0.15);
    border-radius: 16px;
    overflow: hidden;
    z-index: 999999;
    display: none;
    transform: translateY(20px);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;

    const iframe = document.createElement('iframe');
    iframe.src = `${baseUrl}/embed/${agentId}`;
    iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    container.appendChild(iframe);

    document.body.appendChild(button);
    document.body.appendChild(container);

    let isOpen = false;

    button.onclick = () => {
        isOpen = !isOpen;
        if (isOpen) {
            container.style.display = 'block';
            setTimeout(() => {
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }, 10);
            button.style.transform = 'rotate(90deg)';
            button.innerHTML = `
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
        } else {
            container.style.opacity = '0';
            container.style.transform = 'translateY(20px)';
            setTimeout(() => container.style.display = 'none', 300);
            button.style.transform = 'rotate(0deg)';
            button.innerHTML = `
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
        }
    };
})();
