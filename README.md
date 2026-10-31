# Novabuild — NOVA landing page

A premium, art-directed SaaS landing page for **NOVA**, a fictional AI research workspace.
Built with Next.js (App Router), React 18, TypeScript, Tailwind CSS, Motion and Lucide icons.

## Stack

- **Framework**: Next.js 14 (App Router, static prerender)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS 3 + centralized design tokens in `tailwind.config.ts`
- **Animation**: `motion` (Motion for React, `motion/react`) — springs, layout animations, scroll-triggered reveals, `MotionConfig reducedMotion="user"`
- **Icons**: lucide-react

## Quick start

```bash
npm ci
npm run dev       # http://localhost:3000
npm run build     # production build
npm run typecheck # tsc --noEmit
npm start         # serve production build
```

## Component architecture

```
app/
  layout.tsx          # fonts (Sora + Instrument Serif), MotionConfig root, noise overlay
  page.tsx            # section composition
  globals.css         # tokens, utilities (glass, panel, btn-primary, grid, marquee), reduced-motion guard
components/
  MotionRoot.tsx      # <MotionConfig reducedMotion="user"> — respects OS setting
  Navbar.tsx          # sticky nav, scroll bg transition, mobile menu (AnimatePresence)
  Hero.tsx            # hero copy + dashboard composition
  hero/DashboardMockup.tsx  # central dashboard, floating cards, connection lines
  TrustBar.tsx        # marquee of fictional placeholder organizations
  FeaturesBento.tsx   # 6 distinct feature cards, each with a bespoke visual
  Showcase.tsx        # interactive product tour with animated tabs (layoutId pill)
  HowItWorks.tsx      # 3 connected steps
  UseCases.tsx        # 4 use-case cards
  Metrics.tsx         # animated counters (spring-driven, illustrative figures)
  Pricing.tsx         # monthly/yearly toggle, animated price swap, recommend plan
  Testimonials.tsx    # fictional demo testimonials
  FAQ.tsx             # accessible accordion (aria-expanded, region, height animation)
  FinalCTA.tsx
  Footer.tsx
  ui/Button.tsx       # motion-enhanced button (primary / ghost / link)
  ui/Reveal.tsx       # scroll-triggered reveal wrapper
  ui/SectionHeading.tsx
lib/
  motion.ts           # shared variants (staggerContainer, fadeUpItem, revealUp, viewportOnce)
  utils.ts            # cn() helper
scripts/
  qa_screenshots.py   # Playwright QA: interactions + screenshots at 1440 / 390 / 360
```

## Animation implementation

All motion is centralized in `lib/motion.ts` with a signature ease `[0.22, 1, 0.36, 1]` and a
soft rise + fade + blur choreography:

- **Hero entrance** — staggered heading/CTAs via `staggerContainer`/`fadeUpItem`; dashboard scales/fades in with a delayed ease.
- **Floating dashboard elements** — infinite gentle `y: [0, -9, 0]` loops on floating cards (transform-only, GPU-friendly).
- **Scroll-triggered reveals** — `whileInView` with `viewport={{ once: true, margin: "-80px" }}` on sections, cards, headings.
- **Layout transitions** — `layoutId` shared pills for the showcase tab switcher and pricing billing toggle (spring `stiffness: 420, damping: 32`).
- **Animated buttons** — `whileHover={{ y: -2 }}`, `whileTap={{ scale: 0.97 }}` + CSS shimmer on primary.
- **Pricing toggle** — prices swap with `AnimatePresence mode="popLayout"` (vertical slide).
- **FAQ accordion** — animates `height: 0 → auto` with opacity; `aria-expanded`/`aria-controls`/`role="region"` wired up.
- **Counters** — `useSpring` on a `useMotionValue` driven by `useInView`.
- **Reduced motion** — `MotionConfig reducedMotion="user"` plus a CSS guard in `globals.css` that collapses durations to ~0 for `prefers-reduced-motion`.

## Design tokens

- Background `#05060F` (deep navy), surface `#0A0D1C`
- Violet `#7568FF` / bright `#8E7CFF` / soft lavender `#C9C2FF`
- Electric blue `#41A6FF` / bright `#63BCFF`
- Ink text `#ECEFF7`, muted `#8E97B5`

All testimonials, trust logos and metrics are explicitly fictional/illustrative (labeled in the UI).
