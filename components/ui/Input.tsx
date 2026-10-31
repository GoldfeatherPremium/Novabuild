import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-11 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3.5 text-[14.5px] text-ink placeholder:text-muted/60 outline-none transition-all duration-200",
            "focus:border-violet/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet/20",
            error && "border-red-400/60 focus:border-red-400/70 focus:ring-red-400/15",
            className,
          )}
          {...rest}
        />
        {error && <p className="text-[12.5px] text-red-300/90">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
