"use client";

import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";

interface GenerativeArtSceneProps {
  reducedMotion?: boolean;
}

export function GenerativeArtScene({ reducedMotion = false }: GenerativeArtSceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const lightRef = useRef<THREE.PointLight | null>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = 3;

    const isReducedMotion = reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const pixelRatioCap = isReducedMotion ? 1 : isMobile ? 1.2 : 1.5;
    const detail = isReducedMotion ? 18 : isMobile ? 28 : 40;

    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true, powerPreference: "low-power" });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
    currentMount.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(1.2, detail);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pointLightPos: { value: new THREE.Vector3(0, 0, 5) },
        color: { value: new THREE.Color("#67e8f9") },
      },
      vertexShader: `
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0) * 2.0 + 1.0;
          vec4 s1 = floor(b1) * 2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
        }

        void main() {
          vNormal = normal;
          vPosition = position;
          float displacement = snoise(position * 2.0 + time * 0.5) * 0.2;
          vec3 newPosition = position + normal * displacement;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform vec3 pointLightPos;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 normal = normalize(vNormal);
          vec3 lightDir = normalize(pointLightPos - vPosition);
          float diffuse = max(dot(normal, lightDir), 0.0);

          float fresnel = 1.0 - dot(normal, vec3(0.0, 0.0, 1.0));
          fresnel = pow(fresnel, 2.0);

          vec3 finalColor = color * diffuse + color * fresnel * 0.5;
          gl_FragColor = vec4(finalColor, 0.9);
        }
      `,
      wireframe: true,
      transparent: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 0, 5);
    lightRef.current = pointLight;
    scene.add(pointLight);

    let frameId = 0;
    let lastRenderTime = 0;
    let isPaused = false;
    let mouseRafId = 0;
    let pendingMouseEvent: MouseEvent | null = null;
    const frameIntervalMs = isReducedMotion ? 1000 / 18 : 1000 / 30;

    const animate = (t: number) => {
      if (!isPaused && t - lastRenderTime >= frameIntervalMs) {
        material.uniforms.time.value = t * 0.0003;
        mesh.rotation.y += isReducedMotion ? 0.0002 : 0.0005;
        mesh.rotation.x += isReducedMotion ? 0.00008 : 0.0002;
        renderer.render(scene, camera);
        lastRenderTime = t;
      }
      frameId = window.requestAnimationFrame(animate);
    };
    animate(0);

    const handleResize = () => {
      if (!mountRef.current) {
        return;
      }
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };

    const applyMouseLight = () => {
      if (!pendingMouseEvent) {
        mouseRafId = 0;
        return;
      }
      const x = (pendingMouseEvent.clientX / window.innerWidth) * 2 - 1;
      const y = -(pendingMouseEvent.clientY / window.innerHeight) * 2 + 1;
      const vec = new THREE.Vector3(x, y, 0.5).unproject(camera);
      const dir = vec.sub(camera.position).normalize();
      const dist = -camera.position.z / dir.z;
      const pos = camera.position.clone().add(dir.multiplyScalar(dist));
      if (lightRef.current) {
        lightRef.current.position.copy(pos);
      }
      material.uniforms.pointLightPos.value.copy(pos);
      mouseRafId = 0;
      pendingMouseEvent = null;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isReducedMotion) {
        return;
      }
      pendingMouseEvent = e;
      if (mouseRafId === 0) {
        mouseRafId = window.requestAnimationFrame(applyMouseLight);
      }
    };

    const handleVisibilityChange = () => {
      isPaused = document.hidden;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.cancelAnimationFrame(frameId);
      if (mouseRafId) {
        window.cancelAnimationFrame(mouseRafId);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      currentMount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [reducedMotion]);

  return <div ref={mountRef} className="absolute inset-0 h-full w-full z-0" aria-hidden="true" />;
}

interface AnomalousMatterHeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
}

export function AnomalousMatterHero({
  title = "Observation Log: Anomaly 7",
  subtitle = "Matter in a state of constant, beautiful flux.",
  description = "A new form of digital existence has been observed. It responds to stimuli, changes form, and exudes an unknown energy. Further study is required.",
}: AnomalousMatterHeroProps) {
  return (
    <section
      role="banner"
      className="relative h-screen w-full overflow-hidden bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
    >
      <Suspense fallback={<div className="h-full w-full bg-[hsl(var(--background))]" />}>
        <GenerativeArtScene />
      </Suspense>

      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[hsl(var(--background))] via-[hsl(var(--background))/70] to-transparent" />

      <div className="relative z-20 flex h-full flex-col items-center justify-end pb-20 text-center md:pb-32">
        <div className="max-w-3xl animate-fade-in-long px-4">
          <h1 className="text-sm font-mono uppercase tracking-widest text-[hsl(var(--sky-300)/80)]">{title}</h1>
          <p className="mt-4 text-3xl font-bold leading-tight md:text-5xl">{subtitle}</p>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[hsl(var(--gray-300)/80)]">{description}</p>
        </div>
      </div>
    </section>
  );
}
