import { PromptEngineer } from "@/components/prompt-engineer"
import { Header } from "@/components/header"
import { BackgroundGradient } from "@/components/background-gradient"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundGradient />
      <Header />
      <main className="container mx-auto py-10 px-4 md:px-6 relative z-10">
        <PromptEngineer />
      </main>
      <Toaster />
    </div>
  )
}
