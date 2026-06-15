"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient animated constellation background.
 * Nodes drift slowly; lines draw between nearby nodes; one gold node pulses.
 * Pauses when the tab is hidden and respects prefers-reduced-motion.
 */
export default function Constellation({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Node = { x: number; y: number; vx: number; vy: number; r: number; gold: boolean };
    let nodes: Node[] = [];

    const NODE_COUNT_BASE = 0.00009; // nodes per pixel — scales with area
    const LINK_DIST = 130;

    function seed() {
      const count = Math.max(28, Math.min(70, Math.floor(width * height * NODE_COUNT_BASE)));
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: Math.random() * 1.6 + 0.6,
        gold: i % 14 === 0,
      }));
    }

    function resize() {
      const parent = canvas!.parentElement;
      width = parent ? parent.clientWidth : window.innerWidth;
      height = parent ? parent.clientHeight : window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = width + "px";
      canvas!.style.height = height + "px";
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    let t = 0;
    function draw() {
      ctx!.clearRect(0, 0, width, height);
      t += 0.016;

      // links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.22;
            ctx!.strokeStyle = `rgba(150,170,210,${alpha})`;
            ctx!.lineWidth = 0.6;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }

      // nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;

        if (n.gold) {
          const pulse = (Math.sin(t * 1.6 + n.x) + 1) / 2; // 0..1
          const glow = 3 + pulse * 4;
          ctx!.beginPath();
          ctx!.fillStyle = `rgba(224,169,85,${0.5 + pulse * 0.4})`;
          ctx!.shadowColor = "rgba(224,169,85,0.8)";
          ctx!.shadowBlur = glow;
          ctx!.arc(n.x, n.y, n.r + 0.6, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.shadowBlur = 0;
        } else {
          ctx!.beginPath();
          ctx!.fillStyle = "rgba(180,195,225,0.5)";
          ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
    }

    let raf = 0;
    let running = true;
    function loop() {
      if (!running) return;
      draw();
      raf = requestAnimationFrame(loop);
    }

    function onVisibility() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        loop();
      }
    }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced) {
      draw(); // single static frame
    } else {
      loop();
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
