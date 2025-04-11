"use client"

import { useState, useEffect } from "react"
import { Tone } from "@/lib/types"
import type { UserPreferences, Platform, Length, Language } from "@/lib/types"

const STORAGE_KEY = "ai-prompt-generator-preferences"

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultPlatforms: ["cursor", "lovable", "bolt"],
  defaultTone: Tone.PROFESSIONAL,
  defaultLength: "medium",
  defaultComplexity: 50,
  defaultIncludeExamples: true,
  theme: "system",
  language: "portuguese",
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [isLoaded, setIsLoaded] = useState(false)

  // Carregar preferências do localStorage
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem(STORAGE_KEY)
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences))
      }
      setIsLoaded(true)
    } catch (error) {
      console.error("Erro ao carregar preferências:", error)
      setIsLoaded(true)
    }
  }, [])

  // Salvar preferências no localStorage quando atualizadas
  useEffect(() => {
    if (!isLoaded) return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.error("Erro ao salvar preferências:", error)
    }
  }, [preferences, isLoaded])

  // Atualizar preferências
  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...newPreferences,
    }))
  }

  // Atualizar plataformas padrão
  const updateDefaultPlatforms = (platforms: Platform[]) => {
    updatePreferences({ defaultPlatforms: platforms })
  }

  // Atualizar tom padrão
  const updateDefaultTone = (tone: Tone) => {
    updatePreferences({ defaultTone: tone })
  }

  // Atualizar tamanho padrão
  const updateDefaultLength = (length: Length) => {
    updatePreferences({ defaultLength: length })
  }

  // Atualizar complexidade padrão
  const updateDefaultComplexity = (complexity: number) => {
    updatePreferences({ defaultComplexity: complexity })
  }

  // Atualizar inclusão de exemplos padrão
  const updateDefaultIncludeExamples = (includeExamples: boolean) => {
    updatePreferences({ defaultIncludeExamples: includeExamples })
  }

  // Atualizar tema
  const updateTheme = (theme: "light" | "dark" | "system") => {
    updatePreferences({ theme })
  }

  // Atualizar idioma
  const updateLanguage = (language: Language) => {
    updatePreferences({ language })
  }

  // Resetar para valores padrão
  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES)
  }

  return {
    preferences,
    isLoaded,
    updatePreferences,
    updateDefaultPlatforms,
    updateDefaultTone,
    updateDefaultLength,
    updateDefaultComplexity,
    updateDefaultIncludeExamples,
    updateTheme,
    updateLanguage,
    resetToDefaults,
  }
}
