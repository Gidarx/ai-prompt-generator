"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { GeneratedPrompt } from "@/lib/types"
import { Clock, Trash2, RefreshCw, ChevronRight } from "lucide-react"
import { usePromptHistory } from "@/lib/hooks/use-prompt-history"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PromptHistoryProps {
  history: GeneratedPrompt[]
  onSelect: (item: GeneratedPrompt) => void
}

export function PromptHistory({ history, onSelect }: PromptHistoryProps) {
  const { clearHistory, removeFromHistory } = usePromptHistory()
  const { toast } = useToast()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)

  const handleClearHistory = () => {
    clearHistory()
    setShowClearConfirm(false)
    toast({
      title: "Histórico limpo",
      description: "Seu histórico de prompts foi limpo com sucesso.",
    })
  }

  const handleDeleteItem = (id: string) => {
    removeFromHistory(id)
    setItemToDelete(null)
    toast({
      title: "Prompt removido",
      description: "O prompt foi removido do histórico.",
    })
  }

  if (history.length === 0) {
    return (
      <Card className="border-0 shadow-lg glass">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center justify-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Histórico vazio</h3>
            <p className="text-muted-foreground">
              Seu histórico de prompts aparecerá aqui após você gerar alguns prompts.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-0 shadow-lg glass">
        <CardHeader className="border-b border-border/10 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-primary"></span>
            Histórico de Prompts
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[300px]">
            <div className="divide-y divide-border/10">
              {history.map((item) => (
                <div key={item.id} className="p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSelect(item)}>
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setItemToDelete(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="font-medium truncate">{item.params.keywords || "(Sem palavras-chave)"}</div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{item.params.mode?.replace("_", " ") || "N/A"}</span>
                      <span>•</span>
                      <span className="capitalize">{item.params.tone || "N/A"}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-primary" onClick={() => onSelect(item)}>
                      Usar <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Diálogo de confirmação para limpar histórico */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá permanentemente todos os prompts do seu histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHistory}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmação para excluir item */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá permanentemente este prompt do seu histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => itemToDelete && handleDeleteItem(itemToDelete)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
