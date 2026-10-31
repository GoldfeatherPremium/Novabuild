import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className, id, children, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-muted">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              "h-11 w-full appearance-none rounded-xl border border-white/[0.10] bg-white/[0.03] px-3.5 pr-10 text-[14.5px] text-ink outline-none transition-all duration-200",
              "focus:border-violet/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-violet/20",
              className,
            )}
            {...rest}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

export default Select;
