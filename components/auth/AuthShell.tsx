import Link from "next/link";
import { logoMark } from "@/components/auth/LogoMark";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-violet/15 blur-[140px]" />
      <div aria-hidden className="pointer-events-none absolute right-0 bottom-0 h-[300px] w-[420px] rounded-full bg-electric/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/" aria-label="NOVA home" className="flex items-center gap-2.5">
            {logoMark}
            <span className="text-lg font-bold tracking-[0.08em] text-ink">
              NOVA
              <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-soft/70">
                AI Research
              </span>
            </span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-surface/70 p-8 shadow-card backdrop-blur-2xl">
          <h1 className="font-serif text-[26px] leading-tight text-ink">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>

        {footer && <div className="mt-6 text-center text-[13.5px] text-muted">{footer}</div>}
      </div>
    </div>
  );
}
