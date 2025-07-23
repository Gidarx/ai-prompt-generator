import { PromptParams, Tone, Complexity, PromptMode } from './types'

export interface PromptQualityScore {
  overall: number // 0-100
  clarity: number
  specificity: number
  structure: number
  completeness: number
  effectiveness: number
}

export interface PromptAnalysis {
  score: PromptQualityScore
  issues: PromptIssue[]
  suggestions: PromptSuggestion[]
  strengths: string[]
  improvements: string[]
  readabilityLevel: 'beginner' | 'intermediate' | 'advanced'
  estimatedTokens: number
}

export interface PromptIssue {
  type: 'critical' | 'warning' | 'info'
  category: 'clarity' | 'specificity' | 'structure' | 'completeness' | 'tone' | 'length'
  message: string
  suggestion: string
  impact: 'high' | 'medium' | 'low'
  field?: string
}

export interface PromptSuggestion {
  type: 'enhancement' | 'optimization' | 'alternative'
  category: string
  title: string
  description: string
  example?: string
  priority: 'high' | 'medium' | 'low'
}

export class PromptAnalyzer {
  private static readonly KEYWORD_MIN_LENGTH = 10
  private static readonly KEYWORD_OPTIMAL_LENGTH = 50
  private static readonly CONTEXT_MIN_LENGTH = 20
  private static readonly CONTEXT_OPTIMAL_LENGTH = 100

  static analyzePrompt(params: PromptParams): PromptAnalysis {
    const score = this.calculateQualityScore(params)
    const issues = this.detectIssues(params)
    const suggestions = this.generateSuggestions(params, issues)
    const strengths = this.identifyStrengths(params)
    const improvements = this.suggestImprovements(params, issues)
    const readabilityLevel = this.assessReadabilityLevel(params)
    const estimatedTokens = this.estimateTokenCount(params)

    return {
      score,
      issues,
      suggestions,
      strengths,
      improvements,
      readabilityLevel,
      estimatedTokens
    }
  }

  private static calculateQualityScore(params: PromptParams): PromptQualityScore {
    const clarity = this.scoreClarityMetric(params)
    const specificity = this.scoreSpecificityMetric(params)
    const structure = this.scoreStructureMetric(params)
    const completeness = this.scoreCompletenessMetric(params)
    const effectiveness = this.scoreEffectivenessMetric(params)

    const overall = Math.round((clarity + specificity + structure + completeness + effectiveness) / 5)

    return {
      overall,
      clarity,
      specificity,
      structure,
      completeness,
      effectiveness
    }
  }

  private static scoreClarityMetric(params: PromptParams): number {
    let score = 50 // Base score

    // Keywords clarity
    if (params.keywords) {
      const keywordLength = params.keywords.length
      if (keywordLength >= this.KEYWORD_OPTIMAL_LENGTH) score += 20
      else if (keywordLength >= this.KEYWORD_MIN_LENGTH) score += 10
      
      // Check for vague words
      const vagueWords = ['coisa', 'algo', 'qualquer', 'talvez', 'tipo', 'meio']
      const hasVagueWords = vagueWords.some(word => 
        params.keywords.toLowerCase().includes(word)
      )
      if (hasVagueWords) score -= 15

      // Check for specific terms
      const specificTerms = ['específico', 'detalhado', 'preciso', 'exato']
      const hasSpecificTerms = specificTerms.some(term => 
        params.keywords.toLowerCase().includes(term)
      )
      if (hasSpecificTerms) score += 10
    }

    // Context clarity
    if (params.context && params.context.length > this.CONTEXT_MIN_LENGTH) {
      score += 15
    }

    return Math.min(100, Math.max(0, score))
  }

