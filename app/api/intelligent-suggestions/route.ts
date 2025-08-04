import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { PromptParams } from '@/lib/types';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

interface SuggestionRequest {
  params: PromptParams;
  type?: 'all' | 'keywords' | 'context' | 'optimization';
}

interface SmartSuggestion {
  type: 'keyword' | 'context' | 'tone' | 'structure' | 'enhancement';
  title: string;
  description: string;
  value: string;
  field: string;
  confidence: number;
  reasoning: string;
  example?: string;
}

export async function POST(req: Request) {
  let params: PromptParams | undefined;

  try {
    const requestData: SuggestionRequest = await req.json();
    params = requestData.params;
    const type = requestData.type || 'all';

    if (!params.keywords && !params.context) {
      return NextResponse.json(
        { error: "Parâmetros insuficientes para gerar sugestões" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-thinking-exp-01-21",
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 1500,
      }
    });

    const suggestionPrompt = `
Você é um especialista em engenharia de prompts para IA. Analise os seguintes parâmetros e gere sugestões inteligentes para melhorar o prompt:

PARÂMETROS ATUAIS:
- Palavras-chave: "${params.keywords || 'Não fornecido'}"
- Contexto: "${params.context || 'Não fornecido'}"
- Modo: ${params.mode}
- Tom: ${params.tone}
- Complexidade: ${params.complexity}
- Tamanho: ${params.length}
- Incluir exemplos: ${params.includeExamples ? 'Sim' : 'Não'}
${params.imageStyle ? `- Estilo de imagem: ${params.imageStyle}` : ''}
${params.negativePrompt ? `- Prompt negativo: ${params.negativePrompt}` : ''}

Gere sugestões práticas e específicas no seguinte formato JSON:
{
  "suggestions": [
    {
      "type": "keyword|context|tone|structure|enhancement",
      "title": "Título da sugestão",
      "description": "Descrição clara do que fazer",
      "value": "Valor específico a ser aplicado",
      "field": "campo do formulário",
      "confidence": [número de 0-100],
      "reasoning": "Por que esta sugestão é importante",
      "example": "Exemplo opcional"
    }
  ]
}

TIPOS DE SUGESTÕES:
1. **keyword**: Melhorias nas palavras-chave
2. **context**: Adição ou melhoria do contexto
3. **tone**: Ajustes no tom baseado no modo
4. **structure**: Melhorias na estrutura geral
5. **enhancement**: Funcionalidades adicionais

FOQUE EM:
- Sugestões específicas e acionáveis
- Melhorias baseadas no modo selecionado (${params.mode})
- Otimizações para o tom escolhido (${params.tone})
- Tendências atuais relevantes
- Problemas comuns identificados

Máximo de 5 sugestões, priorizadas por impacto.
`;

    const result = await model.generateContent(suggestionPrompt);
    const response = result.response;
    let suggestionText = response.text();

    // Extrair JSON da resposta
    const jsonMatch = suggestionText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Formato de resposta inválido da IA");
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const suggestions: SmartSuggestion[] = parsed.suggestions || [];

    // Validar e sanitizar sugestões
    const sanitizedSuggestions = suggestions
      .filter(s => s.title && s.description && s.value && s.field)
      .map((s, index) => ({
        ...s,
        id: `ai-suggestion-${index}`,
        confidence: Math.max(0, Math.min(100, s.confidence || 70)),
        type: ['keyword', 'context', 'tone', 'structure', 'enhancement'].includes(s.type)
          ? s.type
          : 'enhancement'
      }))
      .slice(0, 5); // Máximo 5 sugestões

    return NextResponse.json({ suggestions: sanitizedSuggestions });

  } catch (error: any) {
    console.error("Erro ao gerar sugestões:", error);

    // Fallback com sugestões básicas - usar parâmetros padrão se params não estiver definido
    const fallbackParams = params || {
      keywords: '',
      mode: 'website_creation' as any,
      tone: 'professional' as any,
      complexity: 'moderate' as any
    } as PromptParams;

    const fallbackSuggestions = generateFallbackSuggestions(fallbackParams);

    return NextResponse.json({ suggestions: fallbackSuggestions });
  }
}

function generateFallbackSuggestions(params: PromptParams): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];

  // Sugestão de palavras-chave se muito curta
  if (!params.keywords || params.keywords.length < 20) {
    suggestions.push({
      type: 'keyword',
      title: 'Expandir Palavras-chave',
      description: 'Adicione mais detalhes específicos para melhorar os resultados',
      value: params.keywords ? `${params.keywords}, detalhado, específico, alta qualidade` : 'Adicione palavras-chave específicas',
      field: 'keywords',
      confidence: 85,
      reasoning: 'Palavras-chave mais específicas geram resultados mais precisos'
    });
  }

  // Sugestão de contexto se ausente
  if (!params.context || params.context.length < 30) {
    suggestions.push({
      type: 'context',
      title: 'Adicionar Contexto',
      description: 'Forneça mais informações sobre o uso pretendido',
      value: `Para uso ${params.mode === 'app_creation' ? 'em aplicativo moderno' :
        params.mode === 'image_generation' ? 'comercial em redes sociais' :
          'profissional'}, com foco em qualidade e impacto visual.`,
      field: 'context',
      confidence: 90,
      reasoning: 'Contexto detalhado melhora significativamente a qualidade'
    });
  }

  // Sugestão específica para imagens
  if (params.mode === 'image_generation' && !params.negativePrompt) {
    suggestions.push({
      type: 'enhancement',
      title: 'Adicionar Prompt Negativo',
      description: 'Especifique elementos indesejados na imagem',
      value: 'blurry, low quality, distorted, ugly, bad anatomy, watermark',
      field: 'negativePrompt',
      confidence: 80,
      reasoning: 'Prompts negativos melhoram significativamente a qualidade das imagens'
    });
  }

  return suggestions;
}