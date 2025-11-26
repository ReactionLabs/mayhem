/**
 * Bridge between Mayhem web app and Chrome extension
 * Allows the web app to control the extension
 */

export type ExtensionCommand = 
  | { type: 'click'; selector: string }
  | { type: 'type'; selector: string; text: string }
  | { type: 'navigate'; url: string }
  | { type: 'wait'; duration: number }
  | { type: 'scroll'; direction: 'up' | 'down'; amount: number }
  | { type: 'extract'; selector: string; attribute?: string }
  | { type: 'execute'; script: string };

/**
 * Check if extension is installed
 */
export async function isExtensionInstalled(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    // Try to ping the extension
    const response = await fetch('chrome-extension://mayhem-extension-id/ping', { method: 'HEAD' })
      .catch(() => null);
    return response !== null;
  } catch {
    return false;
  }
}

/**
 * Send command to extension via postMessage
 * The extension listens for messages from the web app
 */
export async function sendExtensionCommand(command: ExtensionCommand): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Extension commands can only be sent from browser');
  }

  // Try to send via postMessage (if extension injects listener)
  return new Promise((resolve, reject) => {
    const message = {
      type: 'mayhem-command',
      command,
      timestamp: Date.now(),
    };

    // Broadcast to extension
    window.postMessage(message, '*');

    // Also try to call extension directly if available
    if ((window as any).chrome?.runtime) {
      // Extension ID would be known after installation
      // For now, we'll use postMessage which the extension can listen for
    }

    // Set timeout
    setTimeout(() => {
      resolve({ success: true, sent: true });
    }, 100);
  });
}

/**
 * Get token info from extension (if extension detected a token)
 */
export async function getExtensionToken(): Promise<any> {
  return new Promise((resolve) => {
    const message = { type: 'mayhem-get-token' };
    window.postMessage(message, '*');
    
    // Listen for response
    const listener = (event: MessageEvent) => {
      if (event.data?.type === 'mayhem-token-response') {
        window.removeEventListener('message', listener);
        resolve(event.data.token);
      }
    };
    window.addEventListener('message', listener);
    
    // Timeout
    setTimeout(() => {
      window.removeEventListener('message', listener);
      resolve(null);
    }, 2000);
  });
}

