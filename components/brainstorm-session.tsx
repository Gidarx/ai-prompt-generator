"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrainCircuit, Lightbulb, RefreshCw, ThumbsUp, ChevronRight, Code, MessageSquare, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { generateBrainstormIdeas, refineIdea } from "@/lib/brainstorm-service"
import type { BrainstormIdea, PromptParams, Platform, Tone } from "@/lib/types"

interface BrainstormSessionProps {
  onSelectIdea: (params: Partial<PromptParams>) => void
  onClose: () => void
}

export function BrainstormSession({ onSelectIdea, onClose }: BrainstormSessionProps) {
  const [theme, setTheme] = useState("")
  const [ideas, setIdeas] = useState<BrainstormIdea[]>([])
  const [selectedIdea, setSelectedIdea] = useState<BrainstormIdea | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState<"ideas" | "refine">("ideas")

  // Gerar ideias com base no tema
  const handleGenerateIdeas = () => {
    if (!theme.trim()) return

    setIsGenerating(true)

    // Simular tempo de processamento
    setTimeout(() => {
      const newIdeas = generateBrainstormIdeas(theme, 6)
      setIdeas(newIdeas)
      setIsGenerating(false)
    }, 1500)
  }

  // Refinar uma ideia (adicionar/remover plataformas, mudar tom)
  const handleRefineIdea = (
    idea: BrainstormIdea,
    refinement: "addCursor" | "addLovable" | "addBolt" | "removePlatform" | "changeTone",
    value?: Platform | Tone,
  ) => {
    let refinedIdea: BrainstormIdea

    switch (refinement) {
      case "addCursor":
        refinedIdea = refineIdea(idea, { addPlatforms: ["cursor"] })
        break
      case "addLovable":
        refinedIdea = refineIdea(idea, { addPlatforms: ["lovable"] })
        break
      case "addBolt":
        refinedIdea = refineIdea(idea, { addPlatforms: ["bolt"] })
        break
      case "removePlatform":
        refinedIdea = refineIdea(idea, { removePlatforms: [value as Platform] })
        break
      case "changeTone":
        refinedIdea = refineIdea(idea, { changeTone: value as Tone })
        break
      default:
        refinedIdea = idea
    }

    // Atualizar a ideia selecionada
    setSelectedIdea(refinedIdea)

    // Atualizar a lista de ideias
    setIdeas(ideas.map((i) => (i.id === idea.id ? refinedIdea : i)))
  }

  // Converter ideia em parâmetros de prompt
  const handleSelectIdea = (idea: BrainstormIdea) => {
    const params: Partial<PromptParams> = {
      keywords: idea.keywords,
      context: idea.description,
      platforms: [...idea.platforms],
      tone: idea.tone,
      length: "medium",
      complexity: Math.round(idea.confidence),
      includeExamples: idea.confidence > 85,
    }

    onSelectIdea(params)
    onClose()
  }

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case "cursor":
        return <Code className="h-4 w-4" />
      case "lovable":
        return <MessageSquare className="h-4 w-4" />
      case "bolt":
        return <Zap className="h-4 w-4" />
    }
  }

  const getPlatformColor = (platform: Platform) => {
    switch (platform) {
      case "cursor":
        return "bg-emerald-500/80"
      case "lovable":
        return "bg-pink-500/80"
      case "bolt":
        return "bg-amber-500/80"
    }
  }

  return (
    <Card className="border-0 shadow-lg glass w-full">
      <CardHeader className="border-b border-border/10 pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-primary" />
          Sessão de Brainstorming
        </CardTitle>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "ideas" | "refine")}>
        <TabsList className="w-full rounded-none border-b border-border/10 bg-background/20 p-0 h-auto">
          <TabsTrigger
            value="ideas"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Gerar Ideias
          </TabsTrigger>
          <TabsTrigger
            value="refine"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
            disabled={!selectedIdea}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refinar Ideia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ideas" className="m-0">
          <div className="p-4 border-b border-border/10">
            <div className="flex gap-2">
              <Input
                placeholder="Digite um tema para brainstorming..."
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleGenerateIdeas} disabled={!theme.trim() || isGenerating}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Gerar
                  </>
                )}
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[400px]">
            {ideas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {ideas.map((idea) => (
                  <motion.div
                    key={idea.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="cursor-pointer"
                  >
                    <Card
                      className={`h-full border ${
                        selectedIdea?.id === idea.id ? "border-primary" : "border-border/20 hover:border-primary/30"
                      } transition-all`}
                      onClick={() => setSelectedIdea(idea)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium">{idea.title}</h3>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant={
                                idea.confidence > 90 ? "success" : idea.confidence > 80 ? "default" : "secondary"
                              }
                              className="text-[10px]"
                            >
                              {idea.confidence}%
                            </Badge>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">{idea.description}</p>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {idea.platforms.map((platform) => (
                            <Badge
                              key={platform}
                              className="flex items-center gap-1 text-[10px]"
                              variant={platform === "cursor" ? "success" : platform === "lovable" ? "info" : "warning"}
                            >
                              <div className={`h-2 w-2 rounded-full ${getPlatformColor(platform)}`}></div>
                              {platform}
                            </Badge>
                          ))}
                          <Badge variant="outline" className="text-[10px]">
                            {idea.tone}
                          </Badge>
                        </div>

                        <div className="flex justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedIdea(idea)
                              setActiveTab("refine")
                            }}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Refinar
                          </Button>

                          <Button
                            variant="default"
                            size="sm"
                            className="text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectIdea(idea)
                            }}
                          >
                            <ChevronRight className="h-3 w-3" />
                            Usar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Lightbulb className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Vamos fazer um brainstorming!</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  Digite um tema acima e clique em "Gerar" para iniciar uma sessão de brainstorming. Você receberá
                  ideias personalizadas para criar prompts eficazes.
                </p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="refine" className="m-0">
          {selectedIdea && (
            <div className="p-4">
              <Card className="mb-4 border border-primary/30">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">{selectedIdea.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{selectedIdea.description}</p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Plataformas</h4>
                      <div className="flex flex-wrap gap-2">
                        {["cursor", "lovable", "bolt"].map((platform) => {
                          const isSelected = selectedIdea.platforms.includes(platform as Platform)
                          return (
                            <Button
                              key={platform}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className="h-8 gap-1"
                              onClick={() => {
                                if (isSelected) {
                                  if (selectedIdea.platforms.length > 1) {
                                    handleRefineIdea(selectedIdea, "removePlatform", platform as Platform)
                                  }
                                } else {
                                  handleRefineIdea(
                                    selectedIdea,
                                    `add${platform.charAt(0).toUpperCase() + platform.slice(1)}` as any,
                                  )
                                }
                              }}
                            >
                              {getPlatformIcon(platform as Platform)}
                              <span>{platform}</span>
                            </Button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Tom</h4>
                      <div className="flex flex-wrap gap-2">
                        {["professional", "casual", "creative", "technical"].map((tone) => (
                          <Button
                            key={tone}
                            variant={selectedIdea.tone === tone ? "default" : "outline"}
                            size="sm"
                            className="h-8"
                            onClick={() => handleRefineIdea(selectedIdea, "changeTone", tone as Tone)}
                          >
                            {tone}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Palavras-chave</h4>
                      <p className="text-sm text-muted-foreground">{selectedIdea.keywords}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          <span>{selectedIdea.confidence}%</span>
                        </Badge>
                      </div>

                      <Button onClick={() => handleSelectIdea(selectedIdea)} className="gap-1">
                        <Lightbulb className="h-4 w-4" />
                        Usar esta ideia
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("ideas")}>
                  Voltar às ideias
                </Button>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Gerar uma nova versão refinada da ideia
                      const refinedIdea = refineIdea(selectedIdea, {
                        focusKeywords: [theme, "otimizado", "eficaz"],
                      })
                      setSelectedIdea(refinedIdea)
                      setIdeas(ideas.map((i) => (i.id === selectedIdea.id ? refinedIdea : i)))
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refinar automaticamente
                  </Button>

                  <Button onClick={() => handleSelectIdea(selectedIdea)}>Aplicar</Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CardFooter className="border-t border-border/10 p-4 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </CardFooter>
    </Card>
  )
}
