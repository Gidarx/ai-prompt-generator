import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { PromptParams, Complexity, PromptMode, Tone } from '@/lib/types';

// Configuração de timeout para o Vercel - aumenta o limite para 60 segundos (o padrão é 10s)
export const maxDuration = 60; // segundos
export const dynamic = 'force-dynamic';

// Inicializa o cliente do Google Gemini (API Key é lida aqui)
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
// Modelo padrão a ser usado se nenhum for especificado na requisição
const DEFAULT_MODEL_ID = 'gemini-1.5-flash'; // Modelo mais estável e amplamente disponível

// Configurações de segurança para bloquear conteúdo nocivo
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Definição de correções para palavras-chave comuns (expandida)
const keywordCorrections: Record<string, string> = {
  "desingners": "designers",
  "programaçao": "programação",
  "progamação": "programação",
  "programacão": "programação",
  "develoment": "development",
  "desenvolviment": "desenvolvimento",
  "markting": "marketing",
  "inteligencia": "inteligência",
  "artifical": "artificial",
  "inteligecia": "inteligência",
  "assisntent": "assistant",
  "assistemt": "assistant",
  "assitant": "assistant",
  "generacao": "geração",
  "linguagen": "linguagem",
  "linguajem": "linguagem",
  "aplicativo": "app",
  "aplicação": "aplicativo",
  "desenvolvedor": "dev",
  "ux/ui": "UX/UI design",
  "disigner": "designer",
  "desinger": "designer",
  "usuario": "usuário",
  "experiencia": "experiência",
  "api": "API",
  "restful": "RESTful",
  "javascript": "JavaScript",
  "typescript": "TypeScript",
  "reactjs": "React",
  "nodejs": "Node.js",
  "nextjs": "Next.js",
  "machine learning": "machine learning", // Manter termos compostos
  "user interface": "user interface",
  "user experience": "user experience",
  "data science": "data science",
  "web development": "web development",
  "mobile app": "mobile app",
  "social media": "social media",
  "blog post": "blog post",
};

// Lista de verbos instrucionais em português para detecção de instruções (expandida)
const instructionalVerbs = [
  "faça", "crie", "desenvolva", "elabore", "construa", "produza", "prepare",
  "monte", "conceba", "projete", "planeje", "desenhe", "escreva", "programe",
  "implemente", "ajude", "me ajude", "preciso", "quero", "desejo", "gostaria",
  "necessito", "pode", "poderia", "como", "me dê", "sugira", "recomende",
  "gere", "liste", "explique", "resuma", "compare", "defina", "traduza",
  "otimize", "refine", "modifique", "altere", "simplifique", "detalhe"
];

/**
 * Normaliza e corrige palavras-chave, verificando também formatos de instrução
 * @param keywords As palavras-chave inseridas pelo usuário
 * @returns Palavras-chave corrigidas e normalizadas
 */
function correctKeywords(keywords: string): string {
  // Converte para minúsculas
  let normalizedKeywords = keywords.toLowerCase().trim();

  // Detecta se o input começa com um verbo instrucional
  const startsWithInstruction = instructionalVerbs.some(verb =>
    normalizedKeywords.startsWith(verb + " ") ||
    normalizedKeywords.startsWith(verb + ",") ||
    normalizedKeywords === verb // Verifica se é apenas o verbo
  );

  // Se for uma instrução, extraímos os conceitos principais
  if (startsWithInstruction) {
    console.log('Detectada instrução em vez de palavras-chave');

    // Remove verbos instrucionais do início
    for (const verb of instructionalVerbs) {
      if (normalizedKeywords.startsWith(verb + " ")) {
        normalizedKeywords = normalizedKeywords.slice(verb.length).trim();
        break; // Só remove o primeiro encontrado
      }
      if (normalizedKeywords === verb) {
          normalizedKeywords = ''; // Se for só o verbo, limpa
          break;
      }
    }

    // Remove palavras comuns que não agregam valor ao prompt (expandida)
    const fillerWords = [
        "um", "uma", "uns", "umas",
        "para", "que", "me", "mim", "lhe", "ele", "ela", "eles", "elas",
        "a", "o", "as", "os",
        "de", "da", "do", "das", "dos",
        "em", "no", "na", "nos", "nas",
        "com", "por", "sobre", "acerca", "tipo", "estilo",
        "por favor", "gentilmente", "agora", "então",
        "quero que", "gostaria de", "preciso de", "me faça", "me crie"
        ];
    for (const word of fillerWords) {
      const regex = new RegExp(`^${word}\b\s*|\s*\b${word}\b`, 'gi'); // Remove no início ou com espaço antes
      normalizedKeywords = normalizedKeywords.replace(regex, ' ').trim();
    }

    // Remove pontuação comum no início/fim que pode sobrar
    normalizedKeywords = normalizedKeywords.replace(/^[.,!?;:]+|[.,!?;:]+$/g, '').trim();

    // Remove espaços duplos
    normalizedKeywords = normalizedKeywords.replace(/\s+/g, ' ').trim();

    console.log('Keywords extraídas da instrução:', normalizedKeywords);
  }

  // Corrige palavras-chave conhecidas com erros de digitação
  // Aplica primeiro as correções de palavras compostas para evitar separação
  for (const [incorrect, correct] of Object.entries(keywordCorrections)) {
    if (incorrect.includes(' ')) { // Aplica primeiro as correções de termos compostos
        const regex = new RegExp(`\b${incorrect}\b`, 'gi');
        normalizedKeywords = normalizedKeywords.replace(regex, correct);
    }
  }
  // Aplica correções de palavras simples
  for (const [incorrect, correct] of Object.entries(keywordCorrections)) {
     if (!incorrect.includes(' ')) {
        const regex = new RegExp(`\b${incorrect}\b`, 'gi');
        normalizedKeywords = normalizedKeywords.replace(regex, correct);
    }
  }

  return normalizedKeywords;
}

/**
 * Gera um prompt alternativo quando a API falha
 * @param params Parâmetros para geração do prompt
 * @returns Prompt gerado como fallback
 */
