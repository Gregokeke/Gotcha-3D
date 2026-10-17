import React, { useState } from 'react';
import { SkiaShaderBackdrop } from './SkiaShaderBackdrop';
import { TreasureChest3DCanvas, ChestVariant } from './TreasureChest3D';
import { soundEngine } from '../game/audio';

interface LuckyPickChestModalProps {
  onComplete: () => void;
}

/**
 * Rebuilds the Lucky Pick! 3-Chest Bonus Round (00:21 - 00:29 in video) with
 * genuine Three.js 3D sculpted Royal Treasure Chests & 3D Magic Star Key:
 * - Phase 1: "Lucky Pick! • CHOOSE A CHEST •" with 3 sculpted 3D PBR chests (Pink, Purple, Gold)
 * - Phase 2: Chosen 3D chest zooms to center with 3D Magic Star Key hovering; player taps 3 times
 *   ("Tap!" -> "Tap! Tap!" -> "Tap! Tap! Tap!") as the 3D key strikes the lockplate and cracks the hinged lid
 * - Phase 3: 3D Dome Lid flings wide open with a 3D fountain of golden gems and an emerging 3D Foil Pack!
 */
export const LuckyPickChestModal: React.FC<LuckyPickChestModalProps> = ({ onComplete }) => {
  const [selectedChest, setSelectedChest] = useState<ChestVariant | null>(null);
  const [tapCount, setTapCount] = useState<number>(0);
  const [isBursting, setIsBursting] = useState<boolean>(false);

  const handleSelectChest = (variant: ChestVariant) => {
    soundEngine.playPop(1.2);
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(25);
    }
    setSelectedChest(variant);
    setTapCount(0);
  };

  const handleTapChest = () => {
    if (isBursting) return;
    const nextTap = tapCount + 1;
    setTapCount(nextTap);
    soundEngine.playChestTap(nextTap);
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(nextTap >= 3 ? [45, 25, 85] : 35);
    }

    if (nextTap >= 3) {
      setIsBursting(true);
      soundEngine.playUpgradeFlash();
      setTimeout(() => {
        onComplete();
      }, 950);
    }
  };

  const tapLabel =
    tapCount === 0
      ? 'Tap!'
      : tapCount === 1
      ? 'Tap! Tap!'
      : 'Tap! Tap! Tap!';

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-between px-4 py-10"
      data-testid="lucky-pick-modal"
    >
      <SkiaShaderBackdrop mode="DARK_CHEST_VORTEX" />

      {/* Top 3D Extruded Header: "Lucky Pick! • CHOOSE A CHEST •" */}
      <div className="relative z-20 mt-4 flex flex-col items-center">
        {!selectedChest ? (
          <>
            <svg viewBox="0 0 280 75" className="h-20 w-64 overflow-visible select-none drop-shadow-[0_6px_12px_rgba(0,0,0,0.5)]">
              <defs>
                <linearGradient id="luckyPickGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFF0F7" />
                  <stop offset="40%" stopColor="#FF75B5" />
                  <stop offset="100%" stopColor="#DB2777" />
                </linearGradient>
              </defs>
              <text
                x="140"
                y="55"
                textAnchor="middle"
                fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
                fontWeight="700"
                fontSize="44"
                fill="#4A044E"
                stroke="#4A044E"
                strokeWidth="12"
                strokeLinejoin="round"
              >
                Lucky Pick!
              </text>
              <text
                x="140"
                y="49"
                textAnchor="middle"
                fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
                fontWeight="700"
                fontSize="44"
                fill="url(#luckyPickGrad)"
                stroke="#701A75"
                strokeWidth="6"
                strokeLinejoin="round"
                style={{ paintOrder: 'stroke fill' }}
              >
                Lucky Pick!
              </text>
            </svg>
            <div className="mt-1 flex items-center gap-2 rounded-full border border-pink-300/40 bg-purple-950/70 px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-pink-200 uppercase shadow-[0_4px_0_rgba(30,5,56,0.8)]">
              <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12,2 L15,9 L22,9.5 L16.5,14.5 L18,22 L12,18 L6,22 L7.5,14.5 L2,9.5 L9,9 Z" fill="#FDE047" />
              </svg>
              <span>Choose a 3D Royal Chest</span>
              <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12,2 L15,9 L22,9.5 L16.5,14.5 L18,22 L12,18 L6,22 L7.5,14.5 L2,9.5 L9,9 Z" fill="#FDE047" />
              </svg>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 rounded-full border border-amber-300/50 bg-purple-950/80 px-4 py-1.5 text-xs font-extrabold tracking-[0.2em] text-amber-200 uppercase shadow-[0_4px_0_rgba(30,5,56,0.85)]">
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12,2 L15,9 L22,9.5 L16.5,14.5 L18,22 L12,18 L6,22 L7.5,14.5 L2,9.5 L9,9 Z" fill="#FDE047" />
            </svg>
            <span>{isBursting ? 'Unlocking 3D Treasure!' : 'Tap the 3D Chest to Unlock'}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12,2 L15,9 L22,9.5 L16.5,14.5 L18,22 L12,18 L6,22 L7.5,14.5 L2,9.5 L9,9 Z" fill="#FDE047" />
            </svg>
          </div>
        )}
      </div>

      {/* Center Stage: Live Three.js 3D Royal Treasure Chests & 3D Magic Star Key + Accessible Hit Targets */}
      <div className="relative z-10 flex w-full flex-1 items-center justify-center">
        {/* Continuous 60fps Three.js 3D Chest Stage */}
        <div className="pointer-events-none absolute inset-0">
          <TreasureChest3DCanvas
            selectedChest={selectedChest}
            tapCount={tapCount}
            isBursting={isBursting}
            onSelectChest={handleSelectChest}
            onTapChest={handleTapChest}
          />
        </div>

        {/* Interactive Overlay Hit Targets preserving exact ARIA labels and 3D tactile pills */}
        {!selectedChest ? (
          <div className="relative z-20 grid w-full grid-cols-3 gap-2 items-end justify-items-center pt-36">
            {(['PINK', 'PURPLE', 'GOLD'] as const).map((variant) => {
              const badgeColor =
                variant === 'PINK'
                  ? 'from-pink-400 via-rose-500 to-pink-700 border-pink-100 shadow-[0_4px_0_#831843]'
                  : variant === 'PURPLE'
                  ? 'from-purple-400 via-purple-600 to-indigo-800 border-purple-100 shadow-[0_4px_0_#3B0764]'
                  : 'from-yellow-200 via-amber-400 to-amber-600 border-amber-100 text-amber-950 shadow-[0_4px_0_#92400E]';
              return (
                <button
                  key={variant}
                  type="button"
                  onClick={() => handleSelectChest(variant)}
                  aria-label={`Choose ${variant.toLowerCase()} chest`}
                  className="group flex h-44 w-full cursor-pointer flex-col items-center justify-end pb-2 transition-transform duration-200 hover:scale-105 active:translate-y-1"
                >
                  <span
                    className={`rounded-full border-2 bg-gradient-to-b px-3.5 py-1 font-['Fredoka'] text-xs font-bold tracking-wide ${
                      variant === 'GOLD' ? 'text-amber-950' : 'text-white'
                    } ${badgeColor}`}
                  >
                    Pick {variant === 'PINK' ? 'Rose' : variant === 'PURPLE' ? 'Royal' : 'Gold'}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleTapChest}
            aria-label="Tap chest with magic key"
            className="relative z-20 flex h-80 w-full cursor-pointer flex-col items-center justify-end pb-2 focus:outline-none"
          >
            {/* "Tap! Tap! Tap!" Glossy 3D Extruded Prompt below the 3D Chest */}
            <svg viewBox="0 0 280 65" className="h-16 w-64 overflow-visible select-none drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]">
              <text
                x="140"
                y="45"
                textAnchor="middle"
                fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
                fontWeight="700"
                fontSize="36"
                fill="#4A044E"
                stroke="#4A044E"
                strokeWidth="10"
                strokeLinejoin="round"
              >
                {tapLabel}
              </text>
              <text
                x="140"
                y="41"
                textAnchor="middle"
                fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
                fontWeight="700"
                fontSize="36"
                fill="#FF85C0"
                stroke="#831843"
                strokeWidth="5"
                strokeLinejoin="round"
                style={{ paintOrder: 'stroke fill' }}
              >
                {tapLabel}
              </text>
            </svg>
          </button>
        )}
      </div>

      {/* Bottom 3D Beveled Progress Slots for Key Strikes */}
      <div className="relative z-20 mb-3 flex items-center gap-3">
        {selectedChest &&
          [1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-3.5 w-11 rounded-full border-2 transition-all duration-200 ${
                tapCount >= step
                  ? 'border-amber-100 bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600 shadow-[0_3px_0_#92400E,0_0_12px_#FDE047]'
                  : 'border-white/35 bg-purple-950/70 shadow-inner'
              }`}
            />
          ))}
      </div>
    </div>
  );
};

