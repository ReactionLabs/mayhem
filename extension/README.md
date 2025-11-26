# Mayhem Chrome Extension

Chrome extension that pairs with the Mayhem trading platform, providing chart analysis, token links, and backlink tracking across any trading platform.

## Features

- 🔍 **Auto Token Detection**: Automatically detects tokens on Pump.fun, DexScreener, Birdeye, Solscan, and more
- 📊 **Chart Analysis**: Quick analysis of token charts (trend, volume, support/resistance)
- 🔗 **Quick Links**: One-click access to token on multiple platforms
- 📝 **Backlink Tracking**: Tracks where tokens are mentioned/shared
- ⚡ **Mayhem Integration**: Direct links to Mayhem app for detailed analysis

## Installation

### Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder
5. Extension is now installed!

### Production

1. Build the extension (zip the folder)
2. Submit to Chrome Web Store (or distribute manually)

## Usage

1. Navigate to any token page on a trading platform
2. Click the Mayhem extension icon in your toolbar
3. View token info, analysis, and quick links
4. Click "Open in Mayhem" to see full analysis

## Configuration

1. Click the extension icon
2. Click the settings button (⚙️)
3. Set your Mayhem app URL (default: `http://localhost:3000`)
4. Save settings

## API Endpoints Required

The extension expects these endpoints in your Mayhem app:

- `GET /api/search-token?q={ca}` - Get token info by contract address
- `GET /api/token-backlinks?ca={ca}` - Get backlinks for a token

## File Structure

```
extension/
├── manifest.json          # Extension manifest
├── popup.html            # Popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── content.js            # Content script (injected into pages)
├── content.css           # Content script styles
├── background.js         # Background service worker
├── options.html          # Settings page
├── options.js            # Settings logic
├── icons/                # Extension icons (create these)
└── README.md            # This file
```

## Icons Needed

Create these icon files in `extension/icons/`:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

You can use a simple logo or generate from the Mayhem branding.

## Development

### Testing

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test on a token page

### Debugging

- **Popup**: Right-click extension icon → "Inspect popup"
- **Content Script**: Open DevTools on the page, check Console
- **Background**: Go to `chrome://extensions/` → "Service worker" link

## Production Build

1. Update `MAYHEM_APP_URL` in `popup.js` to production URL
2. Create icons in `icons/` folder
3. Zip the extension folder
4. Submit to Chrome Web Store or distribute manually

## Permissions

- `storage`: Save settings and cache token data
- `activeTab`: Access current tab to detect tokens
- `scripting`: Inject content scripts
- `tabs`: Track tab changes for backlinks
- `host_permissions`: Access trading platforms and Mayhem app

## Security

- All API calls are made from the extension, not injected scripts
- No sensitive data is stored
- Backlinks are stored locally in Chrome storage
- Settings are synced across devices (optional)

