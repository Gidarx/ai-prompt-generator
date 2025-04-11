import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { PromptParams, Complexity, PromptMode, Tone } from '@/lib/types';

// Inicializa o modelo do Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');
const modelId = 'gemini-2.0-flash-thinking-exp-01-21';

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

// Definição de correções para palavras-chave comuns
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
  "desinger": "designer"
};

// Lista de verbos instrucionais em português para detecção de instruções
const instructionalVerbs = [
  "faça", "crie", "desenvolva", "elabore", "construa", "produza", "prepare",
  "monte", "conceba", "projete", "planeje", "desenhe", "escreva", "programe",
  "implemente", "ajude", "me ajude", "preciso", "quero", "desejo", "gostaria",
  "necessito", "pode", "poderia", "como", "me dê", "sugira", "recomende"
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
    normalizedKeywords.startsWith(verb + ",")
  );

  // Se for uma instrução, extraímos os conceitos principais
  if (startsWithInstruction) {
    console.log('Detectada instrução em vez de palavras-chave');

    // Remove verbos instrucionais do início
    for (const verb of instructionalVerbs) {
      if (normalizedKeywords.startsWith(verb + " ")) {
        normalizedKeywords = normalizedKeywords.slice(verb.length).trim();
        break;
      }
    }

    // Remove palavras comuns que não agregam valor ao prompt
    const fillerWords = ["um", "uma", "para", "que", "me", "a", "o", "as", "os", "de", "da", "do", "das", "dos"];
    for (const word of fillerWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      normalizedKeywords = normalizedKeywords.replace(regex, '');
    }

    // Remove espaços duplos
    normalizedKeywords = normalizedKeywords.replace(/\s+/g, ' ').trim();

    console.log('Keywords extraídas da instrução:', normalizedKeywords);
  }

  // Corrige palavras-chave conhecidas com erros de digitação
  for (const [incorrect, correct] of Object.entries(keywordCorrections)) {
    const regex = new RegExp(`\\b${incorrect}\\b`, 'gi');
    normalizedKeywords = normalizedKeywords.replace(regex, correct);
  }

  return normalizedKeywords;
}

/**
 * Gera um prompt alternativo quando a API falha
 * @param params Parâmetros para geração do prompt
 * @returns Prompt gerado como fallback
 */
