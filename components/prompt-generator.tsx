"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { PromptCard } from "@/components/prompt-card"
import { PlatformSelector } from "@/components/platform-selector"
import { PromptHistory } from "@/components/prompt-history"
import { SettingsDialog } from "@/components/settings-dialog"
import { PromptTemplates } from "@/components/prompt-templates"
import { PromptComparison } from "@/components/prompt-comparison"
import { CommandMenu } from "@/components/command-menu"
import { usePromptHistory } from "@/lib/hooks/use-prompt-history"
import { useUserPreferences } from "@/lib/hooks/use-user-preferences"
import type { Platform, Length, PromptMode } from "@/lib/types" // Add PromptMode type import
import { Tone, Complexity } from "@/lib/types" // Add regular import for Tone and Complexity
import { templates as promptTemplateList, SimplePromptTemplate } from "@/lib/promptTemplates" // Import the list and type
import {
  Loader2,
  Sparkles,
  History,
  Settings,
  Download,
  Command,
  Lightbulb,
  Maximize2,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

export function PromptGenerator() {
  const { toast } = useToast()
  const { preferences, isLoaded } = useUserPreferences()
  const { history, isLoading, generatePrompt } = usePromptHistory()

  // Estados do formulário
  const [keywords, setKeywords] = useState("")
  const [context, setContext] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["cursor", "lovable", "bolt"])
  const [tone, setTone] = useState<Tone>(Tone.PROFESSIONAL)
  const [length, setLength] = useState<Length>("medium")
  const [complexity, setComplexity] = useState(50)
  const [includeExamples, setIncludeExamples] = useState(true)

  // Estados da UI
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [activeTab, setActiveTab] = useState<Platform>("cursor")
  const [formErrors, setFormErrors] = useState<{ keywords?: string }>({})

  // Referências para atalhos de teclado
  const generateButtonRef = useRef<HTMLButtonElement>(null)
  const historyButtonRef = useRef<HTMLButtonElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)

  // Carregar preferências do usuário
  useEffect(() => {
    if (isLoaded) {
      setSelectedPlatforms(preferences.defaultPlatforms)
      setTone(preferences.defaultTone)
      setLength(preferences.defaultLength)
      setComplexity(preferences.defaultComplexity)
      setIncludeExamples(preferences.defaultIncludeExamples)
    }
  }, [isLoaded, preferences])

  // Atualizar aba ativa quando as plataformas selecionadas mudam
  useEffect(() => {
    if (selectedPlatforms.length > 0 && !selectedPlatforms.includes(activeTab)) {
      setActiveTab(selectedPlatforms[0])
    }
  }, [selectedPlatforms, activeTab])

  // Configurar atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Não processar atalhos se estiver em um campo de entrada
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      if (e.key === "g" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        generateButtonRef.current?.click()
      } else if (e.key === "h" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        historyButtonRef.current?.click()
      } else if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        settingsButtonRef.current?.click()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Validar formulário
  const validateForm = () => {
    const errors: { keywords?: string } = {}

    if (!keywords.trim()) {
      errors.keywords = "Palavras-chave são obrigatórias"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Gerar prompts
  const handleGenerate = async () => {
    if (!validateForm()) return

    try {
      // Mapear o valor numérico de complexidade para o enum Complexity
      let mappedComplexity: Complexity;
      if (complexity <= 33) {
        mappedComplexity = Complexity.SIMPLE;
      } else if (complexity <= 66) {
        mappedComplexity = Complexity.MODERATE;
      } else {
        mappedComplexity = Complexity.DETAILED;
      }

      const result = await generatePrompt({
        keywords,
        context,
        // platforms: selectedPlatforms, // Removido - não é esperado por PromptParams/API
        tone,
        length,
        complexity: mappedComplexity, // Usar o valor mapeado do enum
        mode: 'website_creation', // Adicionar modo padrão
        includeExamples,
      })

      // Definir a aba ativa para a primeira plataforma selecionada
      if (selectedPlatforms.length > 0) {
        setActiveTab(selectedPlatforms[0])
      }

      toast({
        title: "Prompts gerados com sucesso",
        description: `Gerados prompts para ${selectedPlatforms.length} plataforma(s)`,
      })
    } catch (error) {
      toast({
        title: "Erro ao gerar prompts",
        description: "Ocorreu um erro ao gerar os prompts. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  // Exportar prompts como JSON
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

      toast({
        title: "Prompts exportados",
        description: "Seus prompts foram exportados com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao exportar os prompts.",
        variant: "destructive",
      })
    }
  }

  const hasGeneratedPrompts = history.length > 0
  const latestPrompt = history[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Menu de comandos */}
      <CommandMenu />

      {/* Barra de ferramentas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
            Gerador de Prompts IA
          </h1>
          <Badge variant="outline" className="bg-background/50">
            v2.0
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  id="history-button"
                  ref={historyButtonRef}
                  variant="outline"
                  size="icon"
                  className="rounded-full glass border-0"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <History className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Histórico de prompts (⌘H)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  id="settings-button"
                  ref={settingsButtonRef}
                  variant="outline"
                  size="icon"
                  className="rounded-full glass border-0"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Configurações (⌘S)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full glass border-0"
                  onClick={() => setShowTemplates(!showTemplates)}
                >
                  <Lightbulb className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Templates de prompts</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full glass border-0" onClick={exportPrompts}>
                  <Download className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Exportar prompts (⌘E)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full glass border-0">
                  <Command className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Menu de comandos (⌘K)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Templates de prompts */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PromptTemplates
              templates={promptTemplateList} // Passar a lista de templates importada
              onSelectTemplate={(template: SimplePromptTemplate) => { // Tipar o argumento template
                setKeywords(template.defaultKeywords || ""); // Usar defaultKeywords
                setContext(""); // Resetar contexto ao aplicar template

                // Manter plataformas selecionadas, não sobrescrever com template
                // setSelectedPlatforms(template.platforms) // Remover

                if (template.defaultTone) {
                  setTone(template.defaultTone); // Usar defaultTone se existir
                }
                // Manter tamanho selecionado, não sobrescrever com template
                // setLength(template.length) // Remover

                if (template.defaultComplexity) {
                  // Mapear enum Complexity de volta para valor numérico 0-100
                  let numericComplexity = 50; // Default
                  switch (template.defaultComplexity) {
                    case Complexity.SIMPLE:
                    case Complexity.BEGINNER:
                      numericComplexity = 15;
                      break;
                    case Complexity.MODERATE:
                    case Complexity.INTERMEDIATE:
                      numericComplexity = 50;
                      break;
                    case Complexity.DETAILED:
                    case Complexity.ADVANCED:
                      numericComplexity = 85;
                      break;
                  }
                  setComplexity(numericComplexity); // Usar valor numérico mapeado
                }

                // Manter includeExamples selecionado, não sobrescrever com template
                // setIncludeExamples(template.includeExamples) // Remover

                setShowTemplates(false)
                toast({
                  title: "Template aplicado",
                  description: `O template "${template.name}" foi aplicado com sucesso.`, // Usar template.name
                })
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="overflow-hidden border-0 shadow-lg glass">
            <CardHeader className="border-b border-border/10 pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-primary"></span>
                Parâmetros do Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="keywords" className="text-sm font-medium">
                  Palavras-chave/Tópico
                </Label>
                <Input
                  id="keywords"
                  placeholder="Digite palavras-chave ou tópico"
                  value={keywords}
                  onChange={(e) => {
                    setKeywords(e.target.value)
                    if (e.target.value.trim()) {
                      setFormErrors((prev) => ({ ...prev, keywords: undefined }))
                    }
                  }}
                  className={`transition-all focus-visible:ring-primary border-border/20 bg-background/50 ${
                    formErrors.keywords ? "border-red-500 focus-visible:ring-red-500" : ""
                  }`}
                  aria-invalid={!!formErrors.keywords}
                  aria-describedby={formErrors.keywords ? "keywords-error" : undefined}
                />
                {formErrors.keywords && (
                  <p id="keywords-error" className="text-sm text-red-500 mt-1">
                    {formErrors.keywords}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="context" className="text-sm font-medium">
                  Contexto Adicional (Opcional)
                </Label>
                <Textarea
                  id="context"
                  placeholder="Forneça qualquer contexto adicional"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  className="resize-none transition-all focus-visible:ring-primary border-border/20 bg-background/50"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Plataformas</Label>
                <PlatformSelector selectedPlatforms={selectedPlatforms} onChange={setSelectedPlatforms} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="tone" className="text-sm font-medium">
                    Tom
                  </Label>
                  <Select value={tone} onValueChange={(value) => setTone(value as Tone)}>
                    <SelectTrigger
                      id="tone"
                      className="transition-all focus-visible:ring-primary border-border/20 bg-background/50"
                    >
                      <SelectValue placeholder="Selecione o tom" />
                    </SelectTrigger>
                    <SelectContent className="border-border/20 bg-background/90 backdrop-blur-md">
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="creative">Criativo</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length" className="text-sm font-medium">
                    Tamanho
                  </Label>
                  <Select value={length} onValueChange={(value) => setLength(value as Length)}>
                    <SelectTrigger
                      id="length"
                      className="transition-all focus-visible:ring-primary border-border/20 bg-background/50"
                    >
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent className="border-border/20 bg-background/90 backdrop-blur-md">
                      <SelectItem value="short">Curto</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="long">Longo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Opções avançadas (expansível) */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>Opções avançadas</span>
                  {showAdvancedOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                <AnimatePresence>
                  {showAdvancedOptions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="complexity" className="text-sm font-medium">
                            Complexidade
                          </Label>
                          <span className="text-sm text-muted-foreground">{complexity}%</span>
                        </div>
                        <Slider
                          id="complexity"
                          min={0}
                          max={100}
                          step={1}
                          value={[complexity]}
                          onValueChange={(value) => setComplexity(value[0])}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Simples</span>
                          <span>Avançado</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="examples" checked={includeExamples} onCheckedChange={setIncludeExamples} />
                        <Label htmlFor="examples" className="text-sm font-medium">
                          Incluir Exemplos
                        </Label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/10 pt-4">
              <Button
                id="generate-button"
                ref={generateButtonRef}
                onClick={handleGenerate}
                className="w-full rounded-full transition-all"
                disabled={!keywords.trim() || isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Prompts
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Histórico de prompts (visível apenas quando showHistory é true) */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <PromptHistory
                  history={history}
                  onSelect={(item) => {
                    setKeywords(item.params.keywords ?? "") // Provide default empty string
                    setContext(item.params.context || "")
                    // setSelectedPlatforms(item.params.platforms) // 'platforms' não existe em PromptParams
                    setTone(item.params.tone)
                    setLength(item.params.length ?? 'medium') // Provide default length
                    // Mapear enum Complexity de volta para valor numérico 0-100
                    let numericComplexity = 50; // Default
                    switch (item.params.complexity) {
                      case Complexity.SIMPLE:
                      case Complexity.BEGINNER:
                        numericComplexity = 15;
                        break;
                      case Complexity.MODERATE:
                      case Complexity.INTERMEDIATE:
                        numericComplexity = 50;
                        break;
                      case Complexity.DETAILED:
                      case Complexity.ADVANCED:
                        numericComplexity = 85;
                        break;
                    }
                    setComplexity(numericComplexity); // Usar valor numérico mapeado
                    setIncludeExamples(item.params.includeExamples ?? true) // Provide default
                    setShowHistory(false)
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Resultados */}
        <div className="lg:col-span-7">
          <Card className="h-full border-0 shadow-lg overflow-hidden glass">
            <CardHeader className="border-b border-border/10 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full bg-primary"></span>
                Prompts Gerados
              </CardTitle>
              {/* {hasGeneratedPrompts && ( // Botão Comparar comentado pois 'results' não existe em GeneratedPrompt
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5"
                    onClick={() => setShowComparison(!showComparison)}
                  >
                    {showComparison ? (
                      <>
                        <LayoutGrid className="h-4 w-4" />
                        <span>Visualização normal</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="h-4 w-4" />
                        <span>Comparar prompts</span>
                      </>
                    )}
                  </Button>
                </div>
              )} */}
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-8 w-1/3" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : !hasGeneratedPrompts ? (
                <div className="flex flex-col items-center justify-center h-[500px] text-center p-6">
                  <motion.div
                    className="rounded-full bg-primary/10 p-6 mb-4"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3 }}
                  >
                    <Sparkles className="h-10 w-10 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-medium mb-2">Nenhum prompt gerado ainda</h3>
                  <p className="text-muted-foreground max-w-md">
                    Digite seus parâmetros e gere prompts para ver os resultados aqui.
                  </p>

                  <div className="mt-8 space-y-4 max-w-md">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Dicas para prompts eficazes:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Seja específico com suas palavras-chave</li>
                        <li>Adicione contexto para resultados mais precisos</li>
                        <li>Experimente diferentes tons para variação</li>
                        <li>Ajuste a complexidade conforme seu público-alvo</li>
                      </ul>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setKeywords("Desenvolvimento web com React e Next.js")
                        setContext("Para um tutorial voltado a desenvolvedores iniciantes")
                        setShowTemplates(true)
                      }}
                    >
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Explorar templates
                    </Button>
                  </div>
                </div>
              ) : ( // Removido o ramo showComparison
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Platform)} className="w-full">
                  <TabsList className="w-full rounded-none border-b border-border/10 bg-background/20 p-0 h-auto">
                    {(["cursor", "lovable", "bolt"] as Platform[]).map((platform) => (
                      <TabsTrigger
                        key={platform}
                        value={platform}
                        // disabled={!latestPrompt.params.platforms.includes(platform)} // Removido pois 'platforms' não existe em params
                        className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4 capitalize"
                      >
                        {platform}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {(["cursor", "lovable", "bolt"] as Platform[]).map((platform) => (
                    <TabsContent key={platform} value={platform} className="p-0 m-0">
                      {/* Condição removida pois 'platforms' e 'results' não existem em latestPrompt */}
                      {latestPrompt && ( // Renderiza se latestPrompt existir
                        <PromptCard platform={platform} prompt={latestPrompt.genericPrompt} /> // Usa o prompt genérico
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo de configurações */}
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </motion.div>
  )
}
