"use client";

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
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 shrink-0 cursor-help items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-cyan-100/90 shadow-[0_0_18px_rgba(34,211,238,0.12)] backdrop-blur-sm transition hover:border-cyan-200/45 hover:bg-cyan-300/16",
        className,
      )}
      title={description}
      aria-label={label}
      tabIndex={0}
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
    </span>
  );
}
