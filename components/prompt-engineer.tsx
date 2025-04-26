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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select"
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
import { SimplePromptTemplate } from "@/lib/promptTemplates"
import { Complexity, Platform, Tone, Length, PromptParams, GeneratedPrompt, PromptMode, Language } from "@/lib/types"
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
  FileText,
  Wand2,
  Lightbulb,
  Code,
  ImageIcon,
  Briefcase,
  Coffee,
  Palette,
  Wrench,
  Scale,
  Heart,
  Rocket,
  LandPlot,
  MessageSquare,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  AlignJustify,
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
import { Label } from "@/components/ui/label"
import { GlassEffect } from "@/components/ui/glass-effect"

// Definir o tipo dos parâmetros parseados esperados da API
interface ParsedParams {
  keywords?: string;
  mode?: PromptMode;
  tone?: Tone;
  complexity?: Complexity;
  imageStyle?: string;
}

// Manter schema sem complexity
const formSchema = z.object({
  keywords: z.string().min(1, { message: "Palavras-chave são obrigatórias." }).optional(), 
  context: z.string().optional(),
  tone: z.nativeEnum(Tone),
  length: z.enum(["short", "medium", "long"]).optional(),
  includeExamples: z.boolean(),
  mode: z.enum([
    "app_creation", "image_generation", "content_creation", 
  ]),
  imageStyle: z.string().optional(),
  negativePrompt: z.string().optional(),
  modelId: z.string().optional(),
})

// Definir FormValues explicitamente SEM complexity
type FormValues = {
  keywords?: string;
  context?: string;
  tone: Tone;
  length?: "short" | "medium" | "long";
  includeExamples: boolean;
  mode: "app_creation" | "image_generation" | "content_creation";
  imageStyle?: string;
  negativePrompt?: string;
  modelId?: string;
};

// Adicionar mapNumberToComplexity de volta
const mapNumberToComplexity = (value: number): Complexity => {
  if (value < 34) return Complexity.SIMPLE;
  if (value < 67) return Complexity.MODERATE;
  return Complexity.DETAILED;
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
  { value: "character_double_exposure", label: "Dupla Exposição de Personagem" },
  { value: "midjourney_style", label: "Estilo Midjourney" },
];

