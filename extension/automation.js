// Mayhem Extension - Automation Engine
// Allows the extension to control the browser, click elements, navigate, etc.

class MayhemAutomation {
  constructor() {
    this.isActive = false;
    this.commandQueue = [];
    this.currentCommand = null;
  }

  // Start automation
  start() {
    this.isActive = true;
    this.processQueue();
  }

  // Stop automation
  stop() {
    this.isActive = false;
    this.commandQueue = [];
    this.currentCommand = null;
  }

  // Add command to queue
  addCommand(command) {
    this.commandQueue.push({
      ...command,
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
    });
    if (this.isActive && !this.currentCommand) {
      this.processQueue();
    }
  }

  // Process command queue
  async processQueue() {
    if (!this.isActive || this.commandQueue.length === 0) {
      this.currentCommand = null;
      return;
    }

    this.currentCommand = this.commandQueue.shift();
    await this.executeCommand(this.currentCommand);
    
    // Process next command
    setTimeout(() => this.processQueue(), 100);
  }

  // Execute a command
  async executeCommand(command) {
    try {
      switch (command.type) {
        case 'click':
          await this.clickElement(command.selector, command.options);
          break;
        case 'type':
          await this.typeText(command.selector, command.text, command.options);
          break;
        case 'navigate':
          await this.navigate(command.url);
          break;
        case 'wait':
          await this.wait(command.duration);
          break;
        case 'scroll':
          await this.scroll(command.direction, command.amount);
          break;
        case 'screenshot':
          return await this.screenshot(command.options);
        case 'extract':
          return await this.extractData(command.selector, command.attribute);
        case 'execute':
          return await this.executeScript(command.script);
        default:
          console.warn('Unknown command type:', command.type);
      }
    } catch (error) {
      console.error('Command execution error:', error);
      this.sendResponse(command.id, { error: error.message });
    }
  }

  // Click an element
  async clickElement(selector, options = {}) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    if (options.scrollIntoView !== false) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.wait(300);
    }

    // Create and dispatch click event
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
      ...options,
    });

    element.dispatchEvent(event);
    
    // Also try actual click
    if (element.click) {
      element.click();
    }

    return { success: true, selector };
  }

  // Type text into an element
  async typeText(selector, text, options = {}) {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    element.focus();
    await this.wait(100);

    // Clear if needed
    if (options.clear !== false) {
      element.value = '';
    }

    // Type character by character
    for (const char of text) {
      const event = new KeyboardEvent('keydown', { key: char, bubbles: true });
      element.dispatchEvent(event);
      element.value += char;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      await this.wait(options.delay || 50);
    }

    // Trigger change event
    element.dispatchEvent(new Event('change', { bubbles: true }));

    return { success: true, selector, text };
  }

  // Navigate to URL
  async navigate(url) {
    window.location.href = url;
    return { success: true, url };
  }

  // Wait for duration
  async wait(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
  }

  // Scroll page
  async scroll(direction = 'down', amount = 500) {
    const scrollAmount = direction === 'down' ? amount : -amount;
    window.scrollBy({
      top: scrollAmount,
      behavior: 'smooth',
    });
    await this.wait(500);
    return { success: true, direction, amount };
  }

  // Take screenshot
  async screenshot(options = {}) {
    // Use html2canvas or similar library
    // For now, return canvas data
    return { success: true, data: 'screenshot_data' };
  }

  // Extract data from element
  async extractData(selector, attribute = 'textContent') {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    let value;
    if (attribute === 'textContent') {
      value = element.textContent.trim();
    } else if (attribute === 'innerHTML') {
      value = element.innerHTML;
    } else {
      value = element.getAttribute(attribute) || element[attribute];
    }

    return { success: true, selector, attribute, value };
  }

  // Execute custom script
  async executeScript(script) {
    try {
      const result = eval(script);
      return { success: true, result };
    } catch (error) {
      throw new Error(`Script execution error: ${error.message}`);
    }
  }

  // Send response back
  sendResponse(commandId, data) {
    chrome.runtime.sendMessage({
      type: 'automation-response',
      commandId,
      data,
    });
  }
}

// Initialize automation
const automation = new MayhemAutomation();

// Listen for automation commands
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'automation-command') {
    automation.addCommand(request.command);
    sendResponse({ success: true, queued: true });
  } else if (request.type === 'automation-start') {
    automation.start();
    sendResponse({ success: true });
  } else if (request.type === 'automation-stop') {
    automation.stop();
    sendResponse({ success: true });
  }
  return true;
});

// Export for use in content script
if (typeof window !== 'undefined') {
  window.MayhemAutomation = automation;
}

