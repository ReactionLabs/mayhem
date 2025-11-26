// Mayhem Chrome Extension - Popup Script

// Get Mayhem app URL from storage or auto-detect
let MAYHEM_APP_URL = 'http://localhost:3000';

// Load from storage or use default
chrome.storage.local.get(['mayhemAppUrl'], (result) => {
  if (result.mayhemAppUrl) {
    MAYHEM_APP_URL = result.mayhemAppUrl;
  }
});

// DOM Elements
const tokenSection = document.getElementById('tokenSection');
const emptySection = document.getElementById('emptySection');
const tokenName = document.getElementById('tokenName');
const tokenSymbol = document.getElementById('tokenSymbol');
const tokenCA = document.getElementById('tokenCA');
const tokenIcon = document.getElementById('tokenIcon');
const openMayhemBtn = document.getElementById('openMayhem');
const copyCABtn = document.getElementById('copyCA');
const openMayhemAppBtn = document.getElementById('openMayhemApp');
const settingsBtn = document.getElementById('settingsBtn');

// Analysis elements
const trendValue = document.getElementById('trendValue');
const volumeValue = document.getElementById('volumeValue');
const supportValue = document.getElementById('supportValue');
const resistanceValue = document.getElementById('resistanceValue');

// Link elements
const linkPump = document.getElementById('linkPump');
const linkDexScreener = document.getElementById('linkDexScreener');
const linkBirdeye = document.getElementById('linkBirdeye');
const linkSolscan = document.getElementById('linkSolscan');
const backlinksList = document.getElementById('backlinksList');

let currentToken = null;

// Initialize popup
async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (tab.url) {
    const token = await detectTokenFromPage(tab.url, tab.id);
    if (token) {
      currentToken = token;
      displayToken(token);
      await loadAnalysis(token);
      await loadBacklinks(token);
    } else {
      showEmptyState();
    }
  } else {
    showEmptyState();
  }

  setupEventListeners();
}

// Detect token from page URL or content
async function detectTokenFromPage(url, tabId) {
  // Try to extract from URL patterns
  const urlPatterns = [
    /pump\.fun\/([A-Za-z0-9]{32,44})/,
    /dexscreener\.com\/solana\/([A-Za-z0-9]{32,44})/,
    /birdeye\.so\/token\/([A-Za-z0-9]{32,44})/,
    /solscan\.io\/token\/([A-Za-z0-9]{32,44})/,
    /[?&]mint=([A-Za-z0-9]{32,44})/,
  ];

  for (const pattern of urlPatterns) {
    const match = url.match(pattern);
    if (match) {
      const ca = match[1];
      // Try to get token info from storage or API
      const tokenInfo = await getTokenInfo(ca);
      return {
        ca,
        name: tokenInfo?.name || 'Unknown Token',
        symbol: tokenInfo?.symbol || 'UNKNOWN',
        icon: tokenInfo?.icon || null,
      };
    }
  }

  // Try to get from content script
  try {
    const results = await chrome.tabs.sendMessage(tabId, { action: 'getToken' });
    if (results?.token) {
      return results.token;
    }
  } catch (e) {
    // Content script not ready or no token found
  }

  return null;
}

// Get token info from Mayhem API or cache
async function getTokenInfo(ca) {
  // Check cache first
  const cacheKey = `token_${ca}`;
  const cached = await chrome.storage.local.get(cacheKey);
  if (cached[cacheKey]) {
    return cached[cacheKey];
  }

  // Fetch from Mayhem API
  try {
    const response = await fetch(`${MAYHEM_APP_URL}/api/search-token?q=${ca}`);
    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        const tokenInfo = {
          name: data.token.baseAsset?.name || 'Unknown',
          symbol: data.token.baseAsset?.symbol || 'UNKNOWN',
          icon: data.token.baseAsset?.icon || null,
        };
        // Cache it
        await chrome.storage.local.set({ [cacheKey]: tokenInfo });
        return tokenInfo;
      }
    }
  } catch (e) {
    console.error('Failed to fetch token info:', e);
  }

  return null;
}

