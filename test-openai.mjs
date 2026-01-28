import { config } from 'dotenv';
config();

const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.log('❌ No OPENAI_API_KEY found in .env');
  process.exit(1);
}

console.log('🔄 Testing OpenAI connection...');
console.log('   Key starts with:', key.substring(0, 20) + '...');

try {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': 'Bearer ' + key }
  });

  const data = await response.json();

  if (data.error) {
    console.log('❌ OpenAI Error:', data.error.message);
    process.exit(1);
  }

  const gpt4Models = data.data?.filter(m => m.id.includes('gpt-4')) || [];
  console.log('✅ OpenAI connected successfully!');
  console.log('   Total models:', data.data?.length || 0);
  console.log('   GPT-4 models:', gpt4Models.length);
  console.log('   Ready for Floo!');
} catch (e) {
  console.log('❌ Network error:', e.message);
  process.exit(1);
}
