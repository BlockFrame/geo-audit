"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

type ImmersiveMotionSceneProps = {
    free?: boolean;
    className?: string;
};

type Particle = {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    phase: number;
    hue: number;
};

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function mulberry32(seed: number) {
    return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export default function ImmersiveMotionScene({ className = "" }: ImmersiveMotionSceneProps) {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const mount = mountRef.current;
        const canvas = canvasRef.current;
        if (!mount || !canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const palette = [
            [103, 232, 249],
            [45, 212, 191],
            [129, 140, 248],
            [167, 139, 250],
            [240, 171, 252],
            [56, 189, 248],
        ] as const;

        const rng = mulberry32(0x4f2d1c7a);
        const particles: Particle[] = Array.from({ length: 320 }, (_, index) => ({
            x: (rng() - 0.5) * 1.6,
            y: (rng() - 0.5) * 1.0,
            z: (rng() - 0.5) * 1.2,
            vx: (rng() - 0.5) * 0.003,
            vy: (rng() - 0.5) * 0.003,
            vz: (rng() - 0.5) * 0.003,
            phase: rng() * Math.PI * 2,
            hue: index % palette.length,
        }));

        const pointer = { tx: 0.5, ty: 0.5, cx: 0.5, cy: 0.5 };
        let width = 0;
        let height = 0;
        let dpr = 1;
        let rafId = 0;
        let time = 0;
        let ripple = 0;

        const resize = () => {
            const rect = mount.getBoundingClientRect();
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
            const rect = mount.getBoundingClientRect();
            pointer.tx = clamp((event.clientX - rect.left) / rect.width, 0, 1);
            pointer.ty = clamp((event.clientY - rect.top) / rect.height, 0, 1);
            ripple = 1;
        };

        const onPointerLeave = () => {
            pointer.tx = 0.5;
            pointer.ty = 0.5;
        };

        const drawBackground = () => {
            const centerX = width * 0.52;
            const centerY = height * 0.44;
            const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height) * 0.85);
            glow.addColorStop(0, "rgba(103, 232, 249, 0.16)");
            glow.addColorStop(0.34, "rgba(45, 212, 191, 0.08)");
            glow.addColorStop(0.7, "rgba(15, 23, 42, 0.1)");
            glow.addColorStop(1, "rgba(2, 6, 23, 0.94)");
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, width, height);

            const horizon = ctx.createLinearGradient(0, height * 0.18, 0, height * 0.92);
            horizon.addColorStop(0, "rgba(103, 232, 249, 0)");
            horizon.addColorStop(0.42, "rgba(103, 232, 249, 0.1)");
            horizon.addColorStop(0.58, "rgba(129, 140, 248, 0.08)");
            horizon.addColorStop(1, "rgba(103, 232, 249, 0)");
            ctx.fillStyle = horizon;
            ctx.fillRect(0, 0, width, height);
        };

        const drawGrid = () => {
            const rows = 9;
            const cols = 14;
            ctx.lineWidth = 1;
            for (let row = 0; row < rows; row += 1) {
                const y = height * (0.18 + (row / rows) * 0.58);
                ctx.beginPath();
                for (let col = 0; col <= cols; col += 1) {
                    const x = (col / cols) * width;
                    const wave = Math.sin(time * 1.15 + row * 0.82 + col * 0.42) * 12;
                    const pointY = y + wave;
                    if (col === 0) {
                        ctx.moveTo(x, pointY);
                    } else {
                        ctx.lineTo(x, pointY);
                    }
                }
                ctx.strokeStyle = row % 2 === 0 ? "rgba(103,232,249,0.11)" : "rgba(129,140,248,0.08)";
                ctx.stroke();
            }
        };

        const drawRings = () => {
            const cx = width * 0.52;
            const cy = height * 0.48;
            const base = Math.min(width, height) * 0.16;
            [0, 1, 2, 3].forEach((index) => {
                ctx.beginPath();
                ctx.ellipse(
                    cx,
                    cy,
                    base + index * 34,
                    base * 0.72 + index * 18,
                    Math.sin(time * 0.35 + index) * 0.22,
                    0,
                    Math.PI * 2,
                );
                ctx.strokeStyle = index % 2 === 0 ? "rgba(103,232,249,0.14)" : "rgba(45,212,191,0.08)";
                ctx.lineWidth = 1.1;
                ctx.stroke();
            });
        };

        const drawParticles = () => {
            const mx = pointer.cx * width;
            const my = pointer.cy * height;
            const cx = width * 0.5;
            const cy = height * 0.5;

            for (const particle of particles) {
                const flow = time * 0.16 + particle.phase;
                const targetX = Math.sin(flow * 1.2 + particle.z * 1.5) * 0.42;
                const targetY = Math.cos(flow * 1.05 + particle.x * 1.35) * 0.26;
                const targetZ = Math.sin(flow * 1.8) * 0.25;
                const attractionX = (mx - cx) / width * 0.22;
                const attractionY = (my - cy) / height * 0.22;

                particle.vx += (targetX + attractionX - particle.x) * 0.0028;
                particle.vy += (targetY + attractionY - particle.y) * 0.0028;
                particle.vz += (targetZ - particle.z) * 0.0017;

                particle.vx *= 0.968;
                particle.vy *= 0.968;
                particle.vz *= 0.974;

                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.z += particle.vz;

                const perspective = 0.8 + ((particle.z + 1) * 0.5) * 0.95;
                const x = cx + particle.x * width * 0.56 * perspective;
                const y = cy + particle.y * height * 0.34 * perspective;
                const distanceToPointer = Math.hypot(x - mx, y - my);
                const hover = Math.exp(-(distanceToPointer * distanceToPointer) / (width * height * 0.022));
                const size = 1.2 + ((particle.z + 1) * 0.5) * 2.8 + hover * 2.6;
                const color = palette[particle.hue];
                const alpha = 0.14 + ((particle.z + 1) * 0.5) * 0.68;

                ctx.globalAlpha = alpha;
                ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();

                const glow = ctx.createRadialGradient(x, y, 0, x, y, size * 6);
                glow.addColorStop(0, `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${0.35 + hover * 0.2})`);
                glow.addColorStop(0.4, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.1)`);
                glow.addColorStop(1, `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0)`);
                ctx.globalAlpha = 1;
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(x, y, size * 6, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const drawConnections = () => {
            const maxDistance = Math.min(width, height) * 0.16;
            const sampleLimit = Math.min(260, particles.length);
            for (let i = 0; i < sampleLimit; i += 1) {
                const a = particles[i];
                const ax = width * 0.5 + a.x * width * 0.56;
                const ay = height * 0.5 + a.y * height * 0.34;
                for (let j = i + 1; j < sampleLimit; j += 11) {
                    const b = particles[j];
                    const bx = width * 0.5 + b.x * width * 0.56;
                    const by = height * 0.5 + b.y * height * 0.34;
                    const distance = Math.hypot(ax - bx, ay - by);
                    if (distance > maxDistance) continue;
                    const strength = 1 - distance / maxDistance;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay);
                    ctx.lineTo(bx, by);
                    ctx.strokeStyle = `rgba(103,232,249,${strength * 0.12})`;
                    ctx.lineWidth = strength * 1.1;
                    ctx.stroke();
                }
            }
        };

        const drawHUD = () => {
            const cx = width * 0.5;
            const cy = height * 0.48;
            const pulse = ripple * 28;
            [0.17, 0.3, 0.43].forEach((factor, index) => {
                ctx.beginPath();
                ctx.arc(cx, cy, Math.min(width, height) * factor + pulse * (index + 1) * 0.16, 0, Math.PI * 2);
                ctx.strokeStyle = index === 0 ? "rgba(103,232,249,0.3)" : index === 1 ? "rgba(45,212,191,0.18)" : "rgba(129,140,248,0.16)";
                ctx.lineWidth = index === 0 ? 2.2 : 1;
                ctx.stroke();
            });
        };

        const drawScanlines = () => {
            for (let y = 0; y < height; y += 4) {
                ctx.fillStyle = y % 8 === 0 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.028)";
                ctx.fillRect(0, y, width, 1);
            }
        };

        const draw = () => {
            pointer.cx += (pointer.tx - pointer.cx) * 0.08;
            pointer.cy += (pointer.ty - pointer.cy) * 0.08;

            if (!prefersReducedMotion) {
                time += 0.009;
                ripple *= 0.92;
            }

            ctx.clearRect(0, 0, width, height);
            drawBackground();
            drawGrid();
            drawRings();
            drawConnections();
            drawParticles();
            drawHUD();
            drawScanlines();

            rafId = window.requestAnimationFrame(draw);
        };

        resize();
        draw();

        const observer = new ResizeObserver(() => resize());
        observer.observe(mount);
        mount.addEventListener("pointermove", onPointerMove);
        mount.addEventListener("pointerleave", onPointerLeave);

        return () => {
            window.cancelAnimationFrame(rafId);
            observer.disconnect();
            mount.removeEventListener("pointermove", onPointerMove);
            mount.removeEventListener("pointerleave", onPointerLeave);
        };
    }, [prefersReducedMotion]);

    return (
        <motion.div
            ref={mountRef}
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.985, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const }}
            className={[
                "relative mx-auto overflow-hidden rounded-none border-0 bg-transparent",
                className,
            ].join(" ")}
            aria-hidden="true"
        >
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        </motion.div>
    );
}
