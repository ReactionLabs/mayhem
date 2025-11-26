# 🤖 Mayhem Extension - Automation Commands

## Control the Extension from Chat/External Sources

The extension can be controlled via commands to automate browser actions.

## Available Commands

### Navigation
```
navigate https://pump.fun
```
Navigate to a URL.

### Click Elements
```
click button.buy-button
click #token-card
click .trade-button
```
Click any element by CSS selector.

### Type Text
```
type input.search "token name"
type #amount-input "100"
```
Type text into input fields.

### Wait/Delay
```
wait 2000
```
Wait for specified milliseconds.

### Scroll
```
scroll down 500
scroll up 300
```
Scroll the page.

### Extract Data
```
extract .token-name textContent
extract #price innerHTML
extract .chart data-value
```
Extract data from elements.

### Execute Script
```
execute document.querySelector('.buy').click()
```
Execute custom JavaScript.

### Start/Stop Automation
```
start
stop
```
Start or stop automation queue.

## Usage Examples

### Example 1: Buy Token
```
start
navigate https://pump.fun/TOKEN_CA
wait 2000
click button.buy-button
wait 1000
type input.amount "100"
wait 500
click button.confirm
```

### Example 2: Extract Token Info
```
extract h1.token-name textContent
extract .price textContent
extract .volume textContent
```

### Example 3: Navigate and Analyze
```
navigate https://dexscreener.com/solana/TOKEN_CA
wait 3000
scroll down 500
extract .chart-data textContent
```

## Integration

### From Chat/API
Send commands to the extension via:
- Chrome extension messaging API
- External port connection
- Background script messages

### Command Format
```javascript
{
  type: 'automation-command',
  command: {
    type: 'click',
    selector: 'button.buy',
    options: {}
  }
}
```

## Real-time Building

The extension can modify itself in real-time:
- Inject new scripts
- Update content scripts
- Modify DOM
- Execute dynamic code

## Safety

- Commands are queued and executed sequentially
- Errors are caught and reported
- Can be stopped at any time
- No destructive actions by default