function generateFallbackPrompt(params: PromptParams): string {
  const { keywords, tone, complexity, includeExamples, mode, imageStyle } = params;

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
      ["content_creation"]: "Conteúdo",
      ["problem_solving"]: "Problema",
      ["coding"]: "Código",
      ["instruct"]: "Instrução",
      ["explain"]: "Explicação"
    };

    switch (mode) {
      case "app_creation":
        basePrompt += ` O prompt deve guiar o desenvolvimento de um aplicativo, considerando funcionalidades, design de interface, experiência do usuário e tecnologias recomendadas.`;
        break;
      case "image_generation":
        basePrompt += ` O prompt deve descrever detalhadamente a imagem a ser criada, incluindo estilo visual, elementos principais, composição, cores, iluminação e atmosfera.`;
        
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
            default:
              basePrompt += ` A imagem deve ter um estilo visual coerente e bem definido que melhor comunique a ideia central.`;
          }
        }
        break;
      case "content_creation":
        basePrompt += ` O prompt deve orientar a criação de conteúdo textual de qualidade, especificando o formato, tom, público-alvo e objetivos do texto.`;
        break;
      case "problem_solving":
        basePrompt += ` O prompt deve detalhar um problema específico, fornecer contexto relevante e solicitar uma solução estruturada e eficaz.`;
        break;
      case "coding":
        basePrompt += ` O prompt deve especificar uma tarefa de programação, incluindo requisitos técnicos, linguagens, frameworks e funcionalidades esperadas.`;
        break;
      case "instruct":
        basePrompt += ` O prompt deve fornecer instruções claras e sequenciais para realizar uma tarefa específica, identificando passos, ferramentas e resultados esperados.`;
        break;
      case "explain":
        basePrompt += ` O prompt deve solicitar uma explicação aprofundada sobre o tópico, definindo o nível de detalhe técnico e o contexto da explicação.`;
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
    ["content_creation"]: [
      `Escreva um artigo informativo sobre os benefícios da meditação mindfulness para profissionais com agendas ocupadas. O texto deve ter aproximadamente 1000 palavras, incluir pesquisas científicas recentes, dicas práticas para iniciar a prática, e exemplos de exercícios de 5 minutos que podem ser feitos no local de trabalho. Use um tom informativo mas acessível, evitando jargão excessivo.`,
      `Crie um e-mail de marketing para o lançamento de um novo produto de skincare orgânico. Enfatize os ingredientes naturais, benefícios para a pele e compromisso ambiental da marca. O texto deve ser persuasivo sem ser agressivo, incluir uma chamada clara para ação e oferta de lançamento. Limite a 300 palavras e inclua sugestões para linha de assunto que maximize a taxa de abertura.`
    ],
    ["problem_solving"]: [
      `Analise o problema de alta rotatividade de funcionários em uma empresa de tecnologia de médio porte. Identifique possíveis causas, desde compensação até cultura organizacional. Proponha uma estratégia de retenção de talentos com medidas de curto e longo prazo, métricas para avaliar o progresso, e exemplos de empresas que resolveram problemas similares. Considere restrições orçamentárias.`,
      `Resolva o desafio de otimizar o sistema de logística para uma rede de supermercados com 15 lojas regionais. Aborde questões de gestão de estoque, rotas de entrega e previsão de demanda. Recomende soluções tecnológicas específicas, reorganização de processos e necessidades de treinamento. Inclua métodos para medir melhorias em custo e eficiência.`
    ],
    ["coding"]: [
      `Desenvolva uma API RESTful em Node.js para gerenciar um sistema de reservas de hotel. A API deve permitir consulta de disponibilidade, criar/editar/cancelar reservas e processar pagamentos. Implemente autenticação JWT, validação de dados, tratamento de erros e documentação com Swagger. Use Express, MongoDB para armazenamento e implemente testes unitários com Jest. Forneça exemplos de endpoints principais.`,
      `Crie um aplicativo web em React que permita aos usuários visualizar e filtrar dados meteorológicos de diferentes cidades. Implemente um painel com gráficos interativos, filtros por data/local, mapa interativo e tema claro/escuro. Use hooks, context API para estado global, Styled Components para estilização e Axios para chamadas de API. Demonstre boas práticas de performance e responsividade.`
    ],
    ["instruct"]: [
      `Explique como configurar um ambiente completo de desenvolvimento web para iniciantes, incluindo: instalação do VS Code, configuração do Git/GitHub, setup de Node.js, instalação de extensões essenciais e organização de workspace. Forneça comandos específicos para Windows e Mac, screenshots dos processos principais e dicas de produtividade. Adicione links para recursos complementares e ferramentas alternativas.`,
      `Detalhe o processo para criar e lançar um podcast de qualidade profissional, desde o planejamento até distribuição. Inclua: equipamento mínimo necessário com opções de orçamento, configuração de gravação, técnicas de edição de áudio no Audacity, criação de arte para capa, registro em plataformas de distribuição e estratégias básicas de promoção.`
    ],
    ["explain"]: [
      `Explique como funciona a tecnologia blockchain e suas aplicações além das criptomoedas. A explicação deve cobrir os fundamentos técnicos (blocos, hash, consenso distribuído), mas ser acessível para não-especialistas em tecnologia. Aborde casos de uso em diferentes indústrias, limitações atuais e tendências futuras. Use analogias para clarificar conceitos complexos.`,
      `Descreva o processo de machine learning supervisionado, desde a coleta de dados até avaliação do modelo. Explique as etapas de preparação de dados, seleção de features, escolha de algoritmos, treinamento, validação e interpretação de resultados. Use linguagem clara mas tecnicamente precisa, adequada para alguém com conhecimento básico de programação mas sem experiência em ML.`
    ]
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

