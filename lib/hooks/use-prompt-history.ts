"use client"

import { useState, useEffect } from "react"
import type { GeneratedPrompt, PromptParams, Platform } from "@/lib/types"

const STORAGE_KEY = "ai-prompt-generator-history"
const MAX_HISTORY_ITEMS = 10

export function usePromptHistory() {
  const [history, setHistory] = useState<GeneratedPrompt[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY)
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory))
      }
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
    }
  }, [])

  // Salvar histórico no localStorage quando atualizado
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
      console.error("Erro ao salvar histórico:", error)
    }
  }, [history])

  // Gerar novo prompt chamando a API route
  const generatePrompt = async (params: PromptParams): Promise<GeneratedPrompt> => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Tenta pegar corpo do erro
        throw new Error(errorData.error || `Erro na API: ${response.statusText}`);
      }

      // A API agora retorna { genericPrompt: "..." }
      const result: { genericPrompt: string } = await response.json();

      // Criar o objeto com a nova estrutura
          const newPrompt: GeneratedPrompt = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            params,
        genericPrompt: result.genericPrompt,
          }

          setHistory((prev) => {
            const updated = [newPrompt, ...prev].slice(0, MAX_HISTORY_ITEMS)
            return updated
          })

          setIsLoading(false)
      return newPrompt

    } catch (error) {
      console.error("Erro ao gerar prompt via API:", error)
      setIsLoading(false)
      // Re-lançar o erro para que o componente possa tratá-lo (ex: mostrar toast)
      throw error;
    }
  }

  // Limpar histórico
  const clearHistory = () => {
    setHistory([])
  }

  // Remover item específico do histórico
  const removeFromHistory = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }

  return {
    history,
    isLoading,
    generatePrompt,
    clearHistory,
    removeFromHistory,
  }
}
