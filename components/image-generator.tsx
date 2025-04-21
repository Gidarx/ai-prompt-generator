"use client"

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from '@/hooks/use-toast';
import { Loader2, ImageIcon, AlertCircle, Trash2, Wand2, Maximize, Download, Camera, Palette, Clapperboard, Frame, Sparkles as FantasyIcon, Brush, Triangle, Square, Pencil, History, Lightbulb, Info, Lock, Unlock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const VISUAL_STYLES = [
  { value: "photorealistic", label: "Fotorrealista", preview: { type: 'gradient', colors: 'from-amber-500 to-orange-600', Icon: Camera } },
  { value: "anime", label: "Anime", preview: { type: 'gradient', colors: 'from-pink-400 to-rose-500', Icon: Palette } },
  { value: "cinematic", label: "Cinematográfico", preview: { type: 'gradient', colors: 'from-sky-500 to-indigo-600', Icon: Clapperboard } },
  { value: "pixel_art", label: "Pixel Art", preview: { type: 'gradient', colors: 'from-lime-400 to-emerald-600', Icon: Frame } },
  { value: "fantasy_art", label: "Arte Fantasia", preview: { type: 'gradient', colors: 'from-purple-500 to-fuchsia-600', Icon: FantasyIcon } },
  { value: "watercolor", label: "Aquarela", preview: { type: 'gradient', colors: 'from-cyan-400 to-blue-500', Icon: Brush } },
  { value: "low_poly", label: "Low Poly", preview: { type: 'gradient', colors: 'from-yellow-400 to-amber-500', Icon: Triangle } },
  { value: "isometric", label: "Isométrico", preview: { type: 'gradient', colors: 'from-teal-400 to-cyan-600', Icon: Square } },
  { value: "line_art", label: "Arte Linear", preview: { type: 'gradient', colors: 'from-gray-400 to-gray-600', Icon: Pencil } },
];

const ASPECT_RATIOS = [
  { value: "1:1", label: "Quadrado (1:1)", ratio: 1 },
  { value: "16:9", label: "Paisagem (16:9)", ratio: 16 / 9 },
  { value: "9:16", label: "Retrato (9:16)", ratio: 9 / 16 },
  { value: "4:3", label: "Standard (4:3)", ratio: 4 / 3 },
  { value: "3:2", label: "Fotografia (3:2)", ratio: 3 / 2 },
];

const NUM_IMAGES = [
  { value: "1", label: "1 Imagem" },
  { value: "2", label: "2 Imagens" },
  { value: "4", label: "4 Imagens" },
];

interface HistoryItem {
  id: string;
  prompt: string;
  negativePrompt?: string;
  style?: string;
  aspectRatio?: string;
  numberOfImages: number; 
  imageUrls: string[];
  timestamp: number;
}

export function ImageGenerator() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [style, setStyle] = useState<string>(VISUAL_STYLES[0]?.value || '');
  const [aspectRatio, setAspectRatio] = useState<string>(ASPECT_RATIOS[0]?.value || '');
  const [numberOfImages, setNumberOfImages] = useState<string>('1');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedModalData, setSelectedModalData] = useState<{ url: string; prompt?: string } | null>(null);
  const [isStyleLocked, setIsStyleLocked] = useState<boolean>(false);
  const [isAspectRatioLocked, setIsAspectRatioLocked] = useState<boolean>(false);
  const [isNumImagesLocked, setIsNumImagesLocked] = useState<boolean>(false);
  
  // --- State for Favorites ---
  const [favorites, setFavorites] = useState<HistoryItem[]>([]);

  const [isSuggestingPrompt, setIsSuggestingPrompt] = useState<boolean>(false);

  const numImagesToGenerate = parseInt(numberOfImages, 10) || 1;

  const selectedAspectRatio = ASPECT_RATIOS.find(ar => ar.value === aspectRatio);
  const selectedStyle = VISUAL_STYLES.find(s => s.value === style);

  useEffect(() => {
    const storedHistory = localStorage.getItem('imageGeneratorHistory');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
        localStorage.removeItem('imageGeneratorHistory');
      }
    }
    // Load Favorites
    const storedFavorites = localStorage.getItem('imageGeneratorFavorites');
    if (storedFavorites) {
      try { setFavorites(JSON.parse(storedFavorites)); } catch (e) { console.error("Failed to parse favorites", e); localStorage.removeItem('imageGeneratorFavorites'); }
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem('imageGeneratorHistory', JSON.stringify(history));
      } catch (error) {
        // Verificar se é um erro de quota excedida
        if (error instanceof Error && 
            (error.name === 'QuotaExceededError' || error.message.includes('quota'))) {
          
          // Notificar o usuário
          toast({
            title: "Limite de armazenamento excedido",
            description: "Seu histórico de imagens está muito grande. Itens mais antigos serão removidos automaticamente.",
            variant: "destructive",
            duration: 5000,
          });
          
          // Remover metade dos itens mais antigos do histórico e tentar novamente
          const reducedHistory = history.slice(0, Math.max(5, Math.floor(history.length / 2)));
          setHistory(reducedHistory);
          
          // Tente salvar um histórico menor
          try {
            localStorage.setItem('imageGeneratorHistory', JSON.stringify(reducedHistory));
          } catch (innerError) {
            // Se ainda falhar, limpe tudo exceto o item mais recente
            const minimalHistory = history.slice(0, 1);
            setHistory(minimalHistory);
            
            try {
              localStorage.setItem('imageGeneratorHistory', JSON.stringify(minimalHistory));
            } catch (finalError) {
              // Última tentativa: limpe todo o histórico
              console.error("Impossível salvar o histórico, mesmo reduzido", finalError);
              localStorage.removeItem('imageGeneratorHistory');
              setHistory([]);
            }
          }
        } else {
          console.error("Erro ao salvar histórico", error);
        }
      }
    }
  }, [history, toast]);

  useEffect(() => {
    // Save Favorites
    if (favorites.length > 0) {
      localStorage.setItem('imageGeneratorFavorites', JSON.stringify(favorites));
    } else {
      localStorage.removeItem('imageGeneratorFavorites'); // Clean up if empty
    }
  }, [favorites]);

  const handleClearFields = () => {
    setPrompt('');
    setNegativePrompt('');
    if (!isStyleLocked) setStyle(VISUAL_STYLES[0]?.value || '');
    if (!isAspectRatioLocked) setAspectRatio(ASPECT_RATIOS[0]?.value || '');
    if (!isNumImagesLocked) setNumberOfImages('1');
    setImageUrls([]);
    setError(null);
    toast({ title: "Campos limpos!" });
  };

  const addToHistory = (newItem: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const fullNewItem: HistoryItem = {
      ...newItem,
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    
    // Limitar o histórico a um máximo de 10 itens
    setHistory(prev => [fullNewItem, ...prev.slice(0, 9)]);
    
    // Verificar o tamanho dos dados antes de tentar salvar
    try {
      const historyString = JSON.stringify([fullNewItem, ...history.slice(0, 9)]);
      const sizeInKb = new Blob([historyString]).size / 1024;
      
      // Se o tamanho for grande, alerte o usuário
      if (sizeInKb > 3000) { // ~3MB, um valor seguro para a maioria dos navegadores
        toast({
          title: "Aviso de armazenamento",
          description: `O histórico está usando aproximadamente ${Math.round(sizeInKb)}KB. Considere limpar itens antigos.`,
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Erro ao medir tamanho do histórico", error);
    }
  };

  const handleGenerateImage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!prompt.trim()) {
      toast({
        title: 'Prompt Obrigatório',
        description: 'Por favor, insira uma descrição para a imagem.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setImageUrls([]);

    const requestBody = {
      prompt: prompt.trim(),
      negativePrompt: negativePrompt.trim(),
      style: style,
      aspectRatio: aspectRatio,
      numberOfImages: numImagesToGenerate
    };

    try {
      console.log("Enviando para API:", requestBody);
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const responseBody = await response.json();
      if (!responseBody.imageUrls || responseBody.imageUrls.length === 0) {
        throw new Error("A API não retornou nenhuma URL de imagem.");
      }
      setImageUrls(responseBody.imageUrls);

      addToHistory({
        prompt: requestBody.prompt,
        negativePrompt: requestBody.negativePrompt,
        style: requestBody.style,
        aspectRatio: requestBody.aspectRatio,
        numberOfImages: requestBody.numberOfImages,
        imageUrls: responseBody.imageUrls,
      });

      toast({
        title: 'Imagem(ns) Gerada(s)!',
        description: `Foram geradas ${responseBody.imageUrls.length} imagem(ns).`,
      });
    } catch (err: any) {
      console.error('Erro ao gerar imagem:', err);
      const errorMessage = err.message || 'Ocorreu um erro desconhecido.';
      setError(errorMessage);
      toast({
        title: 'Erro na Geração',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setPrompt(item.prompt);
    setNegativePrompt(item.negativePrompt || '');
    if (!isStyleLocked) setStyle(item.style || VISUAL_STYLES[0]?.value || '');
    if (!isAspectRatioLocked) setAspectRatio(item.aspectRatio || ASPECT_RATIOS[0]?.value || '');
    if (!isNumImagesLocked) setNumberOfImages(String(item.numberOfImages)); 
    setImageUrls(item.imageUrls);
    setError(null);
    toast({ title: "Configuração do histórico carregada!" });
  }

  const handleSurpriseMe = async () => {
    setIsSuggestingPrompt(true);
    setError(null);
    try {
      const response = await fetch('/api/suggest-image-prompt');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
      const data = await response.json();
      if (data.suggestion) {
        setPrompt(data.suggestion);
        toast({ title: "Sugestão de prompt carregada!" });
      } else {
        throw new Error("API não retornou uma sugestão válida.");
      }
    } catch (err: any) {
      console.error("Erro ao buscar sugestão:", err);
      const message = err.message || "Falha ao buscar sugestão de prompt.";
      setError(message);
      toast({ title: "Erro na Sugestão", description: message, variant: 'destructive' });
    } finally {
      setIsSuggestingPrompt(false);
    }
  }

  const openImageModal = (imageUrl: string) => {
    const historyItem = history.find(item => item.imageUrls.includes(imageUrl));
    setSelectedModalData({
      url: imageUrl,
      prompt: historyItem?.prompt
    });
  };

  const closeImageModal = () => {
    setSelectedModalData(null);
  };

  const handleModalDownload = () => {
    if (!selectedModalData?.url) return;
    const link = document.createElement('a');
    link.href = selectedModalData.url;
    const mimeTypeMatch = selectedModalData.url.match(/^data:(image\/\w+);base64,/);
    const extension = mimeTypeMatch ? mimeTypeMatch[1].split('/')[1] : 'png';
    link.download = `ai-generated-image-${Date.now()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Download iniciado!" });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('imageGeneratorHistory');
    toast({ title: "Histórico limpo!" });
  };

  // --- Função para Favoritar/Desfavoritar ---
  const toggleFavorite = (item: HistoryItem) => {
    const isFavorited = favorites.some(fav => fav.id === item.id);
    let updatedFavorites;
    if (isFavorited) {
      updatedFavorites = favorites.filter(fav => fav.id !== item.id);
      toast({ title: "Removido dos Favoritos" });
    } else {
      updatedFavorites = [item, ...favorites]; // Add new favorite to the beginning
      toast({ title: "Adicionado aos Favoritos!" });
    }
    setFavorites(updatedFavorites);
  };

  // --- Helper para Botão de Trava ---
  const LockButton = ({ isLocked, onClick, label }: { isLocked: boolean; onClick: () => void; label: string }) => (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            type="button" 
            variant="ghost"
            size="icon"
            onClick={onClick}
            className="h-6 w-6 text-muted-foreground/60 hover:text-foreground"
            aria-label={label}
          >
            {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
      <Card className="w-full lg:flex-grow shadow-xl bg-background/70 backdrop-blur-sm border border-border/40 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Gerador de Imagem IA
              </CardTitle>
              <CardDescription className="mt-1">
                Descreva a imagem que você deseja criar e a IA fará o resto.
              </CardDescription>
            </div>
            <div className="rounded-full bg-primary/10 p-2 dark:bg-primary/5">
              <Wand2 className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleGenerateImage}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="prompt" className="text-sm font-medium flex items-center gap-1">
                  Descrição da Imagem (Prompt)
                  <span className="text-xs text-destructive">*</span>
                </Label>
                <Button 
                  type="button" 
                  variant="ghost"
                  size="sm"
                  onClick={handleSurpriseMe}
                  disabled={isLoading || isSuggestingPrompt}
                  className="text-xs h-7 px-2 gap-1 text-primary hover:text-primary"
                >
                  {isSuggestingPrompt ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Lightbulb className="h-3.5 w-3.5" />
                  )}
                  {isSuggestingPrompt ? "Sugerindo..." : "Surpreenda-me"}
                </Button>
              </div>
              <Textarea
                id="prompt"
                placeholder="Ex: um gato astronauta flutuando no espaço, pintura a óleo"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                rows={3}
                className="resize-y bg-background/50 border-border/50 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="w-full text-left">
                    <Label htmlFor="negative-prompt" className="text-sm font-medium flex items-center gap-1 cursor-help">
                      Prompt Negativo (Opcional)
                      <Info className="h-3 w-3 text-muted-foreground/70" />
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Descreva elementos, estilos ou conceitos que você NÃO quer na imagem (ex: "texto, má qualidade, deformado"). Ajuda a refinar o resultado.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Textarea
                id="negative-prompt"
                placeholder="Ex: texto, má qualidade, deformado, múltiplas figuras"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={2}
                className="resize-y bg-background/50 border-border/50 focus-visible:ring-primary/30 focus-visible:border-primary/50 transition-all"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="style" className="text-sm font-medium">Estilo Visual</Label>
                  <LockButton 
                    isLocked={isStyleLocked} 
                    onClick={() => setIsStyleLocked(!isStyleLocked)} 
                    label={isStyleLocked ? "Desbloquear Estilo" : "Bloquear Estilo"}
                  />
                </div>
                <Select value={style} onValueChange={setStyle} disabled={isLoading || isStyleLocked}>
                  <SelectTrigger id="style" className="bg-background/50 border-border/50 focus:ring-primary/30">
                    <SelectValue placeholder="Selecione um estilo">
                      {selectedStyle ? (
                        <div className="flex items-center gap-2">
                          {selectedStyle.preview.Icon && (
                            <div className={cn(
                              "w-5 h-5 rounded flex items-center justify-center text-white",
                              `bg-gradient-to-br ${selectedStyle.preview.colors}`
                            )}>
                               <selectedStyle.preview.Icon className="h-3 w-3" />
                             </div>
                          )}
                          <span>{selectedStyle.label}</span>
                        </div>
                      ) : (
                        "Selecione um estilo"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[240px]">
                    {VISUAL_STYLES.map(s => (
                      <SelectItem key={s.value} value={s.value}>
                         <div className="flex items-center gap-3">
                           {s.preview.Icon && (
                             <div className={cn(
                               "w-6 h-6 rounded flex items-center justify-center text-white shadow-sm",
                               `bg-gradient-to-br ${s.preview.colors}`
                             )}>
                                <s.preview.Icon className="h-4 w-4" />
                              </div>
                           )}
                           <span>{s.label}</span>
                         </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="aspect-ratio" className="text-sm font-medium">Proporção</Label>
                  <div className="flex items-center gap-1">
                    {selectedAspectRatio && (
                      <div 
                        className="w-6 h-4 bg-muted border border-border/50 rounded-sm overflow-hidden flex items-center justify-center"
                        title={`Preview: ${selectedAspectRatio.label}`}
                      >
                         <div 
                           className="bg-primary/30"
                           style={{ 
                             width: selectedAspectRatio.ratio >= 1 ? '100%' : `${selectedAspectRatio.ratio * 100}%`,
                             height: selectedAspectRatio.ratio <= 1 ? '100%' : `${(1 / selectedAspectRatio.ratio) * 100}%`
                           }}
                         />
                      </div>
                    )}
                    <LockButton 
                      isLocked={isAspectRatioLocked} 
                      onClick={() => setIsAspectRatioLocked(!isAspectRatioLocked)} 
                      label={isAspectRatioLocked ? "Desbloquear Proporção" : "Bloquear Proporção"}
                    />
                  </div>
                </div>
                <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isLoading || isAspectRatioLocked}>
                  <SelectTrigger id="aspect-ratio" className="bg-background/50 border-border/50 focus:ring-primary/30">
                    <SelectValue placeholder="Selecione a proporção" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map(ar => (
                      <SelectItem key={ar.value} value={ar.value}>
                        {ar.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="num-images" className="text-sm font-medium">Número de Imagens</Label>
                  <LockButton 
                    isLocked={isNumImagesLocked} 
                    onClick={() => setIsNumImagesLocked(!isNumImagesLocked)} 
                    label={isNumImagesLocked ? "Desbloquear Número" : "Bloquear Número"}
                  />
                </div>
                <Select value={numberOfImages} onValueChange={setNumberOfImages} disabled={isLoading || isNumImagesLocked}>
                  <SelectTrigger id="num-images" className="bg-background/50 border-border/50 focus:ring-primary/30">
                    <SelectValue placeholder="Quantas imagens?" />
                  </SelectTrigger>
                  <SelectContent>
                    {NUM_IMAGES.map(ni => (
                      <SelectItem key={ni.value} value={ni.value}>
                        {ni.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 rounded-xl overflow-hidden bg-muted/30 border border-border/50 relative">
              {isLoading && (
                <div className="absolute inset-0 backdrop-blur-sm bg-background/30 flex flex-col items-center justify-center z-10 space-y-3 text-center px-4">
                  <div className="p-3 rounded-full bg-background/70 border border-border shadow-md">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground/80">
                    Gerando {numImagesToGenerate > 1 ? `${numImagesToGenerate} imagens` : "imagem"}...
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Isso pode levar alguns segundos. A IA está trabalhando na sua criação!
                  </p>
                </div>
              )}
              
              <div className="min-h-[300px] p-6 flex items-center justify-center">
                {error ? (
                  <div className="text-center text-destructive space-y-3 p-4 sm:p-6 bg-destructive/5 rounded-lg border border-destructive/20 max-w-md mx-auto">
                    <AlertCircle className="h-8 w-8 mx-auto" />
                    <p className="font-semibold text-base sm:text-lg">Ops! Ocorreu um erro</p>
                    <p 
                      className="text-sm text-destructive/80 bg-destructive/10 px-3 py-1.5 rounded border border-destructive/20"
                      style={{ wordBreak: 'break-word' }}
                    >
                      {error}
                    </p>
                    <p className="text-xs text-muted-foreground pt-2">
                      Verifique seu prompt ou tente novamente mais tarde.
                    </p>
                  </div>
                ) : imageUrls.length > 0 ? (
                  <div className={cn(
                    "grid gap-4 w-full",
                    imageUrls.length === 1 && "max-w-md mx-auto", 
                    imageUrls.length === 2 && "grid-cols-2",
                    imageUrls.length > 2 && "grid-cols-2 md:grid-cols-4"
                  )}>
                    {imageUrls.map((imageUrl, index) => (
                      <motion.div 
                        key={index} 
                        className={cn(
                          "relative w-full rounded-lg overflow-hidden shadow-md group border border-border/50",
                          "aspect-square"
                        )}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
                        <Image
                          src={imageUrl}
                          alt={`Imagem gerada ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                          style={{ objectFit: 'cover' }}
                          className="transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-white hover:bg-white/20 h-10 w-10 rounded-full"
                            onClick={() => openImageModal(imageUrl)}
                            title="Ampliar Imagem"
                          >
                            <Maximize className="h-5 w-5" />
                            <span className="sr-only">Ampliar Imagem</span>
                          </Button>
                        </div>
                        <a 
                          href={imageUrl} 
                          download={`ai-image-${index}.png`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute bottom-2 right-2 text-xs text-white font-medium bg-primary/80 hover:bg-primary p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow"
                          title="Download"
                        >
                          <Download className="h-3 w-3" />
                        </a>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground space-y-2">
                    <div className="bg-muted/50 rounded-full p-4 mx-auto w-fit">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
                    </div>
                    <p>Sua imagem gerada aparecerá aqui.</p>
                    <p className="text-xs max-w-md">Insira uma descrição detalhada para obter melhores resultados</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/20">
            <Button 
              type="submit" 
              className="w-full sm:w-auto flex-grow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Gerando...' : `Gerar ${parseInt(numberOfImages, 10) > 1 ? numberOfImages + ' Imagens' : 'Imagem'}`}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClearFields}
              disabled={isLoading}
              className="w-full sm:w-auto bg-background hover:bg-muted/20"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          </CardFooter>
        </form>
      </Card>

      {history.length > 0 && (
        <Card className="w-full lg:w-80 lg:flex-shrink-0 shadow-lg border-border/40 bg-background/60 backdrop-blur-sm overflow-hidden h-fit lg:sticky lg:top-24">
          <CardHeader className="border-b border-border/30 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary"/> Histórico da Sessão
              </CardTitle>
              <CardDescription className="text-xs pt-1">
                Últimas 10 gerações. Clique para reutilizar.
              </CardDescription>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Limpar Histórico</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Limpeza do Histórico?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Todo o histórico de geração desta sessão será permanentemente removido.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Limpar Histórico
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardHeader>
          <CardContent className="p-3 space-y-3 max-h-[600px] overflow-y-auto">
            {history.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma geração recente.</p>}
            {history.map((item) => {
              const isFavorited = favorites.some(fav => fav.id === item.id);
              return (
                <motion.div
                  key={item.id}
                  layout 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="relative border border-border/30 rounded-lg p-2.5 pr-10 cursor-pointer hover:bg-muted/40 transition-colors duration-200 shadow-sm hover:shadow-md"
                  onClick={() => loadFromHistory(item)}
                  title={`Clique para carregar\nPrompt: ${item.prompt}`}
                >
                  {/* Botão Favorito */}
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "absolute top-1.5 right-1.5 h-7 w-7 rounded-full text-muted-foreground/70 hover:bg-transparent",
                            isFavorited ? "text-yellow-500 hover:text-yellow-600" : "hover:text-yellow-500"
                          )}
                          onClick={(e) => { 
                            e.stopPropagation(); // Prevent loadFromHistory on star click
                            toggleFavorite(item); 
                          }}
                          aria-label={isFavorited ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                        >
                          <Star className={cn("h-4 w-4", isFavorited && "fill-current")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>{isFavorited ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  {/* Conteúdo do item do histórico */}
                  <p className="text-sm font-medium truncate mb-1.5 line-clamp-2 mr-6">{item.prompt || "(Sem prompt)"}</p>
                  <div className="flex items-center gap-2">
                    {item.imageUrls[0] && (
                      <div className="relative w-12 h-12 rounded-md overflow-hidden border border-border/50 flex-shrink-0 bg-muted">
                        <Image
                          src={item.imageUrls[0]}
                          alt={`Histórico ${item.id} thumb`}
                          fill
                          sizes="48px"
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground overflow-hidden flex-1 space-y-1">
                      <p className="truncate font-medium text-foreground/80">
                        {item.style ? (VISUAL_STYLES.find(s => s.value === item.style)?.label || item.style) : 'Padrão'}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">
                          {item.numberOfImages} img
                        </span>
                        <span className="text-muted-foreground/80">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selectedModalData} onOpenChange={(open) => !open && closeImageModal()}>
        <DialogContent className="max-w-4xl w-[90vw] p-2 sm:p-4 bg-background/80 backdrop-blur-lg border-border/50 flex flex-col gap-3">
          {selectedModalData?.url && (
            <div className="relative w-full h-auto aspect-auto max-h-[75vh] flex-shrink-0">
              <Image 
                src={selectedModalData.url}
                alt={selectedModalData.prompt || "Imagem ampliada"} 
                fill 
                style={{ objectFit: 'contain' }} 
                className="rounded-md"
              />
              <Button 
                variant="secondary"
                size="icon"
                onClick={handleModalDownload}
                className="absolute top-3 right-3 h-9 w-9 bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg"
                title="Baixar Imagem"
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">Baixar Imagem</span>
              </Button>
            </div>
          )}
          {selectedModalData?.prompt && (
            <div className="flex-shrink-0 bg-muted/50 p-3 rounded-md border border-border/50">
              <p className="text-xs text-muted-foreground font-medium mb-1">Prompt:</p>
              <p className="text-sm text-foreground/90" style={{ wordBreak: 'break-word' }}>
                {selectedModalData.prompt}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}