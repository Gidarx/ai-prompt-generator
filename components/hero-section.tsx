import { ModeToggle } from "@/components/mode-toggle"

export function HeroSection() {
  return (
    <div className="relative">
      <div className="absolute right-0 top-0">
        <ModeToggle />
      </div>

      <div className="absolute inset-x-0 -bottom-40 transform-gpu overflow-hidden blur-3xl -z-10" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-primary/30 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
      </div>
    </div>
  )
}
