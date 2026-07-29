"use client";

import { motion, useReducedMotion } from "motion/react";
import { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

// Simple fade + slide-up on scroll into view.
export function Reveal({ children, delay = 0, y = 24, className }: RevealProps) {
  // Reveal wraps nearly every card on every page, so it was the single largest
  // source of unwanted motion for visitors who ask the OS to reduce it — a
  // WCAG 2.3.3 concern, and a nausea trigger for people with vestibular
  // disorders. When reduced motion is requested, render the content in its
  // final state with no transform and no transition.
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
