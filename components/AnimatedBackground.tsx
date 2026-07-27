'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
  sizeRatio?: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resizeCanvas = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();

    // Mouse & Touch position tracking
    const pointer = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      isDown: false,
      active: false,
    };

    // Arrays
    const particles: Particle[] = [];
    const ripples: Ripple[] = [];
    const ambientParticles: Particle[] = [];

    const vibrantColors = [
      '#71717a', // Zinc 500
      '#a1a1aa', // Zinc 400
      '#d4d4d8', // Zinc 300
      '#52525b', // Zinc 600
    ];

    // Create floating ambient particles
    const ambientCount = Math.min(Math.floor((width * height) / 14000), 55);
    for (let i = 0; i < ambientCount; i++) {
      ambientParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6 - 0.15,
        radius: Math.random() * 2.5 + 1.2,
        color: vibrantColors[Math.floor(Math.random() * vibrantColors.length)],
        alpha: Math.random() * 0.45 + 0.2,
        maxLife: Infinity,
        life: 0,
      });
    }

    const addSparks = (x: number, y: number, count = 16) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 3.5 + 1.5,
          color: vibrantColors[Math.floor(Math.random() * vibrantColors.length)],
          alpha: 1,
          maxLife: Math.random() * 35 + 20,
          life: 0,
        });
      }
    };

    const addRipple = (x: number, y: number) => {
      ripples.push({
        x,
        y,
        radius: 6,
        maxRadius: Math.random() * 45 + 65,
        color: vibrantColors[Math.floor(Math.random() * vibrantColors.length)],
        alpha: 0.9,
        lineWidth: 2.5,
      });
    };

    const addTrailParticle = (x: number, y: number) => {
      particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.5,
        radius: Math.random() * 3 + 1.5,
        color: vibrantColors[Math.floor(Math.random() * vibrantColors.length)],
        alpha: 0.85,
        maxLife: Math.random() * 25 + 15,
        life: 0,
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      pointer.targetX = e.clientX;
      pointer.targetY = e.clientY;
      pointer.active = true;

      // Always create trail on move
      if (Math.random() < 0.7) {
        addTrailParticle(e.clientX, e.clientY);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      pointer.isDown = true;
      addRipple(e.clientX, e.clientY);
      addSparks(e.clientX, e.clientY, 20);
    };

    const handleMouseUp = () => {
      pointer.isDown = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      pointer.isDown = true;
      pointer.active = true;
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        pointer.targetX = t.clientX;
        pointer.targetY = t.clientY;
        addRipple(t.clientX, t.clientY);
        addSparks(t.clientX, t.clientY, 18);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        pointer.targetX = t.clientX;
        pointer.targetY = t.clientY;
        addTrailParticle(t.clientX, t.clientY);
      }
    };

    const handleTouchEnd = () => {
      pointer.isDown = false;
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth pointer lerp
      pointer.x += (pointer.targetX - pointer.x) * 0.18;
      pointer.y += (pointer.targetY - pointer.y) * 0.18;

      // 1. Draw glowing aura under cursor/touch
      if (pointer.active) {
        const auraGrad = ctx.createRadialGradient(
          pointer.x,
          pointer.y,
          0,
          pointer.x,
          pointer.y,
          220
        );
        auraGrad.addColorStop(0, 'rgba(161, 161, 170, 0.12)'); // zinc 400
        auraGrad.addColorStop(0.5, 'rgba(113, 113, 122, 0.06)'); // zinc 500
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 220, 0, Math.PI * 2);
        ctx.fill();

        // Small bright cursor center pulse dot
        ctx.fillStyle = '#a1a1aa';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, pointer.isDown ? 7 : 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 2. Render Ambient Dust Particles
      for (let i = 0; i < ambientParticles.length; i++) {
        const p = ambientParticles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Interaction with cursor (repulsion force)
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          const force = (140 - dist) / 140;
          p.x -= (dx / dist) * force * 3;
          p.y -= (dy / dist) * force * 3;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. Render Click/Touch Expanding Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 3;
        r.alpha -= 0.022;

        if (r.alpha <= 0 || r.radius >= r.maxRadius) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = Math.max(0, r.alpha);
        ctx.lineWidth = r.lineWidth;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Render Interactive Sparkles/Trail
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life++;

        const lifeRatio = p.life / p.maxLife;
        p.alpha = Math.max(0, 1 - lifeRatio);

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.radius * (1 - lifeRatio * 0.4)), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Subtle Neutral Gray Ambient Gradients */}
      <div className="absolute top-[10%] left-[10%] w-[500px] h-[500px] bg-zinc-800/10 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-zinc-900/20 rounded-full blur-3xl animate-blob animation-delay-3000" />

      {/* Canvas for Interactive Pointer Trailing & Ripples */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}