  private static scoreSpecificityMetric(params: PromptParams): number {
    let score = 40

    if (params.keywords) {
      // Count specific details
      const detailWords = ['como', 'quando', 'onde', 'por que', 'qual', 'quanto']
      const detailCount = detailWords.filter(word => 
        params.keywords.toLowerCase().includes(word)
      ).length
      score += detailCount * 8

      // Technical terms bonus
      const technicalTerms = ['api', 'framework', 'algoritmo', 'interface', 'database']
      const hasTechnicalTerms = technicalTerms.some(term => 
        params.keywords.toLowerCase().includes(term)
      )
      if (hasTechnicalTerms) score += 15
    }

    // Mode-specific bonuses
    if (params.mode === 'image_generation' && params.imageStyle) score += 20
    if (params.mode === 'image_generation' && params.negativePrompt) score += 10

    return Math.min(100, Math.max(0, score))
  }

  private static scoreStructureMetric(params: PromptParams): number {
    let score = 60

    // Tone appropriateness
    if (params.tone === Tone.PROFESSIONAL && params.mode === 'app_creation') score += 15
    if (params.tone === Tone.CREATIVE && params.mode === 'image_generation') score += 15
    if (params.tone === Tone.TECHNICAL && params.mode === 'app_creation') score += 10

    // Complexity alignment
    if (params.complexity === Complexity.DETAILED && params.length === 'long') score += 10
    if (params.complexity === Complexity.SIMPLE && params.length === 'short') score += 10

    // Examples inclusion
    if (params.includeExamples && params.length !== 'short') score += 10

    return Math.min(100, Math.max(0, score))
  }

  private static scoreCompletenessMetric(params: PromptParams): number {
    let score = 30

    if (params.keywords) score += 25
    if (params.context) score += 20
    if (params.tone) score += 10
    if (params.complexity) score += 10
    if (params.mode) score += 15

    // Mode-specific completeness
    if (params.mode === 'image_generation') {
      if (params.imageStyle) score += 10
      if (params.negativePrompt) score += 5
    }

    return Math.min(100, Math.max(0, score))
  }

  private static scoreEffectivenessMetric(params: PromptParams): number {
    let score = 50

    // Length vs complexity balance
    if (params.length === 'long' && params.complexity === Complexity.DETAILED) score += 20
    if (params.length === 'short' && params.complexity === Complexity.SIMPLE) score += 15

    // Context relevance
    if (params.context && params.keywords) {
      const contextWords = params.context.toLowerCase().split(' ')
      const keywordWords = params.keywords.toLowerCase().split(' ')
      const overlap = contextWords.filter(word => keywordWords.includes(word)).length
      if (overlap > 0) score += 15
    }

    return Math.min(100, Math.max(0, score))
  }

  private static detectIssues(params: PromptParams): PromptIssue[] {
    const issues: PromptIssue[] = []

    // Critical issues
    if (!params.keywords || params.keywords.length < 5) {
      issues.push({
        type: 'critical',
        category: 'completeness',
        message: 'Palavras-chave muito curtas ou ausentes',
        suggestion: 'Adicione pelo menos 10 caracteres descrevendo o que você quer',
        impact: 'high',
        field: 'keywords'
      })
    }

    // Warning issues
    if (params.keywords && params.keywords.length < this.KEYWORD_MIN_LENGTH) {
      issues.push({
        type: 'warning',
        category: 'specificity',
        message: 'Palavras-chave pouco específicas',
        suggestion: 'Seja mais específico sobre o que você deseja obter',
        impact: 'medium',
        field: 'keywords'
      })
    }

    if (!params.context || params.context.length < this.CONTEXT_MIN_LENGTH) {
      issues.push({
        type: 'warning',
        category: 'clarity',
        message: 'Contexto insuficiente',
        suggestion: 'Adicione mais contexto sobre o uso pretendido',
        impact: 'medium',
        field: 'context'
      })
    }

    // Tone mismatches
    if (params.tone === Tone.CASUAL && params.mode === 'app_creation') {
      issues.push({
        type: 'info',
        category: 'tone',
        message: 'Tom casual pode não ser ideal para criação de apps',
        suggestion: 'Considere usar tom "Profissional" ou "Técnico"',
        impact: 'low'
      })
    }

    // Length vs complexity mismatches
    if (params.length === 'short' && params.complexity === Complexity.DETAILED) {
      issues.push({
        type: 'warning',
        category: 'structure',
        message: 'Conflito entre tamanho curto e complexidade detalhada',
        suggestion: 'Aumente o tamanho para "Médio" ou reduza a complexidade',
        impact: 'medium'
      })
    }

    return issues
  }