// Display token info
function displayToken(token) {
  tokenSection.style.display = 'flex';
  emptySection.style.display = 'none';

  tokenName.textContent = token.name;
  tokenSymbol.textContent = token.symbol;
  tokenCA.textContent = token.ca;

  if (token.icon) {
    tokenIcon.innerHTML = `<img src="${token.icon}" alt="${token.name}" />`;
  } else {
    tokenIcon.innerHTML = '<div style="width: 100%; height: 100%; background: #6366f1; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">?</div>';
  }

  // Update links
  linkPump.href = `https://pump.fun/${token.ca}`;
  linkDexScreener.href = `https://dexscreener.com/solana/${token.ca}`;
  linkBirdeye.href = `https://birdeye.so/token/${token.ca}`;
  linkSolscan.href = `https://solscan.io/token/${token.ca}`;
}

// Load chart analysis
async function loadAnalysis(token) {
  // Placeholder analysis - in production, this would call Mayhem API
  // or analyze chart data from the current page
  
  // Simulate analysis
  trendValue.textContent = '📈 Bullish';
  trendValue.style.color = '#10b981';
  
  volumeValue.textContent = 'High';
  volumeValue.style.color = '#6366f1';
  
  supportValue.textContent = '--';
  resistanceValue.textContent = '--';

  // Try to get real analysis from content script
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.tabs.sendMessage(tab.id, { 
      action: 'analyzeChart',
      token: token.ca 
    });
    
    if (results?.analysis) {
      updateAnalysis(results.analysis);
    }
  } catch (e) {
    // Content script not available
  }
}

function updateAnalysis(analysis) {
  if (analysis.trend) {
    trendValue.textContent = analysis.trend;
    trendValue.style.color = analysis.trendColor || '#10b981';
  }
  if (analysis.volume) volumeValue.textContent = analysis.volume;
  if (analysis.support) supportValue.textContent = analysis.support;
  if (analysis.resistance) resistanceValue.textContent = analysis.resistance;
}

// Load backlinks
async function loadBacklinks(token) {
  try {
    // Fetch backlinks from Mayhem API
    const response = await fetch(`${MAYHEM_APP_URL}/api/token-backlinks?ca=${token.ca}`);
    if (response.ok) {
      const data = await response.json();
      if (data.backlinks && data.backlinks.length > 0) {
        displayBacklinks(data.backlinks);
      } else {
        backlinksList.innerHTML = '<p class="empty-state">No backlinks found</p>';
      }
    } else {
      backlinksList.innerHTML = '<p class="empty-state">No backlinks found</p>';
    }
  } catch (e) {
    backlinksList.innerHTML = '<p class="empty-state">No backlinks found</p>';
  }
}

function displayBacklinks(backlinks) {
  backlinksList.innerHTML = backlinks.map(backlink => `
    <div class="backlink-item">
      <a href="${backlink.url}" target="_blank">${backlink.title || backlink.url}</a>
      <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">${backlink.domain}</div>
    </div>
  `).join('');
}

function showEmptyState() {
  tokenSection.style.display = 'none';
  emptySection.style.display = 'flex';
}

function setupEventListeners() {
  openMayhemBtn?.addEventListener('click', () => {
    if (currentToken) {
      chrome.tabs.create({ url: `${MAYHEM_APP_URL}/token/${currentToken.ca}` });
    }
  });

  copyCABtn?.addEventListener('click', async () => {
    if (currentToken) {
      await navigator.clipboard.writeText(currentToken.ca);
      copyCABtn.textContent = 'Copied!';
      setTimeout(() => {
        copyCABtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy CA
        `;
      }, 2000);
    }
  });

  openMayhemAppBtn?.addEventListener('click', () => {
    chrome.tabs.create({ url: MAYHEM_APP_URL });
  });

  settingsBtn?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// Initialize on load
init();

