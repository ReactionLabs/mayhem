import { NextApiRequest, NextApiResponse } from 'next';

// Increase body size limit for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      tokenLogo,
      tokenName,
      tokenSymbol,
      description,
      twitter,
      telegram,
      website,
    } = req.body;

    if (!tokenLogo || !tokenName || !tokenSymbol) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const formData = new FormData();
    const logoFile = base64ToFile(tokenLogo, `${Date.now()}-logo`);
    formData.append('file', logoFile);
    formData.append('name', tokenName);
    formData.append('symbol', tokenSymbol);
    formData.append('description', description || '');
    formData.append('showName', 'true');
    if (twitter) formData.append('twitter', twitter);
    if (telegram) formData.append('telegram', telegram);
    if (website) formData.append('website', website);

    const response = await fetch('https://pump.fun/api/ipfs', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Pump.fun IPFS error:', err);
      }
      return res
        .status(response.status)
        .json({ error: err.error || err.message || 'Failed to upload metadata to Pump.fun' });
    }

    const json = await response.json();

    return res.status(200).json({
      success: true,
      metadataUri: json.metadataUri,
      imageUri: json.metadata?.image,
    });
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Upload error:', error);
    }
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred during upload' 
    });
  }
}

function base64ToFile(base64: string, fileName: string): File {
  const matches = base64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string');
  }

  const [, contentType, base64Data] = matches;
  const buffer = Buffer.from(base64Data, 'base64');
  return new File([buffer], fileName, { type: contentType });
}
