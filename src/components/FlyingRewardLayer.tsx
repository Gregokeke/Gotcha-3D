import React, { useEffect, useState } from 'react';
import { evaluateCubicBezier2D } from '../game/rules';
import { StarCoinIcon, LegendBadgeSvg, StickerArtSvg } from './StickerArt';

export interface FlyingItem {
  id: string;
  type: 'COIN' | 'STICKER' | 'BADGE';
  stickerId?: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delayMs: number;
  durationMs: number;
}

interface FlyingRewardLayerProps {
  items: FlyingItem[];
  onAllComplete?: () => void;
}

/**
 * Renders 60fps cubic-bezier flying reward trails with sparkle particle wakes:
 * - Coins flying from the Lucky Spin collect button up to the top-right coin counter (00:10)
 * - Stickers flying down into the bottom-right "MY STICKERS" gift box with a "+1" pop (00:19, 00:34)
 * - Legend Star Badge shooting from bottom-left across the screen on a glowing ribbon trail (00:35)
 */
export const FlyingRewardLayer: React.FC<FlyingRewardLayerProps> = ({ items }) => {
  const [now, setNow] = useState<number>(() => performance.now());
  const [startTime] = useState<number>(() => performance.now());

  useEffect(() => {
    if (items.length === 0) return;
    let animId = 0;
    const tick = (t: number) => {
      setNow(t);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {items.map((item) => {
        const elapsed = now - startTime - item.delayMs;
        if (elapsed < 0 || elapsed > item.durationMs) return null;
        const progress = Math.min(1, elapsed / item.durationMs);
        // Smooth ease-in-out
        const t = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const ctrl1 = {
          x: item.startX + (item.endX - item.startX) * 0.15 - 65,
          y: Math.min(item.startY, item.endY) - 80,
        };
        const ctrl2 = {
          x: item.startX + (item.endX - item.startX) * 0.85 + 35,
          y: item.endY - 40,
        };

        const pos = evaluateCubicBezier2D(
          { x: item.startX, y: item.startY },
          ctrl1,
          ctrl2,
          { x: item.endX, y: item.endY },
          t
        );

        const trail1 = evaluateCubicBezier2D(
          { x: item.startX, y: item.startY },
          ctrl1,
          ctrl2,
          { x: item.endX, y: item.endY },
          Math.max(0, t - 0.08)
        );
        const trail2 = evaluateCubicBezier2D(
          { x: item.startX, y: item.startY },
          ctrl1,
          ctrl2,
          { x: item.endX, y: item.endY },
          Math.max(0, t - 0.16)
        );

        const scale = item.type === 'BADGE' ? 0.65 + Math.sin(progress * Math.PI) * 0.55 : 1 - progress * 0.35;

        return (
          <React.Fragment key={item.id}>
            {/* Glowing Comet Wake Particles */}
            <div
              className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200/75 blur-[1px]"
              style={{ left: trail1.x, top: trail1.y }}
            />
            <div
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300/60"
              style={{ left: trail2.x, top: trail2.y }}
            />

            {/* Main Flying Object */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: pos.x,
                top: pos.y,
                transform: `translate(-50%, -50%) scale(${scale})`,
              }}
            >
              {item.type === 'COIN' && <StarCoinIcon size={36} />}
              {item.type === 'STICKER' && (
                <StickerArtSvg stickerId={item.stickerId || 'heart-beat'} className="h-20 w-20" />
              )}
              {item.type === 'BADGE' && <LegendBadgeSvg className="h-24 w-24" />}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
