// Tipos centralizados para uso em todo o aplicativo
export type Platform = 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube' | 'blog' | 'email' | 'discord' | 'all' | 'cursor' | 'lovable' | 'bolt' | 'generic'; // Added cursor, lovable, bolt, generic

// Enum para os tipos de tom
export enum Tone {
  PROFESSIONAL = 'professional',
  CASUAL = 'casual',
  CREATIVE = 'creative',
  TECHNICAL = 'technical',
  NEUTRAL = 'neutral', 
  FORMAL = 'formal',
  FRIENDLY = 'friendly',
  ENTHUSIASTIC = 'enthusiastic',
  AUTHORITATIVE = 'authoritative'
}
// Enum para Complexidade
export enum Complexity {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  DETAILED = 'detailed',
  BEGINNER = 'beginner', // Mantendo os valores do comentário por segurança
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export type Length = 'short' | 'medium' | 'long';
export type PromptMode = 'app_creation' | 'image_generation' | 'content_creation' | 'problem_solving' | 'coding' | 'instruct' | 'explain';

export type PromptParams = {
  keywords: string;
  context?: string;
  tone: Tone;
  length: Length; // Nota: Este campo não parece ser usado na API /api/generate
  complexity: Complexity; // Corrigido para usar o enum
  mode: PromptMode;
  includeExamples?: boolean;
  includeClarifications?: boolean;
  imageStyle?: string; // Estilo visual para geração de imagens
};

export type GeneratedPrompt = {
  id: string;
  timestamp: number;
  params: PromptParams; // Parâmetros usados para gerar
  genericPrompt: string; // <- ADICIONAR
};

// Interface for Prompt Templates
export interface PromptTemplate {
  id: string;
  title: string;
  keywords: string;
  context: string;
  platforms: Platform[]; // Re-uses existing Platform type
  tone: Tone; // Re-uses existing Tone type
  length: Length; // Re-uses existing Length type
  complexity: number; // Assuming 0-100 scale like the form
  includeExamples: boolean;
  tags: string[];
  imageStyle?: string; // Estilo visual para geração de imagens
}

export interface PlatformInfo {
  name: Platform
  label: string
  description: string
  icon: string
  color: string
  gradient: string
}

export interface UserPreferences {
  defaultPlatforms: Platform[]
  defaultTone: Tone
  defaultLength: Length
  defaultComplexity: number
  defaultIncludeExamples: boolean
  theme: "light" | "dark" | "system"
}

export interface PromptVersion {
  id: string
  promptId: string
  version: number
  timestamp: number
  params: PromptParams
  results: Record<Platform, string>
  notes?: string
}

export interface TrendingTopic {
  id: string
  title: string
  description: string
  keywords: string[]
  popularity: number // 1-100
  category: string
  isNew?: boolean
}

export interface BrainstormIdea {
  id: string
  title: string
  description: string
  keywords: string
  platforms: Platform[]
  tone: Tone
  confidence: number // 1-100
}

export interface AIFeedback {
  type: "suggestion" | "warning" | "tip" | "improvement"
  message: string
  field?: string
  suggestion?: string
  impact?: "low" | "medium" | "high"
}

export interface AIAssistantMessage {
  id: string
  content: string
  type: "system" | "user" | "assistant"
  timestamp: number
}

export interface AIAssistantContext {
  messages: AIAssistantMessage[]
  isActive: boolean
  isTyping: boolean
  clearMessages: () => void
  addMessage: (message: Omit<AIAssistantMessage, "id" | "timestamp">) => void
  toggleAssistant: () => void
  analyzePrompt?: (prompt: string) => Promise<FeedbackItem[]>
  onApplySuggestion?: (suggestion: string) => void
}

export interface FeedbackItem {
  type: "suggestion" | "improvement" | "warning"
  message: string
  suggestion?: string
}
