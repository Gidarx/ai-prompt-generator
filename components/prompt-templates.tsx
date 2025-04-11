"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { ChevronRight, Lightbulb } from "lucide-react"
import { Platform, Tone, Length, PromptTemplate } from "@/lib/types" // Import Tone enum

interface PromptTemplatesProps {
  onSelectTemplate: (template: PromptTemplate) => void
}

export function PromptTemplates({ onSelectTemplate }: PromptTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = [
    { id: "programming", name: "Programação" },
    { id: "writing", name: "Escrita" },
    { id: "business", name: "Negócios" },
    { id: "education", name: "Educação" },
    { id: "creative", name: "Criativo" },
  ]

  const templates: PromptTemplate[] = [
    {
      id: "react-tutorial",
      title: "Tutorial de React",
      keywords: "Desenvolvimento web com React e componentes funcionais",
      context: "Para um tutorial voltado a desenvolvedores iniciantes que já conhecem HTML, CSS e JavaScript básico",
      platforms: ["cursor"],
      tone: Tone.PROFESSIONAL, // Corrigido
      length: "medium",
      complexity: 50,
      includeExamples: true,
      tags: ["programming", "web", "react"],
    },
    {
      id: "nextjs-api",
      title: "API Routes no Next.js",
      keywords: "Criando API Routes no Next.js com TypeScript",
      context: "Para desenvolvedores que querem aprender a criar APIs RESTful usando o Next.js",
      platforms: ["cursor"],
      tone: Tone.TECHNICAL, // Corrigido
      length: "medium",
      complexity: 70,
      includeExamples: true,
      tags: ["programming", "web", "nextjs", "api"],
    },
    {
      id: "blog-post",
      title: "Post para Blog",
      keywords: "Inteligência Artificial no dia a dia",
      context: "Para um blog de tecnologia voltado ao público geral",
      platforms: ["lovable"],
      tone: Tone.CASUAL, // Corrigido
      length: "long",
      complexity: 40,
      includeExamples: true,
      tags: ["writing", "blog", "ai"],
    },
    {
      id: "email-marketing",
      title: "Email Marketing",
      keywords: "Lançamento de novo produto de software",
      context: "Para uma lista de clientes existentes que já conhecem a marca",
      platforms: ["lovable"],
      tone: Tone.PROFESSIONAL, // Corrigido
      length: "short",
      complexity: 30,
      includeExamples: false,
      tags: ["business", "marketing", "email"],
    },
    {
      id: "product-description",
      title: "Descrição de Produto",
      keywords: "Aplicativo de produtividade para profissionais",
      context: "Para página de vendas do produto, destacando benefícios e funcionalidades",
      platforms: ["bolt"],
      tone: Tone.PROFESSIONAL, // Corrigido
      length: "medium",
      complexity: 40,
      includeExamples: false,
      tags: ["business", "marketing", "product"],
    },
    {
      id: "lesson-plan",
      title: "Plano de Aula",
      keywords: "Introdução à programação para crianças",
      context: "Para professores do ensino fundamental que querem ensinar conceitos básicos de programação",
      platforms: ["cursor", "lovable"],
      tone: Tone.CASUAL, // Corrigido
      length: "long",
      complexity: 30,
      includeExamples: true,
      tags: ["education", "programming", "teaching"],
    },
    {
      id: "story-prompt",
      title: "Prompt para História",
      keywords: "Aventura de ficção científica em um mundo pós-apocalíptico",
      context: "Para escritores que buscam inspiração para criar uma nova história",
      platforms: ["lovable"],
      tone: Tone.CREATIVE, // Corrigido
      length: "medium",
      complexity: 60,
      includeExamples: true,
      tags: ["creative", "writing", "fiction"],
    },
  ]

  const filteredTemplates = selectedCategory
    ? templates.filter((template) => template.tags.includes(selectedCategory))
    : templates

  return (
    <Card className="border-0 shadow-lg glass">
      <CardHeader className="border-b border-border/10 pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-primary"></span>
          Templates de Prompts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex border-b border-border/10">
          <ScrollArea className="whitespace-nowrap p-4">
            <div className="flex gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="rounded-full"
              >
                Todos
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="rounded-full"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <ScrollArea className="h-[300px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {filteredTemplates.map((template) => (
              <motion.div
                key={template.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
              >
                <Card
                  className="h-full border border-border/20 hover:border-primary/30 transition-all"
                  onClick={() => onSelectTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium">{template.title}</h3>
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.keywords}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.platforms.map((platform) => (
                        <Badge
                          key={platform}
                          variant={platform === "cursor" ? "success" : platform === "lovable" ? "info" : "warning"}
                          className="text-[10px]"
                        >
                          {platform}
                        </Badge>
                      ))}
                      <Badge variant="secondary" className="text-[10px]">
                        {/* Exibir o valor do enum Tone */}
                        {template.tone.charAt(0).toUpperCase() + template.tone.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {template.length}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full justify-between text-primary text-xs h-7 mt-1">
                      <span>Usar template</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
