"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

type GeoParticleGlobeProps = {
    free?: boolean;
    className?: string;
};

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

export default function GeoParticleGlobe({ free = false, className = "" }: GeoParticleGlobeProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) {
            return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            return;
        }

        let rafId = 0;
        let width = 0;
        let height = 0;
        let dpr = 1;

        const pointerTarget = { x: 0, y: 0 };
        const pointerCurrent = { x: 0, y: 0 };

        let phase = 0;

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

        const onPointerMove = (event: PointerEvent) => {
            const rect = container.getBoundingClientRect();
            const nx = (event.clientX - rect.left) / rect.width;
            const ny = (event.clientY - rect.top) / rect.height;
            pointerTarget.x = clamp(nx * 2 - 1, -1, 1);
            pointerTarget.y = clamp(ny * 2 - 1, -1, 1);
        };

        const onPointerLeave = () => {
            pointerTarget.x = 0;
            pointerTarget.y = 0;
        };

        const draw = () => {
            pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.1;
            pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.1;

            if (!prefersReducedMotion) {
                phase += 0.024;
            }

            ctx.clearRect(0, 0, width, height);

            const midX = width * 0.5;
            const midY = height * 0.5;

            const gradient = ctx.createRadialGradient(midX, midY, height * 0.12, midX, midY, height * 0.72);
            gradient.addColorStop(0, "rgba(103, 232, 249, 0.14)");
            gradient.addColorStop(0.5, "rgba(45, 212, 191, 0.08)");
            gradient.addColorStop(1, "rgba(2, 6, 23, 0)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            const segments = 94;
            const helixRadius = Math.min(height * 0.22, width * 0.06);
            const leftPad = width * 0.08;
            const rightPad = width * 0.08;
            const axisSpan = Math.max(40, width - leftPad - rightPad);

            const mouseX = ((pointerCurrent.x + 1) * 0.5) * width;
            const mouseY = ((pointerCurrent.y + 1) * 0.5) * height;

            for (let i = 0; i <= segments; i += 1) {
                const t = i / segments;
                const x = leftPad + t * axisSpan;

                const a = t * Math.PI * 8 + phase;
                const zWave = Math.cos(a);

                const baseY = midY + Math.sin(a) * helixRadius;
                const antiY = midY - Math.sin(a) * helixRadius;

                const deformDist = Math.hypot(x - mouseX, baseY - mouseY);
                const deformStrength = prefersReducedMotion ? 0 : Math.exp(-(deformDist * deformDist) / (Math.max(width, height) * 120));

                const lift = (mouseY - midY) * 0.12 * deformStrength;
                const push = (x - mouseX) * 0.08 * deformStrength;

                const y1 = baseY + lift + push * 0.15;
                const y2 = antiY - lift - push * 0.15;

                const zFactor1 = clamp((zWave + 1) * 0.5, 0, 1);
                const zFactor2 = clamp((1 - zWave) * 0.5, 0, 1);

                if (i % 2 === 0) {
                    ctx.strokeStyle = `rgba(129, 140, 248, ${0.16 + zFactor1 * 0.2})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, y1);
                    ctx.lineTo(x, y2);
                    ctx.stroke();
                }

                const r1 = 1.9 + zFactor1 * 2.6;
                const r2 = 1.9 + zFactor2 * 2.6;

                ctx.fillStyle = `rgba(103, 232, 249, ${0.35 + zFactor1 * 0.5})`;
                ctx.beginPath();
                ctx.arc(x, y1, r1, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `rgba(45, 212, 191, ${0.32 + zFactor2 * 0.52})`;
                ctx.beginPath();
                ctx.arc(x, y2, r2, 0, Math.PI * 2);
                ctx.fill();

                if (i % 7 === 0) {
                    ctx.fillStyle = `rgba(129, 140, 248, ${0.18 + Math.max(zFactor1, zFactor2) * 0.32})`;
                    ctx.fillRect(x + (zWave * 8), midY + Math.sin(a * 0.5) * helixRadius * 0.18, 1.2, 1.2);
                }
            }

            if (!prefersReducedMotion) {
                const sweepX = leftPad + ((phase * 26) % (axisSpan + leftPad));
                const sweepGradient = ctx.createLinearGradient(sweepX - 80, 0, sweepX + 80, 0);
                sweepGradient.addColorStop(0, "rgba(103, 232, 249, 0)");
                sweepGradient.addColorStop(0.5, "rgba(103, 232, 249, 0.12)");
                sweepGradient.addColorStop(1, "rgba(103, 232, 249, 0)");
                ctx.fillStyle = sweepGradient;
                ctx.fillRect(0, 0, width, height);
            }

            rafId = window.requestAnimationFrame(draw);
        };

        resize();
        draw();

        const resizeObserver = new ResizeObserver(() => resize());
        resizeObserver.observe(container);

        container.addEventListener("pointermove", onPointerMove);
        container.addEventListener("pointerleave", onPointerLeave);

        return () => {
            window.cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            container.removeEventListener("pointermove", onPointerMove);
            container.removeEventListener("pointerleave", onPointerLeave);
        };
    }, [prefersReducedMotion]);

    return (
        <motion.div
            ref={containerRef}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={[
                "relative mx-auto h-[17rem] w-full max-w-[40rem] overflow-hidden sm:h-[20rem]",
                free ? "mb-0 rounded-none border-0 bg-transparent" : "mb-8 rounded-[1.6rem] border border-cyan-300/20 bg-slate-950/35",
                className,
            ].join(" ")}
            aria-hidden="true"
        >
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            {!free && (
                <div className="pointer-events-none absolute inset-x-0 top-3 text-center">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-200/80">DNA FIELD</p>
                </div>
            )}
        </motion.div>
    );
}
