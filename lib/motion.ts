import type { Variants } from "motion/react";

/**
 * Shared animation vocabulary for the NOVA landing page.
 * All values are tuned to the same choreography: a soft rise + fade
 * with a light blur, using the site's signature ease.
 */

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Parent that staggers its children on mount. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.08,
    },
  },
};

/** Child item used inside staggerContainer. */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: EASE_OUT },
  },
};

/** Scroll-triggered reveal (used directly with whileInView). */
export const revealUp: Variants = {
  hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: EASE_OUT },
  },
};

/** Subtle scale reveal for media / mockups. */
export const revealScale: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 24 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.9, ease: EASE_OUT },
  },
};

/** Standard viewport opts: reveal once, early enough to feel immediate. */
export const viewportOnce = { once: true, margin: "-80px" } as const;
