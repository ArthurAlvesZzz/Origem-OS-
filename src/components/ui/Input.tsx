import * as React from "react"
import { cn } from "../../lib/utils"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode;
    error?: string | boolean;
    success?: boolean;
  }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, error, success, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${
            error ? 'text-red-500' : success ? 'text-emerald-500' : 'text-zinc-500'
          }`}>
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xl border bg-zinc-950 px-3 py-2 text-sm text-zinc-100 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-10",
            error ? "border-red-500/50 focus-visible:ring-red-500/50 focus-visible:border-red-500" : 
            success ? "border-emerald-500/50 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500" : 
            "border-zinc-800 focus-visible:ring-amber-500/50 focus-visible:border-amber-500",
            (error || success) && "pr-10",
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={typeof error === 'string' ? "input-error" : undefined}
          {...props}
        />
        {error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none">
                <AlertCircle size={16} />
            </div>
        )}
        {success && !error && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
                <CheckCircle2 size={16} />
            </div>
        )}
        {typeof error === 'string' && (
            <p id="input-error" className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
