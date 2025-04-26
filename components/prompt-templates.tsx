"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { ChevronRight, Lightbulb } from "lucide-react"
import { SimplePromptTemplate } from "@/lib/promptTemplates"
import { Tone, Complexity, PromptMode } from "@/lib/types"

interface PromptTemplatesProps {
  templates: SimplePromptTemplate[];
  onSelectTemplate: (template: SimplePromptTemplate) => void;
}

const modeLabels: Record<PromptMode, string> = {
  app_creation: "App",
  image_generation: "Imagem",
  content_creation: "Conteúdo",
};

export function PromptTemplates({ templates, onSelectTemplate }: PromptTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = [
    { id: "content_creation", name: "Conteúdo" },
    { id: "image_generation", name: "Imagem" },
  ]

  const filteredTemplates = selectedCategory
    ? templates.filter((template) => template.mode === selectedCategory)
    : templates

  return (
    <Card className="border-0 shadow-none">
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

        <ScrollArea className="h-[400px]">
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {filteredTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer h-full"
                >
                  <Card
                    className="h-full border border-border/20 hover:border-primary/30 transition-all flex flex-col"
                    onClick={() => onSelectTemplate(template)}
                  >
                    <CardContent className="p-4 flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">{template.name}</h3>
                        <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        <Badge variant="secondary">
                          {modeLabels[template.mode] || template.mode}
                        </Badge>
                        {template.defaultTone && (
                          <Badge variant="outline">
                            {template.defaultTone.charAt(0).toUpperCase() + template.defaultTone.slice(1)}
                          </Badge>
                        )}
                        {template.defaultComplexity && (
                          <Badge variant="outline">
                            {template.defaultComplexity.charAt(0).toUpperCase() + template.defaultComplexity.slice(1)}
                          </Badge>
                        )}
                        {template.imageStyle && template.mode === "image_generation" && (
                          <Badge variant="warning">{template.imageStyle}</Badge>
                        )}
                      </div>
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto">
                      <Button variant="ghost" size="sm" className="w-full justify-between text-primary text-xs h-7">
                        <span>Usar template</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              Nenhum template encontrado {selectedCategory ? `para a categoria ${categories.find(c=>c.id === selectedCategory)?.name || selectedCategory}`: ""}.
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
