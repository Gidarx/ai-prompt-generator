import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

interface GeminiModel {
  name: string;
  displayName: string;
  description: string;
  version: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
  temperature?: number;
  topP?: number;
  topK?: number;
}

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key do Gemini não configurada" },
        { status: 500 }
      );
    }

    // Inicializar o cliente Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Como a API do Gemini não expõe listModels() publicamente,
    // vamos usar uma lista curada dos modelos mais atuais
    const availableModels = await getAvailableModels(genAI);

    return NextResponse.json({
      models: availableModels,
      total: availableModels.length,
      lastUpdated: new Date().toISOString(),
      source: 'live_api'
    });

  } catch (error: any) {
    console.error("Erro ao buscar modelos do Gemini:", error);
    
    // Fallback com modelos conhecidos se a API falhar
    const fallbackModels = getFallbackModels();
    
    return NextResponse.json({
      models: fallbackModels,
      total: fallbackModels.length,
      lastUpdated: new Date().toISOString(),
      fallback: true,
      error: "Usando modelos em cache - API indisponível"
    });
  }
}

async function getAvailableModels(genAI: GoogleGenerativeAI): Promise<GeminiModel[]> {
  try {
    // A biblioteca @google/generative-ai não expõe listModels() publicamente
    // Vamos fazer uma requisição direta à API REST do Gemini
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const availableModels: GeminiModel[] = [];
    
    if (data.models && Array.isArray(data.models)) {
      for (const model of data.models) {
        // Filtrar apenas modelos que suportam generateContent
        if (model.supportedGenerationMethods?.includes('generateContent')) {
          const modelInfo = extractModelInfo(model.name, model.description || '');
          
          availableModels.push({
            name: model.name,
            displayName: formatDisplayName(model.name),
            description: model.description || 'Modelo do Google Gemini',
            version: modelInfo.version,
            inputTokenLimit: modelInfo.inputTokenLimit,
            outputTokenLimit: modelInfo.outputTokenLimit,
            supportedGenerationMethods: model.supportedGenerationMethods || ['generateContent']
          });
        }
      }
    }

    // Se não conseguir modelos da API, usar fallback
    if (availableModels.length === 0) {
      console.warn('Nenhum modelo encontrado na API, usando fallback');
      return getFallbackModels();
    }

    return availableModels.sort((a, b) => {
      // Ordenar por versão (mais recente primeiro) e depois por nome
      const aVersion = parseFloat(a.version);
      const bVersion = parseFloat(b.version);
      
      if (aVersion !== bVersion) {
        return bVersion - aVersion; // Versão mais alta primeiro
      }
      
      return a.displayName.localeCompare(b.displayName);
    });

  } catch (error) {
    console.error('Erro ao listar modelos da API:', error);
    // Em caso de erro, retornar modelos conhecidos
    return getFallbackModels();
  }
}

function formatDisplayName(modelName: string): string {
  // Converter nome do modelo para um formato mais amigável
  return modelName
    .replace('models/', '') // Remove prefixo se existir
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function extractModelInfo(modelName: string, description: string) {
  // Extrair informações baseadas no nome do modelo
  const name = modelName.toLowerCase();
  
  let version = '1.0';
  let inputTokenLimit = 30720;
  let outputTokenLimit = 2048;
  
  if (name.includes('2.0')) {
    version = '2.0';
    inputTokenLimit = 1000000;
    outputTokenLimit = 8192;
  } else if (name.includes('1.5')) {
    version = '1.5';
    inputTokenLimit = name.includes('pro') ? 2000000 : 1000000;
    outputTokenLimit = 8192;
  } else if (name.includes('1.0')) {
    version = '1.0';
    inputTokenLimit = 30720;
    outputTokenLimit = 2048;
  }
  
  // Ajustar limites baseados no tipo do modelo
  if (name.includes('pro')) {
    inputTokenLimit = Math.max(inputTokenLimit, 2000000);
  }
  
  return {
    version,
    inputTokenLimit,
    outputTokenLimit
  };
}

function getFallbackModels(): GeminiModel[] {
  return [
    {
      name: 'gemini-2.0-flash-thinking-exp-01-21',
      displayName: 'Gemini 2.0 Flash Thinking Exp',
      description: 'Modelo experimental mais avançado com capacidades de raciocínio',
      version: '2.0',
      inputTokenLimit: 1000000,
      outputTokenLimit: 8192,
      supportedGenerationMethods: ['generateContent']
    },
    {
      name: 'gemini-1.5-pro',
      displayName: 'Gemini 1.5 Pro',
      description: 'Modelo profissional com alta capacidade de contexto',
      version: '1.5',
      inputTokenLimit: 2000000,
      outputTokenLimit: 8192,
      supportedGenerationMethods: ['generateContent']
    },
    {
      name: 'gemini-1.5-flash',
      displayName: 'Gemini 1.5 Flash',
      description: 'Modelo rápido e eficiente para uso geral',
      version: '1.5',
      inputTokenLimit: 1000000,
      outputTokenLimit: 8192,
      supportedGenerationMethods: ['generateContent']
    },
    {
      name: 'gemini-1.5-flash-8b',
      displayName: 'Gemini 1.5 Flash 8B',
      description: 'Versão otimizada e mais rápida do Flash',
      version: '1.5',
      inputTokenLimit: 1000000,
      outputTokenLimit: 8192,
      supportedGenerationMethods: ['generateContent']
    },
    {
      name: 'gemini-1.0-pro',
      displayName: 'Gemini 1.0 Pro',
      description: 'Modelo estável e confiável da primeira geração',
      version: '1.0',
      inputTokenLimit: 30720,
      outputTokenLimit: 2048,
      supportedGenerationMethods: ['generateContent']
    }
  ];
}