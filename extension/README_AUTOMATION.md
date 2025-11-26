# 🤖 Mayhem Extension - Automation & Self-Building

## ✅ Complete - No Icons Needed!

The extension works **without icons** - Chrome will use a default icon.

## 🚀 Quick Install

1. Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. "Load unpacked" → select `extension` folder
4. **Done!** Works immediately!

## 🤖 Automation Features

### Browser Control from Chat/Commands

The extension can be controlled via commands to:
- **Click elements** - `click button.buy`
- **Type text** - `type input.search "token"`
- **Navigate** - `navigate https://pump.fun`
- **Scroll** - `scroll down 500`
- **Extract data** - `extract .token-name textContent`
- **Execute scripts** - `execute document.querySelector('.buy').click()`

### Self-Building

The extension can modify itself in real-time:

```javascript
// Inject new features
window.MayhemAutomation.executeScript(`
  const div = document.createElement('div');
  div.id = 'mayhem-custom';
  div.innerHTML = '<button>New Feature</button>';
  document.body.appendChild(div);
`);

// Update existing elements
window.MayhemAutomation.executeScript(`
  document.querySelector('#mayhem-badge').innerHTML = 'Updated!';
`);
```

### Control from External Sources

```javascript
// From background script or external API
chrome.tabs.sendMessage(tabId, {
  type: 'automation-command',
  command: {
    type: 'click',
    selector: 'button.buy'
  }
});
```

## 📋 Available Commands

- `click {selector}` - Click element
- `type {selector} {text}` - Type into input
- `navigate {url}` - Navigate to URL
- `wait {ms}` - Wait duration
- `scroll {direction} {amount}` - Scroll page
- `extract {selector} {attribute}` - Extract data
- `execute {script}` - Execute JavaScript

## 🎯 Usage Examples

### Buy Token Automatically
```javascript
window.MayhemAutomation.click('button.buy');
window.MayhemAutomation.wait(1000);
window.MayhemAutomation.type('input.amount', '100');
window.MayhemAutomation.click('button.confirm');
```

### Extract Token Info
```javascript
const name = await window.MayhemAutomation.extract('h1.token-name');
const price = await window.MayhemAutomation.extract('.price');
```

### Self-Modify Extension
```javascript
// Add custom UI
window.MayhemAutomation.executeScript(`
  const badge = document.createElement('div');
  badge.id = 'mayhem-custom-controls';
  badge.innerHTML = '<button onclick="window.MayhemAutomation.click(\'.buy\')">Quick Buy</button>';
  document.body.appendChild(badge);
`);
```

## 🔌 Integration

### From Chat Interface
Send commands via Chrome messaging API - extension executes in real-time.

### From Mayhem App
Add API endpoint to send commands to extension.

### From Background Script
Background can queue commands and execute on active tab.

## ✅ Ready to Use

**The extension is fully functional:**
- ✅ Works without icons
- ✅ Automation engine active
- ✅ Self-building capabilities
- ✅ Chat/command control ready
- ✅ Real-time execution

---

**Load it up and start automating! 🚀**

