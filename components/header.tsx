"use client"

import { useTheme } from "next-themes"
import { ModeToggle } from "./mode-toggle"
import { BrainCircuit, Command, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Header() {
  const { theme } = useTheme()

  return (
    <header className="w-full glass border-b border-border/10 backdrop-blur-md sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-medium">
            <div className="animated-gradient flex items-center justify-center h-9 w-9 rounded-xl text-white">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-blue-500">
              Engenheiro de Prompts IA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="modern" 
                  size="sm" 
                  rounded="full"
                  className="hidden md:flex items-center gap-1 h-9 transition-all duration-300 hover:bg-accent/5"
                >
                  <Command className="h-3.5 w-3.5" />
                  <span>Menu</span>
                  <kbd className="ml-1 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    ⌘K
                  </kbd>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Pressione ⌘K para abrir o menu de comandos</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="text-sm font-medium text-muted-foreground hidden md:flex items-center">
            <Sparkles className="h-3.5 w-3.5 mr-2 text-accent" />
            {theme === "dark" ? "Modo Escuro" : "Modo Claro"}
          </div>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
