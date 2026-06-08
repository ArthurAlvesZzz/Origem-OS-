import * as React from "react"
import { cn } from "../../lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: React.ReactNode;
  error?: boolean;
  success?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, icon, error, success, children, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 flex items-center justify-center">
            {icon}
          </div>
        )}
        <select
          className={cn(
            "flex h-10 w-full appearance-none rounded-xl border border-zinc-800/80 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 hover:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            icon && "pl-10",
            error && "border-red-500/50 hover:border-red-500/80 focus:border-red-500/50 focus:ring-red-500/50 text-red-100",
            success && "border-emerald-500/50 hover:border-emerald-500/80 focus:border-emerald-500/50 focus:ring-emerald-500/50 text-emerald-100",
            className
          )}
          ref={ref}
          aria-invalid={error ? "true" : undefined}
          {...props}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
