// Quick script to create icon files
// Run this in Node.js: node create-icons.js

const fs = require('fs');
const path = require('path');

const iconSvg = `<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#grad)"/>
  <path d="M32 32 L64 64 L96 32 M32 64 L64 96 L96 64" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  <circle cx="64" cy="64" r="4" fill="white"/>
</svg>`;

// Create SVG icon (works for all sizes)
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), iconSvg);
fs.writeFileSync(path.join(iconsDir, 'icon16.png'), ''); // Placeholder - Chrome will use SVG
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), '');
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), '');

console.log('✅ Icons created! Extension will use SVG icon.');

