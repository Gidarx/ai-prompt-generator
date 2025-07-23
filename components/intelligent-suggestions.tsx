"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Sparkles, 
  TrendingUp, 
  Lightbulb, 
  Zap,
  Target,
  Wand2,
  ArrowRight,
  Copy,
  Check,
  BarChart3
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PromptParams, PromptMode, Tone } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface IntelligentSuggestionsProps {
  params: PromptParams
  onApplySuggestion: (field: string, value: string) => void
  className?: string
}

interface SmartSuggestion {
  id: string
  type: 'keyword' | 'context' | 'tone' | 'structure' | 'enhancement'
  title: string
  description: string
  value: string
  field: string
  confidence: number
  reasoning: string
  example?: string
}

export function IntelligentSuggestions({ params, onApplySuggestion, className }: IntelligentSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    generateSuggestions()
  }, [params])

  const generateSuggestions = async () => {
    setIsGenerating(true)
    
    try {
      // Gerar sugestões locais primeiro
      const localSuggestions = generateSmartSuggestions(params)
      setSuggestions(localSuggestions)
      
      // Tentar sugestões avançadas com IA
      if (params.keywords && params.keywords.length > 5) {
        try {
          const response = await fetch('/api/intelligent-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params })
          })
          
          if (response.ok) {
            const { suggestions: aiSuggestions } = await response.json()
            // Combinar sugestões locais com IA, removendo duplicatas
            const combinedSuggestions = [
              ...aiSuggestions,
              ...localSuggestions.filter(local => 
                !aiSuggestions.some((ai: SmartSuggestion) => ai.field === local.field)
              )
            ].slice(0, 8) // Máximo 8 sugestões
            
            setSuggestions(combinedSuggestions)
          }
        } catch (aiError) {
          console.log('Sugestões IA indisponíveis, usando sugestões locais')
        }
      }
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateSmartSuggestions = (params: PromptParams): SmartSuggestion[] => {
    const suggestions: SmartSuggestion[] = []

    // Sugestões de palavras-chave
    if (params.keywords && params.keywords.length < 30) {
      suggestions.push({
        id: 'keyword-expand',
        type: 'keyword',
        title: 'Expandir Palavras-chave',
        description: 'Adicione mais detalhes específicos',
        value: generateKeywordExpansion(params.keywords, params.mode),
        field: 'keywords',
        confidence: 85,
        reasoning: 'Palavras-chave mais específicas geram resultados mais precisos',
        example: 'Adicionar estilo, contexto e objetivos específicos'
      })
    }

    // Sugestões de contexto
    if (!params.context || params.context.length < 50) {
      suggestions.push({
        id: 'context-add',
        type: 'context',
        title: 'Adicionar Contexto Rico',
        description: 'Forneça mais informações sobre o uso pretendido',
        value: generateContextSuggestion(params.mode, params.keywords),
        field: 'context',
        confidence: 90,
        reasoning: 'Contexto detalhado melhora significativamente a qualidade dos resultados'
      })
    }

    // Sugestões de tom
    if (params.mode === 'app_creation' && params.tone !== Tone.TECHNICAL) {
      suggestions.push({
        id: 'tone-technical',
        type: 'tone',
        title: 'Tom Técnico Recomendado',
        description: 'Para criação de apps, tom técnico é mais eficaz',
        value: Tone.TECHNICAL,
        field: 'tone',
        confidence: 75,
        reasoning: 'Prompts técnicos geram código e especificações mais precisas'
      })
    }

    // Sugestões de estrutura
    if (params.mode === 'image_generation' && !params.negativePrompt) {
      suggestions.push({
        id: 'negative-prompt',
        type: 'enhancement',
        title: 'Adicionar Prompt Negativo',
        description: 'Especifique o que você NÃO quer na imagem',
        value: generateNegativePromptSuggestion(params.imageStyle),
        field: 'negativePrompt',
        confidence: 80,
        reasoning: 'Prompts negativos melhoram significativamente a qualidade das imagens'
      })
    }

    // Sugestões de melhoria baseadas em tendências
    if (params.keywords) {
      const trendingSuggestion = generateTrendingSuggestion(params.keywords, params.mode)
      if (trendingSuggestion) {
        suggestions.push(trendingSuggestion)
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }

  const generateKeywordExpansion = (keywords: string, mode: PromptMode): string => {
    const expansions = {
      app_creation: [
        'interface moderna e intuitiva',
        'experiência do usuário otimizada',
        'design responsivo',
        'funcionalidades avançadas'
      ],
      image_generation: [
        'alta qualidade',
        'iluminação profissional',
        'composição equilibrada',
        'cores vibrantes'
      ],
      website_creation: [
        'design responsivo',
        'experiência do usuário',
        'performance otimizada',
        'SEO friendly'
      ]
    }

    const modeExpansions = expansions[mode] || []
    const randomExpansion = modeExpansions[Math.floor(Math.random() * modeExpansions.length)]
    
    return `${keywords}, ${randomExpansion}`
  }

  const generateContextSuggestion = (mode: PromptMode, keywords?: string): string => {
    const contexts = {
      app_creation: 'Para um aplicativo moderno voltado para usuários jovens, com foco em usabilidade e performance. Deve ser compatível com dispositivos móveis e desktop.',
      image_generation: 'Para uso comercial em redes sociais, com estilo profissional e impactante. A imagem deve transmitir confiança e modernidade.',
      website_creation: 'Para um site moderno e profissional, com foco em conversão e experiência do usuário. Deve ser responsivo, acessível e otimizado para SEO.'
    }

    return contexts[mode] || 'Adicione mais detalhes sobre o contexto de uso, público-alvo e objetivos específicos.'
  }

  const generateNegativePromptSuggestion = (imageStyle?: string): string => {
    const baseNegative = 'blurry, low quality, distorted, ugly, bad anatomy'
    
    const styleSpecific = {
      realistic: ', cartoon, anime, painting, drawing',
      anime: ', realistic, photograph, 3d render',
      cartoon: ', realistic, photograph, detailed',
      abstract: ', realistic, detailed faces, specific objects'
    }

    const additional = imageStyle && styleSpecific[imageStyle as keyof typeof styleSpecific] 
      ? styleSpecific[imageStyle as keyof typeof styleSpecific] 
      : ''

    return baseNegative + additional
  }

  const generateTrendingSuggestion = (keywords: string, mode: PromptMode): SmartSuggestion | null => {
    const trends = {
      app_creation: ['IA integrada', 'sustentabilidade', 'acessibilidade', 'gamificação'],
      image_generation: ['minimalismo', 'cores neon', 'estilo retro', 'elementos naturais'],
      website_creation: ['design system', 'micro-interações', 'acessibilidade', 'performance']
    }

    const modeTrends = trends[mode]
    const randomTrend = modeTrends[Math.floor(Math.random() * modeTrends.length)]

    return {
      id: 'trending-enhancement',
      type: 'enhancement',
      title: `Tendência: ${randomTrend}`,
      description: 'Incorpore esta tendência atual para resultados mais modernos',
      value: `${keywords}, incorporando elementos de ${randomTrend}`,
      field: 'keywords',
      confidence: 70,
      reasoning: `${randomTrend} está em alta e pode melhorar o apelo do resultado`
    }
  }

  const applySuggestion = (suggestion: SmartSuggestion) => {
    onApplySuggestion(suggestion.field, suggestion.value)
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]))
    
    toast({
      title: "Sugestão Aplicada!",
      description: suggestion.title,
      duration: 2000
    })
  }

  const copySuggestion = (value: string) => {
    navigator.clipboard.writeText(value)
    toast({
      title: "Copiado!",
      description: "Sugestão copiada para a área de transferência",
      duration: 2000
    })
  }

  if (isGenerating) {
    return (
      <Card className={cn("glass-card overflow-hidden border-0 shadow-2xl", className)}>
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-blue-500/5" />
        <CardContent className="flex items-center justify-center h-40 relative px-6 py-8">
          <div className="text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full blur-xl opacity-15 animate-pulse" />
              <div className="relative bg-gradient-to-r from-violet-500 to-purple-500 p-3 rounded-full">
                <Sparkles className="h-6 w-6 text-white animate-spin" />
              </div>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold gradient-text">Analisando com IA</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">Gerando sugestões inteligentes personalizadas...</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const suggestionsByType = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.type]) acc[suggestion.type] = []
    acc[suggestion.type].push(suggestion)
    return acc
  }, {} as Record<string, SmartSuggestion[]>)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="glass-card overflow-hidden border-0 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-blue-500/5" />
        <CardHeader className="pb-4 pt-6 px-6 relative">
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="flex items-center gap-4 text-lg">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-xl blur-md opacity-60" />
                <div className="relative bg-gradient-to-r from-violet-500 to-purple-500 p-2.5 rounded-xl shadow-lg">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="gradient-text font-bold text-lg leading-tight">Sugestões Inteligentes</span>
                <span className="text-xs text-muted-foreground font-medium">Powered by AI</span>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className="bg-gradient-to-r from-violet-500/15 to-purple-500/15 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800 px-2.5 py-1">
                <Zap className="h-3 w-3 mr-1.5" />
                <span className="text-xs font-medium">IA Ativa</span>
              </Badge>
              {suggestions.length > 0 && (
                <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1">
                  <span className="text-xs font-medium">{suggestions.length} sugestões</span>
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative px-6 pb-6">
          {suggestions.length === 0 ? (
            <div className="text-center py-8">
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-purple-400/20 rounded-full blur-xl" />
                <div className="relative bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 p-5 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                  <Lightbulb className="h-8 w-8 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-gray-100">Aguardando Entrada</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                Digite suas palavras-chave para receber sugestões inteligentes personalizadas
              </p>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-muted/40 backdrop-blur-sm p-1.5 rounded-xl h-11">
                <TabsTrigger 
                  value="all" 
                  className="text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-lg transition-all duration-200 h-8"
                >
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>Todas</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="high" 
                  className="text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-lg transition-all duration-200 h-8"
                >
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Alta</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="keyword" 
                  className="text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-lg transition-all duration-200 h-8"
                >
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5" />
                    <span>Palavras</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger 
                  value="enhancement" 
                  className="text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-lg transition-all duration-200 h-8"
                >
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Melhorias</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-3 mt-4">
                {/* Stats Header */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-lg border border-violet-100 dark:border-violet-900/30">
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xl font-bold text-violet-600 dark:text-violet-400 leading-none">
                        {suggestions.length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Total</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                        {appliedSuggestions.size}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Aplicadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-amber-600 dark:text-amber-400 leading-none">
                        {suggestions.filter(s => s.confidence >= 80).length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">Alta Conf.</div>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white px-2.5 py-1">
                    <TrendingUp className="h-3 w-3 mr-1.5" />
                    <span className="text-xs">IA Ativa</span>
                  </Badge>
                </div>

                <AnimatePresence>
                  {suggestions.map((suggestion, index) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      index={index}
                      isApplied={appliedSuggestions.has(suggestion.id)}
                      onApply={() => applySuggestion(suggestion)}
                      onCopy={() => copySuggestion(suggestion.value)}
                    />
                  ))}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="high" className="space-y-3 mt-4">
                <AnimatePresence>
                  {suggestions.filter(s => s.confidence >= 80).length === 0 ? (
                    <div className="text-center py-8">
                      <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-3">
                        <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="text-base font-semibold mb-2">Nenhuma sugestão de alta confiança</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">Adicione mais detalhes para receber sugestões mais precisas</p>
                    </div>
                  ) : (
                    suggestions.filter(s => s.confidence >= 80).map((suggestion, index) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        index={index}
                        isApplied={appliedSuggestions.has(suggestion.id)}
                        onApply={() => applySuggestion(suggestion)}
                        onCopy={() => copySuggestion(suggestion.value)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="keyword" className="space-y-3 mt-4">
                <AnimatePresence>
                  {suggestions.filter(s => s.type === 'keyword').length === 0 ? (
                    <div className="text-center py-8">
                      <div className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-3">
                        <Target className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-base font-semibold mb-2">Palavras-chave otimizadas</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">Suas palavras-chave estão bem estruturadas</p>
                    </div>
                  ) : (
                    suggestions.filter(s => s.type === 'keyword').map((suggestion, index) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        index={index}
                        isApplied={appliedSuggestions.has(suggestion.id)}
                        onApply={() => applySuggestion(suggestion)}
                        onCopy={() => copySuggestion(suggestion.value)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </TabsContent>

              <TabsContent value="enhancement" className="space-y-3 mt-4">
                <AnimatePresence>
                  {suggestions.filter(s => s.type === 'enhancement').length === 0 ? (
                    <div className="text-center py-8">
                      <div className="bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-3">
                        <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-base font-semibold mb-2">Prompt bem otimizado</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">Não há melhorias adicionais sugeridas no momento</p>
                    </div>
                  ) : (
                    suggestions.filter(s => s.type === 'enhancement').map((suggestion, index) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        index={index}
                        isApplied={appliedSuggestions.has(suggestion.id)}
                        onApply={() => applySuggestion(suggestion)}
                        onCopy={() => copySuggestion(suggestion.value)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

interface SuggestionCardProps {
  suggestion: SmartSuggestion
  index: number
  isApplied: boolean
  onApply: () => void
  onCopy: () => void
}

function SuggestionCard({ suggestion, index, isApplied, onApply, onCopy }: SuggestionCardProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'keyword': return <Target className="h-5 w-5" />
      case 'context': return <Lightbulb className="h-5 w-5" />
      case 'tone': return <Wand2 className="h-5 w-5" />
      case 'enhancement': return <Zap className="h-5 w-5" />
      default: return <Sparkles className="h-5 w-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'keyword': return "from-emerald-500 to-teal-500"
      case 'context': return "from-blue-500 to-cyan-500"
      case 'tone': return "from-purple-500 to-pink-500"
      case 'enhancement': return "from-amber-500 to-orange-500"
      default: return "from-violet-500 to-purple-500"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-emerald-700 bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-900/20 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
    if (confidence >= 70) return "text-blue-700 bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800"
    return "text-amber-700 bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-900/20 dark:text-amber-300 border-amber-200 dark:border-amber-800"
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'keyword': return 'Palavras-chave'
      case 'context': return 'Contexto'
      case 'tone': return 'Tom'
      case 'enhancement': return 'Melhoria'
      default: return 'Sugestão'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`group relative overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-md ${
        isApplied 
          ? 'bg-gradient-to-br from-emerald-50 to-emerald-25 dark:from-emerald-950/30 dark:to-emerald-950/10 border-emerald-200 dark:border-emerald-800' 
          : 'bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900/50 dark:to-gray-900/20 border-gray-200 dark:border-gray-700 hover:border-violet-200 dark:hover:border-violet-700'
      }`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5" />
      </div>
      
      {/* Content */}
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="relative flex-shrink-0 mt-0.5">
            <div className={`absolute inset-0 bg-gradient-to-r ${getTypeColor(suggestion.type)} rounded-lg blur-md opacity-15 group-hover:opacity-25 transition-opacity duration-300`} />
            <div className={`relative bg-gradient-to-r ${getTypeColor(suggestion.type)} p-2 rounded-lg shadow-sm text-white`}>
              {getTypeIcon(suggestion.type)}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 space-y-2.5 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs font-medium bg-white/60 dark:bg-gray-800/60 px-2 py-0.5 h-5">
                    {getTypeLabel(suggestion.type)}
                  </Badge>
                  <Badge className={`text-xs font-semibold border h-5 px-2 py-0.5 ${getConfidenceColor(suggestion.confidence)}`}>
                    {suggestion.confidence >= 85 ? '🔥' : suggestion.confidence >= 70 ? '⭐' : '💡'} {suggestion.confidence}%
                  </Badge>
                </div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors leading-tight">
                  {suggestion.title}
                </h4>
              </div>
            </div>
            
            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {suggestion.description}
            </p>
            
            {/* Reasoning */}
            {suggestion.reasoning && (
              <div className="flex items-start gap-2 p-2.5 bg-violet-50 dark:bg-violet-950/20 rounded-lg border border-violet-100 dark:border-violet-900/30">
                <Lightbulb className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-violet-700 dark:text-violet-300 italic leading-relaxed">
                  {suggestion.reasoning}
                </p>
              </div>
            )}
            
            {/* Example */}
            {suggestion.example && (
              <div className="p-2.5 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Exemplo</span>
                </div>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900/50 p-2 rounded border leading-relaxed">
                  {suggestion.example}
                </p>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={onApply}
                disabled={isApplied}
                className={`h-8 px-3 text-xs font-medium transition-all duration-200 ${
                  isApplied 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm' 
                    : 'bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-sm hover:shadow-md hover:scale-105'
                }`}
              >
                {isApplied ? (
                  <>
                    <Check className="h-3 w-3 mr-1.5" />
                    Aplicado
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-3 w-3 mr-1.5" />
                    Aplicar
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={onCopy}
                className="h-8 px-3 text-xs font-medium border-gray-300 dark:border-gray-600 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-all duration-200"
              >
                <Copy className="h-3 w-3 mr-1.5" />
                Copiar
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Applied Indicator */}
      {isApplied && (
        <div className="absolute top-3 right-3">
          <div className="bg-emerald-500 text-white p-1.5 rounded-full shadow-sm">
            <Check className="h-3 w-3" />
          </div>
        </div>
      )}
    </motion.div>
  )
}