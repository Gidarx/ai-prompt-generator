"use client"

import { useState, useEffect, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { PromptCard } from "@/components/prompt-card"
import { PromptHistory } from "@/components/prompt-history"
import { SettingsDialog } from "@/components/settings-dialog"
import { VersionHistory } from "@/components/version-history"
import { AIAssistantPanel } from "@/components/ai-assistant-panel"
import { CommandMenu } from "@/components/command-menu"
import { PromptTemplates } from "@/components/prompt-templates"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { usePromptHistory } from "@/lib/hooks/use-prompt-history"
import { useUserPreferences } from "@/lib/hooks/use-user-preferences"
import { usePromptVersions } from "@/lib/hooks/use-prompt-versions"
import { useAIAssistant } from "@/lib/hooks/use-ai-assistant"
import { Complexity, Platform, Tone, Length, PromptParams, GeneratedPrompt, PromptMode, PromptTemplate, Language } from "@/lib/types"
import {
  Loader2,
  Sparkles,
  History,
  Settings,
  Download,
  Command,
  BrainCircuit,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Save,
  Bot,
  Copy,
  CheckCheck,
  Library,
  Zap,
  GitBranch,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  keywords: z.string().min(1, { message: "Palavras-chave são obrigatórias." }),
  context: z.string().optional(),
  tone: z.nativeEnum(Tone), // Tone é um enum real, z.nativeEnum está correto
  length: z.enum(["short", "medium", "long"]),
  complexity: z.number().min(0).max(100), // Manter como número para o slider
  includeExamples: z.boolean(),
  // PromptMode é um type alias de strings literais, usar z.enum
  mode: z.enum([
    "app_creation",
    "image_generation",
    "content_creation",
    "problem_solving",
    "coding",
    "instruct",
    "explain",
  ]),
  // Campo opcional para estilo de imagem
  imageStyle: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// Função para mapear número (0-100) para o enum Complexity
const mapNumberToComplexity = (value: number): Complexity => {
  if (value < 34) return Complexity.SIMPLE;
  if (value < 67) return Complexity.MODERATE;
  return Complexity.DETAILED;
};

// Função para mapear o enum Complexity para número (0-100)
const mapComplexityToNumber = (complexity: Complexity): number => {
  switch (complexity) {
    case Complexity.SIMPLE: return 25; // Valor representativo
    case Complexity.MODERATE: return 50;
    case Complexity.DETAILED: return 75;
    // Adicionar casos para os outros valores do enum se necessário
    case Complexity.BEGINNER: return 25;
    case Complexity.INTERMEDIATE: return 50;
    case Complexity.ADVANCED: return 75;
    default: return 50; // Default para moderado
  }
};

// Lista de estilos de imagem disponíveis
const imageStyles = [
  { value: "realistic", label: "Hiper-realista" },
  { value: "cinematic", label: "Cinematográfico" },
  { value: "anime", label: "Anime/Mangá" },
  { value: "cartoon", label: "Cartoon" },
  { value: "pixel_art", label: "Pixel Art" },
  { value: "watercolor", label: "Aquarela" },
  { value: "oil_painting", label: "Pintura a Óleo" },
  { value: "digital_art", label: "Arte Digital" },
  { value: "abstract", label: "Abstrato" },
  { value: "double_exposure", label: "Dupla Exposição" },
  { value: "analog", label: "Analógico/Filme" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "fantasy", label: "Fantasia" },
  { value: "surrealism", label: "Surrealismo" },
  { value: "minimalist", label: "Minimalista" },
  { value: "collectible_figure", label: "Figura Colecionável" },
  { value: "cinematic_double_exposure", label: "Dupla Exposição Cinematográfica" },
];

export function PromptEngineer() {
  const { toast } = useToast()
  const { preferences, isLoaded: preferencesLoaded, updatePreferences } = useUserPreferences()
  const { history, isLoading, generatePrompt } = usePromptHistory()
  const { addVersion } = usePromptVersions()
  const { toggleAssistant } = useAIAssistant() // Removido onApplySuggestion e getCurrentParams daqui

  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [versionNotes, setVersionNotes] = useState("")
  const [showVersionNotes, setShowVersionNotes] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const generateButtonRef = useRef<HTMLButtonElement>(null)
  const historyButtonRef = useRef<HTMLButtonElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      keywords: "",
      context: "",
      tone: Tone.PROFESSIONAL,
      length: "medium",
      complexity: 50,
      includeExamples: true,
      mode: "content_creation",
      imageStyle: "realistic",
    },
  })

  useEffect(() => {
    if (preferencesLoaded) {
      const currentValues = form.getValues();
      form.reset({
        ...currentValues,
        tone: preferences.defaultTone,
        length: preferences.defaultLength,
        complexity: preferences.defaultComplexity,
        includeExamples: preferences.defaultIncludeExamples,
        mode: currentValues.mode,
        imageStyle: currentValues.imageStyle,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferencesLoaded, preferences])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ( e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
           e.preventDefault();
           generateButtonRef.current?.click();
        }
        return
      }
      if (e.key === "g" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); generateButtonRef.current?.click(); }
      else if (e.key === "h" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); historyButtonRef.current?.click(); }
      else if (e.key === "s" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); settingsButtonRef.current?.click(); }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (generatedPrompt) {
      setActiveTab("preview")
    }
  }, [generatedPrompt])

  const onSubmit = async (values: FormValues) => {
    setError(null);
    setCopied(false);

    try {
      let processedKeywords = values.keywords.trim();
      if (/^(faça|crie|desenvolva|elabore|monte|construa)/i.test(processedKeywords)) {
        processedKeywords = processedKeywords
          .replace(/^faça\s+(um|uma)\s+/i, '')
          .replace(/^crie\s+(um|uma)\s+/i, '')
          .replace(/^desenvolva\s+(um|uma)\s+/i, '')
          .replace(/^elabore\s+(um|uma)\s+/i, '')
          .replace(/^monte\s+(um|uma)\s+/i, '')
          .replace(/^construa\s+(um|uma)\s+/i, '')
          .replace(/para\s+/i, '');
        console.log("Palavras-chave convertidas de instrução para substantivos:", processedKeywords);
      }

      const params: PromptParams = {
        keywords: processedKeywords,
        context: values.context,
        tone: values.tone,
        length: values.length,
        complexity: mapNumberToComplexity(values.complexity),
        mode: values.mode as PromptMode,
        includeExamples: values.includeExamples,
        language: preferences.language,
        // Adicionar estilo de imagem aos parâmetros quando aplicável
        ...(values.mode === "image_generation" && values.imageStyle && { imageStyle: values.imageStyle }),
      };

      console.log("Enviando para geração com parâmetros:", params);

      toast({
        title: "Gerando prompt...",
        description: `Processando modo: ${getModeLabel(values.mode)}`,
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Tempo esgotado. O servidor demorou muito para responder.")), 20000);
      });

      const result = await Promise.race([
        generatePrompt(params),
        timeoutPromise
      ]) as GeneratedPrompt;

      setShowVersionNotes(true);
      setGeneratedPrompt(result);

      toast({
        title: "Prompt gerado com sucesso",
        description: "Seu prompt foi criado de acordo com os parâmetros fornecidos",
      });
    } catch (error: any) {
      console.error("Erro ao gerar prompt:", error);
      setError(error?.message || "Ocorreu um erro. Verifique o console ou tente novamente.");

      toast({
        title: "Erro na geração",
        description: error?.message || "Não foi possível gerar o prompt. Tente novamente com palavras-chave diferentes.",
        variant: "destructive",
      });
    }
  }

  const getModeLabel = (mode: string): string => {
    const modeLabels: Record<string, string> = {
      "app_creation": "Criação de App",
      "image_generation": "Geração de Imagem",
      "content_creation": "Criação de Conteúdo",
      "problem_solving": "Resolução de Problemas",
      "coding": "Código",
      "instruct": "Instrução",
      "explain": "Explicação"
    };
    return modeLabels[mode] || mode;
  }

  const handleSaveVersion = () => {
    if (!generatedPrompt) return; // Precisa de um prompt gerado para salvar a versão
    addVersion(generatedPrompt, versionNotes)
    setVersionNotes("")
    setShowVersionNotes(false)
    toast({ title: "Versão salva", description: "A versão atual do prompt foi salva com sucesso." })
  }

  const exportPrompts = () => {
    if (history.length === 0) {
      toast({
        title: "Nenhum prompt para exportar",
        description: "Gere alguns prompts primeiro antes de exportar.",
        variant: "destructive",
      })
      return
    }

    try {
      const dataStr = JSON.stringify(history, null, 2)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`
      const exportFileDefaultName = `ai-prompts-${new Date().toISOString().slice(0, 10)}.json`
      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()
      toast({ title: "Prompts exportados", description: "Seus prompts foram exportados com sucesso." })
    } catch (error) {
       toast({ title: "Erro ao exportar", description: "Ocorreu um erro ao exportar os prompts.", variant: "destructive" })
    }
  }

  const handleApplySuggestion = (suggestion: string, field: keyof FormValues | string) => {
    if (field in form.getValues()) {
      const fieldName = field as keyof FormValues;

      switch (fieldName) {
        case "keywords":
        case "context":
          form.setValue(fieldName, (form.getValues(fieldName) + " " + suggestion).trim());
          break;
        case "tone":
          const toneEnumValue = Object.values(Tone).find(
            (val) => val.toLowerCase() === suggestion.toLowerCase()
          );
          if (toneEnumValue) {
            form.setValue(fieldName, toneEnumValue);
          } else {
            console.warn(`Valor de Tone inválido na sugestão: ${suggestion}`);
          }
          break;
        case "length":
          if (["short", "medium", "long"].includes(suggestion)) {
            form.setValue(fieldName, suggestion as Length);
          }
          break;
        default:
          console.warn(`Aplicação de sugestão não implementada para o campo: ${fieldName}`);
      }
    } else {
      console.warn(`Campo inválido para aplicação de sugestão: ${field}`);
    }
  }

  const handleSelectVersion = (promptParams: PromptParams) => {
    console.log("Versão selecionada:", promptParams);
    form.reset({
      keywords: promptParams.keywords,
      context: promptParams.context ?? "",
      tone: promptParams.tone,
      length: promptParams.length,
      complexity: mapComplexityToNumber(promptParams.complexity),
      includeExamples: promptParams.includeExamples,
      mode: promptParams.mode,
      imageStyle: promptParams.imageStyle,
    });
    
    // Se a versão tiver idioma definido, atualiza as preferências do usuário
    if (promptParams.language) {
      updatePreferences({ language: promptParams.language });
    }
    
    setShowVersionHistory(false);
    toast({ title: "Versão carregada", description: "Parâmetros da versão selecionada foram carregados." });
  }

  const handleSelectTemplate = (template: PromptTemplate) => {
    form.reset({
      ...form.getValues(),
      keywords: template.keywords,
      context: template.context,
      tone: template.tone,
      length: template.length,
      complexity: template.complexity,
      includeExamples: template.includeExamples,
      imageStyle: template.imageStyle,
    });
    setShowTemplates(false);
    toast({
      title: "Template aplicado",
      description: `O template "${template.title}" foi carregado no formulário.`,
    });
  };

  const handleSavePromptEdit = (newPromptText: string) => {
    if (!generatedPrompt) return;

    const updatedPrompt: GeneratedPrompt = {
      ...generatedPrompt,
      genericPrompt: newPromptText,
    };

    setGeneratedPrompt(updatedPrompt);

    addVersion(
      {
        ...updatedPrompt,
        params: generatedPrompt.params,
      },
      "Edição rápida"
    );

    toast({
      title: "Edição salva",
      description: "A edição foi salva como uma nova versão.",
    });
  };

  const handleSelectHistoryItem = (item: GeneratedPrompt) => {
    console.log("Item selecionado:", item);
    form.reset({
      keywords: item.params.keywords,
      context: item.params.context ?? "",
      tone: item.params.tone,
      length: item.params.length,
      complexity: mapComplexityToNumber(item.params.complexity),
      includeExamples: item.params.includeExamples,
      mode: item.params.mode,
      imageStyle: item.params.imageStyle,
    });
    // Se o item do histórico tiver idioma definido, atualiza as preferências
    if (item.params.language) {
      updatePreferences({ language: item.params.language });
    }
    setShowHistory(false);
    setGeneratedPrompt(item);
    toast({ title: "Prompt carregado", description: "O prompt selecionado foi carregado do histórico." });
  }

  // Função para gerar um tema aleatório
  const suggestPromptTopic = () => {
    // Lista de temas interessantes para diferentes modos
    const topicSuggestions = {
      app_creation: [
        "app de meditação com gamificação",
        "gerenciador de finanças pessoais com IA",
        "rede social para amantes de plantas",
        "app de troca de habilidades entre profissionais",
        "organizador de tarefas baseado no método pomodoro",
        "plataforma de ensino de idiomas com realidade aumentada"
      ],
      image_generation: [
        "paisagem futurista de cidade flutuante nas nuvens",
        "retrato de personagem fantástico em estilo anime",
        "cena cyberpunk com neon e chuva",
        "animal mitológico em habitat natural",
        "interpretação surrealista de sonho",
        "interior minimalista com elementos naturais"
      ],
      content_creation: [
        "guia para começar um podcast de sucesso",
        "técnicas de escrita criativa para iniciantes",
        "dicas de marketing digital para pequenos negócios",
        "como criar conteúdo viral no TikTok",
        "estratégias de storytelling para marcas",
        "roteiro para vídeos educacionais"
      ],
      problem_solving: [
        "otimizar processos de atendimento ao cliente",
        "reduzir o desperdício de alimentos em restaurantes",
        "melhorar engajamento de funcionários remotos",
        "estratégias para redução de ansiedade no ambiente corporativo",
        "aumentar taxa de conversão em e-commerce",
        "implementar sistema de logística reversa"
      ],
      coding: [
        "sistema de recomendação com machine learning",
        "aplicação web com NextJS e Supabase",
        "automação de tarefas com Python",
        "API RESTful com autenticação e autorização",
        "aplicativo mobile cross-platform com React Native",
        "dashboard interativo com visualização de dados"
      ],
      instruct: [
        "configurar ambiente de desenvolvimento para React",
        "criar rotina de exercícios em casa sem equipamentos",
        "montar um estúdio caseiro para gravações",
        "implementar sistema de gestão ágil em equipes",
        "fazer pão artesanal perfeito",
        "técnicas avançadas de fotografia com smartphone"
      ],
      explain: [
        "como funciona a tecnologia blockchain",
        "o impacto da inteligência artificial na medicina",
        "princípios básicos de design de UX/UI",
        "como funciona o algoritmo do TikTok",
        "conceitos fundamentais de finanças para não-financeiros",
        "o processo de desenvolvimento de vacinas"
      ]
    };

    // Obter o modo atual
    const currentMode = form.getValues("mode") as PromptMode;
    
    // Selecionar um tema aleatório para o modo atual
    const topicsForMode = topicSuggestions[currentMode] || topicSuggestions.content_creation;
    const randomTopic = topicsForMode[Math.floor(Math.random() * topicsForMode.length)];
    
    // Atualizar o campo de palavras-chave
    form.setValue("keywords", randomTopic);
    
    toast({
      title: "Tema sugerido pela IA",
      description: `Um tema para "${getModeLabel(currentMode)}" foi gerado.`,
    });
  }

  const copyToClipboard = () => {
    if (!generatedPrompt) return;

    navigator.clipboard.writeText(generatedPrompt.genericPrompt)
      .then(() => {
        setCopied(true);
        toast({
          title: "Copiado!",
          description: "O prompt foi copiado para a área de transferência."
        });
      })
      .catch(err => {
        console.error("Erro ao copiar:", err);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o texto. Tente novamente.",
          variant: "destructive"
        });
      });
  }

  return (
          <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
        <Card className="lg:col-span-1 h-fit sticky top-24" elevated hover>
          <CardHeader className="pb-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Gerador de Prompt
                </CardTitle>
              </div>
              <div className="flex items-center gap-1.5">
                <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon-sm" className="rounded-full border-primary/30 hover:bg-primary/10 hover:text-primary">
                          <Library className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Usar Template</TooltipContent>
                  </Tooltip>
                  <DialogContent className="max-w-3xl p-0">
                    <PromptTemplates onSelectTemplate={handleSelectTemplate} />
                  </DialogContent>
                </Dialog>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon-sm" 
                      className={cn(
                        "rounded-full border-primary/30 hover:bg-primary/10 hover:text-primary",
                        showHistory && "bg-primary/20 text-primary"
                      )}
                      onClick={() => setShowHistory(!showHistory)} 
                      ref={historyButtonRef}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Histórico (Ctrl+H)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Button 
                       variant="outline" 
                       size="icon-sm" 
                       className="rounded-full border-primary/30 hover:bg-primary/10 hover:text-primary"
                       onClick={() => setShowSettings(true)} 
                       ref={settingsButtonRef}
                     >
                       <Settings className="h-4 w-4" />
                     </Button>
                  </TooltipTrigger>
                   <TooltipContent>Configurações (Ctrl+S)</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon-sm" 
                        className="rounded-full border-primary/30 hover:bg-primary/10 hover:text-primary"
                        onClick={toggleAssistant}
                      >
                        <Bot className="h-4 w-4" />
                      </Button>
                  </TooltipTrigger>
                    <TooltipContent>Assistente IA</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6 pt-3">
                 <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                        <FormLabel className="font-medium">Modo de Prompt</FormLabel>
                      </div>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="bg-background border-muted-foreground/20 focus:ring-primary/30">
                            <SelectValue placeholder="Selecione o modo do prompt" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="app_creation">Criação de App</SelectItem>
                            <SelectItem value="image_generation">Geração de Imagem</SelectItem>
                            <SelectItem value="content_creation">Criação de Conteúdo</SelectItem>
                            <SelectItem value="problem_solving">Resolução de Problemas</SelectItem>
                            <SelectItem value="coding">Código</SelectItem>
                            <SelectItem value="instruct">Instrução</SelectItem>
                            <SelectItem value="explain">Explicação</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground/80">
                        Como o prompt será utilizado, determinando o formato e estrutura.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                        <FormLabel className="font-medium">Palavras-chave / Tópico</FormLabel>
                      </div>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            placeholder="Ex: marketing digital para iniciantes" 
                            {...field} 
                            className="bg-background border-muted-foreground/20 focus-visible:ring-primary/30"
                          />
                        </FormControl>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={suggestPromptTopic}
                              className="shrink-0 h-10 w-10 border-primary/20 bg-primary/5 hover:bg-primary/10"
                            >
                              <Sparkles className="h-4 w-4 text-primary" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Sugerir tema para o prompt</TooltipContent>
                        </Tooltip>
                      </div>
                      <FormDescription className="text-xs text-muted-foreground/80">
                        Insira as palavras-chave principais ou o tópico do prompt.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="context"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                        <FormLabel className="font-medium">Contexto (Opcional)</FormLabel>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: O público-alvo são pequenas empresas..."
                          className="resize-none bg-background border-muted-foreground/20 focus-visible:ring-primary/30"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-muted-foreground/80">
                        Forneça informações adicionais para refinar o prompt.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="tone"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                          <FormLabel className="font-medium">Tom</FormLabel>
                        </div>
                         <Select onValueChange={field.onChange} value={field.value}>
                           <FormControl>
                             <SelectTrigger className="bg-background border-muted-foreground/20 focus:ring-primary/30">
                               <SelectValue placeholder="Selecione o tom" />
                             </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                             {Object.values(Tone).map((toneValue) => (
                               <SelectItem key={toneValue} value={toneValue}>
                                 {toneValue.charAt(0).toUpperCase() + toneValue.slice(1)}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                          <FormLabel className="font-medium">Tamanho</FormLabel>
                        </div>
                         <Select onValueChange={field.onChange} value={field.value}>
                           <FormControl>
                             <SelectTrigger className="bg-background border-muted-foreground/20 focus:ring-primary/30">
                               <SelectValue placeholder="Selecione o tamanho" />
                             </SelectTrigger>
                           </FormControl>
                          <SelectContent>
                            <SelectItem value="short">Curto</SelectItem>
                            <SelectItem value="medium">Médio</SelectItem>
                            <SelectItem value="long">Longo</SelectItem>
                          </SelectContent>
                         </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Seletor de Idioma */}
                <div className="flex items-center justify-between rounded-lg border border-muted-foreground/20 p-4 shadow-sm bg-gradient-to-r from-primary/5 to-transparent">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                      <FormLabel className="text-base font-medium">Idioma da Resposta</FormLabel>
                    </div>
                    <FormDescription className="text-xs text-muted-foreground/80">
                      Selecione em qual idioma a IA deve responder
                    </FormDescription>
                  </div>
                  <Select 
                    value={preferences.language} 
                    onValueChange={(value) => {
                      const newLanguage = value as Language;
                      updatePreferences({ language: newLanguage });
                      
                      // Mostrar mensagem de confirmação
                      const message = newLanguage === "portuguese" 
                        ? "As respostas serão geradas em Português" 
                        : "As respostas serão geradas em Inglês";
                        
                      toast({
                        title: "Idioma alterado",
                        description: message,
                      });
                    }}
                  >
                    <SelectTrigger className="w-[180px] bg-background border-primary/20 hover:bg-primary/5 focus:ring-primary/30">
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portuguese">
                        <span className="flex items-center">
                          <span className="mr-2 text-lg">🇧🇷</span> Português
                        </span>
                      </SelectItem>
                      <SelectItem value="english">
                        <span className="flex items-center">
                          <span className="mr-2 text-lg">🇺🇸</span> Inglês
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-primary/70 hover:text-primary font-medium"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  >
                    Opções Avançadas
                    {showAdvancedOptions ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                  </Button>
                </div>
                <AnimatePresence>
                  {showAdvancedOptions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6 overflow-hidden"
                    >
                        <FormField
                          control={form.control}
                          name="complexity"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-2 mb-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                                <FormLabel className="font-medium">Complexidade ({field.value})</FormLabel>
                              </div>
                              <FormControl>
                                <Slider
                                  defaultValue={[field.value]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                  max={100}
                                  step={1}
                                  className="py-2"
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-muted-foreground/80">
                                Ajuste o nível de detalhe e complexidade do prompt.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="includeExamples"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-muted-foreground/20 p-4 shadow-sm">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                                  <FormLabel className="font-medium">Incluir Exemplos</FormLabel>
                                </div>
                                <FormDescription className="text-xs text-muted-foreground/80">
                                  Adicionar exemplos ao prompt gerado.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Campo de Estilo de Imagem - Mostrado apenas quando o modo é "image_generation" */}
                {form.watch("mode") === "image_generation" && (
                  <FormField
                    control={form.control}
                    name="imageStyle"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                          <FormLabel className="font-medium">Estilo da Imagem</FormLabel>
                        </div>
                        <FormControl>
                          <Select 
                            value={field.value || "realistic"} 
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="bg-background border-muted-foreground/20 focus:ring-primary/30">
                              <SelectValue placeholder="Selecione um estilo visual" />
                            </SelectTrigger>
                            <SelectContent>
                              {imageStyles.map((style) => (
                                <SelectItem key={style.value} value={style.value}>
                                  {style.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription className="text-xs text-muted-foreground/80">
                          O estilo visual que a IA deve usar para gerar a imagem.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
              <CardFooter className="pt-2 pb-6">
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-12 rounded-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md transition-all"
                  ref={generateButtonRef}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Gerar Prompt (Ctrl+Enter)
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

         <div className="lg:col-span-2 space-y-6">
           {/* Version Notes Input */}
           {showVersionNotes && generatedPrompt && ( // Só mostrar se tiver um prompt gerado
             <Card>
               <CardHeader>
                 <CardTitle>Salvar Versão</CardTitle>
                 {/* Corrigido: Usar <p> em vez de <FormDescription> */}
                 <p className="text-sm text-muted-foreground">Adicione notas a esta versão do prompt antes de salvar.</p>
               </CardHeader>
               <CardContent>
                    <Textarea
                      placeholder="Ex: Ajustado para focar mais em SEO..."
                      value={versionNotes}
                      onChange={(e) => setVersionNotes(e.target.value)}
                    />
               </CardContent>
               <CardFooter className="flex justify-end space-x-2">
                 <Button variant="outline" onClick={() => setShowVersionNotes(false)}>Cancelar</Button>
                 <Button onClick={handleSaveVersion}><Save className="mr-2 h-4 w-4"/> Salvar Versão</Button>
               </CardFooter>
             </Card>
           )}

           {/* Preview Area */}
           {isLoading ? (
             <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </CardContent>
             </Card>
           ) : generatedPrompt ? (
             <Card elevated hover>
               <CardHeader>
                 <div className="flex justify-between items-center">
                   <CardTitle>Prompt Gerado</CardTitle>
                   <div className="flex items-center space-x-2">
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon-sm" rounded="full" onClick={copyToClipboard}>
                           {copied ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                         </Button>
                       </TooltipTrigger>
                       <TooltipContent>{copied ? "Copiado!" : "Copiar Prompt"}</TooltipContent>
                     </Tooltip>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon-sm" rounded="full" onClick={() => setShowVersionHistory(true)}>
                           <History className="h-4 w-4" />
                         </Button>
                       </TooltipTrigger>
                       <TooltipContent>Histórico de Versões</TooltipContent>
                     </Tooltip>
                     <Tooltip>
                       <TooltipTrigger asChild>
                         {/* Habilitar botão de salvar apenas se as notas estiverem visíveis */}
                         <Button variant="ghost" size="icon-sm" rounded="full" onClick={handleSaveVersion} disabled={!showVersionNotes}>
                           <Save className="h-4 w-4" />
                         </Button>
                       </TooltipTrigger>
                       <TooltipContent>Salvar Versão Atual (Adicione notas primeiro)</TooltipContent>
                     </Tooltip>
                   </div>
                 </div>
                 {/* Corrigido: Usar <p> em vez de <FormDescription> */}
                 <p className="text-sm text-muted-foreground">Revise o prompt gerado ou edite-o diretamente.</p>
               </CardHeader>
               <CardContent className="pt-4">
                 {/* Corrigido: Passar a string do prompt e platform */}
                 <PromptCard
                   platform="generic"
                   prompt={generatedPrompt.genericPrompt}
                   onSaveEdit={handleSavePromptEdit}
                 />
               </CardContent>
             </Card>
           ) : (
             <Card className="flex flex-col items-center justify-center p-8 min-h-[300px] border-dashed" glass>
               <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
               <p className="text-muted-foreground text-center">Seu prompt gerado aparecerá aqui.</p>
               {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
             </Card>
           )}

           {/* Panels (conditionally rendered) */}
           <AnimatePresence>
             {showHistory && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 {/* Corrigido: Usar prop 'onSelect' e passar 'history' */}
                 <PromptHistory history={history} onSelect={handleSelectHistoryItem} />
               </motion.div>
             )}
             {showVersionHistory && generatedPrompt && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 {/* Corrigido: Adicionar promptId e onClose */}
                 <VersionHistory
                   promptId={generatedPrompt.id}
                   onSelectVersion={handleSelectVersion}
                   onClose={() => setShowVersionHistory(false)}
                 />
               </motion.div>
             )}
           </AnimatePresence>
         </div>

         {/* Dialogs */}
         <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
         {/* Corrigido: Remover prop triggerRef */}
         <CommandMenu />
         {/* Corrigido: Remover props onApplySuggestion e getCurrentParams */}
         <AIAssistantPanel />
      </div>
          </TooltipProvider>
  )
}
