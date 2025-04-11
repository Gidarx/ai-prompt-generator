"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Code, MessageSquare, Zap, Maximize2, Minimize2 } from "lucide-react"
import type { Platform } from "@/lib/types"
import { PLATFORMS } from "@/lib/platform-data"

interface PromptComparisonProps {
  prompts: Record<Platform, string>
  onClose: () => void
}

export function PromptComparison({ prompts, onClose }: PromptComparisonProps) {
  const [view, setView] = useState<"split" | "full">("split")
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["cursor", "lovable"])

  const availablePlatforms = Object.keys(prompts).filter((platform) => prompts[platform as Platform]) as Platform[]

  const handleTogglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform))
      }
    } else {
      if (selectedPlatforms.length < 2 || view === "full") {
        setSelectedPlatforms([...selectedPlatforms, platform])
      } else {
        // No modo split, substituímos a segunda plataforma
        setSelectedPlatforms([selectedPlatforms[0], platform])
      }
    }
  }

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case "cursor":
        return <Code className="h-4 w-4" />
      case "lovable":
        return <MessageSquare className="h-4 w-4" />
      case "bolt":
        return <Zap className="h-4 w-4" />
    }
  }

  const getPlatformColor = (platform: Platform) => {
    switch (platform) {
      case "cursor":
        return "bg-emerald-500/80"
      case "lovable":
        return "bg-pink-500/80"
      case "bolt":
        return "bg-amber-500/80"
    }
  }

  const getPlatformName = (platform: Platform) => {
    return PLATFORMS[platform]?.label || platform
  }

  return (
    <Card className="border-0 shadow-lg glass w-full">
      <CardHeader className="border-b border-border/10 pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-xl flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-primary"></span>
          Comparação de Prompts
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView(view === "split" ? "full" : "split")}
            className="h-8 w-8"
          >
            {view === "split" ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </CardHeader>

      <div className="border-b border-border/10">
        <ScrollArea className="whitespace-nowrap p-4">
          <div className="flex gap-2">
            {availablePlatforms.map((platform) => (
              <Button
                key={platform}
                variant={selectedPlatforms.includes(platform) ? "default" : "outline"}
                size="sm"
                onClick={() => handleTogglePlatform(platform)}
                className="rounded-full flex items-center gap-1.5"
              >
                <div className={`h-3 w-3 rounded-full ${getPlatformColor(platform)}`}></div>
                {getPlatformName(platform)}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <CardContent className="p-0">
        {view === "split" && selectedPlatforms.length >= 2 ? (
          <div className="grid grid-cols-2 divide-x divide-border/10">
            {selectedPlatforms.slice(0, 2).map((platform) => (
              <div key={platform} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`flex items-center justify-center h-6 w-6 rounded-full ${getPlatformColor(platform)}`}
                  >
                    {getPlatformIcon(platform)}
                  </div>
                  <h3 className="font-medium">{getPlatformName(platform)}</h3>
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{prompts[platform]}</div>
                </ScrollArea>
              </div>
            ))}
          </div>
        ) : (
          <Tabs defaultValue={selectedPlatforms[0]} className="w-full">
            <TabsList className="w-full rounded-none border-b border-border/10 bg-background/20 p-0 h-auto">
              {selectedPlatforms.map((platform) => (
                <TabsTrigger
                  key={platform}
                  value={platform}
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary py-3 px-4 capitalize"
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${getPlatformColor(platform)}`}></div>
                    {getPlatformName(platform)}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            {selectedPlatforms.map((platform) => (
              <TabsContent key={platform} value={platform} className="p-4 m-0">
                <ScrollArea className="h-[400px]">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{prompts[platform]}</div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
