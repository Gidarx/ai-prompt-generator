import type { PlatformInfo } from "@/lib/types"

export const PLATFORMS: Record<string, PlatformInfo> = {
  cursor: {
    name: "cursor",
    label: "Cursor",
    description: "Otimizado para geração de código e explicações técnicas",
    icon: "code",
    color: "bg-emerald-500/80 dark:bg-emerald-600/80",
    gradient: "from-emerald-500/20 to-emerald-600/5",
  },
  lovable: {
    name: "lovable",
    label: "Lovable",
    description: "Ideal para conteúdo criativo e narrativas envolventes",
    icon: "message-square",
    color: "bg-pink-500/80 dark:bg-pink-600/80",
    gradient: "from-pink-500/20 to-pink-600/5",
  },
  bolt: {
    name: "bolt",
    label: "Bolt",
    description: "Perfeito para respostas rápidas e resumos concisos",
    icon: "zap",
    color: "bg-amber-500/80 dark:bg-amber-600/80",
    gradient: "from-amber-500/20 to-amber-600/5",
  },
}
