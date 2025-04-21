import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SafetySetting } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { PromptMode, Language, Tone, Complexity } from '@/lib/types'; // Importar todos os tipos relevantes

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
// Usar o mesmo modelo padrão ou um específico para parsing
const PARSING_MODEL_ID = 'gemini-2.0-flash-thinking-exp-01-21'; 

// Tipar explicitamente safetySettings
const safetySettings: SafetySetting[] = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Definir validModes manualmente pois PromptMode é um type alias
const validModes: PromptMode[] = [
  "app_creation", "image_generation", "content_creation", 
  "problem_solving", "coding", "instruct", "explain"
];
const validTones = Object.values(Tone);
const validComplexities = Object.values(Complexity);

interface ParsedParams {
  keywords?: string;
  mode?: PromptMode;
  tone?: Tone;
  complexity?: Complexity;
  imageStyle?: string; // Pode ser um ou mais estilos, simplificado para string por agora
}

/**
 * Rota POST para interpretar uma instrução de usuário e extrair parâmetros.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const instruction = body.instruction as string;
    const language = (body.language as Language) || 'portuguese';

    if (!instruction || instruction.trim().length < 5) { // Instrução mínima
      return NextResponse.json({ error: "Instrução inválida ou muito curta" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
        model: PARSING_MODEL_ID, 
        safetySettings 
    });

    const languageInstruction = language === 'english' ? 'English' : 'Portuguese';

    // Prompt para a IA fazer o parsing
    const systemPrompt = `You are an AI assistant specialized in parsing user instructions for an AI prompt generator. Analyze the user's instruction and extract the core parameters. Respond ONLY with a valid JSON object containing the extracted parameters: 'keywords' (string, the main topic), 'mode' (string, one of ${JSON.stringify(validModes)}), 'tone' (string, optional, one of ${JSON.stringify(validTones)}), 'complexity' (string, optional, one of ${JSON.stringify(validComplexities)}), and 'imageStyle' (string, optional, relevant visual styles for image generation mode only). If a parameter cannot be determined, omit it from the JSON. Ensure the extracted values for mode, tone, and complexity exactly match one of the provided valid options. The keywords should capture the essence of the request. The response language for keywords/imageStyle should match the user's language (${languageInstruction}).`;
    
    const userPrompt = `Parse the following instruction:
"${instruction.trim()}"`;

    console.log(`Parsing instruction: "${instruction}" in ${language}`);
    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = await result.response;
    const responseText = response.text().trim();

    console.log("Raw parsing response:", responseText);

    // Tentar parsear o JSON
    let parsedParams: ParsedParams = {};
    try {
      // Remover ```json e ``` do início/fim se a IA adicionar
      const cleanedJson = responseText.replace(/^```json\s*|\s*```$/g, '');
      parsedParams = JSON.parse(cleanedJson);

      // Validar os valores dos enums/tipos extraídos
      if (parsedParams.mode && !validModes.includes(parsedParams.mode)) {
        console.warn(`Invalid mode parsed: ${parsedParams.mode}. Falling back.`);
        parsedParams.mode = undefined; 
      }
      if (parsedParams.tone && !validTones.includes(parsedParams.tone)) {
        console.warn(`Invalid tone parsed: ${parsedParams.tone}. Falling back.`);
        parsedParams.tone = undefined;
      }
       if (parsedParams.complexity && !validComplexities.includes(parsedParams.complexity)) {
        console.warn(`Invalid complexity parsed: ${parsedParams.complexity}. Falling back.`);
        parsedParams.complexity = undefined;
      }
      // Limpar keywords se forem muito genéricas
      if (parsedParams.keywords && parsedParams.keywords.toLowerCase() === instruction.toLowerCase()) {
          parsedParams.keywords = undefined; // Evitar retornar a instrução inteira como keyword
      }

    } catch (jsonError: any) {
      console.error("Failed to parse JSON response from LLM:", jsonError.message);
      // Se o JSON falhar, talvez tentar extrair apenas keywords como fallback?
      // Por agora, retornamos erro se o JSON falhar.
      throw new Error("A IA não retornou um formato JSON válido para os parâmetros.");
    }

    console.log("Parsed parameters:", parsedParams);
    return NextResponse.json(parsedParams);

  } catch (error: any) {
    console.error("Erro na API /api/parse-instruction:", error);
    return NextResponse.json(
      { error: `Erro ao interpretar instrução: ${error.message}` },
      { status: 500 }
    );
  }
} 