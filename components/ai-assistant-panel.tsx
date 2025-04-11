"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Bot, Send, X, Minimize2, Maximize2, HelpCircle, Lightbulb, Sparkles, Trash, Copy, Check, Download } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAIAssistant } from "@/lib/hooks/use-ai-assistant"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { useTheme } from "next-themes"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { useToast } from "@/hooks/use-toast"

interface AIAssistantPanelProps {}

// Sugestões rápidas para prompts comuns
const QUICK_SUGGESTIONS = [
  "Como posso melhorar meu prompt atual?",
  "Dê exemplos de boas palavras-chave",
  "Como estruturar um prompt eficaz",
  "Qual tom é melhor para o meu caso?",
  "Diferenças entre prompts curtos e longos",
  "Como incluir exemplos em um prompt"
];

export function AIAssistantPanel({}: AIAssistantPanelProps) {
  const {
    context,
    addUserMessage,
    clearMessages,
    toggleAssistant,
    exportChatHistory,
    deleteMessage,
  } = useAIAssistant()

  const [userInput, setUserInput] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { theme } = useTheme()
  const { toast } = useToast()

  // Efeito para rolagem automática
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [context.messages])

  // Enviar mensagem do usuário
  const handleSendMessage = () => {
    if (!userInput.trim()) return
    addUserMessage(userInput)
    setUserInput("")
    inputRef.current?.focus()
  }

  // Função para copiar mensagem
  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
    
    toast({
      title: "Copiado para a área de transferência",
      description: "O texto foi copiado com sucesso",
      duration: 2000,
    })
  }

  // Renderização do botão flutuante quando o assistente está desativado
  if (!context.isActive) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button 
          onClick={toggleAssistant} 
          className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300"
        >
          <Sparkles className="h-6 w-6 absolute" />
          <Bot className="h-6 w-6 animate-pulse" style={{ animationDuration: '3s' }} />
        </Button>
      </motion.div>
    )
  }

  // Renderização do painel principal
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-6 right-6 z-50 w-80 md:w-96"
      >
        <Card className="shadow-2xl border border-blue-200/20 dark:border-blue-900/30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm overflow-hidden">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 bg-gradient-to-r from-blue-500/90 to-indigo-600/90 dark:from-blue-700/80 dark:to-indigo-800/80 text-white">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Bot className="h-4 w-4" />
              </div>
              Assistente IA
            </CardTitle>
            <div className="flex items-center gap-1">
              {context.messages.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                        onClick={clearMessages}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Limpar conversa
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {context.messages.length > 1 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                        onClick={exportChatHistory}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      Exportar conversa
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10" onClick={() => setIsMinimized(!isMinimized)}>
                      {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    {isMinimized ? 'Expandir' : 'Minimizar'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10" onClick={toggleAssistant}>
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    Fechar assistente
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              <CardContent className="p-0">
                <ScrollArea className="h-[350px] p-4">
                  {context.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Assistente de Engenharia de Prompts</h3>
                      <p className="text-muted-foreground text-sm mb-6">
                        Olá! Sou seu assistente especializado em engenharia de prompts. Como posso ajudar você a criar
                        prompts mais eficazes hoje?
                      </p>
                      
                      <div className="space-y-2 w-full">
                        <h4 className="text-xs uppercase tracking-wider font-semibold text-blue-500 dark:text-blue-400 flex items-center">
                          <Lightbulb className="h-3 w-3 mr-1" />
                          Sugestões rápidas
                        </h4>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {QUICK_SUGGESTIONS.slice(0, 3).map((suggestion, i) => (
                            <Badge 
                              key={i}
                              className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/30 px-3 py-1"
                              onClick={() => addUserMessage(suggestion)}
                            >
                              {suggestion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {context.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`group flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex gap-2 max-w-[85%] ${message.type === "user" ? "flex-row-reverse" : ""}`}
                          >
                            <Avatar className={`h-8 w-8 ${
                              message.type === "system" 
                                ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400" 
                                : message.type === "user"
                                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                                  : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
                            }`}>
                              {message.type === "user" ? (
                                <AvatarFallback>U</AvatarFallback>
                              ) : message.type === "system" ? (
                                <AvatarFallback>
                                  <HelpCircle className="h-4 w-4" />
                                </AvatarFallback>
                              ) : (
                                <>
                                  <AvatarImage src="/ai-assistant.svg" />
                                  <AvatarFallback>
                                    <Bot className="h-4 w-4" />
                                  </AvatarFallback>
                                </>
                              )}
                            </Avatar>
                            <div className="flex flex-col">
                              <div
                                className={`rounded-lg px-3 py-2 text-sm ${
                                  message.type === "user"
                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                                    : message.type === "system"
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                                      : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                } shadow-sm`}
                              >
                                {message.type === "assistant" ? (
                                  <div className="prose prose-sm dark:prose-invert max-w-none prompt-content">
                                    <ReactMarkdown
                                      remarkPlugins={[remarkGfm]}
                                      rehypePlugins={[rehypeRaw]}
                                      components={{
                                        // @ts-ignore - Problema de tipagem com o componente
                                        code({node, inline, className, children, ...props}) {
                                          const match = /language-(\w+)/.exec(className || '');
                                          const language = match ? match[1] : '';
                                          
                                          return !inline ? (
                                            <SyntaxHighlighter
                                              // @ts-ignore - Problema de tipagem com o SyntaxHighlighter
                                              style={theme === 'dark' ? vscDarkPlus : oneLight}
                                              language={language}
                                              PreTag="div"
                                              wrapLongLines={true}
                                              className="rounded-md my-2 text-xs"
                                              {...props}
                                            >
                                              {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                          ) : (
                                            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                                              {children}
                                            </code>
                                          );
                                        }
                                      }}
                                    >
                                      {message.content}
                                    </ReactMarkdown>
                                  </div>
                                ) : (
                                  <div className="whitespace-pre-wrap">{message.content}</div>
                                )}
                              </div>
                              <div className={`flex mt-1 gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 rounded-full"
                                  onClick={() => handleCopyMessage(message.id, message.content)}
                                >
                                  {copied === message.id ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 rounded-full text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                  onClick={() => deleteMessage(message.id)}
                                >
                                  <Trash className="h-3 w-3" />
                                </Button>
                                {message.type === "assistant" && (
                                  <span className="text-[10px] text-muted-foreground self-center">
                                    {new Date(message.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {context.isTyping && (
                        <div className="flex justify-start">
                          <div className="flex gap-2 max-w-[80%]">
                            <Avatar className="h-8 w-8 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                              <AvatarFallback>
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="rounded-lg px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                              <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDuration: '0.8s' }}></span>
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDuration: '0.8s', animationDelay: '0.2s' }}></span>
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDuration: '0.8s', animationDelay: '0.4s' }}></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              <CardFooter className="p-2 border-t bg-gray-50 dark:bg-gray-900/60">
                <div className="flex items-center w-full gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Pergunte algo..."
                    className="flex-1 h-10 bg-white dark:bg-gray-800 shadow-sm focus-visible:ring-blue-500"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                  />
                  <Button 
                    type="button" 
                    size="icon" 
                    className="h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-sm"
                    onClick={handleSendMessage} 
                    disabled={!userInput.trim() || context.isTyping}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
