"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { nanoid } from "nanoid" // Assumindo que nanoid está instalado ou instalar (pnpm add nanoid)
import type { AIAssistantMessage, AIAssistantContext, PromptParams, AIFeedback } from "@/lib/types"
import { Complexity, Tone } from "@/lib/types" // Import enums as values

const STORAGE_KEY = "ai-prompt-engineer-assistant"

// Tipos para Mensagens e Contexto do Chat
// export type Message = { ... }
// export type AIAssistantContext = { ... }
// export type FeedbackItem = { ... } // Renomeado para AIFeedback em types?

// Tipo para o estado interno do hook
interface AIAssistantState {
  messages: AIAssistantMessage[];
  isActive: boolean;
  isTyping: boolean;
}

// Hook principal
export function useAIAssistant() {
  // Usar o tipo de estado interno e renomear state/setState
  const [state, setState] = useState<AIAssistantState>({
    messages: [],
    isActive: false,
    isTyping: false,
  });

  // Carregar estado do localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Garantir que todas as mensagens tenham timestamp
        if (parsedState.messages) {
          parsedState.messages = parsedState.messages.map((msg: AIAssistantMessage) => ({
            ...msg,
            timestamp: msg.timestamp || Date.now()
          }));
        }
        // Validar estrutura básica antes de definir o estado
        if (parsedState.messages !== undefined && parsedState.isActive !== undefined && parsedState.isTyping !== undefined) {
          setState(parsedState);
        } else {
          console.warn("Estado carregado do localStorage está incompleto ou inválido.");
        }
      }
    } catch (error) {
      console.error("Erro ao carregar estado do assistente:", error);
    }
  }, []); // Executar apenas na montagem

  // Salvar estado no localStorage quando atualizado
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); // Salvar o objeto state
    } catch (error) {
      console.error("Erro ao salvar estado do assistente:", error);
    }
  }, [state]); // Depender do objeto state

  // Funções para manipular mensagens (usando setState)
  const addMessage = useCallback((messageData: Pick<AIAssistantMessage, 'type' | 'content'>) => {
    const newMessage: AIAssistantMessage = {
       ...messageData,
       id: nanoid(),
       timestamp: Date.now(),
    };
    setState((prev) => ({ // Usar setState
      ...prev,
      messages: [...prev.messages, newMessage],
    }));
  }, []); // Não precisa de dependência em setState

  // addUserMessage, addAssistantMessage, addSystemMessage usam addMessage, então não precisam mudar
  const addUserMessage = useCallback(
    (content: string) => {
      addMessage({ type: "user", content });
      fetchAssistantResponse(content);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addMessage] // Dependência correta é addMessage
  );

  const addAssistantMessage = useCallback(
    (content: string) => {
      addMessage({ type: "assistant", content });
    },
    [addMessage]
  );

  const addSystemMessage = useCallback(
    (content: string) => {
      addMessage({ type: "system", content });
    },
    [addMessage]
  );

  const clearMessages = useCallback(() => {
    setState((prev) => ({ ...prev, messages: [] })); // Usar setState
  }, []);

  const deleteMessage = useCallback((messageId: string) => {
    setState((prev) => ({ // Usar setState
      ...prev,
      messages: prev.messages.filter(message => message.id !== messageId)
    }));
  }, []);

  const exportChatHistory = useCallback(() => {
    try {
      const chatData = {
        messages: state.messages, // Usar state.messages
        exportedAt: new Date().toISOString(),
        metadata: {
          version: "1.0",
          source: "AI Prompt Engineer Assistant"
        }
      };
      // ... (lógica de download) ...
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
  }, [state.messages]); // Depender de state.messages

  const fetchAssistantResponse = useCallback(async (userMessage: string) => {
    setState((prev) => ({ ...prev, isTyping: true })); // Usar setState

    const historyForApi = state.messages // Usar state.messages
        .filter(msg => msg.type === 'user' || msg.type === 'assistant')
        .map(msg => ({
            role: msg.type === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

    try {
      // ... (lógica fetch) ...
      const response = await fetch('/api/assistant', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           userMessage,
           history: historyForApi,
           requestMarkdown: true
         }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `API Error: ${response.statusText}`);
      if (data.response) addAssistantMessage(data.response); // addAssistantMessage chama addMessage que chama setState
      else addAssistantMessage(data.error || "Erro desconhecido na resposta.");

    } catch (error: any) {
      console.error("Erro ao buscar resposta do assistente:", error);
      addSystemMessage(`Erro: ${error.message || "Não foi possível conectar."}`); // addSystemMessage chama addMessage que chama setState
    } finally {
      setState((prev) => ({ ...prev, isTyping: false })); // Usar setState
    }
    // Removido addAssistantMessage e addSystemMessage das dependências pois são estáveis via useCallback
  }, [state.messages, addMessage]); // Depender de state.messages e addMessage (que é estável)

  const toggleAssistant = useCallback(() => {
    setState((prev) => ({ // Usar setState
      ...prev,
      isActive: !prev.isActive,
      messages: !prev.isActive ? prev.messages : [],
      isTyping: false,
    }));
  }, []);

  // analyzePrompt e suggestImprovements não mudam
  const analyzePrompt = useCallback((params: Omit<PromptParams, 'platforms'>): AIFeedback[] => {
    // ... (lógica de análise) ...
    const feedback: AIFeedback[] = []

    // Verificar palavras-chave
    if (params.keywords && params.keywords.length < 10) { // Adicionado check para params.keywords
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
    if (params.length === "long" && params.complexity) { // Adicionado check para params.complexity
        // Mapear enum Complexity para valor numérico para comparação
        let numericComplexity = 0;
        switch (params.complexity) {
            case Complexity.SIMPLE: case Complexity.BEGINNER: numericComplexity = 15; break;
            case Complexity.MODERATE: case Complexity.INTERMEDIATE: numericComplexity = 50; break;
            case Complexity.DETAILED: case Complexity.ADVANCED: numericComplexity = 85; break;
        }
        if (numericComplexity < 30) {
            feedback.push({
                type: "warning",
                message: "Complexidade baixa para prompt longo",
                field: "complexity",
                suggestion: "Prompts longos geralmente se beneficiam de maior complexidade",
                impact: "medium",
            });
        }
    }


    return feedback
  }, [])

  const suggestImprovements = useCallback((params: Omit<PromptParams, 'platforms'>): string[] => {
    // ... (lógica de sugestões) ...
    const suggestions: string[] = []

    // Sugestões baseadas nos parâmetros
    if (params.keywords && params.keywords.split(" ").length < 5) { // Adicionado check para params.keywords
      suggestions.push("Expanda suas palavras-chave com termos mais específicos")
    }

    if (!params.context || params.context.length < 30) {
      suggestions.push("Adicione mais contexto sobre o público-alvo e o objetivo do prompt")
    }

    if (params.tone === Tone.PROFESSIONAL && params.length === "short") { // Comparar com enum
      suggestions.push("Considere aumentar o tamanho para 'médio' para um tom profissional mais eficaz")
    }

    if (params.includeExamples && params.length === "short") {
      suggestions.push(
        "Em prompts curtos, incluir exemplos pode consumir espaço valioso. Considere desativar esta opção.",
      )
    }

    return suggestions
  }, [])

  // Retornar os campos do estado e as funções memoizadas
  return {
    messages: state.messages,
    isActive: state.isActive,
    isTyping: state.isTyping,
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
