# 🤖 Mayhem Extension - Automation & Self-Building Guide

## Overview

The extension can now:
- ✅ **Work without icons** (uses SVG)
- ✅ **Control browser automatically** (click, type, navigate)
- ✅ **Be controlled from chat/commands**
- ✅ **Build itself in real-time**

## No Icons Needed

The extension uses SVG icons that work at any size. The `icon.svg` file is automatically used.

## Automation Commands

### Basic Commands

```javascript
// Click an element
click button.buy-button

// Type text
type input.search "token name"

// Navigate
navigate https://pump.fun

// Wait
wait 2000

// Scroll
scroll down 500

// Extract data
extract .token-name textContent
```

### From Chat/External Control

Send commands via Chrome messaging:

```javascript
chrome.runtime.sendMessage({
  type: 'automation-command',
  command: {
    type: 'click',
    selector: 'button.buy',
  }
});
```

## Real-Time Self-Building

The extension can modify itself:

1. **Inject Scripts**: Add new functionality on the fly
2. **Update Content**: Modify page content dynamically
3. **Execute Code**: Run custom JavaScript
4. **Modify DOM**: Change page structure

### Example: Self-Modification

```javascript
// Inject new feature
execute const script = document.createElement('script'); script.src = 'new-feature.js'; document.head.appendChild(script);

// Update extension UI
execute document.querySelector('#mayhem-badge').innerHTML = 'New Content';

// Add event listeners
execute document.addEventListener('click', (e) => { console.log('Clicked:', e.target); });
```

## Command Queue System

Commands are queued and executed sequentially:

```javascript
// Start automation
start

// Queue commands
click .button1
wait 1000
click .button2
wait 500
type input "text"

// Commands execute in order
```

## Integration Points

### 1. From Chat Interface
- Send commands via messaging API
- Extension executes in real-time
- Get responses back

### 2. From Mayhem App
- API endpoint to send commands
- Extension receives and executes
- Results sent back

### 3. From Background Script
- Background can queue commands
- Executes on active tab
- Monitors and reports

## Safety Features

- ✅ Commands queued (no race conditions)
- ✅ Error handling (continues on failure)
- ✅ Can be stopped anytime
- ✅ No destructive actions by default
- ✅ Sandboxed execution

## Advanced Usage

### Multi-Step Automation

```javascript
// Navigate and analyze token
navigate https://pump.fun/TOKEN_CA
wait 3000
extract h1.token-name textContent
extract .price textContent
scroll down 500
click button.buy
wait 1000
type input.amount "100"
```

### Dynamic Building

```javascript
// Build custom UI
execute const div = document.createElement('div'); div.id = 'mayhem-controls'; div.innerHTML = '<button>Custom Action</button>'; document.body.appendChild(div);

// Add functionality
execute document.querySelector('#mayhem-controls button').addEventListener('click', () => { alert('Custom action!'); });
```

## API Endpoints (Future)

Add to Mayhem app for remote control:

```typescript
// POST /api/extension/command
{
  command: "click button.buy",
  tabId?: number
}

// Response
{
  success: true,
  result: { ... }
}
```

## Next Steps

1. **Test Automation**: Load extension and try commands
2. **Add Chat Interface**: Connect to chat for command input
3. **Build API**: Create endpoint for remote control
4. **Enhance Features**: Add more automation capabilities

---

**The extension is now self-building and controllable! 🚀**