  private static generateSuggestions(params: PromptParams, issues: PromptIssue[]): PromptSuggestion[] {
    const suggestions: PromptSuggestion[] = []

    // Enhancement suggestions
    if (params.mode === 'image_generation' && !params.negativePrompt) {
      suggestions.push({
        type: 'enhancement',
        category: 'image_generation',
        title: 'Adicionar Prompt Negativo',
        description: 'Especifique elementos que você NÃO quer na imagem',
        example: 'blurry, low quality, distorted, ugly',
        priority: 'medium'
      })
    }

    if (params.keywords && !params.context) {
      suggestions.push({
        type: 'enhancement',
        category: 'context',
        title: 'Adicionar Contexto',
        description: 'Forneça mais informações sobre o uso pretendido',
        example: 'Para um público jovem, estilo moderno, uso comercial',
        priority: 'high'
      })
    }

    // Optimization suggestions
    if (params.includeExamples && params.length === 'short') {
      suggestions.push({
        type: 'optimization',
        category: 'structure',
        title: 'Otimizar Tamanho',
        description: 'Em prompts curtos, exemplos podem ocupar muito espaço',
        priority: 'low'
      })
    }

    return suggestions
  }

  private static identifyStrengths(params: PromptParams): string[] {
    const strengths: string[] = []

    if (params.keywords && params.keywords.length >= this.KEYWORD_OPTIMAL_LENGTH) {
      strengths.push('Palavras-chave bem detalhadas')
    }

    if (params.context && params.context.length >= this.CONTEXT_OPTIMAL_LENGTH) {
      strengths.push('Contexto rico e informativo')
    }

    if (params.mode === 'image_generation' && params.imageStyle) {
      strengths.push('Estilo visual bem definido')
    }

    if (params.includeExamples) {
      strengths.push('Inclusão de exemplos para melhor orientação')
    }

    return strengths
  }

  private static suggestImprovements(params: PromptParams, issues: PromptIssue[]): string[] {
    const improvements: string[] = []

    const criticalIssues = issues.filter(i => i.type === 'critical')
    const warningIssues = issues.filter(i => i.type === 'warning')

    if (criticalIssues.length > 0) {
      improvements.push('Resolver problemas críticos primeiro')
    }

    if (warningIssues.length > 0) {
      improvements.push('Abordar avisos para melhor qualidade')
    }

    if (!params.context) {
      improvements.push('Adicionar contexto detalhado')
    }

    if (params.mode === 'image_generation' && !params.negativePrompt) {
      improvements.push('Considerar prompt negativo para imagens')
    }

    return improvements
  }

  private static assessReadabilityLevel(params: PromptParams): 'beginner' | 'intermediate' | 'advanced' {
    let complexity = 0

    if (params.keywords && params.keywords.length > 50) complexity += 1
    if (params.context && params.context.length > 100) complexity += 1
    if (params.complexity === Complexity.DETAILED) complexity += 1
    if (params.mode === 'image_generation' && params.negativePrompt) complexity += 1

    if (complexity >= 3) return 'advanced'
    if (complexity >= 1) return 'intermediate'
    return 'beginner'
  }

  private static estimateTokenCount(params: PromptParams): number {
    let tokenCount = 0

    if (params.keywords) tokenCount += Math.ceil(params.keywords.length / 4)
    if (params.context) tokenCount += Math.ceil(params.context.length / 4)
    
    // Base prompt structure tokens
    tokenCount += 50

    // Complexity multiplier
    switch (params.complexity) {
      case Complexity.SIMPLE: tokenCount *= 1.2; break
      case Complexity.MODERATE: tokenCount *= 1.5; break
      case Complexity.DETAILED: tokenCount *= 2.0; break
    }

    return Math.round(tokenCount)
  }
}