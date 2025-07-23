"use client"

import { useState, useEffect } from "react"

export interface GeminiModel {
  name: string
  displayName: string
  description: string
  version: string
  inputTokenLimit: number
  outputTokenLimit: number
  supportedGenerationMethods: string[]
  temperature?: number
  topP?: number
  topK?: number
}

interface GeminiModelsResponse {
  models: GeminiModel[]
  total: number
  lastUpdated: string
  fallback?: boolean
  error?: string
}

export function useGeminiModels() {
  const [models, setModels] = useState<GeminiModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const fetchModels = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/gemini-models', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }

      const data: GeminiModelsResponse = await response.json()
      
      setModels(data.models)
      setIsFallback(data.fallback || false)
      setLastUpdated(data.lastUpdated)
      
      if (data.error) {
        setError(data.error)
      }

      // Salvar no localStorage para cache
      localStorage.setItem('gemini-models-cache', JSON.stringify({
        models: data.models,
        timestamp: Date.now(),
        fallback: data.fallback
      }))

    } catch (err: any) {
      console.error('Erro ao buscar modelos do Gemini:', err)
      setError(err.message)
      
      // Tentar carregar do cache se disponível
      const cached = loadFromCache()
      if (cached) {
        setModels(cached.models)
        setIsFallback(true)
        setError('Usando modelos em cache - API indisponível')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem('gemini-models-cache')
      if (cached) {
        const data = JSON.parse(cached)
        const isExpired = Date.now() - data.timestamp > 24 * 60 * 60 * 1000 // 24 horas
        
        if (!isExpired) {
          return data
        }
      }
    } catch (error) {
      console.error('Erro ao carregar cache de modelos:', error)
    }
    return null
  }

  const refreshModels = () => {
    fetchModels()
  }

  const getModelByName = (name: string): GeminiModel | undefined => {
    return models.find(model => model.name === name || model.displayName === name)
  }

  const getRecommendedModel = (): GeminiModel | undefined => {
    // Priorizar modelos mais recentes e com melhor performance
    const priorities = [
      'gemini-2.0-flash-thinking-exp',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro'
    ]

    for (const priority of priorities) {
      const model = models.find(m => 
        m.displayName.toLowerCase().includes(priority.toLowerCase()) ||
        m.name.toLowerCase().includes(priority.toLowerCase())
      )
      if (model) return model
    }

    return models[0] // Retorna o primeiro se nenhum prioritário for encontrado
  }

  const getModelsByVersion = (version: string): GeminiModel[] => {
    return models.filter(model => model.version === version)
  }

  const getLatestModels = (): GeminiModel[] => {
    const versions = [...new Set(models.map(m => m.version))].sort().reverse()
    const latestVersion = versions[0]
    return getModelsByVersion(latestVersion)
  }

  useEffect(() => {
    // Tentar carregar do cache primeiro
    const cached = loadFromCache()
    if (cached) {
      setModels(cached.models)
      setIsFallback(cached.fallback)
      setIsLoading(false)
    }

    // Sempre buscar modelos atualizados
    fetchModels()
  }, [])

  return {
    models,
    isLoading,
    error,
    isFallback,
    lastUpdated,
    refreshModels,
    getModelByName,
    getRecommendedModel,
    getModelsByVersion,
    getLatestModels
  }
}