function generateFallbackPrompt(params: PromptParams): string {
  const { keywords, tone, complexity, includeExamples, mode, imageStyle, negativePrompt } = params;

  // Mapeia enums para strings mais descritivas
  const toneMap: Record<string, string> = {
    [Tone.PROFESSIONAL]: "profissional e formal",
    [Tone.FRIENDLY]: "amigável e acessível",
    [Tone.ENTHUSIASTIC]: "entusiasmado e encorajador",
    [Tone.CREATIVE]: "criativo e inspirador",
    [Tone.CASUAL]: "casual e conversacional",
    [Tone.TECHNICAL]: "técnico e preciso",
    [Tone.NEUTRAL]: "neutro e balanceado",
    [Tone.FORMAL]: "formal e estruturado",
    [Tone.AUTHORITATIVE]: "autoritativo e confiante"
  };

  const complexityMap: Record<string, string> = {
    [Complexity.SIMPLE]: "simples e diretas",
    [Complexity.MODERATE]: "com moderada complexidade",
    [Complexity.DETAILED]: "detalhadas e abrangentes",
    [Complexity.BEGINNER]: "para iniciantes",
    [Complexity.INTERMEDIATE]: "para nível intermediário",
    [Complexity.ADVANCED]: "para nível avançado"
  };

  // Base do prompt de fallback (mantido como antes, pois é um fallback)
  let basePrompt = `Crie um prompt claro e eficaz sobre "${keywords}" com um tom ${toneMap[tone] || 'profissional'} e instruções ${complexityMap[complexity] || 'moderadas'}.`;

  // Adiciona instruções específicas baseadas no modo
  if (mode) {
    const modeMap: Record<string, string> = {
      ["app_creation"]: "App",
      ["image_generation"]: "Imagem",
      ["website_creation"]: "Site",
    };

    switch (mode) {
      case "app_creation":
        basePrompt += ` O prompt deve guiar o desenvolvimento de um aplicativo, considerando funcionalidades, design de interface, experiência do usuário e tecnologias recomendadas.`;
        break;
      case "image_generation":
        basePrompt += ` O prompt deve descrever detalhadamente a imagem a ser criada, incluindo estilo visual, elementos principais, composição, cores, iluminação e atmosfera.`;
        
        // Adicionar prompt negativo se fornecido
        if (negativePrompt) {
          basePrompt += ` Elementos a evitar (prompt negativo): ${negativePrompt}.`;
        }

        // Adicionar diretrizes específicas baseadas no estilo de imagem selecionado
        if (imageStyle) {
          switch(imageStyle) {
            case "realistic":
              basePrompt += ` A imagem deve seguir um estilo HIPER-REALISTA, com altíssimo nível de detalhe, texturas realistas, iluminação natural e física correta. Deve parecer uma fotografia de alta qualidade feita por uma câmera profissional.`;
              break;
            case "cinematic":
              basePrompt += ` A imagem deve seguir um estilo CINEMATOGRÁFICO, com enquadramento cuidadoso, profundidade de campo, contraste dramático e paleta de cores característica de filmes. Deve incluir elementos de composição de cinema como iluminação lateral, proporção widescreen e sensação de narrativa visual.`;
              break;
            case "anime":
              basePrompt += ` A imagem deve seguir um estilo ANIME/MANGÁ, com linhas bem definidas, olhos expressivos e grandes, proporções estilizadas, e elementos visuais característicos de anime japonês. Deve incorporar técnicas de sombreamento cel-shading e expressões faciais exageradas quando apropriado.`;
              break;
            case "cartoon":
              basePrompt += ` A imagem deve seguir um estilo CARTOON, com formas simplificadas, contornos evidentes, cores vivas e elementos de desenho animado. O estilo deve ser alegre e expressivo, com proporções exageradas e simplificação de detalhes realistas.`;
              break;
            case "pixel_art":
              basePrompt += ` A imagem deve seguir um estilo PIXEL ART, com resolução baixa deliberada, pixels visíveis e limitação de paleta de cores. Deve respeitar as limitações do meio, usando dithering quando apropriado e evitando anti-aliasing excessivo.`;
              break;
            case "watercolor":
              basePrompt += ` A imagem deve seguir um estilo AQUARELA, com cores translúcidas, fusão suave de tons, textura de papel visível e técnicas características como wet-on-wet. Deve ter uma qualidade etérea com bordas difusas e variações sutis de cor.`;
              break;
            case "oil_painting":
              basePrompt += ` A imagem deve seguir um estilo PINTURA A ÓLEO, com textura de tela visível, pinceladas densas e texturadas, profundidade de cor rica e técnicas de impasto. Deve imitar a qualidade tridimensional da tinta a óleo com variações visíveis de espessura.`;
              break;
            case "digital_art":
              basePrompt += ` A imagem deve seguir um estilo ARTE DIGITAL moderna, com acabamento polido, cores vibrantes, iluminação dinâmica e detalhes precisos. Deve incorporar técnicas digitais contemporâneas com elementos gráficos claros e composição planejada.`;
              break;
            case "abstract":
              basePrompt += ` A imagem deve seguir um estilo ABSTRATO, focando em formas, cores e composições não-figurativas. Deve usar elementos visuais puros como linhas, formas geométricas e gradientes para expressar emoções e ideias sem representação literal.`;
              break;
            case "double_exposure":
              basePrompt += ` A imagem deve seguir um estilo DUPLA EXPOSIÇÃO, com duas imagens distintas mescladas harmoniosamente. Deve ter uma imagem principal (geralmente um retrato) combinada com outra imagem (geralmente paisagem ou textura) que se integrem criando narrativa visual interessante com contraste e complementaridade.`;
              break;
            case "analog":
              basePrompt += ` A imagem deve seguir um estilo ANALÓGICO/FILME, com características de fotografias de filme como grão visível, leve vazamento de luz, vinheta, cores características de filmes específicos (Kodak, Fuji, etc), e imperfeições autênticas que dão personalidade e nostalgia.`;
              break;
            case "cyberpunk":
              basePrompt += ` A imagem deve seguir um estilo CYBERPUNK, com néons intensos, contraste extremo entre luz e sombra, tecnologia futurista integrada com elementos decadentes, atmosfera noturna chuvosa, e temática de alta tecnologia e baixa qualidade de vida.`;
              break;
            case "fantasy":
              basePrompt += ` A imagem deve seguir um estilo FANTASIA, com elementos mágicos, criaturas mitológicas, ambientes imaginários e detalhes decorativos elaborados. Deve incluir iluminação dramática, atmosfera mística e elementos visuais que transcendem a realidade comum.`;
              break;
            case "surrealism":
              basePrompt += ` A imagem deve seguir um estilo SURREALISTA, com justaposições inesperadas, distorções da realidade, simbolismo visual e elementos oníricos. Deve criar uma sensação de estranhamento e apresentar realidades alternativas com execução tecnicamente precisa de cenários impossíveis.`;
              break;
            case "minimalist":
              basePrompt += ` A imagem deve seguir um estilo MINIMALISTA, com formas simplificadas, espaço negativo amplo, paleta de cores limitada e foco em elementos essenciais. Deve comunicar ideias com eficiência máxima, eliminando detalhes desnecessários e enfatizando composição limpa.`;
              break;
            case "collectible_figure":
              basePrompt += ` A imagem deve representar uma FIGURA DE AÇÃO COLECIONÁVEL, apresentando um personagem extremamente detalhado em embalagem premium. A figura deve ter características faciais precisas, pose articulada, roupas com textura, e acessórios temáticos. Inclua embalagem tipo blister ou caixa com janela transparente, elementos gráficos de marca, informações do produto e texto promocional. Utilize iluminação típica de fotografia de produto com reflexos sutis na embalagem plástica, iluminação focada na figura principal, e apresentação de qualidade comercial profissional.`;
              break;
            case "cinematic_double_exposure":
              basePrompt += ` A imagem deve seguir um estilo de DUPLA EXPOSIÇÃO CINEMATOGRÁFICA, apresentando uma combinação sofisticada de silhuetas e cenas inspiradas em estética de filmes. Crie uma composição onde a silhueta de um personagem principal contém uma cena interior emocional com rica narrativa visual. Utilize controle preciso de cores com dessaturação seletiva, criando contraste entre fundos em preto e branco e elementos centrais em cores suaves. Incorpore elementos visuais específicos de cinema (objetos icônicos, locações reconhecíveis, interações entre personagens) e técnicas de iluminação cinematográfica (iluminação de contorno, sombras dramáticas, luz filtrando através de persianas ou janelas). A estética geral deve transmitir profundidade narrativa, ressonância emocional e a linguagem visual do cinema clássico, mantendo equilíbrio compositivo entre a silhueta externa e a cena interna.`;
              break;
            case "character_double_exposure":
              basePrompt += ` A imagem deve seguir um estilo DUPLA EXPOSIÇÃO DE PERSONAGEM, apresentando a silhueta de um personagem icônico preenchida com paisagens, ambientes ou elementos narrativos tematicamente relevantes que definem sua jornada ou personalidade. A composição deve combinar o contorno reconhecível do personagem com cenas interiores de alto contraste que contam sua história visualmente. Use tratamento seletivo de cores - geralmente fundos monocromáticos com cores vibrantes dentro da silhueta. Inclua elementos visuais significativos como acessórios característicos, locais ou imagens simbólicas que reforcem a identidade do personagem. Aplique técnicas de iluminação dramática para aumentar o impacto emocional. Atenção especial deve ser dada aos detalhes finos dentro da silhueta do personagem, com definição nítida entre o contorno do personagem e o fundo. A imagem final deve transmitir profundidade narrativa e ressonância emocional enquanto celebra a essência do personagem.`;
              break;
            case "midjourney_style":
              basePrompt += ` A imagem deve seguir o ESTILO MIDJOURNEY, apresentando imagens extremamente detalhadas e de alta qualidade com composição impecável e iluminação dramática. Use texturas ricas, cores vibrantes com equilíbrio perfeito de contraste e pontos focais imaculados. O estilo deve incluir detalhes ultra-nítidos em áreas-chave, mantendo transições suaves e sonhadoras em outras. Aplique gradação de cores cinematográfica com destaques e sombras sofisticados. Elementos característicos importantes incluem sutis distorções de lente, profundidade de campo perfeita, efeitos atmosféricos (iluminação volumétrica, partículas, névoa) e alto alcance dinâmico. Cada elemento deve parecer meticulosamente elaborado com hiper-realismo estilizado que equilibra qualidades fotográficas com aprimoramentos artísticos. As paletas de cores devem ser ricas, mas harmoniosas, com atenção cuidadosa aos tons complementares. Inclua palavras-chave como 'altamente detalhado', 'ultra alta resolução', 'fotorrealista', '8k', 'iluminação cinematográfica' para reforçar a estética Midjourney.`;
              break;
            default:
              basePrompt += ` A imagem deve ter um estilo visual coerente e bem definido que melhor comunique a ideia central.`;
          }
        }
        break;
      case "website_creation":
        basePrompt += ` O prompt deve orientar a criação de um site moderno e profissional, especificando design, funcionalidades, tecnologias, experiência do usuário e objetivos do projeto.`;
        break;
      case "logo_creation":
        basePrompt += ` O prompt deve orientar a criação de um logo moderno e profissional, especificando estilo visual, elementos de design, tipografia, cores e conceitos de marca baseados nas tendências 2025.`;
        break;
    }
  }

  // Adiciona exemplos se solicitado
  if (includeExamples) {
    basePrompt += ` Inclua alguns exemplos para ilustrar o tipo de resposta esperada.`;
  }

  // Exemplos por tipo de modo para melhorar a qualidade do fallback
  const examplePrompts: Record<string, string[]> = {
    ["app_creation"]: [
      `Crie um aplicativo de gerenciamento de tarefas com foco em produtividade para profissionais. O app deve incluir listas de tarefas, priorização, lembretes, integração com calendário e análise de produtividade. A interface deve ser minimalista, usando um esquema de cores que promova foco. Inclua recursos premium como sincronização entre dispositivos e backup na nuvem.`,
      `Desenvolva um aplicativo de fitness personalizado que adapte treinos às necessidades do usuário. Funcionalidades devem incluir: rastreamento de exercícios, planos de treinamento ajustáveis, métricas de progresso, integração com dispositivos wearable e orientação por vídeo. Design deve ser energético e motivacional, com gamificação para aumentar o engajamento.`
    ],
    ["image_generation"]: [
      `Crie uma imagem fotorrealista de uma cidade futurista à noite. Arranha-céus com luzes neon em azul e roxo, carros voadores, hologramas flutuantes. Perspectiva ao nível da rua, mostrando pessoas caminhando. Iluminação dramática com reflexos molhados nas ruas. Estilo cyberpunk com alta definição e detalhes arquitetônicos inovadores.`,
      `Gere uma paisagem fantástica de um vale com montanhas flutuantes cobertas de vegetação exuberante e pequenas cachoeiras caindo no vazio. Luz dourada do pôr do sol criando halos ao redor das ilhas flutuantes. Estilo artístico misturando pintura digital com elementos de aquarela. Cores vibrantes com predominância de verdes, azuis e dourados.`,
      `Uma exposição dupla, estilo Midjourney, revelando uma composição de Leonardo DiCaprio, Jamie Foxx e Christoph Waltz no filme Django Livre de Tarantino, harmoniosamente entrelaçada com paisagens impressionantes do oeste americano durante um inverno rigoroso. Florestas cobertas de neve, picos montanhosos gelados, e os personagens montando cavalos por trilhas na neve, ecoam através da silhueta dos protagonistas, adicionando camadas de narrativa e solidão. Contraste nítido no fundo monocromático dirige o foco para a dupla exposição ricamente detalhada. (Detalhado:1.45). (Fundo detalhado:1.4).`,
      `Um retrato analógico de uma cantora idol coreana com beleza e charme de tirar o fôlego. Ela possui uma silhueta feminina bonita e curvas moderadas. Com cabelo ondulado como de modelo, seus olhos penetrantes, rosto e corpo olham diretamente para a câmera. Usa brincos e roupas retrô de hip-hop, com logotipo da Nike sutilmente posicionado na jaqueta. Fotografado com Contax T2 e filme Kodak Gold 200 contra um cenário de rua dos anos 80. Capturando um pôr do sol suave e natural, com luz indireta criando highlights cremosos e sombras equilibradas. Paleta de cores nostálgica com amarelos profundos, vermelhos e laranjas suaves, verdes suaves e azuis próximos ao turquesa. Granulosidade moderada e claridade natural.`,
      `Um close-up espontâneo e nebuloso de uma jovem mulher coreana deslumbrante — etérea, quase sobrenatural em sua beleza, com maxilar definido, olhos grandes e cabelo loiro. Seu olhar é distante e sonhador, como se estivesse entre o riso e uma memória, olhando ligeiramente além da câmera com olhos suaves e desfocados. Sua maquiagem está borrada, não bagunçada — mais como um borrão noturno de glitter e cor, batom desbotado nas bordas, máscara formando halos sob seus olhos como aquarela. Pele úmida e brilhante de suor ou calor do verão, com mechas de cabelo grudadas delicadamente em seu rosto. Capturada em meio a um momento, boca ligeiramente aberta como se estivesse prestes a falar ou rir. O flash a ilumina como se fosse o centro de um sonho — o fundo se dissolvendo em sombras suaves. Fotografada com um celular com grão de filme vintage e leve desfoque de movimento.`
    ],
    ["website_creation"]: [
      `Crie um site moderno e responsivo para uma startup de tecnologia financeira (fintech). O site deve incluir: página inicial com hero section impactante, seção sobre a empresa, demonstração do produto, depoimentos de clientes, blog e página de contato. Use design minimalista com cores azul e branco, tipografia moderna (Inter ou similar), animações sutis e micro-interações. Tecnologias: Next.js, Tailwind CSS, Framer Motion. Foque em conversão e experiência do usuário otimizada para mobile-first.`,
      `Desenvolva um portfólio online para um designer UX/UI freelancer. Estrutura: header com navegação sticky, hero section com apresentação pessoal, galeria de projetos com filtros por categoria, seção sobre habilidades e ferramentas, depoimentos de clientes, blog pessoal e formulário de contato. Design: estilo moderno e clean, uso criativo de whitespace, tipografia elegante, paleta de cores neutras com acentos coloridos. Inclua animações de scroll, hover effects e transições suaves. Otimizado para SEO e performance.`,
      `Construa um e-commerce moderno para uma marca de roupas sustentáveis. Funcionalidades: catálogo de produtos com filtros avançados, carrinho de compras, checkout seguro, sistema de avaliações, wishlist, programa de fidelidade e blog sobre sustentabilidade. Design: interface limpa e intuitiva, fotografia de alta qualidade, cores terrosas, tipografia legível. Tecnologias: React/Next.js, Stripe para pagamentos, headless CMS. Foque em storytelling da marca e experiência de compra fluida.`,
      `Desenvolva um site institucional para uma clínica médica especializada. Seções: página inicial com agendamento online, sobre a clínica, equipe médica, especialidades, convênios aceitos, localização e contato. Design profissional e confiável com cores azul e branco, tipografia clara, ícones médicos sutis. Funcionalidades: sistema de agendamento integrado, chat online, área do paciente, blog com artigos de saúde. Responsivo, acessível (WCAG) e otimizado para busca local.`,
      `Crie um site para uma agência de marketing digital. Estrutura: hero section com proposta de valor clara, serviços oferecidos, cases de sucesso com métricas, sobre a agência, equipe, blog e formulário de orçamento. Design: moderno e dinâmico, gradientes sutis, animações de dados, cores vibrantes (roxo/laranja). Inclua calculadora de ROI interativa, depoimentos em vídeo, certificações e prêmios. Tecnologias: Next.js, Tailwind, animações com Framer Motion, analytics avançado.`
    ],
    ["logo_creation"]: [
      `Crie um logo minimalista moderno para uma startup de tecnologia sustentável chamada "EcoTech". O logo deve combinar elementos tecnológicos com natureza, usando formas geométricas limpas e uma paleta de verde e azul. Estilo vetorial flat design, sem gradientes, com tipografia sans-serif moderna e condensada. O símbolo deve funcionar bem em pequenos tamanhos e ser facilmente reconhecível. Inclua uma versão horizontal e vertical, considerando uso em aplicativos móveis e redes sociais.`,
      `Desenvolva um logo elegante para uma marca de cosméticos premium "Lumina Beauty". Use estilo minimalista com foco em tipografia sofisticada, incorporando elementos dourados sutis. O design deve transmitir luxo e feminilidade através de formas orgânicas suaves e espaço negativo inteligente. Paleta: dourado, rosa suave e branco. Tipografia serif moderna com ligaduras personalizadas. O logo deve funcionar em embalagens, digital e impressos de alta qualidade.`,
      `Crie um logo ousado e geométrico para uma academia de crossfit "Iron Core". Use formas angulares e linhas grossas que transmitam força e energia. Paleta de cores: preto, vermelho intenso e cinza. Tipografia sans-serif condensada e pesada. Incorpore elementos abstratos que remetam a equipamentos de treino ou movimento atlético. O design deve ser impactante em camisetas, equipamentos e sinalização da academia.`,
      `Desenvolva um monograma sofisticado para um escritório de advocacia "Silva & Associados". Use as iniciais S&A de forma elegante e profissional, com elementos que remetam à justiça de forma sutil. Paleta: azul marinho, dourado e branco. Tipografia serif clássica com detalhes refinados. O logo deve transmitir confiança, tradição e excelência, funcionando bem em papelaria corporativa e materiais digitais.`,
      `Crie um logo orgânico e natural para uma marca de alimentos saudáveis "Pure Harvest". Use formas fluidas inspiradas na natureza, com elementos que remetam a folhas, grãos ou crescimento. Paleta de verdes naturais, marrom terra e bege. Estilo hand-drawn moderno com toques artesanais. A tipografia deve ser amigável e legível, transmitindo saúde e sustentabilidade. Adequado para embalagens de produtos orgânicos e marketing digital.`
    ],
  };

  // Exemplos específicos para estilos de imagem se o modo for image_generation
  if (mode === "image_generation" && imageStyle) {
    // Use os exemplos de prompts baseados no estilo selecionado
    const styleExamples: Record<string, string[]> = {
      "realistic": [
        `Crie uma imagem hiper-realista de um tigre siberiano emergindo de um lago congelado. Gotas de água congelando no ar enquanto ele se sacode. Luz do amanhecer criando reflexos dourados em seu pelo molhado. Detalhes minuciosos de cada pelo, músculos tensionados sob a pele e cristais de gelo na água. Profundidade de campo superficial focando nos olhos penetrantes do tigre. Vapor saindo de suas narinas no ar gelado. Qualidade fotográfica ultra HD que captura texturas, imperfeições naturais e reflexos de luz com precisão científica.`,
        `Uma fotografia hiper-realista de uma metrópole futurista durante uma tempestade elétrica. Arranha-céus de vidro e aço refletindo relâmpagos roxos e azuis. Chuva forte criando cascatas nas fachadas dos edifícios e formando poças que refletem as luzes da cidade. Nível de detalhe extremo mostrando gotas individuais, reflexos complexos, e a textura das nuvens carregadas. Composição dramática com contraste acentuado entre áreas iluminadas e sombras profundas. Perspectiva aérea capturando a vastidão urbana iluminada pela tempestade.`
      ],
      "double_exposure": [
        `Um retrato em dupla exposição de um homem pensativo com expressão serena. Seu perfil se mescla perfeitamente com uma floresta de pinheiros coberta de névoa. Os galhos das árvores parecem estender-se como veias através de seu rosto, enquanto raios de luz matinal filtram-se entre os troncos e iluminam seus olhos. Contraste marcante entre a silhueta escura das árvores e a luz suave que define o contorno do rosto. A textura da casca dos pinheiros se funde com as linhas de expressão do sujeito, criando uma metáfora visual de conexão com a natureza. Composição equilibrada com transições suaves entre as duas imagens.`,
        `Uma dupla exposição elegante combinando o perfil de uma mulher jovem com a silhueta de Manhattan ao pôr do sol. Os arranha-céus se projetam para cima dentro da forma de seu rosto, com o Empire State Building alinhado precisamente com seu olho. A linha do horizonte da cidade forma a curva de seu queixo e pescoço. Tons quentes de dourado e âmbar do céu crepuscular preenchem metade de seu perfil, enquanto tons azuis profundos da noite emergente ocupam a outra metade. As luzes dos edifícios brilham como estrelas dentro da silhueta, criando uma constelação urbana que conta uma história de sonhos e ambições.`
      ],
      "analog": [
        `Um retrato analógico intimista de um músico de jazz idoso em um clube esfumaçado. Fotografado com uma Leica M6 em filme Kodak Tri-X 400 empurrado para 1600. Grão pronunciado mas agradável, com rica textura e contraste dramático. Iluminação de baixa intensidade com apenas um feixe de luz destacando seu rosto enrugado e mãos experientes segurando um saxofone. Leve vazamento de luz no canto superior criando um efeito de halo. Vinheta natural escurecendo os cantos. Algumas imperfeições como arranhões sutis e manchas de poeira que adicionam autenticidade à imagem.`,
        `Uma cena de rua capturada em filme analógico Kodak Portra 400 com uma câmera Contax T2. Dois amigos rindo em uma cafeteria parisiense enquanto a chuva cai suavemente do lado de fora. Cores pastéis suaves com tons de verde e azul levemente dessaturados. Cores de pele quentes e naturais características do filme Portra. Leve vazamento de luz criando um brilho dourado no canto do quadro. Bokeh suave nas luzes desfocadas da cidade ao fundo. Grão fino mas visível dando textura e calor à imagem. Leve perda de detalhes nas sombras que adiciona mistério e profundidade.`
      ]
    };

    // Se tivermos exemplos para o estilo selecionado, use-os
    if (styleExamples[imageStyle] && styleExamples[imageStyle].length > 0) {
      // Escolha aleatoriamente um dos exemplos disponíveis para esse estilo
      const randomStyleExample = styleExamples[imageStyle][Math.floor(Math.random() * styleExamples[imageStyle].length)];
      // Substitua o exemplo padrão do modo por um exemplo específico do estilo
      basePrompt += `\n\nExemplo de prompt para ${imageStyle}:\n"${randomStyleExample}"`;
      return basePrompt; // Retorne aqui para evitar adicionar exemplos genéricos
    }
  }

  // Adiciona um exemplo específico baseado no modo (se disponível) - só será executado se não tiver retornado acima
  if (mode && examplePrompts[mode] && examplePrompts[mode].length > 0) {
    // Escolhe aleatoriamente um dos exemplos disponíveis para esse modo
    const randomExample = examplePrompts[mode][Math.floor(Math.random() * examplePrompts[mode].length)];
    basePrompt += `\n\nExemplo de prompt para este caso:\n"${randomExample}"`;
  }

  return basePrompt;
}

