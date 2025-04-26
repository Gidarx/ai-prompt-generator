"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"

interface GlassEffectProps {
  children: React.ReactNode
  blur?: "sm" | "md" | "lg" | "xl"
  opacity?: "low" | "medium" | "high"
  border?: boolean
  glow?: boolean
  animate?: boolean
  className?: string
}

export function GlassEffect({
  children,
  className,
  blur = "md",
  opacity = "medium",
  border = true,
  glow = false,
  animate = false,
  ...props
}: GlassEffectProps & Omit<React.HTMLAttributes<HTMLDivElement>, 'className'>) {
  // Mapear os valores para classes reais
  const blurMap = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg", 
    xl: "backdrop-blur-xl",
  }

  const opacityMap = {
    low: "bg-background/30 dark:bg-background/20",
    medium: "bg-background/50 dark:bg-background/40", 
    high: "bg-background/70 dark:bg-background/60",
  }
  
  if (animate) {
    return (
      <motion.div
        className={cn(
          "rounded-xl relative",
          blurMap[blur],
          opacityMap[opacity],
          border && "border border-primary/10",
          glow && "after:absolute after:inset-0 after:rounded-xl after:shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.1)] after:z-[-1]",
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        {...props as HTMLMotionProps<"div">}
      >
        {children}
      </motion.div>
    )
  }
  
  return (
    <div
      className={cn(
        "rounded-xl relative",
        blurMap[blur],
        opacityMap[opacity],
        border && "border border-primary/10",
        glow && "after:absolute after:inset-0 after:rounded-xl after:shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.1)] after:z-[-1]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
} 