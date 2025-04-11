"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="modern" size="icon-sm" rounded="full" className="aspect-square glass border-0 overflow-hidden">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 absolute transition-all duration-500 dark:-rotate-90 dark:scale-0 text-amber-500" />
                <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 absolute transition-all duration-500 dark:rotate-0 dark:scale-100 text-sky-400" />
                <span className="sr-only">Alternar tema</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Mudar tema</p>
          </TooltipContent>
          <DropdownMenuContent align="end" className="min-w-[10rem] glass border-0 shadow-xl">
            <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-3 cursor-pointer py-2 px-3 focus:bg-accent/10">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-500">
              <Sun className="h-4 w-4" />
              </div>
              <span>Claro</span>
              {theme === "light" && <span className="ml-auto text-xs text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-3 cursor-pointer py-2 px-3 focus:bg-accent/10">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-sky-950 text-sky-400">
              <Moon className="h-4 w-4" />
              </div>
              <span>Escuro</span>
              {theme === "dark" && <span className="ml-auto text-xs text-primary">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center gap-3 cursor-pointer py-2 px-3 focus:bg-accent/10">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              </div>
              <span>Sistema</span>
              {theme === "system" && <span className="ml-auto text-xs text-primary">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  )
}
