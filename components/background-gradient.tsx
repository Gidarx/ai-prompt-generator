"use client"

import { useTheme } from "next-themes"
import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"

export function BackgroundGradient() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  if (!mounted) return null

  return (
    <div ref={containerRef} className="fixed inset-0 z-0 overflow-hidden">
      {/* Base gradient */}
      <div 
        className={`fixed inset-0 ${theme === 'dark' 
          ? 'bg-gradient-to-br from-[#0f1114] via-[#121631] to-[#08080e]' 
          : 'bg-gradient-to-br from-[#f1f5f9] via-[#e9f1fd] to-[#eef8ff]'}`} 
      />
      
      {/* Glowing orbs that respond to mouse */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: theme === 'dark' 
            ? `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(29, 78, 216, 0.12), transparent 70%)`
            : `radial-gradient(800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(56, 189, 248, 0.08), transparent 70%)`,
        }}
      />

      {/* Floating particles */}
      <div className="fixed inset-0 overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${theme === 'dark' 
              ? 'bg-primary/10 shadow-[0_0_10px_0px_rgba(59,130,246,0.2)]' 
              : 'bg-accent/10 shadow-[0_0_10px_0px_rgba(99,102,241,0.15)]'}`}
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, Math.random() * -80 - 40, 0],
              x: [0, Math.random() * 80 - 40, 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: Math.random() * 10 + 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Circuit lines refinadas */}
      <div className="fixed inset-0 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => {
          const startX = Math.random() * 100
          const startY = Math.random() * 100
          const width = Math.random() * 80 + 60 
          const angle = Math.random() * 180
          
          return (
            <motion.div
              key={`line-${i}`}
              className={`absolute ${theme === 'dark' 
                ? 'border-t border-primary/10' 
                : 'border-t border-accent/5'}`}
              style={{
                width: `${width}px`,
                left: `${startX}%`,
                top: `${startY}%`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: 'left',
              }}
              animate={{
                opacity: [0, 0.3, 0],
                width: [`${width * 0.7}px`, `${width}px`, `${width * 0.8}px`]
              }}
              transition={{
                duration: 10,
                delay: i * 1.2,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          )
        })}
      </div>

      {/* Digital node points refinados */}
      <div className="fixed inset-0 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => {
          const posX = Math.random() * 100
          const posY = Math.random() * 100
          const size = Math.random() * 3 + 1
          
          return (
            <motion.div
              key={`node-${i}`}
              className={`absolute rounded-full ${theme === 'dark' 
                ? 'bg-primary/20' 
                : 'bg-accent/15'}`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${posX}%`,
                top: `${posY}%`,
              }}
              animate={{
                boxShadow: [
                  `0 0 0px rgba(${theme === 'dark' ? '29, 78, 216' : '129, 140, 248'}, 0.2)`,
                  `0 0 8px rgba(${theme === 'dark' ? '29, 78, 216' : '129, 140, 248'}, 0.5)`,
                  `0 0 0px rgba(${theme === 'dark' ? '29, 78, 216' : '129, 140, 248'}, 0.2)`,
                ],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                repeatType: "mirror",
                delay: i * 0.8,
              }}
            />
          )
        })}
      </div>
      
      {/* Futuristic horizontal lines refinadas */}
      <div className="fixed inset-0 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => {
          const posY = 20 + i * 20
          return (
            <motion.div
              key={`hline-${i}`}
              className={`absolute left-0 right-0 h-[0.5px] ${theme === 'dark' 
                ? 'bg-gradient-to-r from-transparent via-primary/15 to-transparent' 
                : 'bg-gradient-to-r from-transparent via-accent/8 to-transparent'}`}
              style={{
                top: `${posY}%`,
              }}
              animate={{
                opacity: [0.05, 0.2, 0.05],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                delay: i * 1.5,
              }}
            />
          )
        })}
      </div>

      {/* Tech "scanner" effect refinado */}
      <motion.div
        className={`fixed left-0 right-0 h-[1px] ${theme === 'dark' 
          ? 'bg-primary/30' 
          : 'bg-accent/20'}`}
        animate={{
          top: ['0%', '100%', '0%'],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 20,
          ease: "linear",
          repeat: Infinity,
        }}
        style={{
          boxShadow: theme === 'dark' 
            ? '0 0 15px 1px rgba(59, 130, 246, 0.3)' 
            : '0 0 15px 1px rgba(99, 102, 241, 0.2)',
        }}
      />
    </div>
  )
}
