"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { nanoid } from "nanoid" // Assumindo que nanoid está instalado ou instalar (pnpm add nanoid)
import type { AIAssistantMessage, AIAssistantContext, PromptParams, AIFeedback } from "@/lib/types"

const STORAGE_KEY = "ai-prompt-engineer-assistant"

// Tipos para Mensagens e Contexto do Chat
// export type Message = { ... }
// export type AIAssistantContext = { ... }
// export type FeedbackItem = { ... } // Renomeado para AIFeedback em types?

// Hook principal
export function useAIAssistant() {
  const [context, setContext] = useState<AIAssistantContext>({
    messages: [],
    isActive: false,
    isTyping: false,
  })

  // Carregar contexto do localStorage
  useEffect(() => {
    try {
      const savedContext = localStorage.getItem(STORAGE_KEY)
      if (savedContext) {
        const parsedContext = JSON.parse(savedContext);
        // Garantir que todas as mensagens tenham timestamp
        if (parsedContext.messages) {
          parsedContext.messages = parsedContext.messages.map((msg: AIAssistantMessage) => ({
            ...msg,
            timestamp: msg.timestamp || Date.now() // Usar timestamp atual se não existir
          }));
        }
        setContext(parsedContext)
      }
    } catch (error) {
      console.error("Erro ao carregar contexto do assistente:", error)
    }
  }, [])

  // Salvar contexto no localStorage quando atualizado
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(context))
    } catch (error) {
      console.error("Erro ao salvar contexto do assistente:", error)
    }
  }, [context])

  // Funções para manipular mensagens
  const addMessage = useCallback((messageData: Pick<AIAssistantMessage, 'type' | 'content'>) => {
    const newMessage: AIAssistantMessage = {
       ...messageData,
       id: nanoid(),
       timestamp: Date.now(), // Adicionar timestamp
    };
    setContext((prev) => ({
      ...prev,
      // Garantir que o array messages seja do tipo AIAssistantMessage[]
      messages: [...prev.messages, newMessage],
    }))
  }, [])

  const addUserMessage = useCallback(
    (content: string) => {
      addMessage({ type: "user", content })
      fetchAssistantResponse(content)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addMessage]
  )

  const addAssistantMessage = useCallback(
    (content: string) => {
      // Removi lógica de formatação Markdown automatizada
      addMessage({ type: "assistant", content })
    },
    [addMessage]
  )

  const addSystemMessage = useCallback(
    (content: string) => {
      addMessage({ type: "system", content })
    },
    [addMessage]
  )

  const clearMessages = useCallback(() => {
    setContext((prev) => ({ ...prev, messages: [] }))
  }, [])

  // Função para deletar uma mensagem específica por ID
  const deleteMessage = useCallback((messageId: string) => {
    setContext((prev) => ({
      ...prev,
      messages: prev.messages.filter(message => message.id !== messageId)
    }))
  }, [])

  // Função para exportar o histórico de chat
  const exportChatHistory = useCallback(() => {
    try {
      const chatData = {
        messages: context.messages,
        exportedAt: new Date().toISOString(),
        metadata: {
          version: "1.0",
          source: "AI Prompt Engineer Assistant"
        }
      };
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chatData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `chat-history-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      return true;
    } catch (error) {
      console.error("Erro ao exportar histórico:", error);
      return false;
    }
  }, [context.messages]);

  // Função para chamar a API do assistente
  const fetchAssistantResponse = useCallback(async (userMessage: string) => {
    setContext((prev) => ({ ...prev, isTyping: true }))

    // Formatar histórico para a API do Gemini (usando AIAssistantMessage)
    const historyForApi = context.messages
        .filter(msg => msg.type === 'user' || msg.type === 'assistant')
        .map(msg => ({
            role: msg.type === 'user' ? 'user' : 'model',
            // Assegurar que parts seja um array
            parts: [{ text: msg.content }]
        }));

    try {
      const response = await fetch('/api/assistant', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ 
           userMessage, 
           history: historyForApi,
           requestMarkdown: true // Sinalizar que queremos resposta em Markdown
         }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `API Error: ${response.statusText}`);
      if (data.response) addAssistantMessage(data.response);
      else addAssistantMessage(data.error || "Erro desconhecido na resposta.");

    } catch (error: any) {
      console.error("Erro ao buscar resposta do assistente:", error);
      addSystemMessage(`Erro: ${error.message || "Não foi possível conectar."}`);
    } finally {
      setContext((prev) => ({ ...prev, isTyping: false }))
    }
  }, [context.messages, addAssistantMessage, addSystemMessage]);

  // Ativar/Desativar o painel do assistente
  const toggleAssistant = useCallback(() => {
    setContext((prev) => {
      // Se estiver ativando o assistente e não houver mensagens, adicionar mensagem de boas-vindas
      const shouldAddWelcome = !prev.isActive && prev.messages.length === 0;
      
      return {
        ...prev,
        isActive: !prev.isActive,
        messages: !prev.isActive 
          ? prev.messages 
          : [], // Limpar mensagens ao desativar
        isTyping: false,
      }
    })
  }, [])

  // Analisar o prompt atual e fornecer feedback
  const analyzePrompt = useCallback((params: Omit<PromptParams, 'platforms'>): AIFeedback[] => {
    const feedback: AIFeedback[] = []

    // Verificar palavras-chave
    if (params.keywords.length < 10) {
      feedback.push({
        type: "improvement",
        message: "Palavras-chave muito curtas",
        field: "keywords",
        suggestion: "Adicione mais detalhes às suas palavras-chave para obter resultados mais precisos",
        impact: "high",
      })
    }

    // Verificar contexto
    if (!params.context || params.context.length < 20) {
      feedback.push({
        type: "suggestion",
        message: "Contexto limitado",
        field: "context",
        suggestion: "Fornecer mais contexto pode melhorar significativamente a qualidade do prompt",
        impact: "medium",
      })
    }

    // Verificar complexidade para prompts longos
    if (params.length === "long" && params.complexity < 30) {
      feedback.push({
        type: "warning",
        message: "Complexidade baixa para prompt longo",
        field: "complexity",
        suggestion: "Prompts longos geralmente se beneficiam de maior complexidade",
        impact: "medium",
      })
    }

    return feedback
  }, [])

  // Gerar sugestões de melhoria para um prompt
  const suggestImprovements = useCallback((params: Omit<PromptParams, 'platforms'>): string[] => {
    const suggestions: string[] = []

    // Sugestões baseadas nos parâmetros
    if (params.keywords.split(" ").length < 5) {
      suggestions.push("Expanda suas palavras-chave com termos mais específicos")
    }

    if (!params.context || params.context.length < 30) {
      suggestions.push("Adicione mais contexto sobre o público-alvo e o objetivo do prompt")
    }

    if (params.tone === "professional" && params.length === "short") {
      suggestions.push("Considere aumentar o tamanho para 'médio' para um tom profissional mais eficaz")
    }

    if (params.includeExamples && params.length === "short") {
      suggestions.push(
        "Em prompts curtos, incluir exemplos pode consumir espaço valioso. Considere desativar esta opção.",
      )
    }

    return suggestions
  }, [])

  return {
    context,
    addUserMessage,
    addAssistantMessage,
    addSystemMessage,
    clearMessages,
    deleteMessage,
    toggleAssistant,
    analyzePrompt,
    suggestImprovements,
    exportChatHistory,
  }
}
