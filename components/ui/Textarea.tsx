import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, className, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-muted">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "min-h-[120px] w-full rounded-xl border border-white/[0.10] bg-white/[0.03] px-3.5 py-3 text-[14.5px] leading-relaxed text-ink placeholder:text-muted/60 outline-none transition-all duration-200 resize-y",
            "focus:border-violet/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet/20",
            className,
          )}
          {...rest}
        />
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export default Textarea;
