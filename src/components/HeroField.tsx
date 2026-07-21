import { useEffect, useRef } from 'react';

const PARTICLE_COUNT_DESKTOP = 90;
const PARTICLE_COUNT_MOBILE = 48;
const CONNECT_DIST = 2.4;

/**
 * Dezentes, mausreaktives Partikel-Feld für den Hero.
 * Stil: ruhig, teal/gold — ähnlich Antigravity-Atmosphäre, ohne abzulenken.
 * three.js wird erst im Effekt geladen (kein Blockieren des First Paint).
 */
export function HeroField() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import('three');
      if (disposed || !mountRef.current) return;
      const el = mountRef.current;

      const isDarkMode = () =>
        document.documentElement.classList.contains('dark');
      const primaryColor = () =>
        isDarkMode()
          ? new THREE.Color(0x2dd4bf)
          : new THREE.Color(0x0d6e64);
      const goldColor = () => new THREE.Color(0xc8a245);

      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      const count = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        50,
        el.clientWidth / Math.max(1, el.clientHeight),
        0.1,
        100,
      );
      camera.position.z = 8;

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);

      let primary = primaryColor();
      let gold = goldColor();

      const positions = new Float32Array(count * 3);
      const base = new Float32Array(count * 3);
      const phases = new Float32Array(count);
      const colors = new Float32Array(count * 3);
      const isGold = new Uint8Array(count);

      for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 14;
        const y = (Math.random() - 0.5) * 8;
        const z = (Math.random() - 0.5) * 6;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        base[i * 3] = x;
        base[i * 3 + 1] = y;
        base[i * 3 + 2] = z;
        phases[i] = Math.random() * Math.PI * 2;
        isGold[i] = Math.random() > 0.82 ? 1 : 0;
        const c = isGold[i] ? gold : primary;
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const material = new THREE.PointsMaterial({
        size: isMobile ? 0.06 : 0.05,
        vertexColors: true,
        transparent: true,
        opacity: isDarkMode() ? 0.55 : 0.4,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const maxLines = count * 4;
      const linePositions = new Float32Array(maxLines * 6);
      const lineGeometry = new THREE.BufferGeometry();
      lineGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(linePositions, 3),
      );
      const lineMaterial = new THREE.LineBasicMaterial({
        color: primary,
        transparent: true,
        opacity: isDarkMode() ? 0.12 : 0.08,
        depthWrite: false,
      });
      const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
      scene.add(lines);

      const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
      const onPointer = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        mouse.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.ty = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      };
      window.addEventListener('pointermove', onPointer, { passive: true });

      const themeObs = new MutationObserver(() => {
        primary = primaryColor();
        gold = goldColor();
        material.opacity = isDarkMode() ? 0.55 : 0.4;
        lineMaterial.color.copy(primary);
        lineMaterial.opacity = isDarkMode() ? 0.12 : 0.08;
        for (let i = 0; i < count; i++) {
          const use = isGold[i] ? gold : primary;
          colors[i * 3] = use.r;
          colors[i * 3 + 1] = use.g;
          colors[i * 3 + 2] = use.b;
        }
        geometry.attributes.color.needsUpdate = true;
      });
      themeObs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      let visible = true;
      const io = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
        },
        { threshold: 0.05 },
      );
      io.observe(el);

      let raf = 0;
      let t = 0;
      const clock = new THREE.Clock();

      const animate = () => {
        raf = requestAnimationFrame(animate);
        if (!visible) return;

        const dt = Math.min(clock.getDelta(), 0.05);
        t += dt;

        mouse.x += (mouse.tx - mouse.x) * 0.04;
        mouse.y += (mouse.ty - mouse.y) * 0.04;

        camera.position.x += (mouse.x * 0.55 - camera.position.x) * 0.04;
        camera.position.y += (mouse.y * 0.35 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);

        const pos = geometry.attributes.position.array as Float32Array;
        let lineIdx = 0;

        for (let i = 0; i < count; i++) {
          const ix = i * 3;
          const drift =
            Math.sin(t * 0.35 + phases[i]) * 0.12 +
            Math.cos(t * 0.22 + phases[i] * 1.3) * 0.08;
          const attractX = mouse.x * 0.9;
          const attractY = mouse.y * 0.6;

          pos[ix] = base[ix] + drift + attractX * (0.15 + (i % 5) * 0.02);
          pos[ix + 1] =
            base[ix + 1] +
            Math.cos(t * 0.3 + phases[i]) * 0.1 +
            attractY * (0.12 + (i % 7) * 0.015);
          pos[ix + 2] = base[ix + 2] + Math.sin(t * 0.25 + phases[i]) * 0.15;
        }
        geometry.attributes.position.needsUpdate = true;

        for (let i = 0; i < count; i++) {
          for (let j = i + 1; j < count; j++) {
            if (lineIdx >= maxLines) break;
            const dx = pos[i * 3] - pos[j * 3];
            const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
            const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < CONNECT_DIST * CONNECT_DIST) {
              const o = lineIdx * 6;
              linePositions[o] = pos[i * 3];
              linePositions[o + 1] = pos[i * 3 + 1];
              linePositions[o + 2] = pos[i * 3 + 2];
              linePositions[o + 3] = pos[j * 3];
              linePositions[o + 4] = pos[j * 3 + 1];
              linePositions[o + 5] = pos[j * 3 + 2];
              lineIdx++;
            }
          }
          if (lineIdx >= maxLines) break;
        }
        for (let k = lineIdx * 6; k < linePositions.length; k++) linePositions[k] = 0;
        lineGeometry.setDrawRange(0, lineIdx * 2);
        lineGeometry.attributes.position.needsUpdate = true;

        points.rotation.y = t * 0.02;
        lines.rotation.y = t * 0.02;

        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        const w = el.clientWidth;
        const h = Math.max(1, el.clientHeight);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('pointermove', onPointer);
        window.removeEventListener('resize', onResize);
        themeObs.disconnect();
        io.disconnect();
        geometry.dispose();
        material.dispose();
        lineGeometry.dispose();
        lineMaterial.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === el) {
          el.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-0 overflow-hidden"
    />
  );
}

export default HeroField;
