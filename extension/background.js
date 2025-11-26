// Mayhem Chrome Extension - Background Service Worker

// Listen for extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveBacklink') {
    // Save backlink to storage
    saveBacklink(request.tokenCA, request.url, request.title);
    sendResponse({ success: true });
  } else if (request.type === 'automation-command') {
    // Forward automation commands to active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'automation-command',
          command: request.command,
        }, sendResponse);
      } else {
        sendResponse({ error: 'No active tab' });
      }
    });
    return true;
  } else if (request.type === 'automation-start') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'automation-start' }, sendResponse);
      }
    });
    return true;
  } else if (request.type === 'automation-stop') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'automation-stop' }, sendResponse);
      }
    });
    return true;
  }
  return true;
});

// Save backlink
async function saveBacklink(tokenCA, url, title) {
  const key = `backlinks_${tokenCA}`;
  const result = await chrome.storage.local.get(key);
  const backlinks = result[key] || [];
  
  // Check if already exists
  if (!backlinks.find(b => b.url === url)) {
    backlinks.push({
      url,
      title: title || new URL(url).hostname,
      domain: new URL(url).hostname,
      timestamp: Date.now(),
    });
    
    await chrome.storage.local.set({ [key]: backlinks });
  }
}

// Track when user visits token pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if it's a token page
    const tokenMatch = tab.url.match(/([A-Za-z0-9]{32,44})/);
    if (tokenMatch && isValidSolanaAddress(tokenMatch[1])) {
      const tokenCA = tokenMatch[1];
      // Save as backlink
      saveBacklink(tokenCA, tab.url, tab.title);
    }
  }
});

function isValidSolanaAddress(address) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

