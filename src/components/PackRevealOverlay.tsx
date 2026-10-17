import React, { useEffect, useState } from 'react';
import { StickerDef, StickerCollectionEntry } from '../game/rules';
import { StickerArtSvg, RarityHeaderBanner, LegendBadgeSvg } from './StickerArt';
import { SkiaShaderBackdrop } from './SkiaShaderBackdrop';
import { PackBurst3DCanvas } from './PackBurst3D';
import { soundEngine } from '../game/audio';
import confetti from 'canvas-confetti';

interface PackRevealOverlayProps {
  sticker: StickerDef;
  collectionEntry: StickerCollectionEntry;
  isNew: boolean;
  didUpgrade: boolean;
  skipPackTear?: boolean;
  onCollect: () => void;
}

/**
 * Rebuilds the Pack Tear -> "UPGRADE!" Flash -> Sticker Reveal Screen (00:14 - 00:18 & 00:30 - 00:33):
 * - Shows "RARE!" / "LEGEND!" 3D header
 * - Floating 3D Sticker with tilted "NEW" badge
 * - Rarity label + glossy purple/gold pill name plate ("Heart Beat", "Lucky Star")
 * - "FUSE PROGRESS 1/3" bar (or "+1 OWNED" for Legend)
 * - Glossy yellow "Collect" button
 */
