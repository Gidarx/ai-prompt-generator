import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SafetySetting, GenerateContentRequest } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// É mais provável que precisemos de um modelo Pro para geração de imagem.
// O ID "gemini-2.0-flash-exp-image-generation" pode não ser válido.
// Usaremos um modelo Pro e instruiremos claramente para gerar uma imagem.
// --- CORREÇÃO: Usar o modelo experimental específico para imagem --- 
const IMAGE_MODEL_ID = 'gemini-2.0-flash-exp-image-generation'; 
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

const safetySettings: SafetySetting[] = [
  // Manter configurações de segurança restritivas
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE }, // Mais restritivo aqui
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// --- REINTRODUZIR: Configuração de Geração --- 
const generationConfig = {
  temperature: 0.9, // Ajuste conforme necessário
  topK: 1,
  topP: 1,
  maxOutputTokens: 8192, // Ajuste se necessário
  responseModalities: ["TEXT", "IMAGE"],
};

interface ImageRequestBody {
  prompt: string;
  negativePrompt?: string;
  style?: string; // Novo: Estilo visual desejado
  numberOfImages?: number; // Novo: Quantidade de imagens
  aspectRatio?: string; // Novo: Proporção (ex: "1:1", "16:9")
}

/**
 * Rota POST para gerar uma imagem usando IA.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ImageRequestBody;
    const {
      prompt,
      negativePrompt,
      style,
      numberOfImages = 1, // Valor padrão 1
      aspectRatio // Ainda não usado diretamente na chamada, mas disponível
    } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: "O prompt de imagem é obrigatório" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
        model: IMAGE_MODEL_ID, 
        safetySettings,
        generationConfig: generationConfig
    });

    // --- Construir o prompt para o modelo de imagem ---
    // Instrução clara + Prompt do usuário + Estilo + Prompt negativo
    let fullPrompt = `Generate a high-quality image based on the following description: "${prompt.trim()}"`;

    // Adicionar estilo ao prompt se fornecido
    if (style && style.trim().length > 0) {
      fullPrompt += `\nVisual Style: ${style.trim()}`;
    }

    if (negativePrompt && negativePrompt.trim().length > 0) {
      fullPrompt += `\nNegative prompt (elements to avoid): "${negativePrompt.trim()}"`;
    }
    // Adicionar sugestões de qualidade pode ajudar
    fullPrompt += `\nStyle hints: photorealistic, detailed, high resolution.`; 
    
    console.log(`Requesting image generation with prompt: "${fullPrompt}", numberOfImages: ${numberOfImages}, aspectRatio: ${aspectRatio || 'default'}`);

    // --- Prepara a chamada para a API (SEM candidateCount) --- 
    const requestPayload: GenerateContentRequest = {
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      safetySettings,
      generationConfig: {
        ...generationConfig, // Inclui configs gerais definidas acima
        // --- REMOVIDO: candidateCount não suportado por este modelo --- 
        // candidateCount: numberOfImages,
      },
    };

    // --- Chamadas Sequenciais à API --- 
    const generatedImageUrls: string[] = [];
    console.log(`Attempting to generate ${numberOfImages} image(s) sequentially...`);

    for (let i = 0; i < numberOfImages; i++) {
        console.log(`Generating image ${i + 1} of ${numberOfImages}...`);
        try {
            // Executa a chamada para cada imagem
            const result = await model.generateContent(requestPayload);
            const response = await result.response;
            const candidates = response.candidates;

            // Processa o *primeiro* candidato desta chamada individual
            if (candidates && candidates.length > 0 && candidates[0].content?.parts?.[0]) {
                const part = candidates[0].content.parts[0];

                if ('inlineData' in part && part.inlineData) {
                    const imageData = part.inlineData;
                    const base64Data = imageData.data;
                    const mimeType = imageData.mimeType;

                    if (!mimeType.startsWith("image/")) {
                        console.warn(`Image ${i+1} skipped: Unexpected MimeType ${mimeType}`);
                        continue; // Pula para a próxima iteração do loop
                    }

                    const imageUrl = `data:${mimeType};base64,${base64Data}`;
                    generatedImageUrls.push(imageUrl);
                    console.log(`Image ${i + 1} generated successfully.`);

                } else if ('text' in part) {
                    console.warn(`Image ${i+1} skipped: API returned text instead of image data: ${part.text}`);
                } else {
                    console.warn(`Image ${i+1} skipped: Part has no 'inlineData' or 'text'.`);
                }
            } else {
                 // Tenta extrair feedback se não houver candidato válido
                const blockReason = response.promptFeedback?.blockReason;
                let feedbackMsg = `Image ${i+1} skipped: No valid candidate found.`;
                if(blockReason) feedbackMsg += ` Reason: ${blockReason}.`;
                console.warn(feedbackMsg, "Response structure:", JSON.stringify(response, null, 2));
            }
        } catch (loopError: any) {
            console.error(`Error generating image ${i + 1}:`, loopError);
            // Decide se quer parar o loop em caso de erro ou apenas registrar e continuar
            // Por enquanto, vamos continuar para tentar gerar as outras imagens.
        }
    }

    // --- Verificar se alguma imagem foi gerada --- 
    if (generatedImageUrls.length === 0) {
        // Adapta a mensagem de erro para o contexto de chamadas sequenciais
      let finalErrorMessage = "Nenhuma imagem pôde ser gerada após tentar ${numberOfImages} vez(es).";
       // Se houve algum erro específico na última tentativa (ou algum erro geral), pode adicionar aqui
      // (A lógica de extrair blockReason/safetyRatings precisaria ser adaptada se quiséssemos detalhes do último erro)
      console.error("Failed to generate any images sequentially.");
      throw new Error(finalErrorMessage);
    }

    // --- Retornar o array com TODAS as URLs geradas --- 
    console.log(`Successfully generated ${generatedImageUrls.length} image(s) out of ${numberOfImages} requested.`);
    return NextResponse.json({ imageUrls: generatedImageUrls });

  } catch (error: any) {
    console.error("Erro GERAL na API /api/generate-image:", error);
    // Retorna a mensagem de erro capturada (pode ser a do loop ou a geral)
    let errorMessage = error.message || "Erro desconhecido ao gerar imagem";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}