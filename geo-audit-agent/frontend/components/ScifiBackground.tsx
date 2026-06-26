"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

export default function ScifiBackground() {
    const mountRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        let rafId = 0;
        let cancelled = false;
        let cleanup: (() => void) | null = null;

        void (async () => {
            const T = await import("three");
            if (cancelled) return;

            // ── Renderer ──────────────────────────────────────────────────
            const renderer = new T.WebGLRenderer({ antialias: false, alpha: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x000000, 0);
            const canvas = renderer.domElement;
            canvas.style.cssText =
                "position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;";
            mount.appendChild(canvas);

            // ── Scene & Camera ────────────────────────────────────────────
            const scene = new T.Scene();
            const camera = new T.PerspectiveCamera(
                72,
                window.innerWidth / window.innerHeight,
                1,
                3000,
            );
            camera.position.z = 560;

            // ── Galaxy-distributed particles ──────────────────────────────
            const N = 4800;
            const pos = new Float32Array(N * 3);
            const col = new Float32Array(N * 3);
            const sz = new Float32Array(N);

            // Site palette: cyan / teal / indigo / sky / violet / pink
            const PAL: [number, number, number][] = [
                [103, 232, 249],
                [45, 212, 191],
                [129, 140, 248],
                [56, 189, 248],
                [167, 139, 250],
                [240, 171, 252],
                [52, 211, 153],
            ];

            for (let i = 0; i < N; i++) {
                const arm = i % 3;
                const r = 80 + Math.random() ** 0.55 * 780;
                const base = (arm / 3) * Math.PI * 2;
                const spiral = base + (r / 780) * Math.PI * 4 + (Math.random() - 0.5) * 0.7;
                pos[i * 3] = Math.cos(spiral) * r + (Math.random() - 0.5) * 90;
                pos[i * 3 + 1] = (Math.random() - 0.5) * 320;
                pos[i * 3 + 2] = Math.sin(spiral) * r + (Math.random() - 0.5) * 90 - 80;
                const [r2, g, b] = PAL[Math.floor(Math.random() * PAL.length)];
                col[i * 3] = r2 / 255;
                col[i * 3 + 1] = g / 255;
                col[i * 3 + 2] = b / 255;
                sz[i] = 0.4 + Math.random() ** 1.4 * 4.2;
            }

            const geo = new T.BufferGeometry();
            geo.setAttribute("position", new T.BufferAttribute(pos, 3));
            geo.setAttribute("color", new T.BufferAttribute(col, 3));
            geo.setAttribute("aSize", new T.BufferAttribute(sz, 1));

            const mat = new T.ShaderMaterial({
                uniforms: { uTime: { value: 0 } },
                vertexShader: `
          attribute float aSize;
          varying vec3  vColor;
          varying float vDepth;
          void main() {
            vColor = color;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vDepth  = clamp((-mv.z - 80.0) / 700.0, 0.0, 1.0);
            gl_PointSize = aSize * (290.0 / -mv.z);
            gl_Position  = projectionMatrix * mv;
          }
        `,
                fragmentShader: `
          varying vec3  vColor;
          varying float vDepth;
          void main() {
            float d   = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            float core = smoothstep(0.5,  0.0, d);
            float glow = smoothstep(0.5, 0.12, d) * 0.55;
            float a    = (core + glow) * (0.2 + vDepth * 0.72);
            gl_FragColor = vec4(vColor, a);
          }
        `,
                vertexColors: true,
                transparent: true,
                depthWrite: false,
                blending: T.AdditiveBlending,
            });

            const points = new T.Points(geo, mat);
            scene.add(points);

            // ── Holographic grid floor ────────────────────────────────────
            const GRID_SPAN = 1400;
            const GRID_STEP = 90;
            const gridMat = new T.LineBasicMaterial({
                color: 0x2dd4bf,
                transparent: true,
                opacity: 0.055,
                blending: T.AdditiveBlending,
            });
            for (let x = -GRID_SPAN; x <= GRID_SPAN; x += GRID_STEP) {
                const g = new T.BufferGeometry().setFromPoints([
                    new T.Vector3(x, -200, -GRID_SPAN),
                    new T.Vector3(x, -200, GRID_SPAN),
                ]);
                scene.add(new T.Line(g, gridMat));
            }
            for (let z = -GRID_SPAN; z <= GRID_SPAN; z += GRID_STEP) {
                const g = new T.BufferGeometry().setFromPoints([
                    new T.Vector3(-GRID_SPAN, -200, z),
                    new T.Vector3(GRID_SPAN, -200, z),
                ]);
                scene.add(new T.Line(g, gridMat));
            }

            // ── Nebula orbs ───────────────────────────────────────────────
            (
                [
                    [0x67e8f9, -320, 60, -480, 85],
                    [0x818cf8, 280, -40, -620, 70],
                    [0x2dd4bf, 40, 90, -340, 60],
                    [0xa78bfa, -80, -60, -500, 50],
                ] as [number, number, number, number, number][]
            ).forEach(([color, ox, oy, oz, radius]) => {
                const sg = new T.SphereGeometry(radius, 6, 6);
                const sm = new T.MeshBasicMaterial({
                    color,
                    transparent: true,
                    opacity: 0.04,
                    blending: T.AdditiveBlending,
                    depthWrite: false,
                });
                const mesh = new T.Mesh(sg, sm);
                mesh.position.set(ox, oy, oz);
                scene.add(mesh);
            });

            // ── Mouse parallax ────────────────────────────────────────────
            const mouse = { tx: 0, ty: 0, cx: 0, cy: 0 };
            const onMouseMove = (e: MouseEvent) => {
                mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
                mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
            };
            window.addEventListener("mousemove", onMouseMove);

            // ── Resize ────────────────────────────────────────────────────
            const onResize = () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener("resize", onResize);

            // ── Animation loop ────────────────────────────────────────────
            let t = 0;
            const animate = () => {
                rafId = requestAnimationFrame(animate);
                if (!prefersReducedMotion) {
                    t += 0.00028;
                    mouse.cx += (mouse.tx - mouse.cx) * 0.045;
                    mouse.cy += (mouse.ty - mouse.cy) * 0.045;
                    points.rotation.y = t * 0.55 + mouse.cx * 0.09;
                    points.rotation.x = t * 0.07 + mouse.cy * 0.045;
                    camera.position.x += (mouse.cx * 22 - camera.position.x) * 0.035;
                    camera.position.y += (-mouse.cy * 16 - camera.position.y) * 0.035;
                    camera.lookAt(scene.position);
                    mat.uniforms.uTime.value = t;
                }
                renderer.render(scene, camera);
            };
            animate();

            cleanup = () => {
                cancelAnimationFrame(rafId);
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("resize", onResize);
                geo.dispose();
                mat.dispose();
                renderer.dispose();
                if (mount.contains(canvas)) mount.removeChild(canvas);
            };
        })();

        return () => {
            cancelled = true;
            cleanup?.();
        };
    }, [prefersReducedMotion]);

    return (
        <div
            ref={mountRef}
            className="pointer-events-none"
            aria-hidden="true"
        />
    );
}
