# Quick Install Guide

## Step 1: Create Icons

You need to create 3 icon files. You can:
- Use a simple logo/icon generator
- Create a simple SVG and convert to PNG
- Use the Mayhem logo if you have one

Place these files in `extension/icons/`:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)  
- `icon128.png` (128x128 pixels)

## Step 2: Load Extension

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the `extension` folder
6. Done! 🎉

## Step 3: Test

1. Go to `https://pump.fun` (or any token page)
2. Click the Mayhem extension icon
3. You should see token info and links

## Step 4: Configure

1. Click extension icon → Settings (⚙️)
2. Set Mayhem app URL (default: `http://localhost:3000`)
3. Save

## Troubleshooting

**Extension not showing?**
- Make sure Developer mode is enabled
- Check for errors in `chrome://extensions/`

**Token not detected?**
- Make sure you're on a token page
- Check browser console for errors
- Try refreshing the page

**Can't connect to Mayhem?**
- Make sure Mayhem app is running
- Check the URL in settings
- Verify CORS is configured in Mayhem app

