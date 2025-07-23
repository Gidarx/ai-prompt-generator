"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Zap,
  BarChart3,
  Activity,
  Eye,
  CheckCircle
} from "lucide-react"
import { motion } from "framer-motion"
import { PromptParams } from "@/lib/types"
import { cn } from "@/lib/utils"

interface RealTimeMetricsProps {
  params: PromptParams
  className?: string
}

interface Metrics {
  readabilityScore: number
  complexityLevel: number
  estimatedTokens: number
  completenessScore: number
  optimizationLevel: number
  trendingScore: number
  lastUpdated: number
}

export function RealTimeMetrics({ params, className }: RealTimeMetricsProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  useEffect(() => {
    calculateMetrics()
  }, [params])

  const calculateMetrics = async () => {
    setIsCalculating(true)
    
    // Simular cálculo em tempo real
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const newMetrics = {
      readabilityScore: calculateReadability(params),
      complexityLevel: calculateComplexity(params),
      estimatedTokens: estimateTokens(params),
      completenessScore: calculateCompleteness(params),
      optimizationLevel: calculateOptimization(params),
      trendingScore: calculateTrendingScore(params),
      lastUpdated: Date.now()
    }
    
    setMetrics(newMetrics)
    setIsCalculating(false)
  }

  const calculateReadability = (params: PromptParams): number => {
    let score = 50
    
    if (params.keywords) {
      const wordCount = params.keywords.split(' ').length
      if (wordCount >= 5 && wordCount <= 15) score += 20
      else if (wordCount > 15) score += 10
      
      // Penalizar palavras muito técnicas ou complexas
      const complexWords = ['algorithm', 'implementation', 'optimization', 'sophisticated']
      const hasComplexWords = complexWords.some(word => 
        params.keywords!.toLowerCase().includes(word)
      )
      if (hasComplexWords) score -= 10
    }
    
    if (params.context && params.context.length > 20 && params.context.length < 200) {
      score += 15
    }
    
    return Math.max(0, Math.min(100, score))
  }

  const calculateComplexity = (params: PromptParams): number => {
    let complexity = 30
    
    if (params.keywords && params.keywords.length > 50) complexity += 20
    if (params.context && params.context.length > 100) complexity += 15
    if (params.mode === 'image_generation' && params.imageStyle) complexity += 10
    if (params.negativePrompt) complexity += 10
    if (params.includeExamples) complexity += 5
    
    return Math.max(0, Math.min(100, complexity))
  }

  const estimateTokens = (params: PromptParams): number => {
    let tokens = 0
    
    if (params.keywords) tokens += Math.ceil(params.keywords.length / 4)
    if (params.context) tokens += Math.ceil(params.context.length / 4)
    if (params.negativePrompt) tokens += Math.ceil(params.negativePrompt.length / 4)
    
    // Base tokens para estrutura do prompt
    tokens += 50
    
    // Multiplicador baseado na complexidade
    const complexityMultiplier = {
      simple: 1.2,
      moderate: 1.5,
      detailed: 2.0
    }
    
    return Math.round(tokens * (complexityMultiplier[params.complexity as keyof typeof complexityMultiplier] || 1.5))
  }

  const calculateCompleteness = (params: PromptParams): number => {
    let score = 0
    
    if (params.keywords) score += 30
    if (params.context) score += 25
    if (params.tone) score += 15
    if (params.mode) score += 20
    if (params.length) score += 10
    
    // Bônus para campos específicos do modo
    if (params.mode === 'image_generation') {
      if (params.imageStyle) score += 10
      if (params.negativePrompt) score += 5
    }
    
    return Math.max(0, Math.min(100, score))
  }

  const calculateOptimization = (params: PromptParams): number => {
    let score = 40
    
    // Verificar alinhamento entre parâmetros
    if (params.length === 'long' && params.complexity === 'detailed') score += 20
    if (params.length === 'short' && params.complexity === 'simple') score += 15
    
    // Verificar tom apropriado para o modo
    if (params.mode === 'app_creation' && params.tone === 'technical') score += 15
    if (params.mode === 'image_generation' && params.tone === 'creative') score += 15
    
    // Penalizar conflitos
    if (params.length === 'short' && params.includeExamples) score -= 10
    
    return Math.max(0, Math.min(100, score))
  }

  const calculateTrendingScore = (params: PromptParams): number => {
    let score = 50
    
    // Palavras-chave trending
    const trendingTerms = ['AI', 'modern', 'minimalist', 'sustainable', 'accessible', 'responsive']
    if (params.keywords) {
      const hasTrending = trendingTerms.some(term => 
        params.keywords!.toLowerCase().includes(term.toLowerCase())
      )
      if (hasTrending) score += 25
    }
    
    // Estilos trending para imagens
    const trendingStyles = ['minimalist', 'cyberpunk', 'realistic', 'cinematic']
    if (params.imageStyle && trendingStyles.includes(params.imageStyle)) {
      score += 20
    }
    
    return Math.max(0, Math.min(100, score))
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
    if (score >= 60) return "text-blue-600 dark:text-blue-400"
    if (score >= 40) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500"
    if (score >= 60) return "bg-blue-500"
    if (score >= 40) return "bg-amber-500"
    return "bg-red-500"
  }

  if (!metrics && !isCalculating) {
    return (
      <Card className={cn("glass-card", className)}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Métricas em tempo real aparecerão aqui</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isCalculating) {
    return (
      <Card className={cn("glass-card", className)}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-pulse">
              <Activity className="h-8 w-8 mx-auto mb-2 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Calculando métricas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) return null

  const metricsData = [
    {
      label: 'Legibilidade',
      value: metrics.readabilityScore,
      icon: Eye,
      description: 'Facilidade de compreensão'
    },
    {
      label: 'Complexidade',
      value: metrics.complexityLevel,
      icon: BarChart3,
      description: 'Nível de sofisticação'
    },
    {
      label: 'Completude',
      value: metrics.completenessScore,
      icon: CheckCircle,
      description: 'Campos preenchidos'
    },
    {
      label: 'Otimização',
      value: metrics.optimizationLevel,
      icon: Zap,
      description: 'Alinhamento de parâmetros'
    },
    {
      label: 'Tendência',
      value: metrics.trendingScore,
      icon: TrendingUp,
      description: 'Relevância atual'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            Métricas em Tempo Real
            <Badge variant="outline" className="ml-auto text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Atualizado
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tokens Estimados */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-semibold">Tokens Estimados</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {metrics.estimatedTokens}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Custo aproximado do prompt
            </p>
          </div>

          {/* Métricas Detalhadas */}
          <div className="space-y-4">
            {metricsData.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <metric.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{metric.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-bold", getScoreColor(metric.value))}>
                      {metric.value}%
                    </span>
                  </div>
                </div>
                <Progress value={metric.value} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Status Geral */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status Geral</span>
              <Badge 
                variant={
                  metrics.completenessScore >= 80 ? "default" :
                  metrics.completenessScore >= 60 ? "secondary" : "destructive"
                }
                className="text-xs"
              >
                {metrics.completenessScore >= 80 ? "Excelente" :
                 metrics.completenessScore >= 60 ? "Bom" : "Precisa Melhorar"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}