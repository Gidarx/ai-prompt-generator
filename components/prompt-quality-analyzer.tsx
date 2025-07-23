"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Lightbulb,
  Target,
  BarChart3,
  Zap,
  Eye,
  Clock
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { PromptParams } from "@/lib/types"
import { PromptAnalyzer, PromptAnalysis } from "@/lib/prompt-analyzer"
import { cn } from "@/lib/utils"

interface PromptQualityAnalyzerProps {
  params: PromptParams
  className?: string
}

export function PromptQualityAnalyzer({ params, className }: PromptQualityAnalyzerProps) {
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    const analyzePrompt = async () => {
      setIsAnalyzing(true)
      
      try {
        // Usar análise local primeiro (mais rápida)
        const localResult = PromptAnalyzer.analyzePrompt(params)
        setAnalysis(localResult)
        
        // Tentar análise avançada com IA (opcional)
        if (params.keywords && params.keywords.length > 10) {
          try {
            const response = await fetch('/api/analyze-prompt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ params })
            })
            
            if (response.ok) {
              const aiAnalysis = await response.json()
              // Combinar análise local com IA
              const enhancedAnalysis = {
                ...localResult,
                score: {
                  ...localResult.score,
                  overall: Math.round((localResult.score.overall + aiAnalysis.score) / 2),
                  effectiveness: aiAnalysis.effectiveness,
                  clarity: aiAnalysis.clarity,
                  specificity: aiAnalysis.specificity
                },
                strengths: [...localResult.strengths, ...aiAnalysis.strengths].slice(0, 5),
                improvements: [...localResult.improvements, ...aiAnalysis.improvements].slice(0, 5)
              }
              setAnalysis(enhancedAnalysis)
            }
          } catch (aiError) {
            console.log('Análise IA indisponível, usando análise local')
          }
        }
      } catch (error) {
        console.error('Erro na análise:', error)
      } finally {
        setIsAnalyzing(false)
      }
    }

    if (params.keywords || params.context) {
      analyzePrompt()
    } else {
      setAnalysis(null)
    }
  }, [params])

  if (!analysis && !isAnalyzing) {
    return (
      <Card className={cn("glass-card", className)}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Digite algo para ver a análise de qualidade</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isAnalyzing) {
    return (
      <Card className={cn("glass-card", className)}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Analisando qualidade...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysis) return null

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400"
    if (score >= 60) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500"
    if (score >= 60) return "bg-amber-500"
    return "bg-red-500"
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />
      default: return <Info className="h-4 w-4 text-blue-500" />
    }
  }

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
            <div className="bg-primary/20 p-2 rounded-lg">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            Análise de Qualidade
            <Badge variant="outline" className="ml-auto">
              Tempo Real
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Score Geral */}
          <div className="text-center space-y-3">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center relative overflow-hidden">
                <div 
                  className={cn("absolute inset-0 rounded-full transition-all duration-1000", getScoreBg(analysis.score.overall))}
                  style={{ 
                    background: `conic-gradient(${getScoreBg(analysis.score.overall).replace('bg-', '')} ${analysis.score.overall * 3.6}deg, transparent 0deg)` 
                  }}
                />
                <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center relative z-10">
                  <span className={cn("text-2xl font-bold", getScoreColor(analysis.score.overall))}>
                    {analysis.score.overall}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Score de Qualidade</h3>
              <p className="text-sm text-muted-foreground">
                Nível: {analysis.readabilityLevel === 'beginner' ? 'Iniciante' : 
                        analysis.readabilityLevel === 'intermediate' ? 'Intermediário' : 'Avançado'}
              </p>
            </div>
          </div>

          <Tabs defaultValue="metrics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="metrics" className="text-xs">Métricas</TabsTrigger>
              <TabsTrigger value="issues" className="text-xs">
                Problemas
                {analysis.issues.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                    {analysis.issues.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="suggestions" className="text-xs">Sugestões</TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="space-y-4 mt-4">
              {/* Métricas Detalhadas */}
              <div className="space-y-3">
                {[
                  { label: 'Clareza', value: analysis.score.clarity, icon: Eye },
                  { label: 'Especificidade', value: analysis.score.specificity, icon: Target },
                  { label: 'Estrutura', value: analysis.score.structure, icon: BarChart3 },
                  { label: 'Completude', value: analysis.score.completeness, icon: CheckCircle },
                  { label: 'Eficácia', value: analysis.score.effectiveness, icon: Zap }
                ].map((metric) => (
                  <div key={metric.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <metric.icon className="h-4 w-4 text-muted-foreground" />
                        <span>{metric.label}</span>
                      </div>
                      <span className={cn("font-medium", getScoreColor(metric.value))}>
                        {metric.value}%
                      </span>
                    </div>
                    <Progress value={metric.value} className="h-2" />
                  </div>
                ))}
              </div>

              {/* Informações Adicionais */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Tokens
                  </div>
                  <p className="text-lg font-semibold">{analysis.estimatedTokens}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Pontos Fortes
                  </div>
                  <p className="text-lg font-semibold">{analysis.strengths.length}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="issues" className="space-y-3 mt-4">
              <AnimatePresence>
                {analysis.issues.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhum problema detectado!</p>
                  </motion.div>
                ) : (
                  analysis.issues.map((issue, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Alert className={cn(
                        "border-l-4",
                        issue.type === 'critical' && "border-l-red-500 bg-red-50 dark:bg-red-950/20",
                        issue.type === 'warning' && "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
                        issue.type === 'info' && "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      )}>
                        <div className="flex items-start gap-2">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <AlertDescription className="font-medium">
                              {issue.message}
                            </AlertDescription>
                            <p className="text-xs text-muted-foreground mt-1">
                              {issue.suggestion}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {issue.impact === 'high' ? 'Alto' : issue.impact === 'medium' ? 'Médio' : 'Baixo'}
                          </Badge>
                        </div>
                      </Alert>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-3 mt-4">
              <AnimatePresence>
                {analysis.suggestions.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <Lightbulb className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Seu prompt está bem otimizado!</p>
                  </motion.div>
                ) : (
                  analysis.suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{suggestion.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.description}
                          </p>
                          {suggestion.example && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                              {suggestion.example}
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant={suggestion.priority === 'high' ? 'destructive' : 
                                  suggestion.priority === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {suggestion.priority === 'high' ? 'Alta' : 
                           suggestion.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>

          {/* Pontos Fortes */}
          {analysis.strengths.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Pontos Fortes
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.strengths.map((strength, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {strength}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}