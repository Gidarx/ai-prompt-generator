import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { PromptParams } from '@/lib/types';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

interface AnalysisRequest {
  params: PromptParams;
  generatedPrompt?: string;
}

interface AnalysisResponse {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  improvements: string[];
  effectiveness: number;
  clarity: number;
  specificity: number;
}

export async function POST(req: Request) {
  try {
    const { params, generatedPrompt }: AnalysisRequest = await req.json();

    if (!params.keywords) {
      return NextResponse.json(
        { error: "Parâmetros insuficientes para análise" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-thinking-exp-01-21",
      generationConfig: {
        temperature: 0.3,
        topK: 1,
        topP: 1,
        maxOutputTokens: 1000,
      }
    });

    const analysisPrompt = `
Você é um especialista em engenharia de prompts para IA. Analise os seguintes parâmetros de prompt e forneça uma análise detalhada:

PARÂMETROS DO PROMPT:
- Palavras-chave: "${params.keywords}"
- Contexto: "${params.context || 'Não fornecido'}"
- Modo: ${params.mode}
- Tom: ${params.tone}
- Complexidade: ${params.complexity}
- Tamanho: ${params.length}
- Incluir exemplos: ${params.includeExamples ? 'Sim' : 'Não'}
${params.imageStyle ? `- Estilo de imagem: ${params.imageStyle}` : ''}
${params.negativePrompt ? `- Prompt negativo: ${params.negativePrompt}` : ''}

${generatedPrompt ? `PROMPT GERADO:\n"${generatedPrompt}"` : ''}

Forneça uma análise estruturada no seguinte formato JSON:
{
  "score": [número de 0-100],
  "strengths": ["ponto forte 1", "ponto forte 2", ...],
  "weaknesses": ["fraqueza 1", "fraqueza 2", ...],
  "suggestions": ["sugestão 1", "sugestão 2", ...],
  "improvements": ["melhoria 1", "melhoria 2", ...],
  "effectiveness": [número de 0-100],
  "clarity": [número de 0-100],
  "specificity": [número de 0-100]
}

Critérios de avaliação:
- Clareza: Quão claro e compreensível é o prompt
- Especificidade: Nível de detalhamento e precisão
- Eficácia: Probabilidade de gerar bons resultados
- Estrutura: Organização e coerência dos elementos
- Completude: Se todos os elementos necessários estão presentes

Seja específico e prático nas sugestões. Foque em melhorias acionáveis.
`;

    const result = await model.generateContent(analysisPrompt);
    const response = result.response;
    let analysisText = response.text();

    // Extrair JSON da resposta
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Formato de resposta inválido da IA");
    }

    const analysis: AnalysisResponse = JSON.parse(jsonMatch[0]);

    // Validar e sanitizar a resposta
    const sanitizedAnalysis = {
      score: Math.max(0, Math.min(100, analysis.score || 50)),
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths.slice(0, 5) : [],
      weaknesses: Array.isArray(analysis.weaknesses) ? analysis.weaknesses.slice(0, 5) : [],
      suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions.slice(0, 5) : [],
      improvements: Array.isArray(analysis.improvements) ? analysis.improvements.slice(0, 5) : [],
      effectiveness: Math.max(0, Math.min(100, analysis.effectiveness || 50)),
      clarity: Math.max(0, Math.min(100, analysis.clarity || 50)),
      specificity: Math.max(0, Math.min(100, analysis.specificity || 50))
    };

    return NextResponse.json(sanitizedAnalysis);

  } catch (error: any) {
    console.error("Erro na análise de prompt:", error);
    
    // Fallback para análise básica
    const fallbackAnalysis = {
      score: 60,
      strengths: ["Parâmetros básicos definidos"],
      weaknesses: ["Análise detalhada indisponível"],
      suggestions: ["Tente novamente em alguns instantes"],
      improvements: ["Adicione mais contexto específico"],
      effectiveness: 60,
      clarity: 60,
      specificity: 60
    };

    return NextResponse.json(fallbackAnalysis);
  }
}