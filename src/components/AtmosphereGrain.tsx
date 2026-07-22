import { useEffect, useRef } from 'react';

/**
 * Fixed, subtly animated film grain via three.js fullscreen shader.
 * Dynamic import keeps First Paint light; respects prefers-reduced-motion
 * (static grain frame, no continuous RAF).
 */
export function AtmosphereGrain() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const THREE = await import('three');
      if (disposed || !mountRef.current) return;
      const el = mountRef.current;

      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: 'low-power',
      });
      // dpr 1 → etwas gröberes Grain, besser sichtbar und sparsamer
      renderer.setPixelRatio(1);
      renderer.setClearColor(0x000000, 0);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      el.appendChild(renderer.domElement);

      const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uIntensity: { value: 0.55 },
      };

      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 0.0, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform float uTime;
          uniform vec2 uResolution;
          uniform float uIntensity;
          varying vec2 vUv;

          float hash(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }

          void main() {
            vec2 uv = vUv * uResolution;
            // Sanft driftende Seed-Verschiebung → lebendiges Filmgrain
            float t = floor(uTime * 12.0);
            float n = hash(uv + t);
            float n2 = hash(uv * 1.7 - t * 0.37);
            float grain = mix(n, n2, 0.35);
            // Leicht in Richtung Mittelgrau, wirkt natürlicher
            grain = mix(0.5, grain, uIntensity);
            float alpha = 0.22 + grain * 0.18;
            gl_FragColor = vec4(vec3(grain), alpha);
          }
        `,
      });

      const geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const resize = () => {
        const w = Math.max(1, window.innerWidth);
        const h = Math.max(1, window.innerHeight);
        renderer.setSize(w, h, false);
        uniforms.uResolution.value.set(w, h);
      };
      resize();

      const isDark = () =>
        document.documentElement.classList.contains('dark');
      const syncTheme = () => {
        uniforms.uIntensity.value = isDark() ? 0.7 : 0.5;
        el.style.opacity = isDark() ? '0.28' : '0.2';
      };
      syncTheme();

      const themeObs = new MutationObserver(syncTheme);
      themeObs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      let raf = 0;
      let running = !document.hidden;
      const clock = new THREE.Clock();

      const renderFrame = (animate: boolean) => {
        if (animate) {
          uniforms.uTime.value += clock.getDelta();
        }
        renderer.render(scene, camera);
      };

      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!running) return;
        renderFrame(true);
      };

      if (reduceMotion) {
        uniforms.uTime.value = 1.7;
        renderFrame(false);
      } else {
        loop();
      }

      const onVisibility = () => {
        running = !document.hidden;
        if (!document.hidden) clock.getDelta();
      };
      document.addEventListener('visibilitychange', onVisibility);
      window.addEventListener('resize', resize);

      cleanup = () => {
        cancelAnimationFrame(raf);
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('resize', resize);
        themeObs.disconnect();
        geometry.dispose();
        material.dispose();
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
      className="pointer-events-none absolute inset-0 mix-blend-soft-light dark:mix-blend-overlay"
    />
  );
}

export default AtmosphereGrain;
