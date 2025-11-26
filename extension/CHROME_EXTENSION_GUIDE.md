# 🚀 Mayhem Chrome Extension - Complete Guide

## What It Does

The Mayhem Chrome Extension enhances any trading platform with:
- **Auto Token Detection** - Automatically finds tokens on any page
- **Chart Analysis** - Quick trend, volume, support/resistance analysis
- **Quick Links** - One-click access to Pump.fun, DexScreener, Birdeye, Solscan
- **Backlink Tracking** - Tracks where tokens are shared/mentioned
- **Mayhem Integration** - Direct links to full analysis in Mayhem app

## Installation

### Quick Install (Development)

1. **Create Icons** (see below)
2. Open Chrome → `chrome://extensions/`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `extension` folder
6. Done! ✅

### Creating Icons

You need 3 PNG files in `extension/icons/`:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

**Quick Option**: Use any image editor or online tool to create simple icons with the Mayhem branding/colors.

## Features

### 1. Auto Token Detection
- Works on: Pump.fun, DexScreener, Birdeye, Solscan, and more
- Detects token contract addresses from URLs
- Extracts token name/symbol from page content
- Shows notification badge when token detected

### 2. Chart Analysis
- Trend analysis (Bullish/Bearish)
- Volume indicators
- Support/Resistance levels
- Real-time updates from page

### 3. Quick Links
- **Pump.fun** - Direct link to token
- **DexScreener** - Chart analysis
- **Birdeye** - Token analytics
- **Solscan** - On-chain explorer

### 4. Backlink Tracking
- Automatically tracks when you visit token pages
- Shows where tokens are mentioned/shared
- Stored locally in Chrome storage

### 5. Mayhem Integration
- "Open in Mayhem" button
- Direct link to token page in Mayhem app
- Copy contract address (CA) to clipboard

## Configuration

1. Click extension icon
2. Click settings (⚙️) button
3. Set Mayhem app URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
4. Save

## API Endpoints

The extension uses these Mayhem API endpoints:

### `GET /api/search-token?q={ca}`
Returns token info by contract address.

**Response:**
```json
{
  "type": "address",
  "token": {
    "baseAsset": {
      "id": "token_ca",
      "name": "Token Name",
      "symbol": "SYMBOL",
      "icon": "https://..."
    }
  }
}
```

### `GET /api/token-backlinks?ca={ca}`
Returns backlinks for a token.

**Response:**
```json
{
  "backlinks": [
    {
      "url": "https://...",
      "title": "Link Title",
      "domain": "example.com",
      "timestamp": 1234567890
    }
  ]
}
```

## File Structure

```
extension/
├── manifest.json          # Extension configuration
├── popup.html/css/js      # Extension popup UI
├── content.js/css         # Injected into trading pages
├── background.js          # Background service worker
├── options.html/js        # Settings page
├── icons/                 # Extension icons (create these)
├── README.md              # Full documentation
├── INSTALL.md             # Quick install guide
└── CHROME_EXTENSION_GUIDE.md  # This file
```

## Development

### Testing

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click refresh icon on extension card
4. Test on a token page (e.g., pump.fun)

### Debugging

- **Popup**: Right-click extension icon → "Inspect popup"
- **Content Script**: Open DevTools on page → Console tab
- **Background**: `chrome://extensions/` → "Service worker" link

### Updating

After making changes:
1. Refresh extension in `chrome://extensions/`
2. Reload the page you're testing on
3. Test new functionality

## Production Deployment

### Before Publishing

1. **Update URLs**:
   - Change `MAYHEM_APP_URL` in `popup.js` to production URL
   - Or use settings (users can configure)

2. **Create Icons**:
   - Design proper icons (16x16, 48x48, 128x128)
   - Use Mayhem branding

3. **Test Thoroughly**:
   - Test on all supported platforms
   - Verify API connections
   - Check error handling

### Publishing to Chrome Web Store

1. Zip the `extension` folder
2. Go to Chrome Web Store Developer Dashboard
3. Upload zip file
4. Fill in store listing details
5. Submit for review

## Supported Platforms

- ✅ Pump.fun
- ✅ DexScreener
- ✅ Birdeye
- ✅ Solscan
- ✅ Jupiter
- ✅ Raydium
- ✅ Generic token pages (auto-detection)

## Permissions Explained

- `storage` - Save settings and cache
- `activeTab` - Detect tokens on current page
- `scripting` - Inject content scripts
- `tabs` - Track tab changes for backlinks
- `host_permissions` - Access trading sites and Mayhem app

## Troubleshooting

**Extension not loading?**
- Check `chrome://extensions/` for errors
- Verify manifest.json is valid
- Ensure all files are present

**Token not detected?**
- Make sure you're on a token page
- Check browser console for errors
- Try refreshing the page

**Can't connect to Mayhem?**
- Verify Mayhem app is running
- Check URL in extension settings
- Verify CORS is configured in Mayhem

**Icons missing?**
- Create icon files (see "Creating Icons" above)
- Place in `extension/icons/` folder
- Reload extension

## Next Steps

1. Create icons (16x16, 48x48, 128x128 PNG files)
2. Test on various trading platforms
3. Customize styling to match Mayhem branding
4. Add more chart analysis features
5. Implement backlink database in Mayhem app
6. Publish to Chrome Web Store

## Support

For issues or questions:
- Check `extension/README.md` for detailed docs
- Review `extension/INSTALL.md` for setup help
- Check browser console for errors

---

**Ready to enhance your trading experience! 🚀**

