import * as React from "react"
import { cn } from "@/lib/utils"

export interface EnhancedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "glass" | "floating"
  icon?: React.ReactNode
  label?: string
}

const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ className, type, variant = "default", icon, label, ...props }, ref) => {
    const variants = {
      default: "bg-background border-input hover:border-primary/50 focus:border-primary",
      glass: "bg-white/10 dark:bg-gray-900/20 border-white/20 dark:border-gray-700/30 backdrop-blur-sm hover:bg-white/20 dark:hover:bg-gray-900/30 focus:bg-white/30 dark:focus:bg-gray-900/40",
      floating: "bg-transparent border-b-2 border-muted-foreground/30 rounded-none hover:border-primary/70 focus:border-primary pb-2"
    }

    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl border px-4 py-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            variants[variant],
            icon && "pl-10",
            className
          )}
          ref={ref}
          {...props}
        />
        {label && variant === "floating" && (
          <label className="absolute left-0 -top-6 text-sm font-medium text-muted-foreground">
            {label}
          </label>
        )}
      </div>
    )
  }
)
EnhancedInput.displayName = "EnhancedInput"

export { EnhancedInput }