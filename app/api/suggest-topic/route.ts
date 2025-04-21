import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { PromptMode, Language } from '@/lib/types'; // Importar tipos necessários

// Usar o mesmo cliente e configurações de segurança da outra API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const SUGGESTION_MODEL_ID = 'gemini-2.0-flash-thinking-exp-01-21'; // Modelo específico para sugestões

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Mapeamento de modo para descrição (para o prompt da IA)
const modeDescriptions: Record<PromptMode, string> = {
  app_creation: "desenvolvimento de aplicativo",
  image_generation: "geração de imagem",
  content_creation: "criação de conteúdo (artigo, post, etc.)",
  problem_solving: "resolução de um problema específico",
  coding: "programação ou desenvolvimento de código",
  instruct: "criação de instruções passo a passo",
  explain: "explicação detalhada de um conceito",
};

/**
 * Rota POST para sugerir tópicos de prompt contextuais usando IA.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mode = body.mode as PromptMode;
    const language = (body.language as Language) || 'portuguese';
    const currentKeywords = body.keywords as string || ''; // Receber keywords atuais
    const currentContext = body.context as string || ''; // Receber contexto atual

    if (!mode || !modeDescriptions[mode]) {
      return NextResponse.json({ error: "Parâmetro 'mode' inválido ou ausente" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
        model: SUGGESTION_MODEL_ID, 
        safetySettings 
    });

    const languageInstruction = language === 'english' ? 'English' : 'Portuguese';
    const modeDescription = modeDescriptions[mode];
    const suggestionCount = 3; // Pedir 3 sugestões

    // Prompt dinâmico baseado na existência de keywords
    let systemPrompt = `You are an AI assistant specialized in generating concise and creative topic ideas for AI prompts. Respond ONLY with a list of ${suggestionCount} topic ideas, each on a new line, without any introduction, explanation, numbering, or surrounding text like quotes or dashes. The response must be in ${languageInstruction}.`;
    let userPrompt = '';

    if (currentKeywords.trim()) {
      // Se houver keywords, pedir sugestões relacionadas/refinamentos
      userPrompt = `Based on the current idea "${currentKeywords.trim()}"${currentContext ? ` and context "${currentContext.trim()}"` : ''}, suggest ${suggestionCount} related or refined topic ideas suitable for the prompt generation mode: "${modeDescription}". Focus on variations or improvements.`;
      console.log(`Suggesting related topics for: "${currentKeywords}", mode: ${mode}, lang: ${language}`);
    } else {
      // Se não houver keywords, pedir novas ideias
      userPrompt = `Suggest ${suggestionCount} diverse, specific, and creative topic ideas suitable for the prompt generation mode: "${modeDescription}".`;
      console.log(`Suggesting new topics for mode: ${mode}, lang: ${language}`);
    }
    
    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = await result.response;
    const responseText = response.text();

    // Processar a resposta para obter uma lista de tópicos
    const topics = responseText
      .split('\n') // Dividir por nova linha
      .map(topic => topic.replace(/^- /,'').trim()) // Remover marcadores e espaços
      .filter(topic => topic.length > 0); // Remover linhas vazias

    if (!topics || topics.length === 0) {
        // Tentar uma segunda vez com um prompt mais simples se a primeira falhar
        console.warn("Failed to parse topics, trying simpler prompt...");
        const simplerUserPrompt = `List ${suggestionCount} topic ideas for "${modeDescription}" in ${languageInstruction}, one per line.`;
        const simplerResult = await model.generateContent([systemPrompt, simplerUserPrompt]);
        const simplerResponse = await simplerResult.response;
        const simplerText = simplerResponse.text();
        const simplerTopics = simplerText.split('\n').map(t => t.replace(/^- /,'').trim()).filter(t => t.length > 0);
        
        if (!simplerTopics || simplerTopics.length === 0) {
            throw new Error("A IA não retornou tópicos válidos mesmo com prompt simples.");
        }
        console.log(`Suggested topics (fallback): ${simplerTopics.join('; ')}`);
        return NextResponse.json({ topics: simplerTopics });
    }

    console.log(`Suggested topics: ${topics.join('; ')}`);
    // Retornar um array de tópicos
    return NextResponse.json({ topics });

  } catch (error: any) {
    console.error("Erro na API /api/suggest-topic:", error);
    return NextResponse.json(
      { error: `Erro ao sugerir tópico: ${error.message}` },
      { status: 500 }
    );
  }
} 