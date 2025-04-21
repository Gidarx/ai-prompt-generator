import type { BrainstormIdea, Platform } from "@/lib/types" // Remove Tone from type import
import { Tone } from "@/lib/types" // Add regular import for Tone

// Função para gerar ideias de brainstorming com base em um tema
export function generateBrainstormIdeas(theme: string, count = 5): BrainstormIdea[] {
  // Em um sistema real, isso seria uma chamada de API para um modelo de IA
  // Aqui estamos simulando com algumas ideias pré-definidas baseadas em temas comuns

  const ideas: BrainstormIdea[] = []

  // Temas relacionados a tecnologia
  if (
    theme.toLowerCase().includes("tecnologia") ||
    theme.toLowerCase().includes("tech") ||
    theme.toLowerCase().includes("programação")
  ) {
    ideas.push({
      id: `idea-${Date.now()}-1`,
      title: "Explicação de Conceitos Técnicos",
      description: "Crie prompts que expliquem conceitos técnicos complexos de forma simples e acessível",
      keywords: `${theme} explicação conceitos simplificada didática`,
      platforms: ["cursor", "bolt"],
      tone: Tone.TECHNICAL, // Usar enum
      confidence: 92,
    })

    ideas.push({
      id: `idea-${Date.now()}-2`,
      title: "Resolução de Problemas de Código",
      description: "Prompts para ajudar a identificar e corrigir erros em código ou otimizar algoritmos",
      keywords: `${theme} debugging otimização código solução problemas`,
      platforms: ["cursor"],
      tone: Tone.TECHNICAL, // Usar enum
      confidence: 95,
    })

    ideas.push({
      id: `idea-${Date.now()}-3`,
      title: "Tutoriais Passo a Passo",
      description: "Crie prompts para gerar tutoriais detalhados sobre tecnologias específicas",
      keywords: `${theme} tutorial passo-a-passo aprendizado guia`,
      platforms: ["cursor", "lovable"],
      tone: Tone.PROFESSIONAL, // Usar enum
      confidence: 88,
    })
  }

  // Temas relacionados a criatividade
  if (
    theme.toLowerCase().includes("criativ") ||
    theme.toLowerCase().includes("art") ||
    theme.toLowerCase().includes("escrita")
  ) {
    ideas.push({
      id: `idea-${Date.now()}-4`,
      title: "Narrativas Imersivas",
      description: "Prompts para criar histórias envolventes com personagens bem desenvolvidos",
      keywords: `${theme} narrativa história personagens enredo`,
      platforms: ["lovable"],
      tone: Tone.CREATIVE, // Usar enum
      confidence: 90,
    })

    ideas.push({
      id: `idea-${Date.now()}-5`,
      title: "Descrições Visuais Detalhadas",
      description: "Crie prompts que gerem descrições ricas e detalhadas de cenas ou ambientes",
      keywords: `${theme} descrição visual detalhes ambiente cena`,
      platforms: ["lovable"],
      tone: Tone.CREATIVE, // Usar enum
      confidence: 87,
    })

    ideas.push({
      id: `idea-${Date.now()}-6`,
      title: "Diálogos Autênticos",
      description: "Prompts para gerar diálogos naturais e autênticos entre personagens",
      keywords: `${theme} diálogo conversa personagens interação`,
      platforms: ["lovable", "bolt"],
      tone: Tone.CASUAL, // Usar enum
      confidence: 85,
    })
  }

  // Temas relacionados a negócios
  if (
    theme.toLowerCase().includes("negóci") ||
    theme.toLowerCase().includes("market") ||
    theme.toLowerCase().includes("empresa")
  ) {
    ideas.push({
      id: `idea-${Date.now()}-7`,
      title: "Análise de Mercado",
      description: "Prompts para gerar análises detalhadas de tendências e oportunidades de mercado",
      keywords: `${theme} análise mercado tendências oportunidades`,
      platforms: ["cursor", "bolt"],
      tone: Tone.PROFESSIONAL, // Usar enum
      confidence: 91,
    })

    ideas.push({
      id: `idea-${Date.now()}-8`,
      title: "Comunicação Corporativa",
      description: "Crie prompts para emails, relatórios e apresentações profissionais",
      keywords: `${theme} comunicação corporativa email relatório apresentação`,
      platforms: ["bolt"],
      tone: Tone.PROFESSIONAL, // Usar enum
      confidence: 93,
    })

    ideas.push({
      id: `idea-${Date.now()}-9`,
      title: "Estratégias de Marketing",
      description: "Prompts para desenvolver estratégias de marketing e campanhas promocionais",
      keywords: `${theme} marketing estratégia campanha promoção`,
      platforms: ["lovable", "bolt"],
      tone: Tone.PROFESSIONAL, // Usar enum
      confidence: 89,
    })
  }

  // Adicionar algumas ideias genéricas se não tivermos o suficiente
  if (ideas.length < count) {
    ideas.push({
      id: `idea-${Date.now()}-10`,
      title: "Explicação Educacional",
      description: "Prompts para explicar conceitos complexos de forma educativa e acessível",
      keywords: `${theme} educação explicação conceitos aprendizado`,
      platforms: ["cursor", "lovable"],
      tone: Tone.PROFESSIONAL, // Usar enum
      confidence: 84,
    })

    ideas.push({
      id: `idea-${Date.now()}-11`,
      title: "Resumo Conciso",
      description: "Crie prompts que gerem resumos concisos e informativos sobre o tema",
      keywords: `${theme} resumo conciso informativo síntese`,
      platforms: ["bolt"],
      tone: Tone.PROFESSIONAL, // Usar enum
      confidence: 86,
    })

    ideas.push({
      id: `idea-${Date.now()}-12`,
      title: "Perguntas e Respostas",
      description: "Prompts para criar sequências de perguntas e respostas informativas",
      keywords: `${theme} perguntas respostas FAQ informação`,
      platforms: ["cursor", "bolt"],
      tone: Tone.CASUAL, // Usar enum
      confidence: 82,
    })
  }

  // Garantir que temos ideias suficientes, mesmo que repetindo algumas com variações
  while (ideas.length < count) {
    const baseIdea = ideas[Math.floor(Math.random() * ideas.length)]
    ideas.push({
      ...baseIdea,
      id: `idea-${Date.now()}-${ideas.length + 1}`,
      title: `${baseIdea.title} (Variação)`,
      confidence: Math.max(70, baseIdea.confidence - 10),
    })
  }

  // Retornar apenas o número solicitado de ideias, ordenadas por confiança
  return ideas.sort((a, b) => b.confidence - a.confidence).slice(0, count)
}

