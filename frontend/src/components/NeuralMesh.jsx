import { useRef, useEffect, useCallback } from 'react';

/**
 * NeuralMesh — A subtle, animated canvas background showing
 * a network of connected dots that drift slowly. Provides an
 * "alive" feeling without being distracting.
 *
 * Props:
 *   accentColor - [r, g, b] array, defaults to teal
 *   className   - additional CSS classes
 */
export default function NeuralMesh({ accentColor = [45, 212, 191], className = '' }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const pointsRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  const POINT_COUNT = 50;
  const CONNECTION_DIST = 160;
  const MOUSE_RADIUS = 120;
  const DOT_RADIUS = 1.2;

  const initPoints = useCallback((w, h) => {
    pointsRef.current = Array.from({ length: POINT_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      baseVx: (Math.random() - 0.5) * 0.25,
      baseVy: (Math.random() - 0.5) * 0.25,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (pointsRef.current.length === 0) initPoints(w, h);
    };

    const handleMouse = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const [r, g, b] = accentColor;
      const points = pointsRef.current;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, w, h);

      // Update positions
      if (!reducedMotion) {
        for (const p of points) {
          // Subtle mouse attraction
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS && dist > 0) {
            const force = (1 - dist / MOUSE_RADIUS) * 0.008;
            p.vx += dx * force;
            p.vy += dy * force;
          }

          // Dampen back to base velocity
          p.vx += (p.baseVx - p.vx) * 0.02;
          p.vy += (p.baseVy - p.vy) * 0.02;

          p.x += p.vx;
          p.y += p.vy;

          // Wrap around edges
          if (p.x < -20) p.x = w + 20;
          if (p.x > w + 20) p.x = -20;
          if (p.y < -20) p.y = h + 20;
          if (p.y > h + 20) p.y = -20;
        }
      }

      // Draw connections
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.07;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.strokeStyle = `rgba(${r},${g},${b},${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw dots
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.2)`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    resize();
    if (!reducedMotion) {
      draw();
      window.addEventListener('mousemove', handleMouse);
      window.addEventListener('mouseleave', handleMouseLeave);
    } else {
      // Static single-frame render for reduced motion
      draw();
      cancelAnimationFrame(animRef.current);
    }
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [accentColor, initPoints]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    />
  );
}
