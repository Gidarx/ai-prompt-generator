import type { TrendingTopic } from "@/lib/types"

// Simulação de tópicos em tendência
export const TRENDING_TOPICS: TrendingTopic[] = [
  {
    id: "t1",
    title: "Desenvolvimento com IA Generativa",
    description: "Prompts para auxiliar no desenvolvimento de software usando IA generativa como copiloto",
    keywords: ["desenvolvimento", "programação", "IA generativa", "assistente de código"],
    popularity: 95,
    category: "tecnologia",
    isNew: true,
  },
  {
    id: "t2",
    title: "Análise de Dados com IA",
    description: "Prompts para análise e visualização de dados complexos usando modelos de linguagem",
    keywords: ["análise de dados", "visualização", "estatísticas", "insights"],
    popularity: 88,
    category: "dados",
  },
  {
    id: "t3",
    title: "Criação de Conteúdo SEO",
    description: "Prompts otimizados para gerar conteúdo web com boas práticas de SEO",
    keywords: ["SEO", "marketing digital", "conteúdo web", "otimização"],
    popularity: 92,
    category: "marketing",
  },
  {
    id: "t4",
    title: "Resumos Acadêmicos",
    description: "Prompts para criar resumos concisos de artigos científicos e trabalhos acadêmicos",
    keywords: ["acadêmico", "resumo", "artigos científicos", "pesquisa"],
    popularity: 78,
    category: "educação",
  },
  {
    id: "t5",
    title: "Escrita Criativa Estruturada",
    description: "Prompts para histórias e narrativas com estruturas específicas como Hero's Journey",
    keywords: ["escrita criativa", "narrativa", "estrutura", "storytelling"],
    popularity: 85,
    category: "criativo",
    isNew: true,
  },
  {
    id: "t6",
    title: "Prompts Multi-etapas",
    description: "Técnicas para criar prompts em múltiplas etapas para resultados mais precisos",
    keywords: ["multi-etapas", "chain-of-thought", "raciocínio", "precisão"],
    popularity: 90,
    category: "técnicas",
    isNew: true,
  },
  {
    id: "t7",
    title: "Análise de Sentimento",
    description: "Prompts para analisar o sentimento e tom emocional de textos",
    keywords: ["sentimento", "emoção", "análise", "feedback"],
    popularity: 75,
    category: "análise",
  },
  {
    id: "t8",
    title: "Documentação Técnica",
    description: "Prompts para gerar documentação técnica clara e abrangente",
    keywords: ["documentação", "técnico", "manuais", "guias"],
    popularity: 82,
    category: "tecnologia",
  },
]

// Função para obter tópicos em tendência, opcionalmente filtrados por categoria
export function getTrendingTopics(category?: string): TrendingTopic[] {
  if (category) {
    return TRENDING_TOPICS.filter((topic) => topic.category === category)
  }
  return TRENDING_TOPICS
}

// Função para obter tópicos novos
export function getNewTrendingTopics(): TrendingTopic[] {
  return TRENDING_TOPICS.filter((topic) => topic.isNew)
}

// Função para obter tópicos mais populares
export function getTopTrendingTopics(limit = 5): TrendingTopic[] {
  return [...TRENDING_TOPICS].sort((a, b) => b.popularity - a.popularity).slice(0, limit)
}

// Função para buscar tópicos por palavra-chave
export function searchTrendingTopics(query: string): TrendingTopic[] {
  const lowercaseQuery = query.toLowerCase()
  return TRENDING_TOPICS.filter(
    (topic) =>
      topic.title.toLowerCase().includes(lowercaseQuery) ||
      topic.description.toLowerCase().includes(lowercaseQuery) ||
      topic.keywords.some((keyword) => keyword.toLowerCase().includes(lowercaseQuery)),
  )
}
