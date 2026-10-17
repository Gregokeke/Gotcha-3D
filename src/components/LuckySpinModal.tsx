import React, { useState, useRef, useEffect } from 'react';
import { WHEEL_SLICES, computeWheelTargetAngle, pickWheelSlice, WheelSlice } from '../game/rules';
import { soundEngine } from '../game/audio';
import { StarCoinIcon } from './StickerArt';
import { SkiaShaderBackdrop } from './SkiaShaderBackdrop';
import { X, Flame } from 'lucide-react';

interface LuckySpinModalProps {
  spinCount: number;
  streakCount: number;
  dailyBonusAvailable: boolean;
  dailyBonusCoins: number;
  onClaimDailyBonus?: () => number;
  onClose: () => void;
  onCollectCoins: (coinsWon: number, startRect?: DOMRect) => void;
}

/**
 * Rebuilds the exact Lucky Spin! wheel modal (00:02 - 00:07) and
 * the "+2 Collect" Pink Starburst Reward Screen (00:08 - 00:09),
 * enhanced with Daily Login Streak display and First-Spin-of-the-Day bonus coins.
 */
export const LuckySpinModal: React.FC<LuckySpinModalProps> = ({
  spinCount,
  streakCount,
  dailyBonusAvailable,
  dailyBonusCoins,
  onClaimDailyBonus,
  onClose,
  onCollectCoins,
}) => {
  const [phase, setPhase] = useState<'WHEEL' | 'SPINNING' | 'REWARD'>('WHEEL');
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [pointerBounce, setPointerBounce] = useState<number>(0);
  const [wonSlice, setWonSlice] = useState<WheelSlice>(WHEEL_SLICES[1]);
  const [earnedDailyBonus, setEarnedDailyBonus] = useState<number>(0);
  const collectBtnRef = useRef<HTMLButtonElement | null>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handleSpin = () => {
    if (phase !== 'WHEEL') return;
    soundEngine.playPop(1.1);
    const chosen = pickWheelSlice(spinCount);
    setWonSlice(chosen);

    const bonus = dailyBonusAvailable && onClaimDailyBonus ? onClaimDailyBonus() : 0;
    setEarnedDailyBonus(bonus);
    setPhase('SPINNING');

    const startAngle = rotationDeg;
    const targetAngle = computeWheelTargetAngle(startAngle, chosen.index, 5);
    const durationMs = 2500;
    const startTime = performance.now();
    let lastTickSlice = -1;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Quartic ease-out with slight spring settle
      const eased = 1 - Math.pow(1 - progress, 4);
      const currentDeg = startAngle + (targetAngle - startAngle) * eased;
      setRotationDeg(currentDeg);

      const currentSliceIdx = Math.floor(((currentDeg + 22.5) % 360) / 45);
      if (currentSliceIdx !== lastTickSlice && progress < 0.97) {
        lastTickSlice = currentSliceIdx;
        soundEngine.playWheelTick(progress);
        setPointerBounce(-26 * (1 - progress * 0.6));
      } else {
        setPointerBounce((prev) => prev * 0.82);
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setPointerBounce(0);
        soundEngine.playRewardFanfare(false);
        setTimeout(() => {
          setPhase('REWARD');
        }, 320);
      }
    };

    animRef.current = requestAnimationFrame(tick);
  };

  const totalCoinsWon = wonSlice.coins + earnedDailyBonus;

  const handleCollect = () => {
    soundEngine.playCoinChime(0);
    soundEngine.playCoinChime(1);
    const rect = collectBtnRef.current?.getBoundingClientRect();
    onCollectCoins(totalCoinsWon, rect);
  };

  if (phase === 'REWARD') {
    // 00:08 - 00:09 Pink Starburst Coin Reward Screen
    return (
      <div
        className="absolute inset-0 z-40 flex flex-col items-center justify-between px-6 py-10"
        data-testid="lucky-spin-reward"
      >
        <SkiaShaderBackdrop mode="COIN_RAYBURST" />

        <div className="relative z-10 mt-6 flex flex-col items-center gap-1.5">
          <span className="text-xs font-extrabold tracking-widest text-pink-100 uppercase">
            Lucky Spin Reward
          </span>
          {earnedDailyBonus > 0 && (
            <div
              data-testid="daily-bonus-awarded-banner"
              className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-purple-950/75 px-3.5 py-1 text-xs font-bold text-amber-300 shadow"
            >
              <Flame className="h-3.5 w-3.5 text-amber-400" />
              <span className="tabular-nums">
                Day {streakCount} Login Bonus: +{earnedDailyBonus} Coin{earnedDailyBonus > 1 ? 's' : ''}!
              </span>
            </div>
          )}
        </div>

        {/* Center Floating 3D Star Coins + "+2" */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Glowing White Cloud Burst Behind Coins */}
          <div className="relative flex h-56 w-56 items-center justify-center">
            <div
              className="absolute inset-2 rounded-full opacity-90"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,230,245,0.65) 52%, rgba(255,255,255,0) 75%)',
              }}
            />
            {/* Multiple Overlapping Glossy 3D Star Coins */}
            <div className="relative flex items-center justify-center">
              <div className="-mr-5 -mt-6 -rotate-12 transform transition-transform duration-300">
                <StarCoinIcon size={98} />
              </div>
              <div className="z-10 mt-4 rotate-12 transform">
                <StarCoinIcon size={106} />
              </div>
            </div>
          </div>

          {/* Glossy "+2" Beveled Gold Number */}
          <svg viewBox="0 0 180 80" className="-mt-2 h-20 w-44 overflow-visible select-none">
            <defs>
              <linearGradient id="plusCoinsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="40%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
            <text
              x="90"
              y="62"
              textAnchor="middle"
              fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
              fontWeight="700"
              fontSize="58"
              fill="#78350F"
              stroke="#78350F"
              strokeWidth="14"
              strokeLinejoin="round"
            >
              +{totalCoinsWon}
            </text>
            <text
              x="90"
              y="56"
              textAnchor="middle"
              fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
              fontWeight="700"
              fontSize="58"
              fill="url(#plusCoinsGrad)"
              stroke="#92400E"
              strokeWidth="8"
              strokeLinejoin="round"
              style={{ paintOrder: 'stroke fill' }}
            >
              +{totalCoinsWon}
            </text>
          </svg>

          {earnedDailyBonus > 0 && (
            <p className="mt-0.5 text-xs font-bold text-white drop-shadow tabular-nums">
              ({wonSlice.coins} Wheel + {earnedDailyBonus} Daily Streak Bonus)
            </p>
          )}
        </div>

        {/* Bottom Glossy "Collect +X" CTA Button */}
        <div className="relative z-10 mb-4 w-full max-w-[260px]">
          <button
            ref={collectBtnRef}
            type="button"
            onClick={handleCollect}
            data-testid="collect-spin-coins-btn"
            className="group relative h-14 w-full cursor-pointer rounded-full border-2 border-amber-100 bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600 shadow-[0_6px_0_#92400E,0_12px_20px_rgba(0,0,0,0.35)] transition-transform active:translate-y-1"
          >
            <span className="pointer-events-none absolute inset-x-4 top-1 h-3.5 rounded-full bg-white/60" />
            <span className="relative font-['Fredoka'] text-xl font-bold tracking-wide text-amber-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
              Collect +{totalCoinsWon}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // 00:02 - 00:07 Lucky Spin! Wheel Screen
  return (
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-between px-5 py-8"
      data-testid="lucky-spin-modal"
    >
      <SkiaShaderBackdrop mode="WHEEL_GLOW" />

      {/* Top Left Pink Close Button & Top Right Daily Login Streak Counter */}
      <div className="relative z-10 flex w-full items-center justify-between pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={phase === 'SPINNING'}
          aria-label="Close Lucky Spin"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-pink-200 bg-gradient-to-b from-pink-400 to-pink-600 text-white shadow-[0_3px_0_#831843] transition-transform active:scale-95 disabled:opacity-50"
        >
          <X className="h-5 w-5 stroke-[3]" />
        </button>

        {/* Daily Login Streak & First-Spin Bonus Indicator */}
        <div
          data-testid="lucky-spin-streak-badge"
          className="flex items-center gap-2 rounded-2xl border-2 border-amber-300/80 bg-purple-950/85 px-3 py-1.5 shadow-[0_4px_0_#3B0764]"
        >
          <Flame className="h-4 w-4 text-amber-400 shrink-0" />
          <div className="flex flex-col text-right leading-tight">
            <span className="font-['Fredoka'] text-xs font-bold text-amber-300 tabular-nums whitespace-nowrap">
              Day {streakCount} Streak
            </span>
            <span className="text-[10px] font-bold text-pink-200 whitespace-nowrap">
              {dailyBonusAvailable
                ? `First Spin: +${dailyBonusCoins} Bonus Coin${dailyBonusCoins > 1 ? 's' : ''}`
                : 'Daily Bonus Claimed'}
            </span>
          </div>
        </div>
      </div>

      {/* "Lucky Spin!" 3D Logo with Treasure Pile */}
      <div className="relative z-10 -mt-2 flex flex-col items-center">
        <svg viewBox="0 0 320 120" className="h-28 w-72 overflow-visible select-none">
          <defs>
            <linearGradient id="luckySpinText" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFF0F7" />
              <stop offset="35%" stopColor="#FF75B5" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
          </defs>
          {/* Decorative Coin & Gem Pile on top of Logo */}
          <circle cx="122" cy="28" r="14" fill="#FBBF24" stroke="#78350F" strokeWidth="2.5" />
          <circle cx="195" cy="28" r="15" fill="#FBBF24" stroke="#78350F" strokeWidth="2.5" />
          <circle cx="158" cy="22" r="18" fill="#F472B6" stroke="#831843" strokeWidth="2.5" />
          <path d="M158,10 L163,19 L172,20 L165,26 L167,35 L158,30 L149,35 L151,26 L144,20 L153,19 Z" fill="#FEF08A" />

          <text
            x="160"
            y="88"
            textAnchor="middle"
            fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
            fontWeight="700"
            fontSize="48"
            fill="#4A044E"
            stroke="#4A044E"
            strokeWidth="13"
            strokeLinejoin="round"
          >
            Lucky Spin!
          </text>
          <text
            x="160"
            y="82"
            textAnchor="middle"
            fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
            fontWeight="700"
            fontSize="48"
            fill="url(#luckySpinText)"
            stroke="#701A75"
            strokeWidth="7"
            strokeLinejoin="round"
            style={{ paintOrder: 'stroke fill' }}
          >
            Lucky Spin!
          </text>
        </svg>
      </div>

      {/* Interactive 8-Slice 3D Beveled Wheel with Pink Heart Pointer */}
      <div className="relative z-10 my-1 flex items-center justify-center">
        {/* Top Pink Heart Pointer with Spring Deflection */}
        <div
          className="pointer-events-none absolute -top-6 z-30 origin-top transition-transform duration-75"
          style={{ transform: `rotate(${pointerBounce}deg)` }}
        >
          <svg width="54" height="58" viewBox="0 0 60 64" className="overflow-visible drop-shadow-[0_6px_6px_rgba(0,0,0,0.45)]">
            <defs>
              <linearGradient id="pointerHeart" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF99CC" />
                <stop offset="50%" stopColor="#EC4899" />
                <stop offset="100%" stopColor="#9D174D" />
              </linearGradient>
            </defs>
            <path
              d="M30,56 C12,38 4,24 6,14 C8,5 18,3 25,9 C28,12 30,15 30,18 C30,15 32,12 35,9 C42,3 52,5 54,14 C56,24 48,38 30,56 Z"
              fill="url(#pointerHeart)"
              stroke="#FFFBEB"
              strokeWidth="3.5"
            />
            <ellipse cx="20" cy="15" rx="5" ry="2.5" transform="rotate(-25 20 15)" fill="#FFFFFF" opacity="0.85" />
          </svg>
        </div>

        {/* Spinning Wheel SVG */}
        <div
          className="relative h-72 w-72 rounded-full shadow-[0_14px_34px_rgba(0,0,0,0.6)]"
          style={{ transform: `rotate(${rotationDeg}deg)` }}
        >
          <svg viewBox="0 0 320 320" className="h-full w-full select-none overflow-visible">
            <defs>
              <linearGradient id="wheelGoldRim" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="35%" stopColor="#FDE047" />
                <stop offset="75%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <linearGradient id="hubPink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF85C0" />
                <stop offset="60%" stopColor="#DB2777" />
                <stop offset="100%" stopColor="#831843" />
              </linearGradient>
            </defs>

            {/* Outer Gold Beveled Frame */}
            <circle cx="160" cy="160" r="156" fill="url(#wheelGoldRim)" stroke="#78350F" strokeWidth="4" />
            <circle cx="160" cy="160" r="142" fill="#4A044E" />

            {/* 8 Pie Wedges */}
            {WHEEL_SLICES.map((slice, i) => {
              const startAngle = (i * 45 - 22.5 - 90) * (Math.PI / 180);
              const endAngle = ((i + 1) * 45 - 22.5 - 90) * (Math.PI / 180);
              const rOuter = 140;
              const x1 = 160 + rOuter * Math.cos(startAngle);
              const y1 = 160 + rOuter * Math.sin(startAngle);
              const x2 = 160 + rOuter * Math.cos(endAngle);
              const y2 = 160 + rOuter * Math.sin(endAngle);

              const outerFill =
                slice.color === 'GOLD'
                  ? '#FDE047'
                  : slice.color === 'LIGHT'
                  ? '#FCE7F3'
                  : '#F472B6';

              const innerFill =
                slice.color === 'GOLD'
                  ? '#F59E0B'
                  : slice.color === 'LIGHT'
                  ? '#DB2777'
                  : '#701A75';

              // Inner ring wedge for the multiplier number (matches video's dual-ring wheel!)
              const rMid = 86;
              const mx1 = 160 + rMid * Math.cos(startAngle);
              const my1 = 160 + rMid * Math.sin(startAngle);
              const mx2 = 160 + rMid * Math.cos(endAngle);
              const my2 = 160 + rMid * Math.sin(endAngle);

              return (
                <g key={slice.index}>
                  {/* Outer Ring Wedge (Coin / Crown Graphics) */}
                  <path
                    d={`M160,160 L${x1},${y1} A${rOuter},${rOuter} 0 0,1 ${x2},${y2} Z`}
                    fill={outerFill}
                    stroke="#FBBF24"
                    strokeWidth="2.5"
                  />
                  {/* Inner Ring Wedge (Numbers 10, 2, 1, 3, 1, 5, 2, 1) */}
                  <path
                    d={`M160,160 L${mx1},${my1} A${rMid},${rMid} 0 0,1 ${mx2},${my2} Z`}
                    fill={innerFill}
                    stroke="#FBBF24"
                    strokeWidth="2"
                  />
                  {/* Slice Content Rotated to Slice Angle */}
                  <g transform={`rotate(${i * 45} 160 160)`}>
                    {/* Outer Coin Stack Icon */}
                    <circle cx="160" cy="48" r="15" fill="#FBBF24" stroke="#92400E" strokeWidth="2" />
                    <path
                      d="M160,38 L163,44 L170,45 L165,50 L166,57 L160,53 L154,57 L155,50 L150,45 L157,44 Z"
                      fill="#EC4899"
                    />
                    {slice.coins >= 3 && (
                      <circle cx="171" cy="54" r="10" fill="#FDE047" stroke="#92400E" strokeWidth="1.5" />
                    )}
                    {/* Inner Ring Number */}
                    <text
                      x="160"
                      y="104"
                      textAnchor="middle"
                      fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
                      fontWeight="700"
                      fontSize="21"
                      fill="#FFFFFF"
                      stroke="#4A044E"
                      strokeWidth="4"
                      style={{ paintOrder: 'stroke fill' }}
                    >
                      {slice.label}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Gold Divider Ring between Inner and Outer Wheel */}
            <circle cx="160" cy="160" r="86" fill="none" stroke="url(#wheelGoldRim)" strokeWidth="4" />

            {/* Rim Pegs */}
            {WHEEL_SLICES.map((_, i) => {
              const a = ((i * 45 - 22.5 - 90) * Math.PI) / 180;
              return (
                <circle
                  key={i}
                  cx={160 + 148 * Math.cos(a)}
                  cy={160 + 148 * Math.sin(a)}
                  r="4.5"
                  fill="#FFFBEB"
                  stroke="#92400E"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Center Glossy Pink & Gold Star Hub */}
            <circle cx="160" cy="160" r="36" fill="url(#wheelGoldRim)" stroke="#78350F" strokeWidth="3" />
            <circle cx="160" cy="160" r="28" fill="url(#hubPink)" />
            <path
              d="M160,140 L165,152 L178,154 L168,162 L171,175 L160,168 L149,175 L152,162 L142,154 L155,152 Z"
              fill="#FDE047"
              stroke="#92400E"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      </div>

      {/* Bottom Glossy Gold "Spin" Button */}
      <div className="relative z-10 mb-4 w-full max-w-[260px]">
        <button
          type="button"
          onClick={handleSpin}
          disabled={phase === 'SPINNING'}
          className="group relative h-14 w-full cursor-pointer rounded-full border-2 border-amber-100 bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600 shadow-[0_6px_0_#92400E,0_12px_20px_rgba(0,0,0,0.4)] transition-transform active:translate-y-1 disabled:opacity-75"
        >
          <span className="pointer-events-none absolute inset-x-4 top-1 h-3.5 rounded-full bg-white/60" />
          <span className="relative font-['Fredoka'] text-xl font-bold tracking-wide text-amber-950">
            {phase === 'SPINNING' ? 'Spinning...' : 'Spin'}
          </span>
        </button>
      </div>
    </div>
  );
};
