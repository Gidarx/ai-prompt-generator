"use client"

import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface BackgroundGradientProps {
  className?: string
  children?: React.ReactNode
}

export function BackgroundGradient({ className, children }: BackgroundGradientProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar problemas de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="relative overflow-hidden min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {children}
      </div>
    )
  }
  
  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Background principal com gradiente animado */}
      <div className="fixed inset-0 -z-20 animated-gradient" />
      
      {/* Overlay com textura sutil */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-white/20 via-transparent to-black/10 dark:from-black/30 dark:via-transparent dark:to-white/5" />
      
      {/* Grid pattern melhorado */}
      <div className="fixed inset-0 -z-10 bg-grid-pattern opacity-30 dark:opacity-20" />
      
      {/* Elementos flutuantes com cores dinâmicas */}
      <div 
        className={cn(
          "fixed -z-10 transition-all duration-1000",
          theme === "dark" ? "opacity-60" : "opacity-40"
        )}
      >
        <div className="absolute top-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-violet-400/30 to-purple-600/20 blur-[120px] animate-blob1" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[700px] w-[700px] rounded-full bg-gradient-to-tr from-blue-400/25 to-cyan-500/20 blur-[140px] animate-blob2" />
        <div className="absolute top-[40%] left-[20%] h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-pink-400/20 to-rose-500/15 blur-[100px] animate-blob3" />
        <div className="absolute top-[20%] right-[30%] h-[400px] w-[400px] rounded-full bg-gradient-to-tl from-emerald-400/20 to-teal-500/15 blur-[80px] animate-blob4" />
      </div>
      
      {/* Overlay final para suavizar */}
      <div className="fixed inset-0 -z-5 bg-white/5 dark:bg-black/10 backdrop-blur-[0.5px]" />
      
      {children}
    </div>
  )
}

// Definir animações e padrão de grade no seu CSS global (app/globals.css):
// 
// @keyframes blob1 {
//   0%, 100% { transform: translate(0, 0) scale(1); }
//   25% { transform: translate(5%, -5%) scale(1.05); }
//   50% { transform: translate(0, 10%) scale(0.95); }
//   75% { transform: translate(-5%, -5%) scale(1); }
// }
// 
// @keyframes blob2 {
//   0%, 100% { transform: translate(0, 0) scale(1); }
//   33% { transform: translate(5%, 5%) scale(1.1); }
//   66% { transform: translate(-5%, 10%) scale(0.9); }
// }
// 
// @keyframes blob3 {
//   0%, 100% { transform: translate(0, 0) scale(1); }
//   33% { transform: translate(-10%, -5%) scale(1.05); }
//   66% { transform: translate(10%, 5%) scale(0.95); }
// }
// 
// .bg-grid-pattern {
//   background-size: 20px 20px;
//   background-image: 
//     linear-gradient(to right, rgba(var(--foreground-rgb), 0.05) 1px, transparent 1px),
//     linear-gradient(to bottom, rgba(var(--foreground-rgb), 0.05) 1px, transparent 1px);
// }
// 
// .animate-blob1 {
//   animation: blob1 20s infinite linear;
// }
// 
// .animate-blob2 {
//   animation: blob2 25s infinite linear;
// }
// 
// .animate-blob3 {
//   animation: blob3 30s infinite linear;
// }
