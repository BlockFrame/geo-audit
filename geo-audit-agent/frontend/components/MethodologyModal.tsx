"use client";

import { useEffect } from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    locale?: "en" | "it";
};

const WEIGHTS = [
    { name: "AI Citability & Visibility", weight: "25%" },
    { name: "Brand Authority Signals", weight: "20%" },
    { name: "Content Quality & E-E-A-T", weight: "20%" },
    { name: "Technical Foundations", weight: "15%" },
    { name: "Structured Data", weight: "10%" },
    { name: "Platform Optimization", weight: "10%" },
];

export default function MethodologyModal({ open, onClose }: Props) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto" role="dialog" aria-modal="true" aria-label="GEO score methodology">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

            <div className="relative z-10 my-8 mx-4 w-full max-w-3xl rounded-3xl border border-slate-600/40 bg-slate-900/95 shadow-2xl backdrop-blur-xl">
                <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-700/50 bg-slate-900/90 px-6 py-4 backdrop-blur">
                    <div>
                        <h1 className="text-lg font-semibold text-slate-100">GEO Score Methodology</h1>
                        <p className="text-xs text-slate-400 mt-0.5">How KPIs are computed and weighted</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-slate-600/50 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
                        aria-label="Close"
                    >
                        Close ✕
                    </button>
                </div>

                <div className="px-6 py-6 text-slate-300 space-y-5">
                    <section>
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Overall Formula</h2>
                        <p className="mt-2 text-sm text-slate-400">The GEO score is a weighted average across six dimensions.</p>
                        <pre className="mt-3 rounded-xl border border-slate-600/40 bg-slate-900/60 px-4 py-3 font-mono text-xs text-cyan-200 overflow-x-auto">
                            {`GEO Score =
  AI_Citability * 0.25 +
  Brand_Authority * 0.20 +
  Content_Quality * 0.20 +
  Technical_Foundations * 0.15 +
  Structured_Data * 0.10 +
  Platform_Optimization * 0.10`}
                        </pre>
                    </section>

                    <section>
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Category Weights</h2>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {WEIGHTS.map((item) => (
                                <div key={item.name} className="rounded-xl border border-slate-700/40 bg-slate-800/40 px-3 py-2 text-sm flex items-center justify-between">
                                    <span className="text-slate-200">{item.name}</span>
                                    <span className="text-cyan-300 font-semibold">{item.weight}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-300">Interpretation</h2>
                        <ul className="mt-2 text-sm text-slate-400 space-y-1">
                            <li>80-100: strong readiness for AI answer engines</li>
                            <li>50-79: moderate readiness with improvement opportunities</li>
                            <li>0-49: low readiness and priority remediation required</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}