// Função para refinar uma ideia com base em feedback
export function refineIdea(
  idea: BrainstormIdea,
  refinements: {
    focusKeywords?: string[]
    addPlatforms?: Platform[]
    removePlatforms?: Platform[]
    changeTone?: Tone
  },
): BrainstormIdea {
  const refinedIdea = { ...idea }

  // Refinar palavras-chave
  if (refinements.focusKeywords && refinements.focusKeywords.length > 0) {
    const currentKeywords = idea.keywords.split(" ")
    const newKeywords = [...currentKeywords, ...refinements.focusKeywords]
    refinedIdea.keywords = [...new Set(newKeywords)].join(" ") // Remover duplicatas
  }

  // Adicionar plataformas
  if (refinements.addPlatforms && refinements.addPlatforms.length > 0) {
    const platforms = [...idea.platforms]
    refinements.addPlatforms.forEach((platform) => {
      if (!platforms.includes(platform)) {
        platforms.push(platform)
      }
    })
    refinedIdea.platforms = platforms
  }

  // Remover plataformas
  if (refinements.removePlatforms && refinements.removePlatforms.length > 0) {
    refinedIdea.platforms = idea.platforms.filter((platform) => !refinements.removePlatforms?.includes(platform))
  }

  // Mudar tom
  if (refinements.changeTone) {
    refinedIdea.tone = refinements.changeTone
  }

  // Ajustar confiança com base nas mudanças
  const changeCount = Object.keys(refinements).length
  refinedIdea.confidence = Math.min(98, idea.confidence + changeCount * 2)

  return refinedIdea
}
