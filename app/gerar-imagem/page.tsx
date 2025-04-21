import { ImageGenerator } from "../../components/image-generator";
import { Header } from "../../components/header";
import { Toaster } from "../../components/ui/toaster";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gerador de Imagem | IA Gerador de Prompts',
  description: 'Gere imagens incríveis usando IA com descrições textuais simples',
};

export default function GenerateImagePage() {
  return (
    <div className="relative min-h-screen">
      {/* Fundo com gradiente e efeito */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/30 to-pink-50/30 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 -z-10" />
      <div className="absolute inset-0 bg-grid-small-black/[0.2] dark:bg-grid-small-white/[0.2] -z-10" />
      
      {/* Círculos decorativos */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400/10 dark:bg-purple-400/5 rounded-full blur-3xl -z-10" />
      
      {/* Adicionando o Header */}
      <Header />
      
      <div className="container max-w-5xl py-16 space-y-8 pt-28">
        <div className="relative">
          <ImageGenerator />
        </div>
        
        <div className="text-center text-sm text-muted-foreground mt-10">
          <p>As imagens geradas são criadas usando tecnologia de IA e podem ser usadas para fins pessoais ou comerciais.</p>
          <p>Evite conteúdo impróprio, ofensivo ou ilegal em seus prompts.</p>
        </div>
      </div>
      
      <Toaster />
    </div>
  );
} 