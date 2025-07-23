import { PromptTemplate, Tone, Complexity, PromptMode, Length, Platform } from './types';

// Nota: A interface PromptTemplate original usa 'complexity: number'. 
// Para simplificar e alinhar com a API /generate, usaremos o enum Complexity aqui.
// Se o frontend realmente usa a escala 0-100, pode ser necessário ajustar.
// Também removi 'platforms', 'tags', 'title', 'length' e 'complexity' (number) da definição original 
// para alinhar com o que a API /generate espera como input ou pode inferir.
// Se esses campos forem necessários no frontend, a definição aqui ou a interface em types.ts precisará ser ajustada.

export interface SimplePromptTemplate {
  id: string;
  name: string; // Substitui 'title'
  description: string;
  mode: PromptMode;
  defaultKeywords: string; // Substitui 'keywords'
  defaultTone?: Tone;
  defaultComplexity?: Complexity;
  imageStyle?: string;
  // defaultLength?: Length; // Removido pois não é usado na API /generate
  // defaultContext?: string; // Removido para simplificar
  // defaultIncludeExamples?: boolean; // Removido para simplificar
}

export const templates: SimplePromptTemplate[] = [
  {
    id: 'blog-outline',
    name: 'Esboço de Post de Blog',
    description: 'Gera uma estrutura de tópicos para um artigo de blog sobre um determinado assunto.',
    mode: 'website_creation' as PromptMode, // Usando type assertion
    defaultKeywords: 'Esboço para post de blog sobre [TEMA]',
    defaultTone: Tone.PROFESSIONAL,
    defaultComplexity: Complexity.MODERATE,
  },
  {
    id: 'short-social-media-post',
    name: 'Post Curto para Mídia Social',
    description: 'Cria um post rápido e engajante para mídias sociais.',
    mode: 'website_creation' as PromptMode,
    defaultKeywords: 'Post curto sobre [ASSUNTO] para [PLATAFORMA]',
    defaultTone: Tone.FRIENDLY,
    defaultComplexity: Complexity.SIMPLE,
  },
  {
    id: 'logo-minimalist',
    name: 'Prompt para Logo Minimalista',
    description: 'Cria um prompt detalhado para gerar um logo minimalista usando IA.',
    mode: 'image_generation' as PromptMode,
    defaultKeywords: 'Logo minimalista para [MARCA/CONCEITO] representando [VALORES/IDEIAS]',
    defaultTone: Tone.CREATIVE,
    defaultComplexity: Complexity.DETAILED,
    imageStyle: 'minimalist'
  },
  {
    id: 'realistic-image',
    name: 'Prompt para Imagem Realista',
    description: 'Gera um prompt para criar uma imagem com estilo hiper-realista.',
    mode: 'image_generation' as PromptMode,
    defaultKeywords: 'Imagem hiper-realista de [CENA/OBJETO] com [DETALHES IMPORTANTES]',
    defaultTone: Tone.NEUTRAL,
    defaultComplexity: Complexity.DETAILED,
    imageStyle: 'realistic'
  },
]; 