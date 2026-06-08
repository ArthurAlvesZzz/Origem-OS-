import * as React from "react"
import { cn } from "../../lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onChange, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

    React.useEffect(() => {
      const ta = internalRef.current;
      if (ta) {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
      }
    }, [props.value]);

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-zinc-800/80 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 hover:border-zinc-700 focus:border-amber-500/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors custom-scrollbar resize-none",
          className
        )}
        ref={(e) => {
            internalRef.current = e;
            if (typeof ref === 'function') ref(e);
            else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = e;
        }}
        onChange={(e) => {
            const ta = e.target;
            ta.style.height = 'auto';
            ta.style.height = ta.scrollHeight + 'px';
            onChange?.(e);
        }}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
