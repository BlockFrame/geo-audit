"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type ExplainabilityHintProps = {
  description: string;
  label: string;
  className?: string;
};

export default function ExplainabilityHint({
  description,
  label,
  className,
}: ExplainabilityHintProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const tooltipId = useId();
  const rootRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !rootRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!rootRef.current) {
        return;
      }

      const rect = rootRef.current.getBoundingClientRect();
      const targetTop = rect.bottom + 8;
      const targetLeft = rect.left + rect.width / 2;

      setTooltipStyle({ top: targetTop, left: targetLeft });
    };

    updatePosition();

    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutside = (event: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <span
      ref={rootRef}
      className={cn("relative inline-flex shrink-0", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-cyan-100/90 shadow-[0_0_18px_rgba(34,211,238,0.12)] backdrop-blur-sm transition hover:border-cyan-200/45 hover:bg-cyan-300/16"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.25" opacity="0.95" />
          <circle cx="8" cy="4.75" r="0.9" fill="currentColor" />
          <path d="M8 7v4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      </button>
      {mounted && createPortal(
        <span
          id={tooltipId}
          role="tooltip"
          className={cn(
            "pointer-events-none fixed z-[200] w-64 -translate-x-1/2 rounded-lg border border-cyan-300/25 bg-slate-950/95 px-2.5 py-2 text-[11px] leading-relaxed text-slate-200 shadow-2xl transition",
            open ? "opacity-100" : "opacity-0",
          )}
          style={{ top: tooltipStyle.top, left: tooltipStyle.left }}
        >
          {description}
        </span>,
        document.body,
      )}
    </span>
  );
}
