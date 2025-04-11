"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ClipboardCopy, Star, StarOff } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface PromptDisplayProps {
  prompt: string;
  isGenerating: boolean;
  isFavorited?: boolean;
  onFavorite?: () => void;
  className?: string;
}

export function PromptDisplay({
  prompt,
  isGenerating,
  isFavorited = false,
  onFavorite,
  className,
}: PromptDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [displayedPrompt, setDisplayedPrompt] = useState(prompt);
  const { theme } = useTheme();

  useEffect(() => {
    // Apenas atualize o texto quando não estiver gerando
    if (!isGenerating) {
      setDisplayedPrompt(prompt);
    }
  }, [prompt, isGenerating]);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPlaceholderContent = () => {
    if (isGenerating) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="space-y-2 w-full max-w-[90%]">
            <div className="flex space-x-2">
              <div className="h-4 bg-muted/80 rounded animate-pulse w-1/3"></div>
              <div className="h-4 bg-muted/60 rounded animate-pulse w-1/4"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-4 bg-muted/70 rounded animate-pulse w-2/3"></div>
              <div className="h-4 bg-muted/50 rounded animate-pulse w-1/6"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-4 bg-muted/60 rounded animate-pulse w-1/2"></div>
              <div className="h-4 bg-muted/40 rounded animate-pulse w-1/5"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-4 bg-muted/40 rounded animate-pulse w-1/3"></div>
              <div className="h-4 bg-muted/30 rounded animate-pulse w-1/3"></div>
            </div>
          </div>
        </div>
      );
    }
    
    return prompt ? (
      <AnimatePresence mode="wait">
        <motion.div
          key={displayedPrompt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="prompt-content"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              // @ts-ignore - O tipo exato não está disponível, mas isso funciona
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
            {displayedPrompt}
          </ReactMarkdown>
        </motion.div>
      </AnimatePresence>
    ) : (
      <div className="text-muted-foreground text-center p-6">
        Nenhum prompt gerado. Preencha o formulário e clique em Gerar.
      </div>
    );
  };

  return (
    <Card
      className={cn(
        "relative h-full min-h-[280px] flex flex-col border-muted-foreground/20",
        className
      )}
    >
      <CardContent className="p-6 flex-1 overflow-auto">
        {getPlaceholderContent()}
      </CardContent>
      <div className="absolute bottom-3 right-3 flex space-x-2">
        {onFavorite && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onFavorite}
            disabled={!prompt || isGenerating}
            className={
              isFavorited ? "text-yellow-500 hover:text-yellow-600" : ""
            }
          >
            {isFavorited ? (
              <Star className="h-4 w-4" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            </span>
          </Button>
        )}
        <Button
          variant="secondary"
          size="icon"
          onClick={handleCopy}
          disabled={!prompt || isGenerating}
          className={
            copied
              ? theme === "light"
                ? "bg-green-100 text-green-800 hover:bg-green-200 hover:text-green-800"
                : "bg-green-800/30 text-green-400 hover:bg-green-800/40 hover:text-green-400"
              : ""
          }
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <ClipboardCopy className="h-4 w-4" />
          )}
          <span className="sr-only">
            {copied ? "Copiado" : "Copiar para a área de transferência"}
          </span>
        </Button>
      </div>
    </Card>
  );
} 