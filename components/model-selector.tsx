"use client"

import { useState, useEffect } from "react"
import { Check, ChevronDown, Loader2, RefreshCw, Zap, Brain, Sparkles, Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useGeminiModels, type GeminiModel } from "@/lib/hooks/use-gemini-models"
import { cn } from "@/lib/utils"

interface ModelSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  className?: string
}

export function ModelSelector({ value, onValueChange, className }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const { 
    models, 
    isLoading, 
    error, 
    isFallback, 
    refreshModels, 
    getModelByName, 
    getRecommendedModel 
  } = useGeminiModels()

  const selectedModel = value ? getModelByName(value) : getRecommendedModel()
  const recommendedModel = getRecommendedModel()

  // Definir modelo padrão quando os modelos carregarem
  useEffect(() => {
    if (!value && recommendedModel && !isLoading && models.length > 0) {
      onValueChange(recommendedModel.name)
    }
  }, [value, recommendedModel, isLoading, models.length, onValueChange])

  const getModelIcon = (model: GeminiModel) => {
    if (model.displayName.toLowerCase().includes('thinking')) {
      return <Brain className="h-4 w-4" />
    }
    if (model.displayName.toLowerCase().includes('flash')) {
      return <Zap className="h-4 w-4" />
    }
    if (model.displayName.toLowerCase().includes('pro')) {
      return <Sparkles className="h-4 w-4" />
    }
    return <Brain className="h-4 w-4" />
  }

  const getModelBadge = (model: GeminiModel) => {
    if (model === recommendedModel) {
      return <Badge variant="default" className="text-xs bg-emerald-500 hover:bg-emerald-600">Recomendado</Badge>
    }
    if (model.displayName.toLowerCase().includes('exp')) {
      return <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Experimental</Badge>
    }
    if (model.version === '2.0') {
      return <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Mais Recente</Badge>
    }
    return null
  }

  const formatTokenLimit = (limit: number) => {
    if (limit >= 1000000) {
      return `${(limit / 1000000).toFixed(1)}M`
    }
    if (limit >= 1000) {
      return `${(limit / 1000).toFixed(0)}K`
    }
    return limit.toString()
  }

  const groupModelsByVersion = (models: GeminiModel[]) => {
    const grouped = models.reduce((acc, model) => {
      const version = model.version
      if (!acc[version]) {
        acc[version] = []
      }
      acc[version].push(model)
      return acc
    }, {} as Record<string, GeminiModel[]>)

    // Ordenar versões (mais recente primeiro)
    const sortedVersions = Object.keys(grouped).sort((a, b) => {
      const aNum = parseFloat(a)
      const bNum = parseFloat(b)
      return bNum - aNum
    })

    return sortedVersions.map(version => ({
      version,
      models: grouped[version].sort((a, b) => a.displayName.localeCompare(b.displayName))
    }))
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background/80 backdrop-blur-sm border-muted-foreground/20 hover:border-primary/30 transition-all duration-200"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedModel ? (
                <>
                  {getModelIcon(selectedModel)}
                  <span className="truncate">{selectedModel.displayName}</span>
                  {getModelBadge(selectedModel)}
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Selecionar modelo...</span>
                </>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[400px] p-0 z-[9999]" align="start">
          <Command className="relative z-[9999]">
            <div className="flex items-center justify-between p-2 border-b">
              <CommandInput placeholder="Buscar modelos..." className="border-0 focus:ring-0" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={refreshModels}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                    >
                      <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Atualizar lista de modelos</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <CommandList className="max-h-[400px]">
              {isLoading && (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Carregando modelos...</span>
                </div>
              )}

              {error && (
                <div className="p-3">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {error}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {!isLoading && models.length === 0 && (
                <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
              )}

              {!isLoading && models.length > 0 && (
                <>
                  {isFallback && (
                    <div className="p-3">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Usando modelos em cache. Clique em atualizar para buscar os mais recentes.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {groupModelsByVersion(models).map((group, groupIndex) => (
                    <div key={group.version}>
                      <CommandGroup heading={`Gemini ${group.version}`}>
                        {group.models.map((model) => (
                          <CommandItem
                            key={model.name}
                            value={model.name}
                            onSelect={(currentValue) => {
                              onValueChange(model.name)
                              setOpen(false)
                            }}
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50 pointer-events-auto relative z-10"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {getModelIcon(model)}
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">{model.displayName}</span>
                                    {getModelBadge(model)}
                                  </div>
                                  <span className="text-xs text-muted-foreground truncate">
                                    {model.description}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                      {formatTokenLimit(model.inputTokenLimit)}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-xs">
                                      <div>Entrada: {formatTokenLimit(model.inputTokenLimit)} tokens</div>
                                      <div>Saída: {formatTokenLimit(model.outputTokenLimit)} tokens</div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  selectedModel?.name === model.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {groupIndex < groupModelsByVersion(models).length - 1 && <CommandSeparator />}
                    </div>
                  ))}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedModel && (
        <div className="mt-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Versão {selectedModel.version}</span>
            <span>{formatTokenLimit(selectedModel.inputTokenLimit)} tokens de entrada</span>
          </div>
        </div>
      )}
    </div>
  )
}