export async function POST(req: Request) {
  console.log('Recebendo solicitação de geração de prompt');
  try {
    // Extrai e valida parâmetros
    const params: PromptParams = await req.json();

    // Verifica se os parâmetros essenciais existem
    if (!params.keywords || params.keywords.trim() === '') {
      console.error('Parâmetros inválidos: keywords vazio ou ausente');
      return NextResponse.json(
        { error: 'Palavras-chave são obrigatórias' },
        { status: 400 }
      );
    }

    // Corrige e normaliza as palavras-chave
    const correctedKeywords = correctKeywords(params.keywords);
    console.log(`Keywords originais: "${params.keywords}", corrigidas: "${correctedKeywords}"`);

    // Configura o modelo
    const model = genAI.getGenerativeModel({
      model: modelId,
      generationConfig: {
        temperature: 0.7, // Manter alguma criatividade
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048, // Aumentar para permitir respostas mais detalhadas
      },
      safetySettings,
    });

    // --- INÍCIO DAS ALTERAÇÕES NOS PROMPTS ---

    // Mapeamentos para descrições textuais
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
      [Complexity.SIMPLE]: "simples e direto",
      [Complexity.MODERATE]: "moderadamente detalhado",
      [Complexity.DETAILED]: "detalhado e abrangente",
      [Complexity.BEGINNER]: "adequado para iniciantes",
      [Complexity.INTERMEDIATE]: "de nível intermediário",
      [Complexity.ADVANCED]: "para nível avançado"
    };

    const modeMap: Record<string, string> = {
      ["app_creation"]: "desenvolvimento de aplicativo",
      ["image_generation"]: "geração de imagem",
      ["content_creation"]: "criação de conteúdo",
      ["problem_solving"]: "resolução de problemas",
      ["coding"]: "programação",
      ["instruct"]: "instruções passo a passo",
      ["explain"]: "explicação detalhada"
    };

    // Definições específicas para cada estilo de imagem
    const imageStyleDefinitions: Record<string, string> = {
      "realistic": "HIPER-REALISTA, com altíssimo nível de detalhe fotográfico, texturas realistas, iluminação natural e física correta. Deve parecer uma fotografia de alta qualidade feita com câmera profissional.",
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
      "minimalist": "MINIMALISTA, com formas simplificadas, espaço negativo amplo, paleta de cores limitada e foco em elementos essenciais apenas."
    };

    // Novo System Prompt focado na tarefa de planejamento/geração
    let systemPrompt = `Você é um assistente de IA especialista em ${modeMap[params.mode] || 'geração de conteúdo e planejamento'}.
Sua tarefa é analisar a solicitação do usuário e gerar uma resposta detalhada e bem estruturada em português, de acordo com o modo especificado.
Para o modo "desenvolvimento de aplicativo", estruture a resposta com seções como Objetivo, Funcionalidades, Estrutura de Telas/Componentes, Tecnologias Sugeridas e Próximos Passos.
Para outros modos, adapte a estrutura conforme apropriado para a tarefa (ex: descrição detalhada para imagem, texto completo para conteúdo, passos claros para instruções, etc.).
IMPORTANTE: Utilize formatação Markdown para estruturar sua resposta. Use cabeçalhos (##, ###), listas com marcadores (*), listas numeradas (1., 2.), **negrito** para ênfase, *itálico* para termos importantes, e \`código\` quando necessário. Use tabelas com | para apresentar informações tabulares quando apropriado.
Seja prático, direto ao ponto e forneça informações úteis.
Gere apenas a resposta final solicitada, sem introduções, metadiscursos ou comentários adicionais como "Claro, aqui está...".`;

    // Instruções específicas para geração de imagem com estilo definido
    if (params.mode === 'image_generation' && params.imageStyle && imageStyleDefinitions[params.imageStyle]) {
      systemPrompt += `\n\nIMPORTANTE PARA GERAÇÃO DE IMAGEM: Você DEVE criar um prompt para uma imagem no estilo ${imageStyleDefinitions[params.imageStyle]}
Este estilo é um REQUISITO ABSOLUTO e deve definir a estética visual da imagem.
A imagem DEVE ser descrita considerando as características deste estilo específico.
Adapte TODOS os aspectos visuais para acomodar este estilo.
Inclua referências explícitas ao estilo ${params.imageStyle.toUpperCase()} em diferentes partes do prompt.`;
    }

    // Novo User Prompt focado na ideia central
    let userPrompt = `Gere uma resposta detalhada para a seguinte solicitação, no modo "${modeMap[params.mode] || 'geral'}": "${correctedKeywords}".

Características desejadas para a resposta:
- Tom: ${toneMap[params.tone] || 'profissional'}
- Nível de Detalhe: ${complexityMap[params.complexity] || 'moderado'}
${params.context ? `- Contexto Adicional: ${params.context}` : ''}
${params.includeExamples ? `- Inclua exemplos ou elaborações relevantes dentro da resposta.` : ''}
- Utilize formatação Markdown completa para melhorar a legibilidade da resposta.`;

    // Adiciona instruções específicas para o modo de geração de imagem
    if (params.mode === 'image_generation' && params.imageStyle) {
      userPrompt += `\n\nEsta solicitação é para um prompt de GERAÇÃO DE IMAGEM no estilo ${params.imageStyle.toUpperCase()}.
REQUISITO ABSOLUTO: A imagem deve ser ${imageStyleDefinitions[params.imageStyle]}
A descrição da imagem deve incorporar explicitamente esse estilo visual em todos os elementos.
Adapte a composição, iluminação, texturas e outros aspectos visuais para maximizar as características do estilo ${params.imageStyle.toUpperCase()}.`;
    }

    // Novo Retry Prompt (se necessário)
    let retryPrompt = `Gere uma resposta completa e bem estruturada em português para a solicitação: "${correctedKeywords}".
Modo: ${modeMap[params.mode] || 'geral'}.
Tom: ${toneMap[params.tone] || 'profissional'}.
Nível de Detalhe: ${complexityMap[params.complexity] || 'moderado'}.
${params.context ? `Contexto adicional: ${params.context}.` : ''}
${params.includeExamples ? 'Inclua exemplos relevantes.' : ''}
Siga a estrutura apropriada para o modo solicitado (ex: plano de projeto para app, descrição para imagem, etc.).
IMPORTANTE: Use formatação Markdown abundante: cabeçalhos (##, ###), listas (*), tabelas (|), **negrito**, *itálico*, \`código\` etc. para estruturar a resposta.
Forneça APENAS a resposta final.`;

    // Adiciona instruções fortes para estilo de imagem no retry
    if (params.mode === 'image_generation' && params.imageStyle) {
      retryPrompt += `\n\nATENÇÃO! Este prompt é para geração de imagem no estilo ${params.imageStyle.toUpperCase()}.
REQUISITO INEGOCIÁVEL: A imagem DEVE ser ${imageStyleDefinitions[params.imageStyle]}
Adapte TODOS os elementos visuais para esse estilo específico.
Inclua múltiplas menções ao estilo ${params.imageStyle.toUpperCase()} ao longo da descrição.
A estética visual DEVE ser coerente com este estilo do início ao fim.`;
    }

    // --- FIM DAS ALTERAÇÕES NOS PROMPTS ---

    try {
      console.log('Enviando prompt para o Gemini:', userPrompt);

      // Faz a chamada para a API
      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = result.response;
      // Adicionar log da resposta completa para depuração
      console.log('Resposta completa do Gemini (primeira tentativa):', JSON.stringify(response, null, 2));
      const text = response.text().trim();

      console.log('Texto extraído do Gemini (primeira tentativa):', text ? `${text.substring(0, 150)}...` : '[vazia]');

      // Verifica se a resposta está vazia ou muito curta (ajustar limite se necessário)
      if (!text || text.length < 50) { // Aumentado o limite mínimo
        console.log('Resposta vazia ou muito curta, tentando novamente com instrução mais explícita');

        console.log('Retry prompt:', retryPrompt);
        const retryResult = await model.generateContent(retryPrompt); // Usar apenas o retryPrompt na segunda tentativa
        const retryResponse = retryResult.response;
        // Adicionar log da resposta completa para depuração
        console.log('Resposta completa do Gemini (segunda tentativa):', JSON.stringify(retryResponse, null, 2));
        const retryText = retryResponse.text().trim();

        console.log('Texto extraído do Gemini (segunda tentativa):', retryText ? `${retryText.substring(0, 150)}...` : '[vazia]');

        if (!retryText || retryText.length < 50) { // Aumentado o limite mínimo
          console.log('Segunda tentativa também falhou, gerando fallback');
          // Se ainda falhar, usa o gerador de fallback
          const fallbackPrompt = generateFallbackPrompt(params);
          // Retornar um status diferente ou info extra para indicar fallback? Por enquanto, retorna o fallback.
          return NextResponse.json({ genericPrompt: fallbackPrompt, fallbackUsed: true }); // Adicionado fallbackUsed
        }

        return NextResponse.json({ genericPrompt: retryText });
      }

      return NextResponse.json({ genericPrompt: text });

    } catch (error: any) {
      console.error('Erro ao gerar com Gemini:', error.message || error);
      // Log do erro completo pode ajudar
      console.error('Erro completo do Gemini:', error);
      // Se a API falhar por qualquer motivo, usa o gerador de fallback
      const fallbackPrompt = generateFallbackPrompt(params);
      // Incluir mensagem de erro no retorno pode ajudar na depuração no frontend
      return NextResponse.json({
          genericPrompt: fallbackPrompt,
          fallbackUsed: true, // Adicionado fallbackUsed
          errorDetails: `Erro na API Gemini: ${error.message || 'Erro desconhecido'}`
      });
    }
  } catch (error: any) {
    console.error('Erro no processamento da solicitação:', error.message || error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    );
  }
}