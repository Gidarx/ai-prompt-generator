import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from 'next/server';

// Define o modelo específico para sugestões
const MODEL_NAME = "gemini-2.0-flash-thinking-exp-01-21";
const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || "";

// Basic safety settings - adjust as needed
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export async function GET() {
  if (!API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME, safetySettings });

    const prompt = `Gere uma ideia curta e criativa para um prompt de geração de imagem. 
      Seja conciso e visualmente inspirador. Pense em diferentes estilos, temas e cenários. 
      Retorne APENAS a ideia do prompt, sem nenhuma formatação extra ou texto introdutório.
      
      Exemplos de formato esperado:
      - Um astronauta surfando em um anel de Saturno, estilo vaporwave.
      - Biblioteca antiga abandonada invadida pela natureza, raios de sol entrando pelas janelas quebradas.
      - Gato samurai em armadura completa, em pé sobre um telhado ao luar.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const suggestedPrompt = response.text().trim();

    if (!suggestedPrompt) {
      throw new Error("Failed to generate suggestion or response was empty.");
    }

    return NextResponse.json({ suggestion: suggestedPrompt });

  } catch (error: any) {
    console.error("Error suggesting image prompt:", error);
    const errorMessage = error.message || "Internal server error generating suggestion";
    // Check for specific safety feedback if available in the error object
    // (Structure might vary depending on the error type from the SDK)
    if (error.response?.promptFeedback?.blockReason) {
        return NextResponse.json({ error: `Suggestion blocked due to: ${error.response.promptFeedback.blockReason}` }, { status: 400 });
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 