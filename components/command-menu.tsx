"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"
import { useUserPreferences } from "@/lib/hooks/use-user-preferences"
import { usePromptHistory } from "@/lib/hooks/use-prompt-history"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Moon, Sun, Laptop, History, Settings, Sparkles, Trash2, Download, HelpCircle, Keyboard } from "lucide-react"

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { preferences, updatePreferences } = useUserPreferences()
  const { history, clearHistory } = usePromptHistory()

  // Abrir menu de comando com atalho de teclado
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (command: () => void) => {
    command()
    setOpen(false)
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

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite um comando ou pesquise..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

          <CommandGroup heading="Tema">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))} className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>Tema Claro</span>
              {theme === "light" && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))} className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>Tema Escuro</span>
              {theme === "dark" && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("system"))} className="flex items-center gap-2">
              <Laptop className="h-4 w-4" />
              <span>Tema do Sistema</span>
              {theme === "system" && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Ações">
            <CommandItem
              onSelect={() => runCommand(() => document.getElementById("generate-button")?.click())}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              <span>Gerar Prompts</span>
              <CommandShortcut>⌘G</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => document.getElementById("history-button")?.click())}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              <span>Mostrar Histórico</span>
              <CommandShortcut>⌘H</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => document.getElementById("settings-button")?.click())}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Gerenciamento">
            <CommandItem onSelect={() => runCommand(exportPrompts)} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Exportar Prompts</span>
              <CommandShortcut>⌘E</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  if (history.length > 0) {
                    clearHistory()
                    toast({
                      title: "Histórico limpo",
                      description: "Seu histórico de prompts foi limpo com sucesso.",
                    })
                  } else {
                    toast({
                      title: "Histórico vazio",
                      description: "Não há prompts no histórico para limpar.",
                    })
                  }
                })
              }
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Limpar Histórico</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Ajuda">
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  toast({
                    title: "Atalhos de Teclado",
                    description: "⌘K - Abrir menu de comandos, ⌘G - Gerar prompts, ⌘H - Histórico, ⌘S - Configurações",
                  })
                })
              }
              className="flex items-center gap-2"
            >
              <Keyboard className="h-4 w-4" />
              <span>Atalhos de Teclado</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  toast({
                    title: "Sobre o Gerador de Prompts IA",
                    description:
                      "Versão 2.0 - Uma ferramenta para gerar prompts otimizados para diferentes plataformas de IA.",
                  })
                })
              }
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Sobre</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