/**
 * Função principal que recebe as solicitações POST para geração de prompts
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verifica se todos os parâmetros obrigatórios foram fornecidos
    if (!body.keywords || !body.tone || !body.complexity || !body.mode) {
      return NextResponse.json(
        { error: "Parâmetros incompletos" },
        { status: 400 }
      );
    }

    // Extrai e normaliza os parâmetros
    const params: PromptParams = {
      keywords: correctKeywords(body.keywords),
      context: body.context,
      tone: body.tone,
      length: body.length || 'medium',
      complexity: body.complexity,
      mode: body.mode,
      includeExamples: body.includeExamples !== undefined ? body.includeExamples : true,
      imageStyle: body.imageStyle,
      language: body.language || 'portuguese',
      negativePrompt: body.negativePrompt,
      modelId: body.modelId || DEFAULT_MODEL_ID,
    };

    // Log dos parâmetros recebidos para debug
    console.log("Gerando prompt com os parâmetros:", params);

    // Constantes para retentativas
    const MAX_RETRIES = 3;
    const INITIAL_TIMEOUT = 20000; // 20 segundos para primeira tentativa
    
    // Implementação de retentativas com timeout crescente
    let lastError = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Timeout aumenta a cada tentativa (20s, 30s, 40s)
        const timeout = INITIAL_TIMEOUT + (attempt * 10000);
        
        // Promessa da chamada da API com timeout
        const responsePromise = generatePromptWithGemini(params);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout após ${timeout/1000} segundos`)), timeout)
        );
        
        // Compete entre resposta e timeout
        const response = await Promise.race([responsePromise, timeoutPromise]);
        
        // Se chegou aqui, retorna o resultado com sucesso
        return NextResponse.json(response);
      } catch (error: any) {
        console.error(`Tentativa ${attempt + 1} falhou:`, error.message);
        lastError = error;
        
        // Se não for a última tentativa, espera um pouco antes de tentar novamente
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Espera 1 segundo
          console.log(`Tentando novamente (${attempt + 2}/${MAX_RETRIES})...`);
        }
      }
    }

    // Todas as tentativas falharam, usamos o fallback
    console.warn("Todas as tentativas API falharam, usando fallback local");
    const fallbackPrompt = generateFallbackPrompt(params);
    
    return NextResponse.json({
      id: `fallback-${Date.now()}`,
      timestamp: Date.now(),
      params,
      genericPrompt: fallbackPrompt,
    });

  } catch (error: any) {
    console.error("Erro na API:", error.message);
    return NextResponse.json(
      { error: `Erro no processamento: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Função que efetivamente faz a chamada para a API do Gemini
 */