// --- Lista de Modelos Gemini Disponíveis (Adicionando modelos 2.5) --- 
const geminiModels = [
  { value: "gemini-2.0-flash-thinking-exp-01-21", label: "Gemini 2.0 Flash Exp (Padrão)" },
  // Modelos 2.5 solicitados (VERIFICAR VALIDADE NA API)
  { value: "gemini-2.5-flash-preview-04-17", label: "Gemini 2.5 Flash Preview (04-17)" }, 
  { value: "gemini-2.5-pro-preview-03-25", label: "Gemini 2.5 Pro Preview (03-25)" },
  // Outros modelos existentes
  { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" }, 
  { value: "gemini-1.5-pro-preview-0409", label: "Gemini 1.5 Pro Preview (0409)" }, 
  { value: "gemini-1.0-pro", label: "Gemini 1.0 Pro" }, 
  { value: "gemini-1.5-flash-preview-0514", label: "Gemini 1.5 Flash Preview (0514)" }, 
  { value: "gemini-pro", label: "Gemini Pro (gen 1 via API v1)" }, 
];

// Mapeamento para rótulos amigáveis de Complexidade
const complexityLabels: Record<Complexity, string> = {
  [Complexity.SIMPLE]: "Simples",
  [Complexity.MODERATE]: "Moderado",
  [Complexity.DETAILED]: "Detalhado",
  // Adicionar mapeamentos para os outros se forem usados/necessários
  [Complexity.BEGINNER]: "Iniciante",
  [Complexity.INTERMEDIATE]: "Intermediário",
  [Complexity.ADVANCED]: "Avançado",
};

export function PromptEngineer() {
  const { toast } = useToast()
  const { preferences, isLoaded: preferencesLoaded, updatePreferences } = useUserPreferences()
  const { history, isLoading: historyIsLoading, generatePrompt } = usePromptHistory()
  const { addVersion } = usePromptVersions()
  const { toggleAssistant } = useAIAssistant()

  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false)
  const [versionNotes, setVersionNotes] = useState("")
  const [showVersionNotes, setShowVersionNotes] = useState(false)
  const [activeTab, setActiveTab] = useState("editor")
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [templates, setTemplates] = useState<SimplePromptTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templatesError, setTemplatesError] = useState<string | null>(null)

  const generateButtonRef = useRef<HTMLButtonElement>(null)
  const historyButtonRef = useRef<HTMLButtonElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)

  // --- Novos Estados para Refinamento --- 
  const [isRefining, setIsRefining] = useState(false);
  const [modificationRequest, setModificationRequest] = useState("");

  // --- Novo Estado para Sugestão de Tópico --- 
  const [isSuggestingTopic, setIsSuggestingTopic] = useState(false);

  // --- Adicionar estado useState para Complexity --- 
  const [selectedComplexity, setSelectedComplexity] = useState<Complexity>(Complexity.MODERATE);

  // --- Novo Estado para Lista de Sugestões de Tópico --- 
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);

  // --- Novo Estado para Interpretação --- 
  const [isParsingInstruction, setIsParsingInstruction] = useState(false);

  // --- State for Suggestions Dialog ---
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState(false)

  // Usar o tipo FormValues explícito
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema), // Schema ainda é usado para validação
    defaultValues: {
      keywords: "",
      context: "",
      tone: preferences.defaultTone || Tone.PROFESSIONAL,
      length: preferences.defaultLength || "medium",
      includeExamples: preferences.defaultIncludeExamples !== undefined ? preferences.defaultIncludeExamples : true,
      mode: "content_creation",
      imageStyle: "realistic",
      negativePrompt: "",
      modelId: undefined,
    },
  })

  // Corrigir useEffect de preferências
  useEffect(() => {
    if (preferencesLoaded) {
      // Garantir que defaultComplexity é tratado como número
      const defaultComplexityValue = typeof preferences.defaultComplexity === 'number' 
        ? preferences.defaultComplexity 
        : 50; // Usar 50 como fallback se não for número
      setSelectedComplexity(mapNumberToComplexity(defaultComplexityValue));
      
      // Resetar form SEM complexity
      form.reset({
        keywords: form.getValues("keywords") || "",
        context: form.getValues("context") || "",
        tone: preferences.defaultTone || form.getValues("tone"),
        length: preferences.defaultLength || form.getValues("length"),
        includeExamples: preferences.defaultIncludeExamples !== undefined ? preferences.defaultIncludeExamples : form.getValues("includeExamples"),
        mode: form.getValues("mode"),
        imageStyle: form.getValues("imageStyle"),
        negativePrompt: form.getValues("negativePrompt"),
        modelId: form.getValues("modelId"),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferencesLoaded, preferences]); // Remover form das dependências se causar loops

  useEffect(() => {
    const fetchTemplates = async () => {
      setTemplatesLoading(true)
      setTemplatesError(null)
      try {
        const response = await fetch("/api/templates")
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: Falha ao buscar templates`)
        }
        const data: SimplePromptTemplate[] = await response.json()
        setTemplates(data)
      } catch (err: any) {
        console.error("Erro ao buscar templates:", err)
        setTemplatesError(err.message)
      } finally {
        setTemplatesLoading(false)
      }
    }

    fetchTemplates()
  }, [])

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

  // Efeito para limpar isRefining se o prompt gerado mudar (ex: ao carregar do histórico)
  useEffect(() => {
    setIsRefining(false);
    setModificationRequest("");
  }, [generatedPrompt?.id]); // Depende do ID do prompt gerado

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    setError(null)
    setCopied(false)
    if (!isRefining) {
      setGeneratedPrompt(null)
    }

    let params: PromptParams;
    if (isRefining && generatedPrompt?.genericPrompt && modificationRequest) {
      // --- Modo Refinamento ---
      console.log("Refinando prompt...");
      params = {
        ...(generatedPrompt.params),
        keywords: undefined, 
        previousPrompt: generatedPrompt.genericPrompt,
        modificationRequest: modificationRequest,
        tone: values.tone, 
        complexity: selectedComplexity,
        length: values.length,
        mode: values.mode as PromptMode,
        language: preferences.language, 
        includeExamples: values.includeExamples,
        ...(values.mode === "image_generation" && values.imageStyle && { imageStyle: values.imageStyle }),
        ...(values.mode === "image_generation" && values.negativePrompt && { negativePrompt: values.negativePrompt.trim() }),
        ...(values.modelId && values.modelId !== "default" && { modelId: values.modelId.trim() }),
      };
    } else {
       // --- Modo Geração Normal --- 
       let processedKeywords = values.keywords?.trim() || "";
       if (!processedKeywords) {
         setError("Por favor, insira palavras-chave ou selecione um template.");
         setIsLoading(false);
         return; 
       }
       
       params = {
         keywords: processedKeywords,
         context: values.context,
         tone: values.tone,
         length: values.length,
         complexity: selectedComplexity,
         mode: values.mode as PromptMode,
         includeExamples: values.includeExamples,
         language: preferences.language,
         ...(values.mode === "image_generation" && values.imageStyle && { imageStyle: values.imageStyle }),
         ...(values.mode === "image_generation" && values.negativePrompt && { negativePrompt: values.negativePrompt.trim() }),
         ...(values.modelId && values.modelId !== "default" && { modelId: values.modelId.trim() }),
       };
    }

    console.log("Enviando para API com parâmetros:", params);

    try {
      toast({
        title: isRefining ? "Refinando prompt..." : "Gerando prompt...",
        description: `Processando modo: ${getModeLabel(values.mode)}`,
      });

      const timeoutPromise = new Promise<GeneratedPrompt>((_, reject) => {
        setTimeout(() => reject(new Error("Tempo esgotado. O servidor demorou muito para responder.")), 60000);
      });

      // A função generatePrompt do hook precisa ser capaz de lidar com os novos parâmetros
      const result = await Promise.race([
        generatePrompt(params),
        timeoutPromise
      ]) as GeneratedPrompt;

      console.log("Resultado recebido:", result);

      if (result && result.genericPrompt) {
        setGeneratedPrompt(result); // Atualiza com o novo prompt (gerado ou refinado)
        setActiveTab("preview");
        // Limpar estado de refinamento após sucesso
        setIsRefining(false); 
        setModificationRequest(""); 
      } else {
        throw new Error("Resposta da API inválida ou vazia.");
      }

    } catch (err: any) {
      console.error("Erro na geração:", err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Erro ao gerar prompt",
        description: err.message || "Ocorreu um erro inesperado.",
      })
    } finally {
      setIsLoading(false);
    }
  }

  const getModeLabel = (mode: string): string => {
    const modeLabels: Record<string, string> = {
      "app_creation": "Criação de App",
      "image_generation": "Geração de Imagem",
      "content_creation": "Criação de Conteúdo",
    };
    return modeLabels[mode] || mode;
  }

  const handleSaveVersion = () => {
    if (!generatedPrompt) return;
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
    setSelectedComplexity(promptParams.complexity);
    form.reset({
      keywords: promptParams.keywords,
      context: promptParams.context ?? "",
      tone: promptParams.tone,
      length: promptParams.length,
      includeExamples: promptParams.includeExamples,
      mode: promptParams.mode,
      imageStyle: promptParams.imageStyle,
      negativePrompt: promptParams.negativePrompt,
      modelId: promptParams.modelId,
    });
    
    if (promptParams.language) {
      updatePreferences({ language: promptParams.language });
    }
    
    setShowVersionHistory(false);
    toast({ title: "Versão carregada", description: "Parâmetros da versão selecionada foram carregados." });
  }

  const handleSelectTemplate = (template: SimplePromptTemplate) => {
    console.log("Template selecionado:", template);
    form.setValue("keywords", template.defaultKeywords || "");
    form.setValue("mode", template.mode);
    if (template.defaultTone) {
      form.setValue("tone", template.defaultTone);
    }
    if (template.mode === "image_generation" && template.imageStyle) {
      form.setValue("imageStyle", template.imageStyle);
    } else if (template.mode !== "image_generation") {
      form.setValue("imageStyle", undefined);
    }
    if (template.defaultComplexity) {
       setSelectedComplexity(template.defaultComplexity);
    }
    form.setValue("context", "");
    
    setShowTemplatesDialog(false);
    setGeneratedPrompt(null);
    setActiveTab("editor");
    
    toast({
      title: "Template aplicado!",
      description: `"${template.name}" carregado no editor.`,
    })
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
    setSelectedComplexity(item.params.complexity);
    form.reset({
      keywords: item.params.keywords,
      context: item.params.context ?? "",
      tone: item.params.tone,
      length: item.params.length,
      includeExamples: item.params.includeExamples,
      mode: item.params.mode,
      imageStyle: item.params.imageStyle,
      negativePrompt: item.params.negativePrompt,
      modelId: item.params.modelId,
    });
    if (item.params.language) {
      updatePreferences({ language: item.params.language });
    }
    setShowHistory(false);
    setGeneratedPrompt(item);
    toast({ title: "Prompt carregado", description: "O prompt selecionado foi carregado do histórico." });
  }

  // --- Modificar suggestPromptTopic para enviar contexto e receber lista --- 
  const suggestPromptTopic = async () => {
    setIsSuggestingTopic(true);
    setTopicSuggestions([]); // Limpar sugestões anteriores
    const currentMode = form.getValues("mode") as PromptMode;
    const currentLanguage = preferences.language;
    const currentKeywords = form.getValues("keywords"); // Pegar keywords atuais
    const currentContext = form.getValues("context"); // Pegar contexto atual
    
    console.log(`Requesting topic suggestion for mode: ${currentMode}, lang: ${currentLanguage}, keywords: ${currentKeywords}`);
    
    try {
      const response = await fetch("/api/suggest-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           mode: currentMode, 
           language: currentLanguage, 
           keywords: currentKeywords, // Enviar keywords
           context: currentContext // Enviar contexto
         }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const data = await response.json();
      const suggestedTopics: string[] = data.topics; // Esperar um array

      if (suggestedTopics && Array.isArray(suggestedTopics) && suggestedTopics.length > 0) {
        setTopicSuggestions(suggestedTopics); // Armazenar a lista
        setShowSuggestionsDialog(true); // Abrir o dialog aqui
        toast({
          title: "Sugestões de Tópico Geradas!",
          description: `Clique em uma sugestão para usá-la.`,
        });
      } else {
         // Se não vier sugestões, talvez apenas mostrar um toast?
         console.warn("API did not return valid suggestions.");
         toast({
            variant: "default", // Usar default ou warning
            title: "Nenhuma sugestão específica",
            description: "Não foi possível gerar sugestões no momento.",
          });
         // Não lançar erro aqui necessariamente, apenas não mostrar sugestões
         // throw new Error("Resposta da API de sugestão inválida.") 
      }

    } catch (err: any) {
       // ... (tratamento de erro existente) ...
    } finally {
      setIsSuggestingTopic(false);
    }
  }

  // Função para aplicar uma sugestão de tópico selecionada
  const applyTopicSuggestion = (topic: string) => {
    form.setValue("keywords", topic);
    setShowSuggestionsDialog(false); // Fechar o dialog aqui
  };

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

  // --- Nova Função para Interpretar Instrução --- 
  const handleParseInstruction = async () => {
    const instruction = form.getValues("keywords"); // Usar o texto atual de keywords como instrução
    if (!instruction || instruction.trim().length < 10) { // Requer instrução um pouco mais longa
      toast({
        variant: "destructive",
        title: "Instrução muito curta",
        description: "Digite uma frase mais completa para a IA interpretar.",
      });
      return;
    }

    setIsParsingInstruction(true);
    const currentLanguage = preferences.language;
    console.log(`Requesting instruction parsing for: "${instruction}"`);

    try {
      const response = await fetch("/api/parse-instruction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: instruction, language: currentLanguage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status}`);
      }

      const parsedParams: ParsedParams = await response.json();
      console.log("Received parsed params:", parsedParams);

      // Atualizar o formulário com os parâmetros recebidos
      let updatedFields = 0;
      if (parsedParams.keywords) {
        form.setValue("keywords", parsedParams.keywords);
        updatedFields++;
      }
      if (parsedParams.mode) {
        form.setValue("mode", parsedParams.mode);
        updatedFields++;
      }
      if (parsedParams.tone) {
        form.setValue("tone", parsedParams.tone);
        updatedFields++;
      }
      if (parsedParams.complexity) {
        setSelectedComplexity(parsedParams.complexity); // Atualizar estado de complexity
        updatedFields++;
      }
      if (parsedParams.imageStyle && parsedParams.mode === "image_generation") {
        form.setValue("imageStyle", parsedParams.imageStyle);
        updatedFields++;
      }

      if (updatedFields > 0) {
         toast({
          title: "Instrução Interpretada!",
          description: `Campos do formulário foram atualizados com base na sua instrução.`,
        });
      } else {
          toast({
            variant: "default",
            title: "Interpretação Concluída",
            description: "Não foram encontrados parâmetros claros para atualizar automaticamente.",
          });
      }

    } catch (err: any) {
      console.error("Erro ao interpretar instrução:", err);
      toast({
        variant: "destructive",
        title: "Erro na Interpretação",
        description: err.message || "Não foi possível interpretar a instrução.",
      });
    } finally {
      setIsParsingInstruction(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative pb-12">
        <Card className="lg:col-span-1 h-fit sticky top-24 shadow-lg border-primary/20 backdrop-blur-sm bg-gradient-to-br from-background to-background/90" elevated hover>
          <CardHeader className="pb-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary/15 p-2.5 rounded-xl shadow-inner">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary/70 bg-clip-text text-transparent">
                  Gerador de Prompt
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button size="icon-sm" className="rounded-full aspect-square bg-primary/8 backdrop-blur-sm border border-primary/20 shadow-sm hover:shadow-md hover:border-primary/40 hover:bg-primary/15 transition-all duration-300">
                            <Library className="h-4 w-4 text-primary/90" />
                            <span className="sr-only">Templates</span>
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-popover/90 backdrop-blur-md">Usar Template</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <DialogContent className="max-w-3xl p-0">
                    <DialogHeader className="p-6 pb-4">
                      <DialogTitle>Selecionar Template</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 pt-0">
                      {templatesLoading ? (
                        <div className="flex justify-center items-center h-[400px]">
                           <Loader2 className="h-8 w-8 animate-spin text-primary" /> 
                        </div>
                      ) : templatesError ? (
                        <p className="text-red-500 text-center py-4">Erro ao carregar templates: {templatesError}</p>
                      ) : templates.length > 0 ? (
                        <PromptTemplates 
                          templates={templates}
                          onSelectTemplate={handleSelectTemplate}
                        />
                      ) : (
                        <p className="text-center text-muted-foreground py-4">Nenhum template encontrado.</p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={showHistory} onOpenChange={setShowHistory}>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button size="icon-sm" className="rounded-full aspect-square bg-primary/8 backdrop-blur-sm border border-primary/20 shadow-sm hover:shadow-md hover:border-primary/40 hover:bg-primary/15 transition-all duration-300">
                            <History className="h-4 w-4 text-primary/90" />
                            <span className="sr-only">Histórico</span>
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-popover/90 backdrop-blur-md">Ver Histórico</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Dialog>
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button size="icon-sm" className="rounded-full aspect-square bg-primary/8 backdrop-blur-sm border border-primary/20 shadow-sm hover:shadow-md hover:border-primary/40 hover:bg-primary/15 transition-all duration-300">
                            <Settings className="h-4 w-4 text-primary/90" />
                            <span className="sr-only">Configurações</span>
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-popover/90 backdrop-blur-md">Configurações</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Dialog>
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon-sm" 
                        className="rounded-full aspect-square bg-primary/8 backdrop-blur-sm border border-primary/20 shadow-sm hover:shadow-md hover:border-primary/40 hover:bg-primary/15 transition-all duration-300" 
                        onClick={toggleAssistant}
                      >
                        <Bot className="h-4 w-4 text-primary/90" />
                        <span className="sr-only">Assistente IA</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-popover/90 backdrop-blur-md">Assistente IA</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
          </CardHeader>
          <Form {...form}>
            <fieldset disabled={isLoading || isSuggestingTopic || isParsingInstruction} className="group">
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
                          <SelectTrigger className="bg-background/80 backdrop-blur-sm border-muted-foreground/20 focus:ring-primary/30 transition-all duration-200 hover:border-primary/30">
                            <SelectValue placeholder="Selecione o modo do prompt" />
                          </SelectTrigger>
                          <SelectContent className="backdrop-blur-md">
                            <SelectItem value="app_creation" className="hover:bg-primary/5 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="bg-emerald-500/20 p-1.5 rounded-md">
                                  <Code className="h-3.5 w-3.5 text-emerald-600" />
                                </div>
                                <span>Criação de App</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="image_generation" className="hover:bg-primary/5 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="bg-violet-500/20 p-1.5 rounded-md">
                                  <ImageIcon className="h-3.5 w-3.5 text-violet-600" />
                                </div>
                                <span>Geração de Imagem</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="content_creation" className="hover:bg-primary/5 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="bg-blue-500/20 p-1.5 rounded-md">
                                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                                </div>
                                <span>Criação de Conteúdo</span>
                              </div>
                            </SelectItem>
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
                      <div className="flex gap-2 items-start">
                        <FormControl>
                          <Textarea 
                            placeholder="Digite palavras-chave ou uma instrução completa... Ex: Crie uma imagem de um astronauta em Marte, estilo cartoon"
                            className="bg-background/80 backdrop-blur-sm border-muted-foreground/20 focus-visible:ring-primary/30 min-h-[80px] resize-none disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:border-primary/30 transition-colors"
                            disabled={isRefining || isLoading || isSuggestingTopic || isParsingInstruction}
                            {...field}
                          />
                        </FormControl>
                        <div className="flex flex-col gap-1.5">
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={handleParseInstruction}
                                  className="shrink-0 h-10 w-10 rounded-lg border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
                                  disabled={isParsingInstruction || isLoading || isRefining || !(form.watch("keywords")?.trim() ?? "").length || (form.watch("keywords")?.trim() ?? "").length < 10}
                                >
                                  {isParsingInstruction ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-primary" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-popover/90 backdrop-blur-md">Interpretar Instrução (Beta)</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={suggestPromptTopic}
                                  className="shrink-0 h-10 w-10 rounded-lg border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
                                  disabled={isSuggestingTopic || isLoading || isParsingInstruction || isRefining} 
                                >
                                  {isSuggestingTopic ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                  ) : (
                                    <Sparkles className="h-4 w-4 text-primary" />
                                  )} 
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-popover/90 backdrop-blur-md">Sugerir tema (via IA)</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <FormDescription className="text-xs text-muted-foreground/80">
                        {isRefining 
                          ? "Refinando prompt anterior. Edite os parâmetros abaixo se necessário."
                          : "Insira palavras-chave ou uma instrução completa (e clique em Interpretar)."
                        }
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
                          className="resize-none bg-background/80 backdrop-blur-sm border-muted-foreground/20 focus-visible:ring-primary/30 shadow-sm hover:border-primary/30 transition-colors"
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
                             <SelectTrigger className="bg-background/80 backdrop-blur-sm border-muted-foreground/20 focus:ring-primary/30 hover:border-primary/30 transition-colors shadow-sm">
                               <SelectValue placeholder="Selecione o tom" />
                             </SelectTrigger>
                           </FormControl>
                           <SelectContent className="backdrop-blur-md">
                             {Object.values(Tone).map((toneValue) => (
                               <SelectItem key={toneValue} value={toneValue} className="hover:bg-primary/5 transition-colors">
                                 {(() => {
                                   // Usar ícones Lucide em vez de emojis
                                   let icon;
                                   let iconBgColor;
                                   
                                   switch(toneValue) {
                                     case "professional":
                                       icon = <Briefcase className="h-3.5 w-3.5 text-blue-600" />;
                                       iconBgColor = "bg-blue-500/20";
                                       break;
                                     case "casual":
                                       icon = <Coffee className="h-3.5 w-3.5 text-orange-600" />;
                                       iconBgColor = "bg-orange-500/20";
                                       break;
                                     case "creative":
                                       icon = <Palette className="h-3.5 w-3.5 text-purple-600" />;
                                       iconBgColor = "bg-purple-500/20";
                                       break;
                                     case "technical":
                                       icon = <Wrench className="h-3.5 w-3.5 text-gray-600" />;
                                       iconBgColor = "bg-gray-500/20";
                                       break;
                                     case "neutral":
                                       icon = <Scale className="h-3.5 w-3.5 text-gray-600" />;
                                       iconBgColor = "bg-gray-500/20";
                                       break;
                                     case "formal":
                                       icon = <FileText className="h-3.5 w-3.5 text-indigo-600" />;
                                       iconBgColor = "bg-indigo-500/20";
                                       break;
                                     case "friendly":
                                       icon = <Heart className="h-3.5 w-3.5 text-red-600" />;
                                       iconBgColor = "bg-red-500/20";
                                       break;
                                     case "enthusiastic":
                                       icon = <Rocket className="h-3.5 w-3.5 text-amber-600" />;
                                       iconBgColor = "bg-amber-500/20";
                                       break;
                                     case "authoritative":
                                       icon = <LandPlot className="h-3.5 w-3.5 text-teal-600" />;
                                       iconBgColor = "bg-teal-500/20";
                                       break;
                                     default:
                                       icon = <MessageSquare className="h-3.5 w-3.5 text-primary" />;
                                       iconBgColor = "bg-primary/20";
                                   }
                                   
                                   return (
                                     <span className="flex items-center">
                                       <div className={`${iconBgColor} p-1.5 rounded-md mr-2`}>
                                         {icon}
                                       </div>
                                       {toneValue.charAt(0).toUpperCase() + toneValue.slice(1)}
                                     </span>
                                   );
                                 })()}
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
                         <Select
                           value={field.value}
                           onValueChange={field.onChange}
                         >
                           <FormControl>
                             <SelectTrigger className="rounded-xl">
                               <SelectValue placeholder="Selecione o comprimento" />
                             </SelectTrigger>
                           </FormControl>
                           <SelectContent className="backdrop-blur-md">
                             {["short", "medium", "long"].map((lengthValue) => (
                               <SelectItem key={lengthValue} value={lengthValue} className="hover:bg-primary/5 transition-colors">
                                 {(() => {
                                   // Usar ícones Lucide em vez de emojis
                                   let icon;
                                   let iconBgColor;
                                   
                                   switch(lengthValue) {
                                     case "short":
                                       icon = <AlignStartHorizontal className="h-3.5 w-3.5 text-green-600" />;
                                       iconBgColor = "bg-green-500/20";
                                       break;
                                     case "medium":
                                       icon = <AlignCenterHorizontal className="h-3.5 w-3.5 text-amber-600" />;
                                       iconBgColor = "bg-amber-500/20";
                                       break;
                                     case "long":
                                       icon = <AlignEndHorizontal className="h-3.5 w-3.5 text-blue-600" />;
                                       iconBgColor = "bg-blue-500/20";
                                       break;
                                     default:
                                       icon = <AlignJustify className="h-3.5 w-3.5 text-primary" />;
                                       iconBgColor = "bg-primary/20";
                                   }
                                   
                                   return (
                                     <span className="flex items-center">
                                       <div className={`${iconBgColor} p-1.5 rounded-md mr-2`}>
                                         {icon}
                                       </div>
                                       {lengthValue === "short" ? "Curto" : 
                                        lengthValue === "medium" ? "Médio" : 
                                        lengthValue === "long" ? "Longo" : 
                                        lengthValue.charAt(0).toUpperCase() + lengthValue.slice(1)}
                                     </span>
                                   );
                                 })()}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Seletor de Idioma */}
                <div className="flex items-center justify-between rounded-lg border border-muted-foreground/20 p-4 shadow-sm bg-gradient-to-r from-primary/5 to-transparent hover:shadow-md transition-shadow">
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
                    <SelectTrigger className="w-[180px] bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary/5 focus:ring-primary/30 transition-colors">
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent className="backdrop-blur-md">
                      <SelectItem value="portuguese" className="hover:bg-primary/5 transition-colors">
                        <span className="flex items-center">
                          <span className="mr-2 text-lg">🇧🇷</span> Português
                        </span>
                      </SelectItem>
                      <SelectItem value="english" className="hover:bg-primary/5 transition-colors">
                        <span className="flex items-center">
                          <span className="mr-2 text-lg">🇺🇸</span> Inglês
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* --- Campo Negative Prompt (condicional) --- */}
                {form.watch("mode") === "image_generation" && (
                  <FormField
                    control={form.control}
                    name="negativePrompt"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2 mb-1.5">
                           {/* Ícone opcional */}
                           <div className="h-1.5 w-1.5 rounded-full bg-destructive/70" />
                           <FormLabel className="font-medium">Prompt Negativo (Opcional)</FormLabel>
                         </div>
                         <FormControl>
                           <Textarea
                             placeholder="Elementos a evitar na imagem... Ex: texto, baixa qualidade, deformado"
                             className="resize-none bg-background/80 backdrop-blur-sm border-muted-foreground/20 focus-visible:ring-destructive/30 shadow-sm hover:border-destructive/30 transition-colors"
                             {...field}
                             value={field.value ?? ""} // Garantir que seja string
                           />
                         </FormControl>
                         <FormDescription className="text-xs text-muted-foreground/80">
                           Descreva o que NÃO deve aparecer na imagem gerada.
                         </FormDescription>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 )}

                <div>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-primary/70 hover:text-primary font-medium transition-colors group"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  >
                    Opções Avançadas
                    <span className="ml-1 group-hover:translate-x-0.5 transition-transform">
                      {showAdvancedOptions ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />}
                    </span>
                  </Button>
                </div>
                <AnimatePresence>
                  {showAdvancedOptions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="space-y-6 overflow-hidden"
                    >
                        <FormItem className="bg-gradient-to-r from-primary/3 to-transparent p-4 rounded-lg border border-primary/10 shadow-sm"> 
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                            <FormLabel className="font-medium">Complexidade</FormLabel>
                          </div>
                          <Select 
                            onValueChange={(value) => setSelectedComplexity(value as Complexity)}
                            value={selectedComplexity} 
                            disabled={isLoading}
                           > 
                            <FormControl> 
                              <SelectTrigger className="bg-background/80 backdrop-blur-sm border-muted-foreground/20 focus:ring-primary/30 hover:border-primary/30 transition-colors shadow-sm">
                                <SelectValue placeholder="Selecione o nível..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="backdrop-blur-md">
                              <SelectItem value={Complexity.SIMPLE} className="hover:bg-primary/5 transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className="w-12 bg-gradient-to-r from-primary/30 to-primary/10 h-1.5 rounded-full"></div>
                                  <span>Simples</span>
                                </div>
                              </SelectItem>
                              <SelectItem value={Complexity.MODERATE} className="hover:bg-primary/5 transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className="w-12 bg-gradient-to-r from-primary/50 to-primary/20 h-1.5 rounded-full"></div>
                                  <span>Moderado</span>
                                </div>
                              </SelectItem>
                              <SelectItem value={Complexity.DETAILED} className="hover:bg-primary/5 transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className="w-12 bg-gradient-to-r from-primary/80 to-primary/40 h-1.5 rounded-full"></div>
                                  <span>Detalhado</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs text-muted-foreground/80 mt-1.5">
                            Define o nível de detalhe da resposta da IA.
                          </FormDescription>
                        </FormItem> 
                        
                        <FormField
                          control={form.control}
                          name="includeExamples"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-muted-foreground/20 p-4 shadow-sm bg-gradient-to-r from-primary/3 to-transparent hover:shadow-md transition-all duration-300">
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
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* Seleção de Modelo - Só mostrar para GPT-4 e SE o modo não for image_generation */}
                        {form.watch("mode") !== "image_generation" && (
                          <FormField
                            control={form.control}
                            name="modelId"
                            render={({ field }) => (
                              <FormItem className="bg-gradient-to-r from-primary/3 to-transparent p-4 rounded-lg border border-primary/10 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary/70" />
                                  <FormLabel className="font-medium">Modelo da IA</FormLabel>
                                </div>
                                <Select
                                  value={field.value || "default"}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-background/80 backdrop-blur-sm border-muted-foreground/20 focus:ring-primary/30 hover:border-primary/30 transition-colors shadow-sm">
                                      <SelectValue placeholder="Selecione o modelo" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="backdrop-blur-md max-h-[300px]">
                                    <SelectItem value="default" className="hover:bg-primary/5 transition-colors">
                                      <div className="flex items-center gap-2">
                                        <div className="bg-primary/20 p-1.5 rounded-md">
                                          <BrainCircuit className="h-3.5 w-3.5 text-primary/80" />
                                        </div>
                                        <span>Padrão (recomendado)</span>
                                      </div>
                                    </SelectItem>
                                    <SelectSeparator />
                                    {geminiModels.map((model) => (
                                      <SelectItem key={model.value} value={model.value} className="hover:bg-primary/5 transition-colors">
                                        <div className="flex items-center gap-2">
                                          <div className="bg-accent/20 p-1.5 rounded-md">
                                            <Sparkles className="h-3.5 w-3.5 text-accent/80" />
                                          </div>
                                          <span>{model.label}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription className="text-xs text-muted-foreground/80 mt-1.5">
                                  Modelo utilizado para gerar o prompt (opcional).
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
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
              <CardFooter className="pt-2 pb-6 flex flex-col items-stretch gap-3">
                <div className="flex flex-col gap-4">
                  {/* Botão cancelar refinamento */}
                  {isRefining && (
                    <Button 
                      onClick={() => setIsRefining(false)}
                      variant="outline" 
                      className="w-full mt-2 rounded-full border-primary/20 hover:bg-primary/5 hover:border-primary/30 transition-all"
                    >
                      Cancelar Refinamento
                    </Button>
                  )}

                  {/* Botão principal */}
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full h-12 rounded-full bg-gradient-to-r from-primary/90 via-primary to-accent/90 shadow-md hover:shadow-lg hover:from-primary hover:to-accent/90 transition-all duration-300 font-medium text-white"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2.5">
                          <Loader2 className="h-4 w-4 animate-spin" /> Gerando Prompt...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="h-4 w-4" /> {isRefining ? "Refinar Prompt" : "Gerar Prompt"}
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </div>

                {/* --- Seção de Refinamento (Condicional) --- */} 
                {isRefining && (
                  <div className="mt-2 border-t border-border/10 pt-3 space-y-3"> {/* Aumentar espaço */}
                      {/* --- Mostrar Prompt Original --- */} 
                      {generatedPrompt?.genericPrompt && ( 
                        <div className="space-y-1.5">
                           <Label className="text-xs font-semibold text-muted-foreground">Refinando o prompt:</Label>
                           <Card className="bg-muted/40 border-muted-foreground/20 max-h-40 overflow-y-auto"> {/* Limitar altura e adicionar scroll */} 
                             <CardContent className="p-3">
                               <pre className="text-xs whitespace-pre-wrap break-words text-foreground/80">
                                 {generatedPrompt.genericPrompt}
                               </pre>
                             </CardContent>
                           </Card>
                         </div>
                       )}
                      {/* --- Input Instrução de Refinamento --- */} 
                     <div className="space-y-1.5">
                       <Label htmlFor="modificationRequest" className="text-sm font-medium">Instrução de Modificação:</Label>
                       <Textarea
                         id="modificationRequest"
                         placeholder="Ex: Faça mais curto, mude o tom para formal, adicione exemplos..."
                         value={modificationRequest}
                         onChange={(e) => setModificationRequest(e.target.value)}
                         className="bg-background border-muted-foreground/20 focus-visible:ring-primary/30 min-h-[60px]"
                         disabled={isLoading}
                       />
                      </div>
                  </div>
                )}
              </CardFooter>
             </form>
            </fieldset>
          </Form>
        </Card>

         <div className="lg:col-span-2 space-y-6">
           {/* Version Notes Input */}
           {showVersionNotes && generatedPrompt && ( // Só mostrar se tiver um prompt gerado
             <Card className="border-primary/15 shadow-md backdrop-blur-sm">
               <CardHeader>
                 <CardTitle>Salvar Versão</CardTitle>
                 <p className="text-sm text-muted-foreground">Adicione notas a esta versão do prompt antes de salvar.</p>
               </CardHeader>
               <CardContent>
                    <Textarea
                      placeholder="Ex: Ajustado para focar mais em SEO..."
                      value={versionNotes}
                      onChange={(e) => setVersionNotes(e.target.value)}
                      className="border-primary/15 focus-visible:ring-primary/30"
                    />
               </CardContent>
               <CardFooter className="flex justify-end space-x-2">
                 <Button variant="outline" onClick={() => setShowVersionNotes(false)}>Cancelar</Button>
                 <Button onClick={handleSaveVersion} className="bg-primary/90 hover:bg-primary"><Save className="mr-2 h-4 w-4"/> Salvar Versão</Button>
               </CardFooter>
             </Card>
           )}

           {/* Preview Area */}
           {isLoading ? (
             <Card className="border-primary/15 shadow-lg backdrop-blur-sm">
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
             <GlassEffect 
               animate
               blur="lg"
               opacity="low"
               glow
               className="overflow-hidden"
             >
               <div className="bg-gradient-to-br from-primary/5 via-background/30 to-background/20">
                 <div className="p-6 pb-4">
                   <div className="flex justify-between items-center">
                     <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-accent/80 bg-clip-text text-transparent">Prompt Gerado</h2>
                     <div className="flex items-center space-x-1.5">
                       {!isRefining && (
                           <Tooltip>
                            <TooltipTrigger asChild>
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="ghost" size="icon-sm" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setIsRefining(true)}>
                                  <Zap className="h-4 w-4" />
                                </Button>
                              </motion.div>
                             </TooltipTrigger>
                            <TooltipContent className="bg-popover/90 backdrop-blur-md">Refinar este prompt</TooltipContent>
                          </Tooltip>
                       )}
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                             <Button variant="ghost" size="icon-sm" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={copyToClipboard}>
                               {copied ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                             </Button>
                           </motion.div>
                         </TooltipTrigger>
                         <TooltipContent className="bg-popover/90 backdrop-blur-md">{copied ? "Copiado!" : "Copiar Prompt"}</TooltipContent>
                       </Tooltip>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                             <Button variant="ghost" size="icon-sm" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setShowVersionHistory(true)}>
                               <History className="h-4 w-4" />
                             </Button>
                           </motion.div>
                         </TooltipTrigger>
                         <TooltipContent className="bg-popover/90 backdrop-blur-md">Histórico de Versões</TooltipContent>
                       </Tooltip>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                             <Button variant="ghost" size="icon-sm" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => setShowVersionNotes(true)} disabled={showVersionNotes}>
                               <Save className="h-4 w-4" />
                             </Button>
                           </motion.div>
                         </TooltipTrigger>
                         <TooltipContent className="bg-popover/90 backdrop-blur-md">Salvar Versão Atual</TooltipContent>
                       </Tooltip>
                     </div>
                   </div>
                   <p className="text-sm text-muted-foreground mt-2">Revise o prompt gerado ou edite-o diretamente.</p>
                 </div>
                 <div className="px-6 pb-6">
                   <PromptCard
                     platform="generic"
                     prompt={generatedPrompt.genericPrompt}
                     onSaveEdit={handleSavePromptEdit}
                   />
                 </div>
               </div>
             </GlassEffect>
           ) : (
             <GlassEffect 
               animate
               opacity="low"
               className="flex flex-col items-center justify-center p-8 min-h-[300px] border-dashed border-primary/20"
             >
               <motion.div 
                 initial={{ opacity: 0.5, y: 5 }}
                 animate={{ opacity: 1, y: [0, -5, 0] }}
                 transition={{ 
                   repeat: Infinity, 
                   duration: 3,
                   ease: "easeInOut"
                 }}
               >
                 <Sparkles className="h-14 w-14 text-muted-foreground mb-4" />
               </motion.div>
               <p className="text-muted-foreground text-center font-medium">Seu prompt gerado aparecerá aqui.</p>
               {error && (
                 <motion.div
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                 >
                   <p className="text-destructive mt-2 text-sm bg-destructive/10 px-3 py-1.5 rounded-full">{error}</p>
                 </motion.div>
               )}
             </GlassEffect>
           )}

           {/* Panels (conditionally rendered) */}
           <AnimatePresence mode="wait">
             {showHistory && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 exit={{ opacity: 0, y: -20 }}
                 transition={{ duration: 0.3 }}
               >
                 <PromptHistory history={history} onSelect={handleSelectHistoryItem} />
               </motion.div>
             )}
             {showVersionHistory && generatedPrompt && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 exit={{ opacity: 0, y: -20 }}
                 transition={{ duration: 0.3 }}
               >
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
         <CommandMenu />
         <AIAssistantPanel />
         {/* --- Suggestions Dialog --- */} 
         <Dialog open={showSuggestionsDialog} onOpenChange={setShowSuggestionsDialog}>
           <DialogContent className="max-w-lg bg-background/80 backdrop-blur-md border-primary/10 shadow-lg">
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                 <Lightbulb className="h-5 w-5 text-primary animate-pulse" />
                 <span className="bg-gradient-to-r from-primary to-accent/80 bg-clip-text text-transparent">Sugestões de Tópico</span>
               </DialogTitle>
               <p className="text-sm text-muted-foreground">
                 Escolha um tópico para iniciar seu prompt ou para inspiração.
               </p>
             </DialogHeader>
             <div className="pt-2 pb-1">
               {topicSuggestions.length > 0 ? (
                 <div className="flex flex-col max-h-[400px] overflow-y-auto -mx-6 divide-y divide-border/5">
                   {topicSuggestions.map((topic, index) => (
                     <motion.div
                       key={index}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.05, duration: 0.2 }}
                       whileHover={{ backgroundColor: "rgba(var(--primary-rgb), 0.05)" }}
                     >
                       <Button 
                         variant="ghost" 
                         className="justify-start font-normal rounded-none w-full hover:bg-transparent px-6 py-3 text-left h-auto whitespace-normal"
                         onClick={() => applyTopicSuggestion(topic)}
                       >
                         <div className="flex gap-3">
                           <div className="bg-primary/10 p-1.5 rounded-lg flex items-center justify-center mt-0.5">
                             <Lightbulb className="h-4 w-4 text-primary" /> 
                           </div>
                           <div>
                             <p className="font-medium text-foreground">{topic}</p>
                             <p className="text-xs text-muted-foreground mt-1">
                               Clique para aplicar este tópico ao seu prompt
                             </p>
                           </div>
                         </div>
                       </Button>
                     </motion.div>
                   ))}
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-10">
                   <Loader2 className="h-8 w-8 text-primary/50 animate-spin mb-4" />
                   <p className="text-muted-foreground text-center">Buscando sugestões...</p>
                 </div>
               )}
             </div>
           </DialogContent>
         </Dialog>
      </div>
    </TooltipProvider>
  )
}
