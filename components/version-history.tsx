"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { History, Clock, FileText, Diff, RotateCcw, Save, X } from "lucide-react"
import { motion } from "framer-motion"
import { usePromptVersions } from "@/lib/hooks/use-prompt-versions"
import type { PromptVersion, PromptParams } from "@/lib/types"

interface VersionHistoryProps {
  promptId: string
  onSelectVersion: (params: PromptParams) => void
  onClose: () => void
}

export function VersionHistory({ promptId, onSelectVersion, onClose }: VersionHistoryProps) {
  const { versions, getVersionsForPrompt, updateVersionNotes } = usePromptVersions()

  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null)
  const [editingNotes, setEditingNotes] = useState<string>("")
  const [isEditingNotes, setIsEditingNotes] = useState(false)

  const promptVersions = getVersionsForPrompt(promptId)

  const handleSelectVersion = (version: PromptVersion) => {
    setSelectedVersion(version)
    setEditingNotes(version.notes || "")
  }

  const handleApplyVersion = () => {
    if (selectedVersion) {
      onSelectVersion(selectedVersion.params)
      onClose()
    }
  }

  const handleSaveNotes = () => {
    if (selectedVersion) {
      updateVersionNotes(selectedVersion.id, editingNotes)
      setIsEditingNotes(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getChanges = (version: PromptVersion): string[] => {
    if (version.version === 1) {
      return ["Versão inicial"]
    }

    const previousVersions = getVersionsForPrompt(promptId)
    const previousVersion = previousVersions.find((v) => v.version === version.version - 1)

    if (!previousVersion) return ["Alterações não disponíveis"]

    const changes: string[] = []

    // Comparar palavras-chave
    if (previousVersion.params.keywords !== version.params.keywords) {
      changes.push("Palavras-chave alteradas")
    }

    // Comparar contexto
    if (previousVersion.params.context !== version.params.context) {
      changes.push("Contexto modificado")
    }

    // Comparar plataformas
    if (JSON.stringify(previousVersion.params.platforms) !== JSON.stringify(version.params.platforms)) {
      changes.push("Plataformas atualizadas")
    }

    // Comparar tom
    if (previousVersion.params.tone !== version.params.tone) {
      changes.push(`Tom alterado de ${previousVersion.params.tone} para ${version.params.tone}`)
    }

    // Comparar tamanho
    if (previousVersion.params.length !== version.params.length) {
      changes.push(`Tamanho alterado de ${previousVersion.params.length} para ${version.params.length}`)
    }

    // Comparar complexidade
    if (previousVersion.params.complexity !== version.params.complexity) {
      changes.push(
        `Complexidade alterada de ${Math.round(previousVersion.params.complexity * 100)}% para ${Math.round(version.params.complexity * 100)}%`,
      )
    }

    // Comparar inclusão de exemplos
    if (previousVersion.params.includeExamples !== version.params.includeExamples) {
      changes.push(`Inclusão de exemplos ${version.params.includeExamples ? "ativada" : "desativada"}`)
    }

    return changes.length > 0 ? changes : ["Sem alterações significativas"]
  }

  return (
    <Card className="border-0 shadow-lg glass w-full">
      <CardHeader className="border-b border-border/10 pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Histórico de Versões
        </CardTitle>
      </CardHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-border/10">
        <div className="col-span-1">
          <ScrollArea className="h-[500px]">
            <div className="p-4 space-y-2">
              {promptVersions.length > 0 ? (
                promptVersions.map((version) => (
                  <motion.div
                    key={version.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="cursor-pointer"
                  >
                    <Card
                      className={`border ${
                        selectedVersion?.id === version.id ? "border-primary" : "border-border/20"
                      } hover:border-primary/30 transition-all`}
                      onClick={() => handleSelectVersion(version)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">
                            v{version.version}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(version.timestamp)}
                          </div>
                        </div>

                        <div className="text-sm mt-2 space-y-1">
                          {getChanges(version).map((change, index) => (
                            <div key={index} className="flex items-start gap-1.5">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5"></div>
                              <p className="text-xs">{change}</p>
                            </div>
                          ))}
                        </div>

                        {version.notes && (
                          <div className="mt-2 text-xs text-muted-foreground border-t border-border/10 pt-2">
                            <p className="line-clamp-2">{version.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Sem versões</h3>
                  <p className="text-muted-foreground text-sm">Este prompt ainda não possui versões salvas.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="col-span-2">
          {selectedVersion ? (
            <div className="p-4 h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">
                    Versão {selectedVersion.version}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{formatDate(selectedVersion.timestamp)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleApplyVersion}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restaurar esta versão
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Palavras-chave</h3>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                    {selectedVersion.params.keywords}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Plataformas</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedVersion.params.platforms.map((platform) => (
                      <Badge key={platform} variant="secondary" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">Contexto</h3>
                <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md max-h-20 overflow-y-auto">
                  {selectedVersion.params.context || "Sem contexto"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Tom</h3>
                  <Badge variant="outline" className="text-xs">
                    {selectedVersion.params.tone}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Tamanho</h3>
                  <Badge variant="outline" className="text-xs">
                    {selectedVersion.params.length}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Complexidade</h3>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(selectedVersion.params.complexity * 100)}%
                  </Badge>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Notas da versão</h3>
                  {!isEditingNotes ? (
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsEditingNotes(true)}>
                      Editar
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => {
                          setIsEditingNotes(false)
                          setEditingNotes(selectedVersion.notes || "")
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={handleSaveNotes}>
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                {isEditingNotes ? (
                  <Textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    placeholder="Adicione notas sobre esta versão..."
                    className="h-32 text-sm"
                  />
                ) : (
                  <div className="bg-muted/30 p-3 rounded-md h-32 overflow-y-auto">
                    <p className="text-sm text-muted-foreground">
                      {selectedVersion.notes || "Sem notas para esta versão."}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border/10">
                <h3 className="text-sm font-medium mb-2">Alterações</h3>
                <div className="space-y-1">
                  {getChanges(selectedVersion).map((change, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Diff className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <p className="text-sm">{change}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[500px] text-center p-6">
              <History className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Selecione uma versão</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Selecione uma versão à esquerda para ver os detalhes e alterações. Você pode restaurar versões
                anteriores ou adicionar notas para referência futura.
              </p>
            </div>
          )}
        </div>
      </div>

      <CardFooter className="border-t border-border/10 p-4 flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Fechar
        </Button>
      </CardFooter>
    </Card>
  )
}
