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
    <header className="w-full glass-card border-b border-white/20 dark:border-gray-700/30 backdrop-blur-2xl sticky top-0 z-50 shadow-lg">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="group transition-all duration-300 hover:scale-105">
            <div className="flex items-center gap-3 font-medium">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 flex items-center justify-center h-12 w-12 rounded-2xl text-white shadow-xl">
                  <BrainCircuit className="h-6 w-6" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold gradient-text text-shadow">
                  Engenheiro de Prompts
                </span>
                <span className="text-sm text-muted-foreground font-medium">
                  Powered by AI
                </span>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/" passHref>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="hidden md:flex items-center gap-2 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-6 rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover-lift border-none glow"
                  >
                    <Home className="h-4 w-4" />
                    <span>Início</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="glass-card">
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
                    className="hidden md:flex items-center gap-2 h-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 rounded-full shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover-lift border-none glow"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Imagens</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="glass-card">
                <p>Crie imagens incríveis com IA</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 h-10 rounded-full border-2 transition-all duration-300 hover:shadow-lg active:scale-95 hover-lift",
                    theme === "dark" 
                      ? "bg-slate-800/80 border-slate-600/50 text-slate-200 hover:bg-slate-700/80 hover:border-slate-500" 
                      : "bg-white/80 border-slate-300/50 text-slate-700 hover:bg-white hover:border-slate-400"
                  )}
                >
                  {theme === "dark" ? (
                    <>
                      <Moon className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium hidden sm:inline">Escuro</span>
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium hidden sm:inline">Claro</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="glass-card">
                <p>Alternar tema {theme === "dark" ? "claro" : "escuro"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </header>
  )
}
