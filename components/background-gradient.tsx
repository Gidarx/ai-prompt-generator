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
    return null
  }
  
  return (
    <div className="relative overflow-hidden min-h-screen">
      <div 
        className={cn(
          "fixed inset-0 -z-10 opacity-30 transition-opacity duration-1000",
          theme === "dark" ? "opacity-40" : "opacity-30",
          className
        )}
      >
        {/* Gradiente interativo */}
        <div className="absolute inset-0 bg-grid-pattern" />
        <div className="absolute top-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-primary/30 blur-[100px] animate-blob1" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-accent/20 blur-[100px] animate-blob2" />
        <div className="absolute top-[40%] left-[20%] h-[400px] w-[400px] rounded-full bg-secondary/20 blur-[100px] animate-blob3" />
      </div>
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
