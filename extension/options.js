// Mayhem Extension - Options Page

const form = document.getElementById('settingsForm');
const mayhemUrlInput = document.getElementById('mayhemUrl');
const status = document.getElementById('status');

// Load saved settings
chrome.storage.sync.get(['mayhemUrl'], (result) => {
  if (result.mayhemUrl) {
    mayhemUrlInput.value = result.mayhemUrl;
  }
});

// Save settings
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const mayhemUrl = mayhemUrlInput.value.trim();
  
  if (!mayhemUrl) {
    showStatus('Please enter a valid URL', false);
    return;
  }

  try {
    await chrome.storage.sync.set({ mayhemUrl });
    showStatus('Settings saved successfully!', true);
  } catch (error) {
    showStatus('Failed to save settings', false);
  }
});

function showStatus(message, success) {
  status.textContent = message;
  status.className = `status ${success ? 'success' : ''}`;
  setTimeout(() => {
    status.className = 'status';
  }, 3000);
}

