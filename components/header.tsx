"use client"

import { useTheme } from "next-themes"
import { BrainCircuit, ImageIcon, Moon, Sun, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function Header() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="w-full glass border-b border-border/10 backdrop-blur-md sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <div className="flex items-center gap-2 font-medium">
              <div className="animated-gradient flex items-center justify-center h-9 w-9 rounded-xl text-white">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-blue-500">
                Engenheiro de Prompts IA
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/" passHref>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="hidden md:flex items-center gap-2 h-9 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium px-4 rounded-full shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 border-none"
                  >
                    <Home className="h-4 w-4" />
                    <span>Página Inicial</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Voltar à página inicial</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/gerar-imagem" passHref>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="hidden md:flex items-center gap-2 h-9 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-4 rounded-full shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-105 border-none"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Gerar Imagem</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Crie imagens incríveis com IA</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  onClick={toggleTheme}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer hover:shadow-md active:scale-95",
                    theme === "dark" 
                      ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" 
                      : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {theme === "dark" ? (
                    <>
                      <Moon className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-xs font-medium">Modo Escuro</span>
                    </>
                  ) : (
                    <>
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-xs font-medium">Modo Claro</span>
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Clique para alternar entre modo claro e escuro</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  )
}
