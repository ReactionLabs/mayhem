# 🤖 AI Features Setup Guide

## Harry AI Agent Features

Your Mayhem app includes an advanced AI agent named **Harry** that can:
- 🎯 Generate wallets from PumpPortal
- 💰 Create meme coins with AI-generated content
- 📈 Execute automated trades
- 🎨 Generate images and memes
- 💬 Create viral social media content

## OpenAI API Setup

To enable Harry's AI features, you need to configure an OpenAI API key:

### Step 1: Get an OpenAI API Key
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in to your OpenAI account
3. Click "Create new secret key"
4. Copy the generated API key (save it securely!)

### Step 2: Configure Environment Variables
1. Open the `.env.local` file in your project root
2. Replace `your_openai_api_key_here` with your actual API key:

```env
# OpenAI API Key for AI features (Harry agent, image generation, content creation)
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Step 3: Restart Your Development Server
```bash
npm run dev
```

## Testing Harry Agent

Once configured, visit `/harry` in your browser and try these commands:

- `"generate a new wallet"` - Creates a wallet from PumpPortal
- `"create a funny meme coin about cats"` - AI-generated meme coin concept
- `"buy 0.1 SOL worth of trending token"` - Automated trading simulation
- `"generate an image of a rocket ship"` - AI image generation
- `"create viral content about crypto memes"` - Social media content

## API Costs

OpenAI API usage incurs costs based on:
- **GPT-4**: ~$0.03 per 1K tokens (text generation)
- **DALL-E**: ~$0.04 per 512x512 image

Monitor your usage at [https://platform.openai.com/usage](https://platform.openai.com/usage)

## Troubleshooting

### "OpenAI API key not configured" Error
- Check that your `.env.local` file exists and contains the correct API key
- Ensure the key starts with `sk-`
- Restart your development server after adding the key

### Still Having Issues?
- Verify your API key is valid and has credits
- Check the browser console for detailed error messages
- Ensure your `.env.local` file is in the project root

## Security Note

- Never commit your `.env.local` file to version control
- Keep your API key secure and don't share it publicly
- Monitor your OpenAI usage to avoid unexpected charges
