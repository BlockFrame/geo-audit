"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GenerativeArtScene } from "@/components/ui/anomalous-matter-hero";
import { cn } from "@/lib/utils";

interface LiquidMetalHeroProps {
  badge?: string;
  title: string;
  subtitle: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  onPrimaryCtaClick?: () => void;
  onSecondaryCtaClick?: () => void;
  className?: string;
}

export default function LiquidMetalHero({
  badge,
  title,
  subtitle,
  primaryCtaLabel,
  secondaryCtaLabel,
  onPrimaryCtaClick,
  onSecondaryCtaClick,
  className,
}: LiquidMetalHeroProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      className={cn("relative isolate overflow-visible bg-transparent py-4 sm:py-6 lg:py-8", className)}
    >
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <GenerativeArtScene reducedMotion={Boolean(prefersReducedMotion)} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(103,232,249,0.2),transparent_36%),radial-gradient(circle_at_78%_20%,rgba(129,140,248,0.18),transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.3),rgba(2,6,23,0.84))]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto flex max-w-4xl flex-col items-center text-center"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { delayChildren: 0.12, staggerChildren: 0.09 } },
          }}
          transition={{ duration: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {badge && (
            <motion.div className="mb-4 flex justify-center" variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
              <Badge variant="secondary" className="border-cyan-300/20 bg-cyan-300/10 text-cyan-100 backdrop-blur-sm transition-colors duration-300 hover:bg-cyan-300/20">
                <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_16px_rgba(103,232,249,0.9)]" />
                {badge}
              </Badge>
            </motion.div>
          )}

          <motion.div
            className="relative w-full max-w-5xl"
            variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } }}
          >
            <motion.h1 role="heading" aria-level={1} className="pb-1 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-7xl xl:text-8xl">
              {title}
            </motion.h1>

            <motion.p className="mx-auto mt-2 max-w-3xl text-lg leading-relaxed text-slate-200/90 sm:text-xl lg:text-2xl">
              {subtitle}
            </motion.p>
          </motion.div>

          <motion.div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row" variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
            {primaryCtaLabel && onPrimaryCtaClick && (
              <motion.div whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}>
                <Button onClick={onPrimaryCtaClick} size="lg" className="bg-cyan-300 px-8 py-6 text-lg font-semibold text-slate-950 shadow-2xl transition-all duration-300 hover:bg-cyan-200">
                  {primaryCtaLabel}
                </Button>
              </motion.div>
            )}

            {secondaryCtaLabel && onSecondaryCtaClick && (
              <motion.div whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}>
                <Button onClick={onSecondaryCtaClick} variant="outline" size="lg" className="border-white/15 px-8 py-6 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-cyan-200/40 hover:bg-white/10">
                  {secondaryCtaLabel}
                </Button>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="mt-8 flex w-full max-w-2xl items-center justify-center gap-2 text-[11px] uppercase tracking-[0.28em] text-cyan-100/70"
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
            aria-hidden="true"
          >
            <span className="h-px w-10 bg-cyan-300/35" />
            <motion.span
              className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.9)]"
              animate={prefersReducedMotion ? undefined : { scale: [1, 1.42, 1], opacity: [0.72, 1, 0.72] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <span>Live visual analysis</span>
            <span className="h-px w-10 bg-cyan-300/35" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
