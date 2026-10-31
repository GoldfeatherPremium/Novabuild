import { cn } from "@/lib/utils";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
};

export default function Checkbox({ label, className, id, checked, ...rest }: CheckboxProps) {
  const inputId = id ?? rest.name;
  return (
    <label htmlFor={inputId} className="flex cursor-pointer items-start gap-3 select-none">
      <span className="relative mt-0.5 flex h-5 w-5 shrink-0">
        <input
          type="checkbox"
          id={inputId}
          checked={checked}
          className={cn(
            "peer h-5 w-5 appearance-none rounded-md border border-white/[0.16] bg-white/[0.03] transition-all duration-200",
            "checked:border-violet checked:bg-violet checked:shadow-[0_0_16px_-2px_rgba(117,104,255,0.6)]",
            "focus:ring-2 focus:ring-violet/25 focus:outline-none",
            className,
          )}
          {...rest}
        />
        <svg
          viewBox="0 0 16 16"
          fill="none"
          className="pointer-events-none absolute left-1 top-1 h-3 w-3 text-white opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
          aria-hidden
        >
          <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {label && <span className="text-[13.5px] leading-relaxed text-muted">{label}</span>}
    </label>
  );
}
