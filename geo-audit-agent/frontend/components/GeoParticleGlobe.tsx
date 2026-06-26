"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

type GeoParticleGlobeProps = {
    free?: boolean;
    className?: string;
};

function clamp(v: number, lo: number, hi: number) {
    return v < lo ? lo : v > hi ? hi : v;
}

// Seeded PRNG — deterministic so SSR & client match
function mulberry32(seed: number) {
    return function () {
        seed |= 0; seed = seed + 0x6d2b79f5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

export default function GeoParticleGlobe({ free = false, className = "" }: GeoParticleGlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let rafId = 0;
        let width = 0;
        let height = 0;
        let dpr = 1;
        let phase = 0;
        let glitchTimer = 0;
        let glitchActive = false;
        let glitchIntensity = 0;

        const rng = mulberry32(0xdeadbeef);

        const pointer = { tx: 0, ty: 0, cx: 0, cy: 0 };

        const resize = () => {
            const rect = container.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
            dpr = window.devicePixelRatio || 1;
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${Math.floor(width)}px`;
            canvas.style.height = `${Math.floor(height)}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const onPointerMove = (e: PointerEvent) => {
            const rect = container.getBoundingClientRect();
            pointer.tx = clamp((e.clientX - rect.left) / rect.width, 0, 1);
            pointer.ty = clamp((e.clientY - rect.top) / rect.height, 0, 1);
        };
        const onPointerLeave = () => { pointer.tx = 0.5; pointer.ty = 0.5; };
        pointer.tx = 0.5; pointer.ty = 0.5;

        // ── Palette (matches site: cyan / teal / indigo / magenta accent) ──
        const C_CYAN = { r: 103, g: 232, b: 249 }; // #67e8f9
        const C_TEAL = { r: 45, g: 212, b: 191 }; // #2dd4bf
        const C_INDIGO = { r: 129, g: 140, b: 248 }; // #818cf8
        const C_PINK = { r: 240, g: 171, b: 252 }; // cyberpunk accent
        const C_GREEN = { r: 74, g: 222, b: 128 }; // neon green

        const STRAND_COLORS = [C_CYAN, C_TEAL, C_INDIGO, C_PINK, C_GREEN];

        const SEGMENTS = 160;
        const STRANDS = 2;

        const drawStrand = (
            phaseOffset: number,
            colorA: typeof C_CYAN,
            colorB: typeof C_CYAN,
            amp: number,
            freq: number,
            glitch: number,
        ) => {
            const midY = height * 0.5;
            const margin = width * 0.02;
            const span = width - margin * 2;

            // Mouse ripple: attract/push particles near cursor
            const mx = pointer.cx * width;
            const my = pointer.cy * height;

            for (let i = 0; i <= SEGMENTS; i++) {
                const t = i / SEGMENTS;
                const x = margin + t * span;
                const a = t * Math.PI * freq + phase + phaseOffset;

                // glitch horizontal slice displacement
                const glitchY = glitch > 0 && rng() < 0.08
                    ? (rng() - 0.5) * 28 * glitch
                    : 0;

                const rawY = midY + Math.sin(a) * amp + glitchY;

                // mouse ripple deformation
                const dist = Math.hypot(x - mx, rawY - my);
                const ripple = Math.exp(-(dist * dist) / (width * height * 0.035));
                const pushX = (x - mx) * 0.18 * ripple;
                const pushY = (rawY - my) * 0.24 * ripple;
                const finalX = x + (prefersReducedMotion ? 0 : pushX);
                const finalY = rawY + (prefersReducedMotion ? 0 : pushY);

                // depth: sin gives Z-like perspective
                const z = (Math.sin(a) + 1) * 0.5;
                const alpha = 0.28 + z * 0.68;

                // interpolate color along t for gradient feel
                const cr = Math.round(colorA.r + (colorB.r - colorA.r) * t);
                const cg = Math.round(colorA.g + (colorB.g - colorA.g) * t);
                const cb = Math.round(colorA.b + (colorB.b - colorA.b) * t);

                const r = 1.4 + z * 3.2;

                if (glitch > 0.4) {
                    // RGB aberration: draw three offset blobs
                    ctx.globalAlpha = alpha * 0.45;
                    ctx.fillStyle = `rgb(${cr + 30},0,0)`;
                    ctx.beginPath(); ctx.arc(finalX - 3 * glitch, finalY, r, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = `rgb(0,${cg},0)`;
                    ctx.beginPath(); ctx.arc(finalX, finalY, r, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = `rgb(0,0,${cb + 30})`;
                    ctx.beginPath(); ctx.arc(finalX + 3 * glitch, finalY, r, 0, Math.PI * 2); ctx.fill();
                    ctx.globalAlpha = 1;
                }

                ctx.globalAlpha = alpha;
                ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
                ctx.beginPath(); ctx.arc(finalX, finalY, r, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;

                // glow halo
                if (z > 0.75) {
                    ctx.globalAlpha = (z - 0.75) * 0.5;
                    const glow = ctx.createRadialGradient(finalX, finalY, 0, finalX, finalY, r * 5);
                    glow.addColorStop(0, `rgba(${cr},${cg},${cb},0.6)`);
                    glow.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
                    ctx.fillStyle = glow;
                    ctx.beginPath(); ctx.arc(finalX, finalY, r * 5, 0, Math.PI * 2); ctx.fill();
                    ctx.globalAlpha = 1;
                }
            }

            // draw rungs (base pairs)
            const rungEvery = 8;
            for (let i = 0; i <= SEGMENTS; i += rungEvery) {
                const t = i / SEGMENTS;
                const x = margin + t * span;
                const a = t * Math.PI * freq + phase + phaseOffset;
                const y1 = height * 0.5 + Math.sin(a) * amp;
                const y2 = height * 0.5 - Math.sin(a) * amp;
                const z = (Math.sin(a) + 1) * 0.5;

                const gx = prefersReducedMotion ? 0 : (x - pointer.cx * width) * 0.1 * Math.exp(-(Math.hypot(x - pointer.cx * width, 0) ** 2) / (width * width * 0.06));

                ctx.globalAlpha = 0.15 + z * 0.22;
                ctx.strokeStyle = `rgba(${C_INDIGO.r},${C_INDIGO.g},${C_INDIGO.b},1)`;
                ctx.lineWidth = 0.8 + z * 0.6;
                ctx.beginPath();
                ctx.moveTo(x + gx, y1);
                ctx.lineTo(x + gx, y2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        };

        const drawScanlines = () => {
            const lineH = 4;
            for (let y = 0; y < height; y += lineH) {
                ctx.fillStyle = "rgba(0,0,0,0.06)";
                ctx.fillRect(0, y, width, 1);
            }
        };

        const drawHorizonGlow = () => {
            const mid = height * 0.5;
            const glow = ctx.createLinearGradient(0, mid - height * 0.36, 0, mid + height * 0.36);
            glow.addColorStop(0, "rgba(2,6,23,0)");
            glow.addColorStop(0.4, "rgba(103,232,249,0.06)");
            glow.addColorStop(0.5, "rgba(103,232,249,0.12)");
            glow.addColorStop(0.6, "rgba(103,232,249,0.06)");
            glow.addColorStop(1, "rgba(2,6,23,0)");
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, width, height);
        };

        const drawGlitchSlices = (intensity: number) => {
            if (intensity <= 0) return;
            const slices = Math.floor(intensity * 6);
            for (let s = 0; s < slices; s++) {
                const sliceY = rng() * height;
                const sliceH = rng() * 12 + 2;
                const shift = (rng() - 0.5) * 40 * intensity;
                if (sliceY + sliceH < height && sliceY > 0) {
                    try {
                        const imgData = ctx.getImageData(0, sliceY, width, sliceH);
                        ctx.putImageData(imgData, shift, sliceY);
                    } catch { /* cross-origin guard */ }
                }
            }
        };

        const draw = () => {
            pointer.cx += (pointer.tx - pointer.cx) * 0.09;
            pointer.cy += (pointer.ty - pointer.cy) * 0.09;

            if (!prefersReducedMotion) {
                phase += 0.018;
                glitchTimer += 1;
                // trigger glitch burst every ~180 frames, lasts ~20 frames
                if (!glitchActive && glitchTimer > 140 + Math.floor(rng() * 80)) {
                    glitchActive = true;
                    glitchIntensity = 0;
                    glitchTimer = 0;
                }
                if (glitchActive) {
                    glitchIntensity = Math.min(1, glitchIntensity + 0.12);
                    if (glitchIntensity >= 1) glitchActive = false;
                } else {
                    glitchIntensity = Math.max(0, glitchIntensity - 0.06);
                }
            }

            ctx.clearRect(0, 0, width, height);
            drawHorizonGlow();

            const amp = Math.min(height * 0.28, width * 0.09);
            const freq = 5.5;

            // two strands π out of phase, different colour gradients
            drawStrand(0, STRAND_COLORS[0], STRAND_COLORS[2], amp, freq, glitchIntensity);
            drawStrand(Math.PI, STRAND_COLORS[1], STRAND_COLORS[4], amp, freq, glitchIntensity);

            drawGlitchSlices(glitchIntensity * 0.7);
            drawScanlines();

            // sweep light
            if (!prefersReducedMotion) {
                const sweepX = (phase * 38) % (width + 120) - 60;
                const sg = ctx.createLinearGradient(sweepX - 60, 0, sweepX + 60, 0);
                sg.addColorStop(0, "rgba(103,232,249,0)");
                sg.addColorStop(0.5, "rgba(103,232,249,0.09)");
                sg.addColorStop(1, "rgba(103,232,249,0)");
                ctx.fillStyle = sg;
                ctx.fillRect(0, 0, width, height);
            }

            rafId = window.requestAnimationFrame(draw);
        };

        resize();
        draw();

        const ro = new ResizeObserver(() => resize());
        ro.observe(container);
        container.addEventListener("pointermove", onPointerMove);
        container.addEventListener("pointerleave", onPointerLeave);

        return () => {
            window.cancelAnimationFrame(rafId);
            ro.disconnect();
            container.removeEventListener("pointermove", onPointerMove);
            container.removeEventListener("pointerleave", onPointerLeave);
        };
    }, [prefersReducedMotion]);

    return (
        <motion.div
            ref={containerRef}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
            className={[
                "relative mx-auto overflow-hidden",
                free ? "mb-0 rounded-none border-0 bg-transparent" : "mb-8 rounded-[1.6rem] border border-cyan-300/20 bg-slate-950/35",
                className,
            ].join(" ")}
            aria-hidden="true"
        >
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        </motion.div>
    );
}
