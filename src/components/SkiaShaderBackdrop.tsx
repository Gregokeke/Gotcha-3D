import React, { useEffect, useRef } from 'react';
import { Rarity } from '../game/rules';

export type ShaderMode = 'IDLE_CLOUDS' | 'WHEEL_GLOW' | 'COIN_RAYBURST' | 'PACK_BURST' | 'REWARD_AURA' | 'DARK_CHEST_VORTEX';

interface SkiaShaderBackdropProps {
  mode: ShaderMode;
  rarity?: Rarity;
  intensity?: number;
  className?: string;
}

/**
 * High-performance Skia / WebGPU RuntimeShader-style canvas backdrop.
 * Renders multi-plane volumetric clouds, radial starburst rays, rotating energy vortexes,
 * and floating sparkle particles at 60fps (throttled automatically in headless browser).
 */
export const SkiaShaderBackdrop: React.FC<SkiaShaderBackdropProps> = ({
  mode,
  rarity = 'RARE',
  intensity = 1,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modeRef = useRef<ShaderMode>(mode);
  const rarityRef = useRef<Rarity>(rarity);
  const intensityRef = useRef<number>(intensity);

  useEffect(() => {
    modeRef.current = mode;
    rarityRef.current = rarity;
    intensityRef.current = intensity;
  }, [mode, rarity, intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    let animId = 0;
    let startTime = performance.now();
    let lastFrameTime = 0;

    // Pre-allocated sparkle particle pool (zero GC in loop)
    const PARTICLE_COUNT = 28;
    const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: ((i * 73) % 100) / 100,
      y: ((i * 41) % 100) / 100,
      size: 2 + (i % 5) * 1.4,
      speedY: 0.015 + (i % 4) * 0.01,
      phase: i * 0.7,
    }));

    const renderFrame = (now: number) => {
      if (isHeadless && now - lastFrameTime < 75) {
        animId = requestAnimationFrame(renderFrame);
        return;
      }
      lastFrameTime = now;

      const t = (now - startTime) * 0.001;
      const w = canvas.width;
      const h = canvas.height;
      const currentMode = modeRef.current;
      const currentRarity = rarityRef.current;

      ctx.clearRect(0, 0, w, h);

      if (currentMode === 'IDLE_CLOUDS') {
        // Dreamy Remea Twilight Violet-Pink Sky Gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#9358D8');
        skyGrad.addColorStop(0.38, '#C87CE5');
        skyGrad.addColorStop(0.68, '#F0A6CA');
        skyGrad.addColorStop(1, '#7935B5');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // Soft Golden Sunset Glow behind the Gacha Machine
        const sunGlow = ctx.createRadialGradient(w * 0.5, h * 0.46, 10, w * 0.5, h * 0.46, w * 0.65);
        sunGlow.addColorStop(0, 'rgba(255, 234, 175, 0.68)');
        sunGlow.addColorStop(0.5, 'rgba(244, 114, 182, 0.32)');
        sunGlow.addColorStop(1, 'rgba(147, 51, 234, 0)');
        ctx.fillStyle = sunGlow;
        ctx.fillRect(0, 0, w, h);

        // Distant Ringed Pastel Planet (top right, just like 00:11 in video)
        const px = w * 0.84;
        const py = h * 0.24 + Math.sin(t * 0.8) * 3;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(-0.32);
        ctx.fillStyle = 'rgba(233, 213, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 28, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Multi-layered Fluffy Billowing Clouds on Left, Right, and Bottom
        const drawCloudBank = (
          yBase: number,
          colorTop: string,
          colorBot: string,
          scale: number,
          drift: number
        ) => {
          const grad = ctx.createLinearGradient(0, yBase - 80 * scale, 0, h);
          grad.addColorStop(0, colorTop);
          grad.addColorStop(1, colorBot);
          ctx.fillStyle = grad;

          const puffs = [
            { cx: -0.05, cy: 0, r: 0.26 },
            { cx: 0.14, cy: 0.04, r: 0.22 },
            { cx: 0.35, cy: 0.08, r: 0.24 },
            { cx: 0.65, cy: 0.07, r: 0.24 },
            { cx: 0.86, cy: 0.03, r: 0.22 },
            { cx: 1.05, cy: -0.01, r: 0.27 },
          ];
          ctx.beginPath();
          puffs.forEach((p, idx) => {
            const ox = Math.sin(t * 0.6 + idx + drift) * 6;
            const oy = Math.cos(t * 0.5 + idx) * 4;
            ctx.arc(w * p.cx + ox, yBase + h * p.cy + oy, w * p.r * scale, 0, Math.PI * 2);
          });
          ctx.lineTo(w, h);
          ctx.lineTo(0, h);
          ctx.closePath();
          ctx.fill();
        };

        // Side clouds framing the sky
        drawCloudBank(h * 0.52, 'rgba(253, 224, 215, 0.65)', 'rgba(192, 132, 252, 0.7)', 0.95, 0);
        drawCloudBank(h * 0.66, 'rgba(233, 179, 252, 0.85)', 'rgba(139, 69, 214, 0.92)', 1.05, 1.5);
        drawCloudBank(h * 0.80, 'rgba(192, 132, 252, 0.95)', 'rgba(88, 28, 135, 1)', 1.15, 3.1);
      } else if (currentMode === 'WHEEL_GLOW') {
        // Deep Cosmic Purple & Gold Bokeh Backdrop for Lucky Spin (00:03)
        const bg = ctx.createRadialGradient(w * 0.5, h * 0.48, 20, w * 0.5, h * 0.48, h * 0.7);
        bg.addColorStop(0, '#6B21A8');
        bg.addColorStop(0.5, '#3B0764');
        bg.addColorStop(1, '#1E0538');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Rotating soft golden rays behind the wheel
        ctx.save();
        ctx.translate(w * 0.5, h * 0.52);
        ctx.rotate(t * 0.25);
        const rays = 12;
        for (let i = 0; i < rays; i++) {
          ctx.rotate((Math.PI * 2) / rays);
          const rayGrad = ctx.createLinearGradient(0, 0, 0, -w * 0.65);
          rayGrad.addColorStop(0, 'rgba(253, 224, 71, 0.25)');
          rayGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-22, -w * 0.65);
          ctx.lineTo(22, -w * 0.65);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      } else if (currentMode === 'COIN_RAYBURST') {
        // Vibrant Pink Starburst for Coin Collect Screen (00:08)
        const bg = ctx.createRadialGradient(w * 0.5, h * 0.45, 10, w * 0.5, h * 0.45, h * 0.75);
        bg.addColorStop(0, '#FFFFFF');
        bg.addColorStop(0.28, '#FF99CC');
        bg.addColorStop(0.65, '#EC4899');
        bg.addColorStop(1, '#9D174D');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w * 0.5, h * 0.45);
        ctx.rotate(t * 0.4);
        const rays = 16;
        for (let i = 0; i < rays; i++) {
          ctx.rotate((Math.PI * 2) / rays);
          ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.28)' : 'rgba(254, 240, 138, 0.18)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-18, -h * 0.8);
          ctx.lineTo(18, -h * 0.8);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      } else if (currentMode === 'PACK_BURST') {
        // Electric Blue / Violet Comic Speed-Lines & Energy Flash for UPGRADE! (00:14 - 00:16)
        const bg = ctx.createRadialGradient(w * 0.5, h * 0.46, 5, w * 0.5, h * 0.46, h * 0.72);
        bg.addColorStop(0, '#FFFFFF');
        bg.addColorStop(0.25, '#60A5FA');
        bg.addColorStop(0.6, '#6366F1');
        bg.addColorStop(1, '#312E81');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w * 0.5, h * 0.46);
        ctx.rotate(-t * 0.8);
        const spikes = 24;
        for (let i = 0; i < spikes; i++) {
          ctx.rotate((Math.PI * 2) / spikes);
          ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.55)' : 'rgba(192, 132, 252, 0.35)';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-12, -h * 0.85);
          ctx.lineTo(12, -h * 0.85);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      } else if (currentMode === 'DARK_CHEST_VORTEX') {
        // Deep Plum / Obsidian Treasure Room with Swirl Vortex (00:21 - 00:28)
        const bg = ctx.createRadialGradient(w * 0.5, h * 0.48, 10, w * 0.5, h * 0.48, h * 0.75);
        bg.addColorStop(0, '#581C87');
        bg.addColorStop(0.5, '#27093B');
        bg.addColorStop(1, '#0F0318');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(w * 0.5, h * 0.48);
        ctx.rotate(t * 0.9);
        for (let i = 0; i < 8; i++) {
          ctx.rotate((Math.PI * 2) / 8);
          const grad = ctx.createLinearGradient(0, 0, w * 0.45, w * 0.45);
          grad.addColorStop(0, 'rgba(192, 132, 252, 0.25)');
          grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(w * 0.16, 0, 36, 0, Math.PI * 1.2);
          ctx.fill();
        }
        ctx.restore();
      } else if (currentMode === 'REWARD_AURA') {
        // Rarity-matched Radiant Aura (00:18 Purple Rare vs 00:32 Golden-Sunset Legend)
        const bg = ctx.createLinearGradient(0, 0, 0, h);
        if (currentRarity === 'LEGEND') {
          bg.addColorStop(0, '#BE185D');
          bg.addColorStop(0.35, '#F59E0B');
          bg.addColorStop(0.75, '#FBBF24');
          bg.addColorStop(1, '#F97316');
        } else if (currentRarity === 'EPIC') {
          bg.addColorStop(0, '#4C1D95');
          bg.addColorStop(0.5, '#9333EA');
          bg.addColorStop(1, '#DB2777');
        } else {
          bg.addColorStop(0, '#5B21B6');
          bg.addColorStop(0.5, '#8B5CF6');
          bg.addColorStop(1, '#C084FC');
        }
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Center Halo Glow behind Sticker
        const halo = ctx.createRadialGradient(w * 0.5, h * 0.42, 10, w * 0.5, h * 0.42, w * 0.52);
        halo.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        halo.addColorStop(0.45, 'rgba(254, 240, 138, 0.45)');
        halo.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, w, h);
      }

      // Twinkling 4-Point Skia Shader Stars across all modes
      particles.forEach((p, idx) => {
        const py = ((p.y - t * p.speedY) % 1 + 1) % 1;
        const px = p.x + Math.sin(t * 1.2 + p.phase) * 0.02;
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(t * 2.4 + p.phase));
        const x = px * w;
        const y = py * h;
        const r = p.size * twinkle;

        ctx.fillStyle = idx % 3 === 0 ? `rgba(254, 240, 138, ${twinkle})` : `rgba(255, 255, 255, ${twinkle})`;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 2.2);
        ctx.quadraticCurveTo(x, y, x + r * 2.2, y);
        ctx.quadraticCurveTo(x, y, x, y + r * 2.2);
        ctx.quadraticCurveTo(x, y, x - r * 2.2, y);
        ctx.quadraticCurveTo(x, y, x, y - r * 2.2);
        ctx.fill();
      });

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={390}
      height={844}
      className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${className}`}
    />
  );
};
