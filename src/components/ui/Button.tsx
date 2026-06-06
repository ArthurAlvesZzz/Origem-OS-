import * as React from "react"
import { cn } from "../../lib/utils"
import { motion, HTMLMotionProps } from "motion/react"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: 
    | "primary" 
    | "conclusive" 
    | "flow" 
    | "secondary" 
    | "outline" 
    | "explore"
    | "ghost" 
    | "danger" 
    | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    
    // Base styles setup for consistency
    const baseClass = "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none group overflow-hidden isolate";

    // Sophisticated, layered variants
    const variants = {
      // Primary: High contrast, solid amber but with subtle inner depth
      primary: "bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-[0_2px_10px_rgba(197,152,104,0.2)] border border-amber-600/20 active:bg-amber-500",
      
      // Conclusive: The most impactful button for "Finalizing / Saving"
      conclusive: "bg-gradient-to-b from-amber-400 to-amber-500 text-amber-950 hover:from-amber-300 hover:to-amber-400 border border-amber-300/30 shadow-[0_4px_20px_rgba(197,152,104,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] active:shadow-[0_2px_10px_rgba(197,152,104,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] font-bold",
      
      // Flow: Light/White variant for productive operational actions (creates high contrast on dark UI)
      flow: "bg-zinc-100 text-zinc-950 hover:bg-white inset-ring inset-ring-white shadow-[0_2px_10px_rgba(255,255,255,0.05)] border border-zinc-200/20 hover:shadow-[0_4px_20px_rgba(255,255,255,0.15)]",
      
      // Secondary: Standard dark UI buttons for forms & secondary actions
      secondary: "bg-zinc-800/80 text-zinc-100 hover:bg-zinc-700 hover:text-white border border-zinc-700/80 shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-zinc-600",
      
      // Explore / Outline with tinted amber feel for tracing/details
      explore: "bg-transparent text-amber-500 hover:text-amber-400 border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/10 hover:shadow-[0_0_15px_rgba(197,152,104,0.1)]",
      
      // Outline: Muted border-only
      outline: "bg-transparent text-zinc-300 hover:text-zinc-50 border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50",
      
      // Ghost: Invisible until hovered
      ghost: "bg-transparent text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60",
      
      // Danger / Destructive
      danger: "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40",
      destructive: "bg-gradient-to-b from-red-500 to-red-600 text-red-50 hover:from-red-400 hover:to-red-500 border border-red-400/30 shadow-[0_4px_20px_rgba(220,38,38,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]",
    }
    
    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 py-2 text-sm gap-2",
      lg: "h-12 px-6 py-3 text-base gap-2.5",
      icon: "h-10 w-10 p-2",
    }

    // Determine motion scale behavior based on prominence
    const scaleTap = (disabled || isLoading) ? 1 : 0.98;
    const isConclusive = variant === 'conclusive';

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileTap={{ scale: scaleTap }}
        className={cn(baseClass, variants[variant], sizes[size], className)}
        aria-busy={isLoading}
        aria-label={size === 'icon' && !props['aria-label'] ? 'Ação' : props['aria-label']}
        {...props}
      >
        {/* Shine Extra Effect for Conclusive / Flow variants */}
        {isConclusive && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] skew-x-[30deg] group-hover:animate-[shine_1.5s_ease-out] -z-10" />
        )}

        {/* Content Container (protects z-index from absolute backgrounds) */}
        <span className={cn(
          "relative flex items-center justify-center gap-inherit z-10 w-full",
           isLoading && "opacity-0" // Hide content but keep layout box when loading
        )}>
          {children as React.ReactNode}
        </span>

        {/* Loading Spinner Absolute Center */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
             <Loader2 className="animate-spin h-5 w-5 text-current opacity-80" strokeWidth={2.5} />
          </div>
        )}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button }
