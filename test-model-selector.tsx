"use client"

import { useState } from "react"
import { ModelSelector } from "@/components/model-selector"

export function TestModelSelector() {
  const [selectedModel, setSelectedModel] = useState<string>("")

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Teste do Model Selector</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Modelo Selecionado:
          </label>
          <ModelSelector
            value={selectedModel}
            onValueChange={(value) => {
              console.log("Modelo selecionado:", value)
              setSelectedModel(value)
            }}
          />
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <p className="text-sm">
            <strong>Valor atual:</strong> {selectedModel || "Nenhum modelo selecionado"}
          </p>
        </div>
      </div>
    </div>
  )
}