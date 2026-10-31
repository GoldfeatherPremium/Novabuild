"use client";

import { MotionConfig } from "motion/react";

export default function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative z-10">{children}</div>
    </MotionConfig>
  );
}
