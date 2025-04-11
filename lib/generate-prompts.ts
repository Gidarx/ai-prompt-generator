import type { Platform, Tone, Length, PromptParams } from "@/lib/types"

export function generatePrompts({
  keywords,
  context = "",
  platforms,
  tone,
  length,
  complexity,
  includeExamples,
}: PromptParams): Record<Platform, string> {
  // Initialize result object
  const result: Record<Platform, string> = {
    cursor: "",
    lovable: "",
    bolt: "",
  }

  // Only generate prompts for selected platforms
  platforms.forEach((platform) => {
    result[platform] = createPromptForPlatform(platform, keywords, context, tone, length, complexity, includeExamples)
  })

  return result
}

function createPromptForPlatform(
  platform: Platform,
  keywords: string,
  context: string,
  tone: Tone,
  length: Length,
  complexity: number,
  includeExamples: boolean,
): string {
  // Platform-specific templates and features
  const platformFeatures = {
    cursor: {
      strengths: "geração de código, explicações técnicas e depuração",
      format: "detalhado e estruturado",
      specialInstructions: "Inclua exemplos de código e explicações.",
    },
    lovable: {
      strengths: "conteúdo criativo, narrativas e respostas conversacionais",
      format: "envolvente e personalizado",
      specialInstructions: "Foque na conexão emocional e engajamento do usuário.",
    },
    bolt: {
      strengths: "respostas rápidas, resumos concisos e insights acionáveis",
      format: "direto e eficiente",
      specialInstructions: "Priorize clareza e informações acionáveis.",
    },
  }

  // Length modifiers
  const lengthModifiers = {
    short: {
      descriptor: "conciso",
      paragraphs: 1,
      wordCount: "50-100 palavras",
    },
    medium: {
      descriptor: "equilibrado",
      paragraphs: 2,
      wordCount: "150-250 palavras",
    },
    long: {
      descriptor: "abrangente",
      paragraphs: 3,
      wordCount: "300-500 palavras",
    },
  }

  // Tone modifiers
  const toneDescriptors = {
    professional: "formal, autoritativo e preciso",
    casual: "conversacional, amigável e acessível",
    creative: "imaginativo, expressivo e original",
    technical: "detalhado, analítico e especializado",
  }

  // Complexity adjustments
  const complexityLevel = complexity < 0.33 ? "simples" : complexity < 0.66 ? "moderada" : "avançada"

  // Build the prompt
  let prompt = `Preciso de uma resposta ${lengthModifiers[length].descriptor} ${toneDescriptors[tone]} sobre ${keywords}.`

  // Add context if provided
  if (context) {
    prompt += `\n\nContexto adicional: ${context}`
  }

  // Add platform-specific instructions
  prompt += `\n\nOtimize isso para ${platform}, que se destaca em ${platformFeatures[platform].strengths}. A resposta deve ser ${platformFeatures[platform].format}.`

  // Add complexity guidance
  prompt += `\n\nUse linguagem e conceitos de complexidade ${complexityLevel}.`

  // Add length guidance
  prompt += `\n\nA resposta deve ter aproximadamente ${lengthModifiers[length].wordCount} em ${lengthModifiers[length].paragraphs} parágrafo(s).`

  // Add special instructions for the platform
  prompt += `\n\n${platformFeatures[platform].specialInstructions}`

  // Add examples request if enabled
  if (includeExamples) {
    prompt += `\n\nInclua exemplos práticos para ilustrar os pontos principais.`
  }

  return prompt
}
