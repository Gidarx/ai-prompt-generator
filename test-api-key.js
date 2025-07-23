// Script para testar se a API key do Gemini está funcionando
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// Função para carregar variáveis do .env.local
function loadEnvFile() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  } catch (error) {
    console.log('⚠️  Arquivo .env.local não encontrado');
  }
}

async function testApiKey() {
  try {
    console.log('🔑 Testando API key do Gemini...\n');
    
    loadEnvFile();
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.error('❌ API key não encontrada!');
      return;
    }

    console.log('✅ API key encontrada:', apiKey.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Testar com modelo mais básico primeiro
    console.log('🧪 Testando modelo gemini-1.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Diga apenas "Olá, API funcionando!"');
    const response = await result.response;
    
    console.log('✅ Teste bem-sucedido!');
    console.log('📝 Resposta:', response.text());
    
    // Testar listagem de modelos
    console.log('\n🔍 Testando listagem de modelos...');
    const models = await genAI.listModels();
    console.log(`📊 ${models.length} modelos encontrados`);
    
    // Mostrar alguns modelos disponíveis
    const availableModels = models
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .slice(0, 5)
      .map(m => m.name);
    
    console.log('🎯 Primeiros 5 modelos disponíveis:');
    availableModels.forEach(name => console.log(`  - ${name}`));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    if (error.message.includes('403')) {
      console.log('\n💡 Possíveis soluções:');
      console.log('1. Verificar se a API key está correta');
      console.log('2. Gerar nova API key em: https://makersuite.google.com/app/apikey');
      console.log('3. Verificar se a API do Gemini está habilitada');
    }
  }
}

testApiKey();