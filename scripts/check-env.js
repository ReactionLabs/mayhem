/**
 * Environment Variable Checker
 * Run this to verify your OpenAI API key is configured correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking environment variables...\n');

// Check .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('✅ .env.local file exists');
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  
  const openaiKey = envContent.match(/OPENAI_API_KEY\s*=\s*(.+)/i);
  const aiGatewayKey = envContent.match(/(VERCEL_AI_GATEWAY_API_KEY|AI_GATEWAY_API_KEY|AIGATEWAYAPI)\s*=\s*(.+)/i);
  
  if (openaiKey) {
    const key = openaiKey[1].trim();
    console.log(`✅ OPENAI_API_KEY found: ${key.substring(0, 7)}...${key.substring(key.length - 4)}`);
  } else {
    console.log('❌ OPENAI_API_KEY not found');
  }
  
  if (aiGatewayKey) {
    const key = aiGatewayKey[2] || aiGatewayKey[1];
    console.log(`✅ AI Gateway key found: ${key.substring(0, 7)}...${key.substring(key.length - 4)}`);
  } else {
    console.log('❌ AI Gateway key not found');
  }
  
  if (!openaiKey && !aiGatewayKey) {
    console.log('\n⚠️  No OpenAI API keys found in .env.local');
    console.log('\n📝 Add one of these to your .env.local file:');
    console.log('   OPENAI_API_KEY=sk-your-key-here');
    console.log('   OR');
    console.log('   AIGATEWAYAPI=your-gateway-key-here');
  }
} else {
  console.log('❌ .env.local file not found');
  console.log('\n📝 Create .env.local in the root directory and add:');
  console.log('   OPENAI_API_KEY=sk-your-key-here');
}

// Check if variables are loaded in Node.js
console.log('\n🔍 Checking process.env...');
const openaiInEnv = process.env.OPENAI_API_KEY;
const aiGatewayInEnv = process.env.VERCEL_AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_API_KEY || process.env.AIGATEWAYAPI;

if (openaiInEnv) {
  console.log(`✅ OPENAI_API_KEY in process.env: ${openaiInEnv.substring(0, 7)}...${openaiInEnv.substring(openaiInEnv.length - 4)}`);
} else {
  console.log('❌ OPENAI_API_KEY not in process.env');
}

if (aiGatewayInEnv) {
  console.log(`✅ AI Gateway key in process.env: ${aiGatewayInEnv.substring(0, 7)}...${aiGatewayInEnv.substring(aiGatewayInEnv.length - 4)}`);
} else {
  console.log('❌ AI Gateway key not in process.env');
}

console.log('\n💡 Note: If variables are in .env.local but not in process.env, restart your dev server!');
console.log('   Run: npm run dev');