async function generatePromptWithGemini(params: PromptParams) {
  const model = genAI.getGenerativeModel({ model: params.modelId || DEFAULT_MODEL_ID });

    // --- INÍCIO DAS ALTERAÇÕES NOS PROMPTS ---

    // Mapeamentos para descrições textuais
    const toneMap: Record<string, string> = {
      [Tone.PROFESSIONAL]: params.language === "english" ? "professional and formal" : "profissional e formal",
      [Tone.FRIENDLY]: params.language === "english" ? "friendly and accessible" : "amigável e acessível",
      [Tone.ENTHUSIASTIC]: params.language === "english" ? "enthusiastic and encouraging" : "entusiasmado e encorajador",
      [Tone.CREATIVE]: params.language === "english" ? "creative and inspiring" : "criativo e inspirador",
      [Tone.CASUAL]: params.language === "english" ? "casual and conversational" : "casual e conversacional",
      [Tone.TECHNICAL]: params.language === "english" ? "technical and precise" : "técnico e preciso",
      [Tone.NEUTRAL]: params.language === "english" ? "neutral and balanced" : "neutro e balanceado",
      [Tone.FORMAL]: params.language === "english" ? "formal and structured" : "formal e estruturado",
      [Tone.AUTHORITATIVE]: params.language === "english" ? "authoritative and confident" : "autoritativo e confiante"
    };

    const complexityMap: Record<string, string> = {
      [Complexity.SIMPLE]: params.language === "english" ? "simple and direct" : "simples e direto",
      [Complexity.MODERATE]: params.language === "english" ? "moderately detailed" : "moderadamente detalhado",
      [Complexity.DETAILED]: params.language === "english" ? "detailed and comprehensive" : "detalhado e abrangente",
      [Complexity.BEGINNER]: params.language === "english" ? "suitable for beginners" : "adequado para iniciantes",
      [Complexity.INTERMEDIATE]: params.language === "english" ? "intermediate level" : "de nível intermediário",
      [Complexity.ADVANCED]: params.language === "english" ? "advanced level" : "para nível avançado"
    };

    const modeMap: Record<string, string> = {
      ["app_creation"]: params.language === "english" ? "app development" : "desenvolvimento de aplicativo",
      ["image_generation"]: params.language === "english" ? "image generation" : "geração de imagem",
      ["website_creation"]: params.language === "english" ? "website creation" : "criação de site",
      ["logo_creation"]: params.language === "english" ? "logo creation" : "criação de logo",
    };

    // Definições específicas para cada estilo de imagem
    const imageStyleDefinitions: Record<string, string> = {
      "realistic": params.language === "english" 
        ? "HYPER-REALISTIC, with extremely high level of photographic detail, realistic textures, natural lighting and correct physics. It should look like a high-quality photograph taken with a professional camera."
        : "HIPER-REALISTA, com altíssimo nível de detalhe fotográfico, texturas realistas, iluminação natural e física correta. Deve parecer uma fotografia de alta qualidade feita com câmera profissional.",
      "cinematic": "CINEMATOGRÁFICO, com enquadramento cuidadoso, profundidade de campo, contraste dramático e paleta de cores característica de filmes. Com iluminação lateral, proporção widescreen e narrativa visual.",
      "anime": "ANIME/MANGÁ, com linhas bem definidas, olhos expressivos e grandes, proporções estilizadas e elementos visuais típicos de anime japonês.",
      "cartoon": "CARTOON, com formas simplificadas, contornos evidentes, cores vivas e elementos de desenho animado. Alegre e expressivo, com proporções exageradas.",
      "pixel_art": "PIXEL ART, com resolução baixa deliberada, pixels visíveis e limitação de paleta de cores. Respeitando as limitações do meio com dithering quando apropriado.",
      "watercolor": "AQUARELA, com cores translúcidas, fusão suave de tons, textura de papel visível e bordas difusas com variações sutis de cor.",
      "oil_painting": "PINTURA A ÓLEO, com textura de tela visível, pinceladas densas e texturadas, profundidade de cor rica e variações visíveis de espessura.",
      "digital_art": "ARTE DIGITAL moderna, com acabamento polido, cores vibrantes, iluminação dinâmica e elementos gráficos claros e composição planejada.",
      "abstract": "ABSTRATO, focando em formas, cores e composições não-figurativas, usando elementos visuais puros como formas geométricas e gradientes.",
      "double_exposure": "DUPLA EXPOSIÇÃO, com duas imagens distintas mescladas harmoniosamente. Uma imagem principal combinada com outra que se integram criando narrativa visual interessante.",
      "analog": "ANALÓGICO/FILME, com grão visível, leve vazamento de luz, vinheta, cores características de filmes específicos e imperfeições autênticas.",
      "cyberpunk": "CYBERPUNK, com néons intensos, contraste extremo entre luz e sombra, tecnologia futurista com elementos decadentes e atmosfera noturna chuvosa.",
      "fantasy": "FANTASIA, com elementos mágicos, criaturas mitológicas, ambientes imaginários, iluminação dramática e atmosfera mística.",
      "surrealism": "SURREALISTA, com justaposições inesperadas, distorções da realidade, simbolismo visual e elementos oníricos que criam sensação de estranhamento.",
      "minimalist": "MINIMALISTA, com formas simplificadas, espaço negativo amplo, paleta de cores limitada e foco em elementos essenciais apenas.",
      "collectible_figure": params.language === "english" 
        ? "COLLECTIBLE ACTION FIGURE, featuring a hyper-detailed character displayed in premium packaging. The figure should have detailed facial features, articulated pose, textured clothing, and themed accessories. Include blister pack or window box packaging with branded graphics, product information, and marketing text. Utilize product photography lighting with subtle reflections on the plastic packaging, focused lighting on the figure, and a commercial-grade presentation."
        : "FIGURA DE AÇÃO COLECIONÁVEL, apresentando um personagem hiper-detalhado exibido em embalagem premium. A figura deve ter características faciais detalhadas, pose articulada, roupas texturizadas e acessórios temáticos. Inclua embalagem blister ou caixa com janela, elementos gráficos de marca, informações do produto e texto de marketing. Utilize iluminação de fotografia de produto com reflexos sutis na embalagem plástica, iluminação focada na figura e apresentação de qualidade comercial.",
      "cinematic_double_exposure": params.language === "english"
        ? "CINEMATIC DOUBLE EXPOSURE, presenting a masterful blend of silhouettes and scenes inspired by film aesthetics. The composition should feature a main character silhouette containing an emotional interior scene rich with narrative detail. Use carefully controlled color grading with selective desaturation, creating contrast between B&W backgrounds and muted color focal points. Include film-specific visual elements (iconic props, locations, character interactions) and cinematic lighting techniques (rim lighting, dramatic shadows, light filtering through blinds/windows). The overall aesthetic should convey narrative depth, emotional resonance, and the visual language of classic cinema, with particular attention to compositional balance between the outer silhouette and inner scene."
        : "DUPLA EXPOSIÇÃO CINEMATOGRÁFICA, apresentando uma mistura magistral de silhuetas e cenas inspiradas na estética cinematográfica. A composição deve apresentar uma silhueta de personagem principal contendo uma cena interior emocional rica em detalhes narrativos. Use gradação de cores cuidadosamente controlada com dessaturação seletiva, criando contraste entre fundos P&B e pontos focais em cores suaves. Inclua elementos visuais específicos de filmes (adereços icônicos, locais, interações entre personagens) e técnicas de iluminação cinematográfica (contraluz, sombras dramáticas, luz filtrando através de persianas/janelas). A estética geral deve transmitir profundidade narrativa, ressonância emocional e a linguagem visual do cinema clássico, com atenção especial ao equilíbrio compositivo entre a silhueta externa e a cena interna.",
      "character_double_exposure": params.language === "english"
        ? "CHARACTER DOUBLE EXPOSURE, featuring an iconic character's silhouette filled with thematically relevant landscapes, environments or story elements that define their journey or personality. The composition should blend the character's recognizable outline with high-contrast interior scenes that tell their story visually. Use selective color treatment - typically monochromatic backgrounds with vibrant colors within the silhouette. Include meaningful visual elements like signature props, locations, or symbolic imagery that reinforce character identity. Apply dramatic lighting techniques to enhance the emotional impact. Special attention should be given to fine details within the character silhouette, with sharp definition between the character outline and the background. The final image should convey narrative depth and emotional resonance while celebrating the character's essence."
        : "DUPLA EXPOSIÇÃO DE PERSONAGEM, apresentando a silhueta de um personagem icônico preenchida com paisagens, ambientes ou elementos narrativos tematicamente relevantes que definem sua jornada ou personalidade. A composição deve combinar o contorno reconhecível do personagem com cenas interiores de alto contraste que contam sua história visualmente. Use tratamento seletivo de cores - geralmente fundos monocromáticos com cores vibrantes dentro da silhueta. Inclua elementos visuais significativos como acessórios característicos, locais ou imagens simbólicas que reforcem a identidade do personagem. Aplique técnicas de iluminação dramática para aumentar o impacto emocional. Atenção especial deve ser dada aos detalhes finos dentro da silhueta do personagem, com definição nítida entre o contorno do personagem e o fundo. A imagem final deve transmitir profundidade narrativa e ressonância emocional enquanto celebra a essência do personagem.",
      "midjourney_style": params.language === "english"
        ? "MIDJOURNEY STYLE, featuring extremely high-quality, hyper-detailed imagery with impeccable composition and dramatic lighting. Use rich textures, vibrant colors with perfect contrast balance, and immaculate focal points. The style should include ultra-sharp details in key areas while maintaining dreamy, smooth transitions in others. Apply cinematic color grading with sophisticated highlights and shadows. Important signature elements include subtle lens distortions, perfect depth of field, atmospheric effects (volumetric lighting, particles, mist), and high dynamic range. Every element should appear meticulously crafted with stylized hyper-realism that balances photographic qualities with artistic enhancements. Color palettes should be rich but harmonious with careful attention to complementary tones. Include keywords like 'highly detailed', 'ultra high resolution', 'photorealistic', '8k', 'cinematic lighting' to reinforce the Midjourney aesthetic."
        : "ESTILO MIDJOURNEY, apresentando imagens extremamente detalhadas e de alta qualidade com composição impecável e iluminação dramática. Use texturas ricas, cores vibrantes com equilíbrio perfeito de contraste e pontos focais imaculados. O estilo deve incluir detalhes ultra-nítidos em áreas-chave, mantendo transições suaves e sonhadoras em outras. Aplique gradação de cores cinematográfica com destaques e sombras sofisticados. Elementos característicos importantes incluem sutis distorções de lente, profundidade de campo perfeita, efeitos atmosféricos (iluminação volumétrica, partículas, névoa) e alto alcance dinâmico. Cada elemento deve parecer meticulosamente elaborado com hiper-realismo estilizado que equilibra qualidades fotográficas com aprimoramentos artísticos. As paletas de cores devem ser ricas, mas harmoniosas, com atenção cuidadosa aos tons complementares. Inclua palavras-chave como 'altamente detalhado', 'ultra alta resolução', 'fotorrealista', '8k', 'iluminação cinematográfica' para reforçar a estética Midjourney."
    };

    // Definições específicas para cada estilo de logo baseadas nas tendências 2025
    const logoStyleDefinitions: Record<string, string> = {
      "minimalist_modern": params.language === "english"
        ? "MINIMALIST MODERN style with clean geometric shapes, ample white space, simple typography, and limited color palette (maximum 2-3 colors). Focus on essential elements only, avoiding unnecessary details. Use contemporary sans-serif fonts and ensure scalability across all sizes."
        : "estilo MINIMALISTA MODERNO com formas geométricas limpas, amplo espaço em branco, tipografia simples e paleta de cores limitada (máximo 2-3 cores). Foque apenas em elementos essenciais, evitando detalhes desnecessários. Use fontes sans-serif contemporâneas e garanta escalabilidade em todos os tamanhos.",
      "bold_geometric": params.language === "english"
        ? "BOLD GEOMETRIC style with strong angular shapes, thick lines, high contrast colors, and oversized typography. Use primary geometric forms like circles, triangles, and squares. Emphasize visual impact and memorability with confident, structured design elements."
        : "estilo GEOMÉTRICO OUSADO com formas angulares fortes, linhas grossas, cores de alto contraste e tipografia oversized. Use formas geométricas primárias como círculos, triângulos e quadrados. Enfatize impacto visual e memorabilidade com elementos de design confiantes e estruturados.",
      "flat_design": params.language === "english"
        ? "FLAT DESIGN style with no gradients, shadows, or 3D effects. Use solid colors, simple shapes, and clean lines. Focus on clarity and simplicity with modern color schemes and straightforward iconography. Ensure perfect scalability for digital applications."
        : "estilo DESIGN PLANO sem gradientes, sombras ou efeitos 3D. Use cores sólidas, formas simples e linhas limpas. Foque em clareza e simplicidade com esquemas de cores modernos e iconografia direta. Garanta escalabilidade perfeita para aplicações digitais.",
      "vector_clean": params.language === "english"
        ? "VECTOR CLEAN style with crisp, scalable paths and smooth curves. Use precise geometric construction with clean edges and professional finish. Emphasize technical precision and mathematical perfection in all design elements."
        : "estilo VETORIAL LIMPO com caminhos nítidos e escaláveis e curvas suaves. Use construção geométrica precisa com bordas limpas e acabamento profissional. Enfatize precisão técnica e perfeição matemática em todos os elementos de design.",
      "typography_focused": params.language === "english"
        ? "TYPOGRAPHY FOCUSED style where the text is the main design element. Use custom lettering, unique font treatments, creative spacing, and typographic hierarchy. No additional symbols or icons - let the typography tell the complete brand story."
        : "estilo FOCADO EM TIPOGRAFIA onde o texto é o principal elemento de design. Use lettering personalizado, tratamentos únicos de fonte, espaçamento criativo e hierarquia tipográfica. Sem símbolos ou ícones adicionais - deixe a tipografia contar toda a história da marca.",
      "monogram": params.language === "english"
        ? "MONOGRAM style combining initials or letters in an elegant, interlocked design. Use sophisticated typography with custom ligatures, balanced proportions, and refined details. Create a mark that works as both a symbol and readable text."
        : "estilo MONOGRAMA combinando iniciais ou letras em um design elegante e entrelaçado. Use tipografia sofisticada com ligaduras personalizadas, proporções equilibradas e detalhes refinados. Crie uma marca que funcione tanto como símbolo quanto como texto legível.",
      "badge_emblem": params.language === "english"
        ? "BADGE/EMBLEM style with circular, shield, or crest-like structure. Include decorative elements, borders, and traditional craftsmanship details. Use vintage-inspired typography and classic proportions while maintaining modern clarity."
        : "estilo EMBLEMA/BADGE com estrutura circular, escudo ou brasão. Inclua elementos decorativos, bordas e detalhes de artesanato tradicional. Use tipografia inspirada no vintage e proporções clássicas mantendo clareza moderna.",
      "organic_natural": params.language === "english"
        ? "ORGANIC NATURAL style with flowing, curved lines inspired by nature. Use earth tones, leaf shapes, water forms, or growth patterns. Emphasize sustainability and environmental consciousness through natural textures and organic forms."
        : "estilo ORGÂNICO NATURAL com linhas fluidas e curvas inspiradas na natureza. Use tons terrosos, formas de folhas, formas de água ou padrões de crescimento. Enfatize sustentabilidade e consciência ambiental através de texturas naturais e formas orgânicas.",
      "tech_futuristic": params.language === "english"
        ? "TECH FUTURISTIC style with digital elements, circuit patterns, angular geometry, and high-tech aesthetics. Use modern color schemes like electric blue, neon green, or metallic silver. Incorporate elements that suggest innovation and cutting-edge technology."
        : "estilo TECNOLÓGICO FUTURISTA com elementos digitais, padrões de circuito, geometria angular e estética high-tech. Use esquemas de cores modernos como azul elétrico, verde neon ou prata metálica. Incorpore elementos que sugiram inovação e tecnologia de ponta.",
      "hand_drawn": params.language === "english"
        ? "HAND DRAWN style with organic, imperfect lines that suggest human craftsmanship. Use sketch-like qualities, slight irregularities, and artisanal feel. Maintain legibility while embracing the authentic, personal touch of hand-created design."
        : "estilo DESENHADO À MÃO com linhas orgânicas e imperfeitas que sugerem artesanato humano. Use qualidades de esboço, pequenas irregularidades e sensação artesanal. Mantenha legibilidade abraçando o toque autêntico e pessoal do design criado à mão.",
      "gradient_modern": params.language === "english"
        ? "GRADIENT MODERN style with smooth color transitions, contemporary color combinations, and dynamic visual flow. Use subtle gradients that enhance depth without overwhelming the design. Focus on modern color trends and sophisticated blending techniques."
        : "estilo GRADIENTE MODERNO com transições suaves de cores, combinações de cores contemporâneas e fluxo visual dinâmico. Use gradientes sutis que realcem profundidade sem sobrecarregar o design. Foque em tendências de cores modernas e técnicas sofisticadas de mistura.",
      "negative_space": params.language === "english"
        ? "NEGATIVE SPACE style that uses empty areas to create secondary images or meanings. Design clever visual tricks where the space between elements forms additional symbols. Emphasize the relationship between positive and negative space for maximum impact."
        : "estilo ESPAÇO NEGATIVO que usa áreas vazias para criar imagens ou significados secundários. Projete truques visuais inteligentes onde o espaço entre elementos forma símbolos adicionais. Enfatize a relação entre espaço positivo e negativo para máximo impacto.",
      "retro_vintage": params.language === "english"
        ? "RETRO VINTAGE style with nostalgic elements, classic typography, and period-appropriate color schemes. Use design elements from specific eras (50s, 60s, 70s, 80s) while maintaining contemporary functionality and clarity."
        : "estilo RETRÔ VINTAGE com elementos nostálgicos, tipografia clássica e esquemas de cores apropriados para a época. Use elementos de design de eras específicas (anos 50, 60, 70, 80) mantendo funcionalidade e clareza contemporâneas.",
      "3d_dimensional": params.language === "english"
        ? "3D DIMENSIONAL style with depth, shadows, highlights, and three-dimensional effects. Use isometric perspectives, layered elements, and realistic lighting. Create visual depth while maintaining logo functionality and scalability."
        : "estilo 3D DIMENSIONAL com profundidade, sombras, destaques e efeitos tridimensionais. Use perspectivas isométricas, elementos em camadas e iluminação realista. Crie profundidade visual mantendo funcionalidade e escalabilidade do logo.",
      "line_art": params.language === "english"
        ? "LINE ART style using only outlines and strokes without filled areas. Use varying line weights, clean paths, and minimalist approach. Focus on essential contours and shapes that define the brand through linear elements only."
        : "estilo ARTE LINEAR usando apenas contornos e traços sem áreas preenchidas. Use pesos de linha variados, caminhos limpos e abordagem minimalista. Foque em contornos e formas essenciais que definam a marca apenas através de elementos lineares."
    };

    // Definir as restrições de tamanho com base no parâmetro length
    const lengthRestriction = params.length === 'short' 
      ? (params.language === "english" 
          ? "IMPORTANT LENGTH RESTRICTION: Your response MUST be MAXIMUM 6 LINES OF TEXT. Be extremely concise and focused. Do not exceed 6 lines total, including any markdown formatting or line breaks."
          : "RESTRIÇÃO IMPORTANTE DE TAMANHO: Sua resposta DEVE ter NO MÁXIMO 6 LINHAS DE TEXTO. Seja extremamente conciso e focado. Não ultrapasse 6 linhas no total, incluindo qualquer formatação markdown ou quebras de linha."
        )
      : '';

    // Escolha o idioma base para o systemPrompt
    const outputLanguage = params.language === "english" ? "English" : "Portuguese";
    
    // Novo System Prompt com suporte a idiomas e restrição de tamanho
    let systemPrompt = params.language === "english" 
      ? `You are an AI assistant specializing in ${modeMap[params.mode] || 'content generation and planning'}.
Your task is to analyze the user's request and generate a detailed and well-structured response in ${outputLanguage}, according to the specified mode.
For "app development" mode, structure the response with sections like Objective, Features, Screen/Component Structure, Suggested Technologies, and Next Steps.
For "website creation" mode, structure the response with sections like Project Overview, Site Structure, Design Guidelines, Key Features, Technology Stack, SEO & Performance, and Implementation Steps. Focus on modern web development trends 2025: responsive design, mobile-first approach, accessibility (WCAG), Core Web Vitals optimization, micro-interactions, clean minimalist design, and user experience best practices.
For "logo creation" mode, structure the response with sections like Brand Analysis, Design Concept, Visual Elements, Typography, Color Palette, Style Guidelines, Applications, and Technical Specifications. Focus on modern logo design trends 2025: minimalist aesthetics, bold geometric shapes, versatile scalability, sustainable design principles, and strong brand recognition across digital and physical touchpoints.
For other modes, adapt the structure as appropriate for the task (e.g., detailed description for images, complete text for content, clear steps for instructions, etc.).
IMPORTANT: Use Markdown formatting to structure your response. Use headings (##, ###), bullet lists (*), numbered lists (1., 2.), **bold** for emphasis, *italic* for important terms, and \`code\` when necessary. Use tables with | to present tabular information when appropriate.
Be practical, direct to the point, and provide useful information.
Generate only the final requested response, without introductions, meta-discourse, or additional comments such as "Sure, here is...".
${lengthRestriction}`
      : `Você é um assistente de IA especialista em ${modeMap[params.mode] || 'geração de conteúdo e planejamento'}.
Sua tarefa é analisar a solicitação do usuário e gerar uma resposta detalhada e bem estruturada em ${outputLanguage}, de acordo com o modo especificado.
Para o modo "desenvolvimento de aplicativo", estruture a resposta com seções como Objetivo, Funcionalidades, Estrutura de Telas/Componentes, Tecnologias Sugeridas e Próximos Passos.
Para o modo "criação de site", estruture a resposta com seções como Visão Geral do Projeto, Estrutura do Site, Diretrizes de Design, Funcionalidades Principais, Stack Tecnológico, SEO & Performance, e Passos de Implementação. Foque nas tendências modernas de desenvolvimento web 2025: design responsivo, abordagem mobile-first, acessibilidade (WCAG), otimização Core Web Vitals, micro-interações, design minimalista limpo, e melhores práticas de experiência do usuário.
Para o modo "criação de logo", estruture a resposta com seções como Análise da Marca, Conceito de Design, Elementos Visuais, Tipografia, Paleta de Cores, Diretrizes de Estilo, Aplicações, e Especificações Técnicas. Foque nas tendências modernas de design de logo 2025: estética minimalista, formas geométricas ousadas, escalabilidade versátil, princípios de design sustentável, e forte reconhecimento de marca em pontos de contato digitais e físicos.
Para outros modos, adapte a estrutura conforme apropriado para a tarefa (ex: descrição detalhada para imagem, texto completo para conteúdo, passos claros para instruções, etc.).
IMPORTANTE: Utilize formatação Markdown para estruturar sua resposta. Use cabeçalhos (##, ###), listas com marcadores (*), listas numeradas (1., 2.), **negrito** para ênfase, *itálico* para termos importantes, e \`código\` quando necessário. Use tabelas com | para apresentar informações tabulares quando apropriado.
Seja prático, direto ao ponto e forneça informações úteis.
Gere apenas a resposta final solicitada, sem introduções, metadiscursos ou comentários adicionais como "Claro, aqui está...".
${lengthRestriction}`;

    // Instruções específicas para geração de imagem com estilo definido
    if (params.mode === 'image_generation' && params.imageStyle && imageStyleDefinitions[params.imageStyle]) {
      systemPrompt += params.language === "english"
        ? `\n\nIMPORTANT FOR IMAGE GENERATION: You MUST create a prompt for an image in the style ${imageStyleDefinitions[params.imageStyle]}
This style is an ABSOLUTE REQUIREMENT and must define the visual aesthetics of the image.
The image MUST be described considering the characteristics of this specific style.
Adapt ALL visual aspects to accommodate this style.
Include explicit references to the style ${params.imageStyle.toUpperCase()} in different parts of the prompt.`
        : `\n\nIMPORTANTE PARA GERAÇÃO DE IMAGEM: Você DEVE criar um prompt para uma imagem no estilo ${imageStyleDefinitions[params.imageStyle]}
Este estilo é um REQUISITO ABSOLUTO e deve definir a estética visual da imagem.
A imagem DEVE ser descrita considerando as características deste estilo específico.
Adapte TODOS os aspectos visuais para acomodar este estilo.
Inclua referências explícitas ao estilo ${params.imageStyle.toUpperCase()} em diferentes partes do prompt.`;
    }

    // Instruções específicas para criação de logo com estilo definido
    if (params.mode === 'logo_creation' && params.imageStyle && logoStyleDefinitions[params.imageStyle]) {
      systemPrompt += params.language === "english"
        ? `\n\nIMPORTANT FOR LOGO CREATION: You MUST create a prompt for a logo in the style ${logoStyleDefinitions[params.imageStyle]}
This style is an ABSOLUTE REQUIREMENT and must define the visual aesthetics of the logo.
The logo MUST be described considering the characteristics of this specific style.
Adapt ALL design aspects to accommodate this style.
Include explicit references to the style ${params.imageStyle.toUpperCase()} in different parts of the prompt.
Focus on: scalability, brand recognition, versatility across applications, and modern design trends 2025.
Consider: typography choices, color psychology, geometric principles, and brand personality.`
        : `\n\nIMPORTANTE PARA CRIAÇÃO DE LOGO: Você DEVE criar um prompt para um logo no estilo ${logoStyleDefinitions[params.imageStyle]}
Este estilo é um REQUISITO ABSOLUTO e deve definir a estética visual do logo.
O logo DEVE ser descrito considerando as características deste estilo específico.
Adapte TODOS os aspectos de design para acomodar este estilo.
Inclua referências explícitas ao estilo ${params.imageStyle.toUpperCase()} em diferentes partes do prompt.
Foque em: escalabilidade, reconhecimento de marca, versatilidade em aplicações, e tendências de design moderno 2025.
Considere: escolhas tipográficas, psicologia das cores, princípios geométricos, e personalidade da marca.`;
    }

    // Adiciona menção ao prompt negativo no system prompt se ele for usado
    if ((params.mode === 'image_generation' || params.mode === 'logo_creation') && params.negativePrompt) {
       systemPrompt += params.language === "english"
        ? `\nAlso consider the negative prompt provided by the user, specifying elements or styles to AVOID.`
        : `\nConsidere também o prompt negativo fornecido pelo usuário, especificando elementos ou estilos a EVITAR.`;
    }

    // Novo User Prompt focado na ideia central com restrição de tamanho
    let userPrompt = params.language === "english"
      ? `Generate a ${params.length === 'short' ? 'very concise' : 'detailed'} response for the following request, in "${modeMap[params.mode] || 'general'}" mode: "${params.keywords}".

Desired characteristics for the response:
- Tone: ${toneMap[params.tone] || 'professional'}
- Detail Level: ${complexityMap[params.complexity] || 'moderate'}
${params.context ? `- Additional Context: ${params.context}` : ''}
${params.includeExamples ? `- Include relevant examples or elaborations within the response.` : ''}
- Use complete Markdown formatting to improve the readability of the response.
${params.length === 'short' ? '- STRICT LENGTH LIMIT: Maximum 6 lines total, including any markdown formatting or line breaks.' : ''}`
      : `Gere uma resposta ${params.length === 'short' ? 'muito concisa' : 'detalhada'} para a seguinte solicitação, no modo "${modeMap[params.mode] || 'geral'}": "${params.keywords}".

Características desejadas para a resposta:
- Tom: ${toneMap[params.tone] || 'profissional'}
- Nível de Detalhe: ${complexityMap[params.complexity] || 'moderado'}
${params.context ? `- Contexto Adicional: ${params.context}` : ''}
${params.includeExamples ? `- Inclua exemplos ou elaborações relevantes dentro da resposta.` : ''}
- Utilize formatação Markdown completa para melhorar a legibilidade da resposta.
${params.length === 'short' ? '- LIMITE ESTRITO DE TAMANHO: Máximo de 6 linhas no total, incluindo qualquer formatação markdown ou quebras de linha.' : ''}`;

    // Adiciona instruções específicas para o modo de geração de imagem, incluindo o negative prompt
    if (params.mode === 'image_generation' && params.imageStyle) {
      userPrompt += params.language === "english"
        ? `\n\nThis request is for an IMAGE GENERATION prompt in ${params.imageStyle.toUpperCase()} style.
ABSOLUTE REQUIREMENT: The image must be ${imageStyleDefinitions[params.imageStyle]}
The image description must explicitly incorporate this visual style in all elements.
Adapt composition, lighting, textures and other visual aspects to maximize the characteristics of the ${params.imageStyle.toUpperCase()} style.`
        : `\n\nEsta solicitação é para um prompt de GERAÇÃO DE IMAGEM no estilo ${params.imageStyle.toUpperCase()}.
REQUISITO ABSOLUTO: A imagem deve ser ${imageStyleDefinitions[params.imageStyle]}
A descrição da imagem deve incorporar explicitamente esse estilo visual em todos os elementos.
Adapte a composição, iluminação, texturas e outros aspectos visuais para maximizar as características do estilo ${params.imageStyle.toUpperCase()}.`;
    }
    
    // Adiciona instruções específicas para o modo de criação de logo
    if (params.mode === 'logo_creation' && params.imageStyle) {
      userPrompt += params.language === "english"
        ? `\n\nThis request is for a LOGO CREATION prompt in ${params.imageStyle.toUpperCase()} style.
ABSOLUTE REQUIREMENT: The logo must be ${logoStyleDefinitions[params.imageStyle]}
The logo description must explicitly incorporate this design style in all elements.
Adapt typography, shapes, colors, and composition to maximize the characteristics of the ${params.imageStyle.toUpperCase()} style.
Focus on creating a scalable, memorable, and versatile brand mark that works across all applications.
Consider modern logo design principles: simplicity, memorability, timelessness, versatility, and appropriateness.`
        : `\n\nEsta solicitação é para um prompt de CRIAÇÃO DE LOGO no estilo ${params.imageStyle.toUpperCase()}.
REQUISITO ABSOLUTO: O logo deve ser ${logoStyleDefinitions[params.imageStyle]}
A descrição do logo deve incorporar explicitamente esse estilo de design em todos os elementos.
Adapte tipografia, formas, cores e composição para maximizar as características do estilo ${params.imageStyle.toUpperCase()}.
Foque em criar uma marca escalável, memorável e versátil que funcione em todas as aplicações.
Considere princípios modernos de design de logo: simplicidade, memorabilidade, atemporalidade, versatilidade e adequação.`;
    }
    
    // Adiciona o prompt negativo ao user prompt se fornecido
    if ((params.mode === 'image_generation' || params.mode === 'logo_creation') && params.negativePrompt) {
        userPrompt += params.language === "english"
        ? `\n\nNEGATIVE PROMPT (Elements to AVOID): ${params.negativePrompt}`
        : `\n\nPROMPT NEGATIVO (Elementos a EVITAR): ${params.negativePrompt}`;
    }

    // --- FIM DAS ALTERAÇÕES NOS PROMPTS ---

    // Executa a chamada para a API
    const result = await model.generateContent([systemPrompt, userPrompt]);
    const response = await result.response;
    let text = response.text();

    // Aplica pós-processamento para realmente garantir o máximo de 6 linhas quando o tamanho for "short"
    if (params.length === 'short') {
      // Divide o texto em linhas e mantém apenas as primeiras 6
      const lines = text.split('\n');
      if (lines.length > 6) {
        text = lines.slice(0, 6).join('\n');
      }
    }

    // Se chegou aqui, retorna a resposta como objeto estruturado
    return {
      id: `prompt-${Date.now()}`,
      timestamp: Date.now(),
      params,
      genericPrompt: text,
    };
}