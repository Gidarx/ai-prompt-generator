"use client"

import { useState, useEffect } from "react"
import type { GeneratedPrompt, PromptVersion } from "@/lib/types"

const STORAGE_KEY = "ai-prompt-engineer-versions"

export function usePromptVersions() {
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Carregar versões do localStorage
  useEffect(() => {
    try {
      const savedVersions = localStorage.getItem(STORAGE_KEY)
      if (savedVersions) {
        setVersions(JSON.parse(savedVersions))
      }
    } catch (error) {
      console.error("Erro ao carregar versões:", error)
    }
  }, [])

  // Salvar versões no localStorage quando atualizadas
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(versions))
    } catch (error) {
      console.error("Erro ao salvar versões:", error)
    }
  }, [versions])

  // Adicionar nova versão
  const addVersion = (prompt: GeneratedPrompt, notes?: string): PromptVersion => {
    setIsLoading(true)

    try {
      // Encontrar a versão mais recente deste prompt
      const existingVersions = versions.filter((v) => v.promptId === prompt.id)
      const newVersionNumber = existingVersions.length > 0 ? Math.max(...existingVersions.map((v) => v.version)) + 1 : 1

      const newVersion: PromptVersion = {
        id: `${prompt.id}-v${newVersionNumber}`,
        promptId: prompt.id,
        version: newVersionNumber,
        timestamp: Date.now(),
        params: { ...prompt.params },
        results: { ...prompt.results },
        notes,
      }

      setVersions((prev) => [...prev, newVersion])
      setIsLoading(false)
      return newVersion
    } catch (error) {
      console.error("Erro ao adicionar versão:", error)
      setIsLoading(false)
      throw error
    }
  }

  // Obter todas as versões de um prompt
  const getVersionsForPrompt = (promptId: string): PromptVersion[] => {
    return versions.filter((version) => version.promptId === promptId).sort((a, b) => b.version - a.version)
  }

  // Obter uma versão específica
  const getVersion = (versionId: string): PromptVersion | undefined => {
    return versions.find((version) => version.id === versionId)
  }

  // Excluir uma versão
  const deleteVersion = (versionId: string) => {
    setVersions((prev) => prev.filter((version) => version.id !== versionId))
  }

  // Atualizar notas de uma versão
  const updateVersionNotes = (versionId: string, notes: string) => {
    setVersions((prev) => prev.map((version) => (version.id === versionId ? { ...version, notes } : version)))
  }

  return {
    versions,
    isLoading,
    addVersion,
    getVersionsForPrompt,
    getVersion,
    deleteVersion,
    updateVersionNotes,
  }
}
