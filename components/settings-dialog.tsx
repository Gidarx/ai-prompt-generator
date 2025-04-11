"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { PlatformSelector } from "@/components/platform-selector"
import { useUserPreferences } from "@/lib/hooks/use-user-preferences"
import { Tone } from "@/lib/types"
import type { Platform, Length, Language } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw } from "lucide-react"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { preferences, isLoaded, updatePreferences, resetToDefaults } = useUserPreferences()
  const { toast } = useToast()

  // Estados locais para as configurações
  const [localPlatforms, setLocalPlatforms] = useState<Platform[]>([])
  const [localTone, setLocalTone] = useState<Tone>(Tone.PROFESSIONAL)
  const [localLength, setLocalLength] = useState<Length>("medium")
  const [localComplexity, setLocalComplexity] = useState(50)
  const [localIncludeExamples, setLocalIncludeExamples] = useState(true)
  const [localLanguage, setLocalLanguage] = useState<Language>("portuguese")

  // Carregar preferências quando o diálogo é aberto
  useEffect(() => {
    if (open && isLoaded) {
      setLocalPlatforms(preferences.defaultPlatforms)
      setLocalTone(preferences.defaultTone)
      setLocalLength(preferences.defaultLength)
      setLocalComplexity(preferences.defaultComplexity)
      setLocalIncludeExamples(preferences.defaultIncludeExamples)
      setLocalLanguage(preferences.language)
    }
  }, [open, isLoaded, preferences])

  // Salvar configurações
  const handleSave = () => {
    updatePreferences({
      defaultPlatforms: localPlatforms,
      defaultTone: localTone,
      defaultLength: localLength,
      defaultComplexity: localComplexity,
      defaultIncludeExamples: localIncludeExamples,
      language: localLanguage,
    })

    toast({
      title: "Configurações salvas",
      description: "Suas preferências foram atualizadas com sucesso.",
    })

    onOpenChange(false)
  }

  // Resetar para valores padrão
  const handleReset = () => {
    resetToDefaults()

    toast({
      title: "Configurações resetadas",
      description: "Suas preferências foram restauradas para os valores padrão.",
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>Personalize suas preferências para o gerador de prompts.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="defaults" className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="defaults">Valores Padrão</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          </TabsList>

          <TabsContent value="defaults" className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Plataformas Padrão</Label>
                <PlatformSelector selectedPlatforms={localPlatforms} onChange={setLocalPlatforms} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultTone" className="text-sm font-medium">
                    Tom Padrão
                  </Label>
                  <Select value={localTone} onValueChange={(value) => setLocalTone(value as Tone)}>
                    <SelectTrigger id="defaultTone">
                      <SelectValue placeholder="Selecione o tom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Tone.PROFESSIONAL}>Profissional</SelectItem>
                      <SelectItem value={Tone.CASUAL}>Casual</SelectItem>
                      <SelectItem value={Tone.CREATIVE}>Criativo</SelectItem>
                      <SelectItem value={Tone.TECHNICAL}>Técnico</SelectItem>
                      <SelectItem value={Tone.NEUTRAL}>Neutro</SelectItem>
                      <SelectItem value={Tone.FORMAL}>Formal</SelectItem>
                      <SelectItem value={Tone.FRIENDLY}>Amigável</SelectItem>
                      <SelectItem value={Tone.ENTHUSIASTIC}>Entusiasmado</SelectItem>
                      <SelectItem value={Tone.AUTHORITATIVE}>Autoritativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultLength" className="text-sm font-medium">
                    Tamanho Padrão
                  </Label>
                  <Select value={localLength} onValueChange={(value) => setLocalLength(value as Length)}>
                    <SelectTrigger id="defaultLength">
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">Curto</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="long">Longo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="defaultComplexity" className="text-sm font-medium">
                    Complexidade Padrão
                  </Label>
                  <span className="text-sm text-muted-foreground">{localComplexity}%</span>
                </div>
                <Slider
                  id="defaultComplexity"
                  min={0}
                  max={100}
                  step={1}
                  value={[localComplexity]}
                  onValueChange={(value) => setLocalComplexity(value[0])}
                  className="py-2"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="defaultIncludeExamples"
                  checked={localIncludeExamples}
                  onCheckedChange={setLocalIncludeExamples}
                />
                <Label htmlFor="defaultIncludeExamples" className="text-sm font-medium">
                  Incluir Exemplos por Padrão
                </Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme" className="text-sm font-medium">
                  Tema
                </Label>
                <Select
                  value={preferences.theme}
                  onValueChange={(value) => updatePreferences({ theme: value as "light" | "dark" | "system" })}
                >
                  <SelectTrigger id="theme">
                    <SelectValue placeholder="Selecione o tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm font-medium">
                  Idioma das Respostas da IA
                </Label>
                <Select
                  value={localLanguage}
                  onValueChange={(value) => setLocalLanguage(value as Language)}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portuguese">Português</SelectItem>
                    <SelectItem value="english">Inglês</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Selecione o idioma em que a IA irá gerar os prompts.
                </p>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Mais opções de personalização serão adicionadas em atualizações futuras.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center">
          <Button variant="outline" onClick={handleReset} className="gap-1">
            <RefreshCw className="h-4 w-4" />
            Resetar
          </Button>
          <Button type="submit" onClick={handleSave}>
            Salvar Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
