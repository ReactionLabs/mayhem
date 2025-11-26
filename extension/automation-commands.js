// Mayhem Extension - Automation Command Interface
// Allows controlling the extension from external sources (chat, API, etc.)

class AutomationController {
  constructor() {
    this.commands = new Map();
    this.setupCommands();
  }

  setupCommands() {
    // Register available commands
    this.commands.set('click', this.handleClick);
    this.commands.set('type', this.handleType);
    this.commands.set('navigate', this.handleNavigate);
    this.commands.set('wait', this.handleWait);
    this.commands.set('scroll', this.handleScroll);
    this.commands.set('extract', this.handleExtract);
    this.commands.set('execute', this.handleExecute);
    this.commands.set('start', this.handleStart);
    this.commands.set('stop', this.handleStop);
  }

  // Execute command from string
  async executeCommandString(commandString) {
    try {
      const parts = commandString.trim().split(' ');
      const command = parts[0];
      const args = parts.slice(1);

      if (!this.commands.has(command)) {
        throw new Error(`Unknown command: ${command}`);
      }

      const handler = this.commands.get(command);
      return await handler(args);
    } catch (error) {
      return { error: error.message };
    }
  }

  // Send command to active tab
  async sendToTab(command) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('No active tab');
    }

    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'automation-command',
        command,
      }, (response) => {
        resolve(response || { error: 'No response' });
      });
    });
  }

  // Command handlers
  handleClick = async (args) => {
    const selector = args[0];
    if (!selector) {
      throw new Error('Click command requires selector');
    }
    return await this.sendToTab({
      type: 'click',
      selector,
      options: {},
    });
  };

  handleType = async (args) => {
    const selector = args[0];
    const text = args.slice(1).join(' ');
    if (!selector || !text) {
      throw new Error('Type command requires selector and text');
    }
    return await this.sendToTab({
      type: 'type',
      selector,
      text,
      options: {},
    });
  };

  handleNavigate = async (args) => {
    const url = args[0];
    if (!url) {
      throw new Error('Navigate command requires URL');
    }
    return await this.sendToTab({
      type: 'navigate',
      url,
    });
  };

  handleWait = async (args) => {
    const duration = parseInt(args[0]) || 1000;
    return await this.sendToTab({
      type: 'wait',
      duration,
    });
  };

  handleScroll = async (args) => {
    const direction = args[0] || 'down';
    const amount = parseInt(args[1]) || 500;
    return await this.sendToTab({
      type: 'scroll',
      direction,
      amount,
    });
  };

  handleExtract = async (args) => {
    const selector = args[0];
    const attribute = args[1] || 'textContent';
    if (!selector) {
      throw new Error('Extract command requires selector');
    }
    return await this.sendToTab({
      type: 'extract',
      selector,
      attribute,
    });
  };

  handleExecute = async (args) => {
    const script = args.join(' ');
    if (!script) {
      throw new Error('Execute command requires script');
    }
    return await this.sendToTab({
      type: 'execute',
      script,
    });
  };

  handleStart = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('No active tab');
    }
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { type: 'automation-start' }, resolve);
    });
  };

  handleStop = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      throw new Error('No active tab');
    }
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { type: 'automation-stop' }, resolve);
    });
  };
}

// Initialize controller
const controller = new AutomationController();

// Listen for commands from background/popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'automation-execute') {
    controller.executeCommandString(request.command)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

// Export for use
if (typeof window !== 'undefined') {
  window.AutomationController = controller;
}

