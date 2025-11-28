# 🔗 Mayhem App & Extension Pairing

## ✅ Integration Complete!

The web app and Chrome extension are now fully paired and can communicate with each other.

## 🚀 How It Works

### 1. **Extension → Web App**
- Extension detects tokens on any trading platform
- Extension popup shows "Open in Mayhem" button
- Clicking opens the token page in the Mayhem app
- Extension fetches token data from `/api/search-token`
- Extension fetches backlinks from `/api/token-backlinks`

### 2. **Web App → Extension**
- Web app detects if extension is installed
- Shows "Extension Connected" status in dashboard
- Can send commands to extension (click, type, navigate, etc.)
- Can get detected token from extension
- Real-time communication via `postMessage`

## 📋 Features

### Extension Features
- ✅ Auto token detection on Pump.fun, DexScreener, Birdeye, etc.
- ✅ Quick links to all trading platforms
- ✅ "Open in Mayhem" button
- ✅ Chart analysis
- ✅ Backlink tracking

### Web App Features
- ✅ Extension status indicator
- ✅ Token sync from extension
- ✅ Command extension from web app
- ✅ Quick actions (open token, copy CA)

## 🔌 API Endpoints

The extension uses these endpoints:

- `GET /api/search-token?q={ca}` - Get token info by contract address
- `GET /api/token-backlinks?ca={ca}` - Get backlinks for a token
- `POST /api/extension-command` - Send commands to extension (future)

## 🎯 Usage

### From Extension
1. Visit any token page (Pump.fun, DexScreener, etc.)
2. Click extension icon
3. Click "Open in Mayhem" to view in web app
4. Extension auto-detects token and shows info

### From Web App
1. Open dashboard
2. See "Extension Connected" status (if installed)
3. View token detected by extension
4. Use quick actions to interact with extension

## 🔧 Configuration

### Extension Settings
- Open extension popup
- Click settings (⚙️)
- Set Mayhem app URL (default: `http://localhost:3000`)
- Save settings

### Auto-Detection
- Extension auto-detects `localhost:3000` in development
- In production, update to your production URL

## 📡 Communication

### Message Types

**Extension → Web App:**
- `mayhem-token-response` - Token detected by extension
- `mayhem-command-response` - Command execution result

**Web App → Extension:**
- `mayhem-command` - Execute automation command
- `mayhem-get-token` - Request detected token

## ✅ Status

**Everything is paired and ready!**

- ✅ Extension can open tokens in web app
- ✅ Web app can detect extension
- ✅ Two-way communication established
- ✅ API endpoints ready
- ✅ Status indicators working

---

**The app and extension are now fully integrated! 🎉**

