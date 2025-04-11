"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { TrendingUp, Search, Tag, BarChart, ChevronRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import {
  getTrendingTopics,
  getNewTrendingTopics,
  getTopTrendingTopics,
  searchTrendingTopics,
} from "@/lib/trending-topics"
import type { TrendingTopic, PromptParams } from "@/lib/types"

interface TrendingTopicsPanelProps {
  onSelectTopic: (params: Partial<PromptParams>) => void
}

export function TrendingTopicsPanel({ onSelectTopic }: TrendingTopicsPanelProps) {
  const [activeTab, setActiveTab] = useState("popular")
  const [searchQuery, setSearchQuery] = useState("")

  const popularTopics = getTopTrendingTopics(5)
  const newTopics = getNewTrendingTopics()
  const allTopics = getTrendingTopics()

  const searchResults = searchQuery.length > 2 ? searchTrendingTopics(searchQuery) : []

  const handleSelectTopic = (topic: TrendingTopic) => {
    // Converter o tópico em parâmetros de prompt
    const params: Partial<PromptParams> = {
      keywords: topic.keywords.join(", "),
      context: topic.description,
    }

    // Definir plataformas com base na categoria
    if (topic.category === "tecnologia" || topic.category === "dados") {
      params.platforms = ["cursor", "bolt"]
      params.tone = "technical"
      params.length = "medium"
    } else if (topic.category === "criativo") {
      params.platforms = ["lovable"]
      params.tone = "creative"
      params.length = "long"
    } else if (topic.category === "marketing") {
      params.platforms = ["lovable", "bolt"]
      params.tone = "professional"
      params.length = "medium"
    } else {
      params.platforms = ["cursor", "lovable", "bolt"]
      params.tone = "professional"
      params.length = "medium"
    }

    // Definir complexidade com base na popularidade
    params.complexity = Math.min(100, Math.max(30, topic.popularity))

    // Incluir exemplos para tópicos mais complexos
    params.includeExamples = topic.popularity > 80

    onSelectTopic(params)
  }

  const renderTopicCard = (topic: TrendingTopic) => (
    <motion.div key={topic.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="cursor-pointer">
      <Card
        className="h-full border border-border/20 hover:border-primary/30 transition-all"
        onClick={() => handleSelectTopic(topic)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium">{topic.title}</h3>
            <div className="flex items-center gap-1">
              <BarChart className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{topic.popularity}%</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{topic.description}</p>

          <div className="flex flex-wrap gap-1 mb-3">
            {topic.isNew && (
              <Badge variant="default" className="text-[10px]">
                Novo
              </Badge>
            )}
            <Badge variant="secondary" className="text-[10px]">
              {topic.category}
            </Badge>
            {topic.keywords.slice(0, 2).map((keyword, index) => (
              <Badge key={index} variant="outline" className="text-[10px]">
                {keyword}
              </Badge>
            ))}
            {topic.keywords.length > 2 && (
              <Badge variant="outline" className="text-[10px]">
                +{topic.keywords.length - 2}
              </Badge>
            )}
          </div>

          <Button variant="ghost" size="sm" className="w-full justify-between text-primary text-xs h-7 mt-1">
            <span>Usar tópico</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <Card className="border-0 shadow-lg glass">
      <CardHeader className="border-b border-border/10 pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-primary"></span>
          Tópicos em Tendência
        </CardTitle>
      </CardHeader>

      <div className="p-4 border-b border-border/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tópicos..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full rounded-none border-b border-border/10 bg-background/20 p-0 h-auto">
          <TabsTrigger
            value="popular"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Populares
          </TabsTrigger>
          <TabsTrigger
            value="new"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Novos
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4"
          >
            <Tag className="h-4 w-4 mr-2" />
            Todos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="popular" className="m-0">
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">{popularTopics.map(renderTopicCard)}</div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="new" className="m-0">
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">{newTopics.map(renderTopicCard)}</div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="all" className="m-0">
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">{allTopics.map(renderTopicCard)}</div>
          </ScrollArea>
        </TabsContent>

        {searchQuery.length > 2 && (
          <div className="p-4 border-t border-border/10">
            <h3 className="text-sm font-medium mb-3">Resultados da busca</h3>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{searchResults.map(renderTopicCard)}</div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum resultado encontrado para "{searchQuery}"</p>
            )}
          </div>
        )}
      </Tabs>
    </Card>
  )
}
