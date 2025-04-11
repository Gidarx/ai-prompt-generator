import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from 'next/server';

// Tipos para a conversa (simplificado)
type ChatMessage = {
  role: "user" | "model"; // Gemini usa 'user' e 'model'
  parts: { text: string }[];
};

type AssistantRequestBody = {
  userMessage: string;
  history: ChatMessage[];
  requestMarkdown?: boolean; // Flag opcional para solicitar formatação em Markdown
  // TODO: Adicionar currentParams?: PromptParams se quisermos que o assistente analise o formulário
};

// Configuração do Gemini (Reutilizar chave)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");
const modelId = "gemini-2.0-flash-thinking-exp-01-21"; // Ou outro modelo adequado para chat

// Configurações de Geração e Segurança (Ajustar conforme necessário)
const generationConfig = {
  temperature: 0.7,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048, // Limite razoável para resposta de chat
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export async function POST(request: Request) {
  try {
    const { userMessage, history, requestMarkdown = true }: AssistantRequestBody = await request.json();

    if (!userMessage) {
      return NextResponse.json({ error: "Mensagem do usuário está vazia." }, { status: 400 });
    }

    // --- Instrução de Sistema / Meta-Prompt para o Gemini --- 
    // Define o papel e o comportamento esperado do assistente
    const systemInstruction = `Você é um assistente especializado em engenharia de prompts de IA. Seu objetivo é ajudar o usuário a criar e refinar prompts eficazes para modelos de IA. 

Seja extremamente direto e objetivo. Vá direto ao ponto. Evite introduções, cumprimentos, explicações desnecessárias e formatação Markdown. Forneça apenas o conteúdo essencial, sem formatação adicional. Apresente exemplos somente quando solicitado.`;
    
    // Mensagem do usuário sem aprimoramentos adicionais
    let enhancedUserMessage = userMessage;
    
    // Inicializa o chat com a instrução de sistema e o histórico
    const chat = genAI.getGenerativeModel({ 
        model: modelId, 
        systemInstruction: systemInstruction,
        generationConfig,
        safetySettings
    }).startChat({ history: history || [] });

    console.log("[API Assistant] Enviando para Gemini:", enhancedUserMessage);
    console.log("[API Assistant] Histórico:", JSON.stringify(history));

    // Envia a nova mensagem do usuário
    const result = await chat.sendMessage(enhancedUserMessage);
    const response = result.response;
    let assistantResponseText = response.text();
    
    console.log("[API Assistant] Resposta do Gemini:", assistantResponseText);

    return NextResponse.json({ response: assistantResponseText });

  } catch (error) {
    console.error("Erro na API Route /api/assistant:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao contatar assistente.";
    // Verificar erros específicos da API do Gemini (ex: bloqueio de segurança)
    if (errorMessage.includes('response was blocked')) {
        return NextResponse.json({ response: "Desculpe, não posso responder a isso devido às políticas de segurança." }, { status: 200 }); // Retornar 200 com mensagem específica
    }
    return NextResponse.json({ error: `Falha ao obter resposta do assistente: ${errorMessage}` }, { status: 500 });
  }
} 