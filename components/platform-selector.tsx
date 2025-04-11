"use client"
import { motion } from "framer-motion"
import { Code, MessageSquare, Zap } from "lucide-react"
import type { Platform } from "@/lib/types"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PlatformSelectorProps {
  selectedPlatforms: Platform[]
  onChange: (platforms: Platform[]) => void
}

export function PlatformSelector({ selectedPlatforms, onChange }: PlatformSelectorProps) {
  const platforms = [
    {
      name: "cursor" as Platform,
      label: "Cursor",
      description: "Otimizado para geração de código e explicações técnicas",
      icon: <Code className="h-5 w-5" />,
      color: "bg-emerald-500/80 dark:bg-emerald-600/80",
      gradient: "from-emerald-500/20 to-emerald-600/5",
    },
    {
      name: "lovable" as Platform,
      label: "Lovable",
      description: "Ideal para conteúdo criativo e narrativas envolventes",
      icon: <MessageSquare className="h-5 w-5" />,
      color: "bg-pink-500/80 dark:bg-pink-600/80",
      gradient: "from-pink-500/20 to-pink-600/5",
    },
    {
      name: "bolt" as Platform,
      label: "Bolt",
      description: "Perfeito para respostas rápidas e resumos concisos",
      icon: <Zap className="h-5 w-5" />,
      color: "bg-amber-500/80 dark:bg-amber-600/80",
      gradient: "from-amber-500/20 to-amber-600/5",
    },
  ]

  const togglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      // Não permitir desmarcar se for a última plataforma selecionada
      if (selectedPlatforms.length > 1) {
        onChange(selectedPlatforms.filter((p) => p !== platform))
      }
    } else {
      onChange([...selectedPlatforms, platform])
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {platforms.map((platform) => {
        const isSelected = selectedPlatforms.includes(platform.name)

        return (
          <TooltipProvider key={platform.name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  onClick={() => togglePlatform(platform.name)}
                  className={`
                    relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all overflow-hidden
                    ${
                      isSelected
                        ? "border-primary/30 bg-gradient-to-b " + platform.gradient
                        : "border-border/20 bg-background/50 hover:border-border/40 hover:bg-background/70"
                    }
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  aria-pressed={isSelected}
                >
                  <div
                    className={`
                    flex items-center justify-center h-12 w-12 rounded-full mb-3
                    ${isSelected ? platform.color : "bg-muted/50"}
                    transition-all duration-300 ease-in-out
                  `}
                  >
                    {platform.icon}
                  </div>

                  <span className="text-sm font-medium">{platform.label}</span>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{platform.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      })}
    </div>
  )
}
