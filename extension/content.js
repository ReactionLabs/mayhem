// Mayhem Chrome Extension - Content Script
// Injects into trading platforms to detect tokens and analyze charts

// Load automation engine
(function() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('automation.js');
  script.onload = function() { this.remove(); };
  (document.head || document.documentElement).appendChild(script);
})();

(function() {
  'use strict';

  let detectedToken = null;
  let chartAnalysis = null;

  // Detect token from page
  function detectToken() {
    const url = window.location.href;
    
    // URL patterns
    const patterns = [
      { pattern: /pump\.fun\/([A-Za-z0-9]{32,44})/, name: 'Pump.fun' },
      { pattern: /dexscreener\.com\/solana\/([A-Za-z0-9]{32,44})/, name: 'DexScreener' },
      { pattern: /birdeye\.so\/token\/([A-Za-z0-9]{32,44})/, name: 'Birdeye' },
      { pattern: /solscan\.io\/token\/([A-Za-z0-9]{32,44})/, name: 'Solscan' },
      { pattern: /[?&]mint=([A-Za-z0-9]{32,44})/, name: 'Generic' },
    ];

    for (const { pattern, name } of patterns) {
      const match = url.match(pattern);
      if (match) {
        const ca = match[1];
        const tokenInfo = extractTokenInfoFromPage(ca);
        return {
          ca,
          name: tokenInfo.name || 'Unknown Token',
          symbol: tokenInfo.symbol || 'UNKNOWN',
          icon: tokenInfo.icon || null,
          source: name,
        };
      }
    }

    // Try to extract from page content
    return extractTokenFromDOM();
  }

  // Extract token info from page DOM
  function extractTokenFromDOM() {
    // Common selectors for token info
    const selectors = {
      name: ['h1', '[data-token-name]', '.token-name', '.symbol'],
      symbol: ['[data-token-symbol]', '.token-symbol', '.ticker'],
      ca: ['[data-token-address]', '.token-address', 'code'],
    };

    let name = null;
    let symbol = null;
    let ca = null;

    // Try to find CA in page
    const text = document.body.innerText;
    const caMatch = text.match(/([A-Za-z0-9]{32,44})/);
    if (caMatch && isValidSolanaAddress(caMatch[1])) {
      ca = caMatch[1];
    }

    // Try selectors
    for (const selector of selectors.name) {
      const el = document.querySelector(selector);
      if (el) {
        name = el.textContent.trim();
        break;
      }
    }

    for (const selector of selectors.symbol) {
      const el = document.querySelector(selector);
      if (el) {
        symbol = el.textContent.trim();
        break;
      }
    }

    if (ca) {
      return { ca, name: name || 'Unknown Token', symbol: symbol || 'UNKNOWN', icon: null };
    }

    return null;
  }

  function extractTokenInfoFromPage(ca) {
    // Try to extract name and symbol from page
    const nameEl = document.querySelector('h1, [data-token-name], .token-name');
    const symbolEl = document.querySelector('[data-token-symbol], .token-symbol, .ticker');
    const iconEl = document.querySelector('img[alt*="token"], .token-icon img, [data-token-icon] img');

    return {
      name: nameEl?.textContent?.trim() || null,
      symbol: symbolEl?.textContent?.trim() || null,
      icon: iconEl?.src || null,
    };
  }

  function isValidSolanaAddress(address) {
    // Basic Solana address validation (base58, 32-44 chars)
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }

  // Analyze chart on page
  function analyzeChart() {
    // This would analyze the chart if available
    // For now, return placeholder data
    
    // Try to find chart elements
    const chartElements = document.querySelectorAll('canvas, svg, [data-chart]');
    
    if (chartElements.length > 0) {
      // Basic analysis - in production, this would use chart data
      return {
        trend: '📈 Bullish',
        trendColor: '#10b981',
        volume: 'High',
        support: '--',
        resistance: '--',
      };
    }

    return null;
  }

  // Inject Mayhem badge/overlay
  function injectMayhemBadge() {
    if (document.getElementById('mayhem-extension-badge')) {
      return; // Already injected
    }

    const badge = document.createElement('div');
    badge.id = 'mayhem-extension-badge';
    badge.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        background: #111111;
        border: 1px solid #6366f1;
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        color: #e5e5e5;
        max-width: 200px;
      ">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="color: #6366f1; font-weight: 600;">⚡ Mayhem</span>
        </div>
        <div style="font-size: 11px; color: #9ca3af;">
          Token detected! Click extension icon for analysis.
        </div>
      </div>
    `;

    document.body.appendChild(badge);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      badge.style.opacity = '0';
      badge.style.transition = 'opacity 0.3s';
      setTimeout(() => badge.remove(), 300);
    }, 5000);
  }

  // Listen for messages from popup and background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getToken') {
      if (!detectedToken) {
        detectedToken = detectToken();
        if (detectedToken) {
          injectMayhemBadge();
        }
      }
      sendResponse({ token: detectedToken });
    } else if (request.action === 'analyzeChart') {
      chartAnalysis = analyzeChart();
      sendResponse({ analysis: chartAnalysis });
    } else if (request.type === 'automation-command') {
      // Handle automation commands - execute directly
      executeAutomationCommand(request.command)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ error: error.message }));
      return true;
    } else if (request.type === 'automation-start') {
      sendResponse({ success: true, message: 'Automation ready' });
    } else if (request.type === 'automation-stop') {
      sendResponse({ success: true, message: 'Automation stopped' });
    }
    return true;
  });

  // Initial detection
  detectedToken = detectToken();
  if (detectedToken) {
    injectMayhemBadge();
  }

  // Automation command executor - allows browser control from chat/commands
  async function executeAutomationCommand(command) {
    try {
      switch (command.type) {
        case 'click':
          const clickEl = document.querySelector(command.selector);
          if (!clickEl) throw new Error(`Element not found: ${command.selector}`);
          clickEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await new Promise(r => setTimeout(r, 300));
          clickEl.click();
          return { success: true, selector: command.selector };
        
        case 'type':
          const typeEl = document.querySelector(command.selector);
          if (!typeEl) throw new Error(`Element not found: ${command.selector}`);
          typeEl.focus();
          typeEl.value = '';
          for (const char of command.text) {
            typeEl.value += char;
            typeEl.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 50));
          }
          typeEl.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, selector: command.selector, text: command.text };
        
        case 'navigate':
          window.location.href = command.url;
          return { success: true, url: command.url };
        
        case 'wait':
          await new Promise(r => setTimeout(r, command.duration || 1000));
          return { success: true, duration: command.duration };
        
        case 'scroll':
          const amount = command.direction === 'down' ? (command.amount || 500) : -(command.amount || 500);
          window.scrollBy({ top: amount, behavior: 'smooth' });
          await new Promise(r => setTimeout(r, 500));
          return { success: true, direction: command.direction, amount };
        
        case 'extract':
          const extractEl = document.querySelector(command.selector);
          if (!extractEl) throw new Error(`Element not found: ${command.selector}`);
          const value = command.attribute === 'textContent' 
            ? extractEl.textContent.trim()
            : extractEl.getAttribute(command.attribute) || extractEl[command.attribute];
          return { success: true, selector: command.selector, value };
        
        case 'execute':
          const result = eval(command.script);
          return { success: true, result };
        
        default:
          throw new Error(`Unknown command type: ${command.type}`);
      }
    } catch (error) {
      throw new Error(`Command execution failed: ${error.message}`);
    }
  }

  // Expose automation to window for external access and self-building
  window.MayhemAutomation = {
    execute: executeAutomationCommand,
    click: (selector) => executeAutomationCommand({ type: 'click', selector }),
    type: (selector, text) => executeAutomationCommand({ type: 'type', selector, text }),
    navigate: (url) => executeAutomationCommand({ type: 'navigate', url }),
    extract: (selector, attr = 'textContent') => executeAutomationCommand({ type: 'extract', selector, attribute: attr }),
    wait: (ms) => executeAutomationCommand({ type: 'wait', duration: ms }),
    scroll: (dir, amt) => executeAutomationCommand({ type: 'scroll', direction: dir, amount: amt }),
    executeScript: (script) => executeAutomationCommand({ type: 'execute', script }),
  };

  // Listen for messages from Mayhem web app (postMessage)
  window.addEventListener('message', (event) => {
    // Only accept messages from Mayhem app
    if (event.origin.includes('localhost:3000') || event.origin.includes('mayhem') || event.origin === window.location.origin) {
      if (event.data?.type === 'mayhem-command') {
        // Execute command from web app
        executeAutomationCommand(event.data.command)
          .then(result => {
            // Send response back
            window.postMessage({
              type: 'mayhem-command-response',
              command: event.data.command,
              result,
              timestamp: Date.now(),
            }, '*');
          })
          .catch(error => {
            window.postMessage({
              type: 'mayhem-command-response',
              command: event.data.command,
              error: error.message,
              timestamp: Date.now(),
            }, '*');
          });
      } else if (event.data?.type === 'mayhem-get-token') {
        // Send detected token back to web app
        window.postMessage({
          type: 'mayhem-token-response',
          token: detectedToken,
          timestamp: Date.now(),
        }, '*');
      }
    }
  });

  // Watch for URL changes (SPA navigation)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      detectedToken = detectToken();
      if (detectedToken) {
        injectMayhemBadge();
      }
    }
  }).observe(document, { subtree: true, childList: true });

})();

