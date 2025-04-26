import { PromptEngineer } from "@/components/prompt-engineer"
import { Header } from "@/components/header"
import { BackgroundGradient } from "@/components/background-gradient"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <BackgroundGradient>
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12 lg:py-16 relative">
        <PromptEngineer />
      </main>
      <Toaster />
    </BackgroundGradient>
  )
}
