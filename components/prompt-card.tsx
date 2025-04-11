"use client"

import { useState, useRef, useEffect } from "react" // Added useEffect
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea" // Added Textarea
import { Check, Copy, Code, MessageSquare, Zap, Download, Share2, Sparkles, Pencil, Save, X } from "lucide-react" // Added Pencil, Save, X icons
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { useTheme } from "next-themes"
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism'

interface PromptCardProps {
  platform: string;
  prompt: string;
  // Optional callback when the prompt is edited and saved
  onSaveEdit?: (newPromptText: string) => void;
}

export function PromptCard({ platform, prompt, onSaveEdit }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState(prompt);
  const { toast } = useToast();
  const { theme } = useTheme();
  const promptRef = useRef<HTMLDivElement>(null); // Keep for non-edit mode if needed
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for textarea focus

  // Update editedPrompt if the prompt prop changes externally (e.g., new generation)
  useEffect(() => {
    setEditedPrompt(prompt);
    // If editing was active, cancel it to show the new prompt
    if (isEditing) {
      setIsEditing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select(); // Select text for easy replacement
    }
  }, [isEditing]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)

      toast({
        title: "Copiado para a área de transferência",
        description: "O prompt foi copiado com sucesso.",
      })
    } catch (err) {
      console.error("Falha ao copiar texto: ", err)
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o texto para a área de transferência.",
        variant: "destructive",
      })
    }
  }

  const downloadAsText = () => {
    try {
      const element = document.createElement("a")
      const file = new Blob([prompt], { type: "text/plain" })
      element.href = URL.createObjectURL(file)
      element.download = `prompt-${platform}-${new Date().toISOString().slice(0, 10)}.txt`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)

      toast({
        title: "Prompt baixado",
        description: "O arquivo de texto foi baixado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar o prompt como arquivo de texto.",
        variant: "destructive",
      })
    }
  }

  const sharePrompt = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Prompt para ${getPlatformName()}`,
          text: prompt,
        })

        toast({
          title: "Prompt compartilhado",
          description: "O prompt foi compartilhado com sucesso.",
        })
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast({
            title: "Erro ao compartilhar",
            description: "Não foi possível compartilhar o prompt.",
            variant: "destructive",
          })
        }
      }
    } else {
      copyToClipboard()
    }
  }

  const getPlatformIcon = () => {
    switch (platform) {
      case "cursor":
        return <Code className="h-5 w-5" />
      case "lovable":
        return <MessageSquare className="h-5 w-5" />
      case "bolt":
        return <Zap className="h-5 w-5" />
      default:
        return <Sparkles className="h-5 w-5" />
    }
  }

  const getPlatformColor = () => {
    switch (platform) {
      case "cursor":
        return "bg-emerald-500/80 dark:bg-emerald-600/80"
      case "lovable":
        return "bg-pink-500/80 dark:bg-pink-600/80"
      case "bolt":
        return "bg-amber-500/80 dark:bg-amber-600/80"
      default:
        return "animated-gradient"
    }
  }

  const getPlatformGradient = () => {
    switch (platform) {
      case "cursor":
        return "from-emerald-500/10 to-transparent"
      case "lovable":
        return "from-pink-500/10 to-transparent"
      case "bolt":
        return "from-amber-500/10 to-transparent"
      default:
        return "from-primary/5 via-accent/5 to-transparent"
    }
  }

  const getPlatformName = () => {
    switch (platform) {
      case "cursor":
        return "Cursor"
      case "lovable":
        return "Lovable"
      case "bolt":
        return "Bolt"
      default:
        return "Genérico"
    }
  }

  // Handlers for edit mode (Moved inside the component)
  const handleSave = () => {
    if (editedPrompt !== prompt && onSaveEdit) {
      onSaveEdit(editedPrompt);
      toast({
        title: "Prompt atualizado",
        description: "Suas alterações foram salvas.",
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedPrompt(prompt); // Revert changes
    setIsEditing(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center h-9 w-9 rounded-xl ${getPlatformColor()}`}>
              {getPlatformIcon()}
            </div>
            <h3 className="text-lg font-medium">{getPlatformName()}</h3>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              // Buttons for Edit Mode
              <>
                <Button
                  variant="modern"
                  size="sm"
                  rounded="full"
                  onClick={handleSave}
                  className="gap-1.5 transition-all bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:hover:bg-green-500/30"
                  disabled={editedPrompt === prompt} // Disable if no changes
                >
                  <Save className="h-4 w-4" />
                  <span>Salvar</span>
                </Button>
                <Button
                  variant="modern"
                  size="icon-sm"
                  rounded="full"
                  onClick={handleCancel}
                  className="h-9 w-9 transition-all bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/30"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              // Buttons for View Mode
              <>
                {onSaveEdit && ( // Only show Edit button if onSaveEdit is provided
                  <Button
                    variant="modern"
                    size="icon-sm"
                    rounded="full"
                    onClick={() => setIsEditing(true)}
                    className="h-9 w-9 transition-all"
                    title="Editar Prompt"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="modern"
                  size="sm"
                  rounded="full"
                  onClick={copyToClipboard}
                  className="gap-1.5 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copiar</span>
                    </>
                  )}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="modern"
                      size="icon-sm"
                      rounded="full"
                      className="h-9 w-9 transition-all"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass border-0 shadow-xl">
                    <DropdownMenuItem onClick={sharePrompt} className="gap-3 cursor-pointer py-2 px-3 focus:bg-accent/10">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                        <Share2 className="h-4 w-4" />
                      </div>
                      <span>Compartilhar</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={downloadAsText} className="gap-3 cursor-pointer py-2 px-3 focus:bg-accent/10">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <Download className="h-4 w-4" />
                      </div>
                      <span>Baixar como texto</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className={`bg-gradient-to-b ${getPlatformGradient()} rounded-xl p-5 text-sm leading-relaxed border border-primary/40 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all duration-200 shadow-sm min-h-[200px] max-h-[500px] resize-y`}
            placeholder="Edite o prompt aqui..."
          />
        ) : (
          <div
            ref={promptRef}
            className={`bg-gradient-to-b ${getPlatformGradient()} rounded-xl p-5 max-h-[500px] overflow-y-auto shadow-sm prompt-content`}
          >
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
                      className="rounded-md my-4"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {editedPrompt}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Removed the functions from outside the component scope
