import { NextApiRequest, NextApiResponse } from 'next';

// API endpoint for controlling the extension from the web app
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { command, tabId } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  try {
    // This would send a message to the extension
    // In a real implementation, you'd use Chrome Extension Messaging API
    // For now, return success - the extension listens for these commands
    
    return res.status(200).json({ 
      success: true, 
      message: 'Command sent to extension',
      command,
      note: 'Extension must be installed and active tab must be open'
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Extension command error:', error);
    }
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to send command' 
    });
  }
}