export const PackRevealOverlay: React.FC<PackRevealOverlayProps> = ({
  sticker,
  collectionEntry,
  isNew,
  didUpgrade,
  skipPackTear = false,
  onCollect,
}) => {
  const [stage, setStage] = useState<'PACK_BURST' | 'UPGRADE_FLASH' | 'STICKER_CARD'>(
    skipPackTear ? 'STICKER_CARD' : 'PACK_BURST'
  );
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 0, ry: 0 });

  useEffect(() => {
    if (skipPackTear) {
      soundEngine.playRewardFanfare(sticker.rarity === 'LEGEND');
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.55 },
      });
      return;
    }

    soundEngine.playPop(1.25);
    const t1 = setTimeout(() => {
      if (didUpgrade) {
        setStage('UPGRADE_FLASH');
        soundEngine.playUpgradeFlash();
      } else {
        setStage('STICKER_CARD');
        soundEngine.playRewardFanfare(sticker.rarity === 'LEGEND');
      }
    }, 680);

    const t2 = setTimeout(() => {
      setStage('STICKER_CARD');
      soundEngine.playRewardFanfare(sticker.rarity === 'LEGEND');
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.55 },
      });
    }, didUpgrade ? 1420 : 700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [didUpgrade, skipPackTear, sticker.rarity]);

  if (stage === 'PACK_BURST' || stage === 'UPGRADE_FLASH') {
    // 00:14 - 00:16 3D Foil Pack Tear, Burst & Emerging Sticker from Inside the Pack!
    return (
      <div
        className="absolute inset-0 z-40 flex flex-col items-center justify-center px-4"
        data-testid="pack-upgrade-flash"
      >
        <SkiaShaderBackdrop mode="PACK_BURST" />

        {stage === 'UPGRADE_FLASH' && (
          <div className="relative z-20 mb-2 animate-bounce">
            <svg viewBox="0 0 280 70" className="h-16 w-64 overflow-visible">
              <text
                x="140"
                y="50"
                textAnchor="middle"
                fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
                fontWeight="700"
                fontSize="42"
                fill="#3B0764"
                stroke="#3B0764"
                strokeWidth="12"
                strokeLinejoin="round"
              >
                UPGRADE!
              </text>
              <text
                x="140"
                y="45"
                textAnchor="middle"
                fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
                fontWeight="700"
                fontSize="42"
                fill="#FF85C0"
                stroke="#FFFFFF"
                strokeWidth="5"
                strokeLinejoin="round"
                style={{ paintOrder: 'stroke fill' }}
              >
                UPGRADE!
              </text>
            </svg>
          </div>
        )}

        {/* Live Three.js 3D Foil Sticker Pack Rips Open & Sticker Emerges Out of the Pack! */}
        <div className="relative z-10 h-96 w-full">
          <PackBurst3DCanvas
            sticker={sticker}
            stage={stage}
            onTapPack={() => setStage('STICKER_CARD')}
          />
        </div>

        <p className="relative z-20 mt-1 font-['Fredoka'] text-xs font-bold tracking-widest text-amber-200 uppercase drop-shadow">
          {stage === 'UPGRADE_FLASH' ? 'Rarity Upgrade Burst!' : 'Bursting 3D Foil Pack...'}
        </p>
      </div>
    );
  }

  const fuseCurrent = ((collectionEntry.count - 1) % sticker.fuseTarget) + 1;

  // 00:18 Rare "Heart Beat" or 00:32 Legend "Lucky Star" 3D Holographic Reveal Screen
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-between px-6 py-8"
      data-testid="sticker-reveal-card"
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        setTilt({ rx: -ny * 14, ry: nx * 16 });
      }}
      onPointerLeave={() => setTilt({ rx: 0, ry: 0 })}
    >
      <SkiaShaderBackdrop mode="REWARD_AURA" rarity={sticker.rarity} />

      {/* Top 3D Rarity Header ("RARE!", "LEGEND!") */}
      <div className="relative z-10 mt-2 flex flex-col items-center">
        <RarityHeaderBanner rarity={sticker.rarity} />
      </div>

      {/* Center 3D Emerged Sticker Pedestal + Torn Open 3D Foil Pouch Base */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className="relative flex flex-col items-center justify-center transition-transform duration-150"
          style={{
            transform: `perspective(700px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {isNew && (
            <div
              className="absolute -top-3 -right-4 z-30 rotate-12 rounded-full border-2 border-white bg-gradient-to-b from-pink-400 via-rose-500 to-rose-700 px-3.5 py-0.5 font-['Fredoka'] text-sm font-bold text-white shadow-[0_4px_0_#881337,0_8px_16px_rgba(0,0,0,0.4)]"
              style={{ transform: 'translateZ(35px) rotate(12deg)' }}
            >
              NEW
            </div>
          )}

          {/* 3D Holographic Floating Sticker Artwork emerging from the Torn Foil Pack Collar */}
          <div
            className="relative z-20 transition-transform duration-300 hover:scale-105"
            style={{ transform: 'translateZ(28px)' }}
          >
            <StickerArtSvg
              stickerId={sticker.id}
              className="h-44 w-44 drop-shadow-[0_18px_24px_rgba(0,0,0,0.5)]"
            />
          </div>

          {/* 3D Torn Open Foil Pack Rim Below the Emerged Sticker (shows it just burst out of the pack!) */}
          <div
            className="-mt-6 z-10 flex h-12 w-36 flex-col items-center justify-end overflow-hidden rounded-b-2xl border-x-2 border-b-2 border-amber-200/90 bg-gradient-to-b from-fuchsia-500 via-purple-700 to-purple-950 shadow-[0_8px_0_#3B0764,0_14px_24px_rgba(0,0,0,0.45)]"
            style={{ transform: 'translateZ(10px) rotateX(18deg)' }}
          >
            {/* Jagged Torn Foil Teeth along top of open pack */}
            <svg viewBox="0 0 160 18" className="w-full shrink-0 -mt-1" preserveAspectRatio="none">
              <polygon
                points="0,0 12,12 24,2 36,14 48,0 60,12 72,2 84,14 96,0 108,12 120,2 132,14 144,0 160,12 160,0"
                fill="#FDE047"
              />
            </svg>
            <span className="mb-1.5 font-['Fredoka'] text-[10px] font-bold tracking-widest text-amber-200 uppercase">
              3D Foil Pack
            </span>
          </div>
        </div>

        {/* Rarity Diamond Kicker */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <span
            className="inline-block h-3.5 w-3.5 rotate-45 rounded-[2px] border border-white shadow-[0_2px_0_rgba(0,0,0,0.4)]"
            style={{
              backgroundColor:
                sticker.rarity === 'LEGEND'
                  ? '#FACC15'
                  : sticker.rarity === 'EPIC'
                  ? '#C084FC'
                  : '#F472B6',
            }}
          />
          <span className="font-['Fredoka'] text-sm font-bold tracking-wider text-white uppercase drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">
            {sticker.rarity}
          </span>
        </div>

        {/* Glossy 3D Extruded Purple Banner with Sticker Name ("Heart Beat" / "Lucky Star") */}
        <div className="relative mt-2 flex min-w-[235px] items-center justify-center rounded-full border-2 border-purple-100 bg-gradient-to-b from-fuchsia-400 via-purple-600 to-purple-900 px-7 py-2 shadow-[0_6px_0_#3B0764,0_12px_22px_rgba(0,0,0,0.4)]">
          <span className="pointer-events-none absolute inset-x-5 top-1 h-2.5 rounded-full bg-white/40" />
          <span className="relative font-['Fredoka'] text-2xl font-bold tracking-wide text-white drop-shadow-[0_2px_0_#3B0764]">
            {sticker.name}
          </span>
        </div>

        {/* Fuse Progress Bar (00:18) or +1 OWNED (00:32) */}
        {sticker.rarity === 'LEGEND' ? (
          <div className="mt-3 rounded-full border border-amber-500/40 bg-amber-300/30 px-4 py-0.5 font-['Fredoka'] text-sm font-bold tracking-wider text-amber-950 uppercase shadow-sm">
            +{collectionEntry.count} OWNED
          </div>
        ) : (
          <div className="mt-3.5 w-56">
            <div className="mb-1 flex items-center justify-between text-xs font-extrabold tracking-wider text-white uppercase drop-shadow">
              <span>Fuse Progress</span>
              <span className="tabular-nums">
                {fuseCurrent}/{sticker.fuseTarget}
              </span>
            </div>
            <div className="h-4.5 w-full overflow-hidden rounded-full border-2 border-white/90 bg-purple-950/85 p-0.5 shadow-[0_3px_0_#3B0764,inset_0_2px_4px_rgba(0,0,0,0.6)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-amber-300 transition-all duration-500"
                style={{ width: `${(fuseCurrent / sticker.fuseTarget) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Glossy 3D Beveled Yellow "Collect" Button */}
      <div className="relative z-10 mb-2 w-full max-w-[260px]">
        <button
          type="button"
          onClick={() => {
            soundEngine.playPop(1.15);
            onCollect();
          }}
          className="group relative h-14 w-full cursor-pointer rounded-full border-2 border-amber-100 bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600 shadow-[0_7px_0_#92400E,0_14px_24px_rgba(0,0,0,0.4)] transition-transform active:translate-y-1"
        >
          <span className="pointer-events-none absolute inset-x-4 top-1 h-3.5 rounded-full bg-white/65" />
          <span className="relative font-['Fredoka'] text-xl font-bold tracking-wide text-amber-950">
            Collect
          </span>
        </button>
      </div>
    </div>
  );
};

/**
 * Rebuilds the "NEW BADGE! Legend" Floating Cloud Celebration Modal (00:36 - 00:37 in video).
 */
export const NewBadgeModal: React.FC<{
  badgeTitle: string;
  badgeSubtitle: string;
  onContinue: () => void;
}> = ({ badgeTitle, badgeSubtitle, onContinue }) => {
  return (
    <div
      onClick={() => {
        soundEngine.playPop(1.2);
        onContinue();
      }}
      className="absolute inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-purple-950/75 px-6"
      data-testid="new-badge-modal"
    >
      {/* Top "NEW BADGE!" Header */}
      <svg viewBox="0 0 280 65" className="h-16 w-64 overflow-visible select-none">
        <text
          x="140"
          y="46"
          textAnchor="middle"
          fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
          fontWeight="700"
          fontSize="36"
          fill="#4A044E"
          stroke="#4A044E"
          strokeWidth="11"
          strokeLinejoin="round"
        >
          NEW BADGE!
        </text>
        <text
          x="140"
          y="42"
          textAnchor="middle"
          fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
          fontWeight="700"
          fontSize="36"
          fill="#FF99CC"
          stroke="#831843"
          strokeWidth="5"
          strokeLinejoin="round"
          style={{ paintOrder: 'stroke fill' }}
        >
          NEW BADGE!
        </text>
      </svg>

      {/* Crowned Star Badge on Fluffy Cloud Cushion with Pink Ribbon */}
      <div className="relative my-4 flex flex-col items-center">
        <LegendBadgeSvg className="h-36 w-36 drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)]" />
        {/* Pink Ribbon Banner */}
        <div className="-mt-5 z-10 rounded-full border-2 border-pink-100 bg-gradient-to-b from-pink-400 via-rose-500 to-pink-700 px-8 py-1.5 shadow-[0_5px_0_#831843]">
          <span className="font-['Fredoka'] text-xl font-bold text-white drop-shadow">
            {badgeTitle}
          </span>
        </div>
        {/* Cloud Cushion Under Ribbon */}
        <div className="-mt-3 h-8 w-48 rounded-full bg-purple-300/45 blur-[1px]" />
      </div>

      <p className="mt-3 font-['Plus_Jakarta_Sans'] text-base font-bold text-white drop-shadow">
        {badgeSubtitle}
      </p>
      <p className="mt-6 font-['Plus_Jakarta_Sans'] text-sm font-semibold text-pink-200/90">
        Tap to continue
      </p>
    </div>
  );
};
