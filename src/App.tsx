import React, { useState, useEffect, useRef } from 'react';
import {
  STICKER_CATALOG,
  INITIAL_BADGES,
  StickerDef,
  StickerCollectionEntry,
  BadgeDef,
  evaluateGachaPull,
  addStickerToCollection,
  DailyLoginState,
  evaluateDailyLogin,
  claimDailySpinBonus,
} from './game/rules';
import { soundEngine } from './game/audio';
import {
  StickerGachaLogo,
  StarCoinIcon,
  StickerArtSvg,
  LegendBadgeSvg,
} from './components/StickerArt';
import { SkiaShaderBackdrop } from './components/SkiaShaderBackdrop';
import { GachaMachine3DCanvas } from './components/GachaMachine3D';
import { LuckySpinModal } from './components/LuckySpinModal';
import { LuckyPickChestModal } from './components/LuckyPickChestModal';
import { PackRevealOverlay, NewBadgeModal } from './components/PackRevealOverlay';
import { MyStickersDrawer } from './components/MyStickersDrawer';
import { FlyingRewardLayer, FlyingItem } from './components/FlyingRewardLayer';
import {
  Home,
  Volume2,
  VolumeX,
  Sliders,
  Sparkles,
  Layers,
  Eye,
  RotateCcw,
  ChevronRight,
  Box,
} from 'lucide-react';

type ActiveModal =
  | 'NONE'
  | 'LUCKY_SPIN'
  | 'PACK_REVEAL'
  | 'LUCKY_PICK_CHEST'
  | 'NEW_BADGE'
  | 'MY_STICKERS';

const DAILY_LOGIN_STORAGE_KEY = 'sticker_gacha_daily_login_v1';

export default function App() {
  // Core Game State matching the reference video journey (starts at 0 coins -> "Out of coins - spin the lucky wheel")
  const [coins, setCoins] = useState<number>(0);
  const [spinCount, setSpinCount] = useState<number>(0);
  const [pullCount, setPullCount] = useState<number>(0);
  const [luckyMeter, setLuckyMeter] = useState<number>(2); // 2/5 stars initially as seen at 00:01

  // Daily Login Streak & First-Spin-of-the-Day Bonus System
  const [dailyLogin, setDailyLogin] = useState<DailyLoginState>(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    try {
      const raw = localStorage.getItem(DAILY_LOGIN_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as DailyLoginState) : null;
      return evaluateDailyLogin(parsed, todayStr);
    } catch {
      return evaluateDailyLogin(null, todayStr);
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(DAILY_LOGIN_STORAGE_KEY, JSON.stringify(dailyLogin));
    } catch {
      // Ignore storage quota errors in restricted frames
    }
  }, [dailyLogin]);

  // 3D Gacha Machine State
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [pullTriggerCount, setPullTriggerCount] = useState<number>(0);
  const [targetReels, setTargetReels] = useState<[number, number, number]>([0, 0, 0]);
  const [packDropped, setPackDropped] = useState<boolean>(false);

  // Pending Pull Outcome & Collection State
  const [activeModal, setActiveModal] = useState<ActiveModal>('NONE');
  const [currentOutcome, setCurrentOutcome] = useState<{
    sticker: StickerDef;
    entry: StickerCollectionEntry;
    isNew: boolean;
    didUpgrade: boolean;
    skipPackTear: boolean;
  } | null>(null);

  const [collection, setCollection] = useState<Record<string, StickerCollectionEntry>>({});
  const [badges, setBadges] = useState<BadgeDef[]>(INITIAL_BADGES);
  const [pendingBadge, setPendingBadge] = useState<BadgeDef | null>(null);

  // Dynamic Island Toast ("New Sticker Pack! Lucky Star - Legend" at 00:34) & Gift Box "+1" Pop
  const [islandToast, setIslandToast] = useState<string | null>(null);
  const [giftPlusOne, setGiftPlusOne] = useState<boolean>(false);
  const [lastPulledStickerId, setLastPulledStickerId] = useState<string | null>(null);

  // Flying Bezier Reward Trails
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

  // Audio & Blender MCP / Skia Studio Controls (Desktop Showcase & Inspector)
  const [muted, setMuted] = useState<boolean>(false);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [explodedFactor, setExplodedFactor] = useState<number>(0);
  const [cameraPreset, setCameraPreset] = useState<'DEFAULT' | 'CLOSEUP' | 'TOP_ANGLE' | 'BACK_VIEW'>('DEFAULT');
  const [showMobileInspector, setShowMobileInspector] = useState<boolean>(false);

  const phoneFrameRef = useRef<HTMLDivElement | null>(null);

  // Mirror state to document.body.dataset.state for automated verification
  useEffect(() => {
    document.body.dataset.state = activeModal === 'NONE' ? 'playing' : activeModal.toLowerCase();
  }, [activeModal]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.muted = next;
  };

  const handleClaimDailyBonus = (): number => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const res = claimDailySpinBonus(dailyLogin, todayStr);
    setDailyLogin(res.updatedState);
    return res.bonusGranted;
  };

  // Triggered when user clicks "Get coins" (when coins === 0) or the Spin Wheel shortcut
  const handleOpenLuckySpin = () => {
    soundEngine.playPop(1.05);
    setActiveModal('LUCKY_SPIN');
  };

  // Triggered when user collects coins from Lucky Spin reward screen (00:08 -> 00:11)
  const handleCollectSpinCoins = (coinsWon: number) => {
    setActiveModal('NONE');
    setSpinCount((c) => c + 1);

    // Spawn flying coins from center of phone frame to top-right coin counter
    const items: FlyingItem[] = Array.from({ length: Math.min(coinsWon, 5) }, (_, i) => ({
      id: `coin-${Date.now()}-${i}`,
      type: 'COIN',
      startX: 195,
      startY: 460,
      endX: 334,
      endY: 64,
      delayMs: i * 110,
      durationMs: 680,
    }));
    setFlyingItems(items);

    setTimeout(() => {
      soundEngine.playCoinChime(2);
      setCoins((c) => c + coinsWon);
      setFlyingItems([]);
    }, 650);
  };

  // Triggered when user pulls the 3D Gacha Machine Lever or clicks "Pull! (1 Coin)"
  const handlePullGacha = () => {
    if (isPulling) return;

    if (coins <= 0) {
      handleOpenLuckySpin();
      return;
    }

    // Physical haptic vibration when the lever is pulled
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([35, 20, 55]);
    }

    soundEngine.playLeverPull();
    setCoins((c) => Math.max(0, c - 1));
    setIsPulling(true);
    setPackDropped(false);
    setPullTriggerCount((c) => c + 1);

    const outcome = evaluateGachaPull(pullCount, luckyMeter);
    setTargetReels(outcome.reels);
    setPullCount((p) => p + 1);
    setLuckyMeter(outcome.newLuckyMeter);

    const added = addStickerToCollection(collection, outcome.sticker);
    setCollection(added.updated);

    // Unlock badges if criteria met
    let newlyUnlockedBadge: BadgeDef | null = null;
    const nextBadges = badges.map((b) => {
      if (b.unlocked) return b;
      if (b.id === 'badge-first-pull') {
        return { ...b, unlocked: true };
      }
      if (b.id === 'badge-legend' && outcome.sticker.rarity === 'LEGEND') {
        newlyUnlockedBadge = { ...b, unlocked: true };
        return newlyUnlockedBadge;
      }
      if (b.id === 'badge-lucky-chest' && outcome.triggeredLuckyPick) {
        return { ...b, unlocked: true };
      }
      if (b.id === 'badge-fuser' && added.didFuseLevelUp) {
        return { ...b, unlocked: true };
      }
      return b;
    });

    setBadges(nextBadges);
    if (newlyUnlockedBadge) {
      setPendingBadge(newlyUnlockedBadge);
    }

    setCurrentOutcome({
      sticker: outcome.sticker,
      entry: added.entry,
      isNew: added.isNew,
      didUpgrade: outcome.didUpgrade,
      skipPackTear: outcome.triggeredLuckyPick,
    });

    // After reels lock in (1.15s), eject the 3D Foil Sticker Pack onto the pedestal (00:13)
    setTimeout(() => {
      soundEngine.playPop(1.3);
      // Physical haptic vibration when the 3D pack hits the pedestal
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([60, 30, 90]);
      }
      setPackDropped(true);
    }, 1150);

    // Automatically transition into the Pack Tear / Lucky Pick Chest sequence (00:14 or 00:21)
    setTimeout(() => {
      setIsPulling(false);
      setPackDropped(false);
      if (outcome.triggeredLuckyPick) {
        setActiveModal('LUCKY_PICK_CHEST');
      } else {
        setActiveModal('PACK_REVEAL');
      }
    }, 1850);
  };

  // Triggered when user finishes the 3-chest Lucky Pick bonus round (00:29 -> 00:30)
  const handleChestUnlocked = () => {
    setActiveModal('PACK_REVEAL');
  };

  // Triggered when user clicks "Collect" on the Sticker Reveal Card (00:18 or 00:33)
  const handleCollectSticker = () => {
    const outcome = currentOutcome;
    setActiveModal('NONE');
    if (!outcome) return;

    setLastPulledStickerId(outcome.sticker.id);

    // Show Dynamic Island notification banner ("New Sticker Pack! Lucky Star - Legend" at 00:34)
    setIslandToast(`New Sticker Pack! · ${outcome.sticker.name} - ${outcome.sticker.rarity}`);
    setTimeout(() => setIslandToast(null), 3200);

    // Fly sticker down into the bottom-right "MY STICKERS" gift box (00:19, 00:34)
    const flySticker: FlyingItem = {
      id: `sticker-fly-${Date.now()}`,
      type: 'STICKER',
      stickerId: outcome.sticker.id,
      startX: 195,
      startY: 360,
      endX: 325,
      endY: 735,
      delayMs: 0,
      durationMs: 620,
    };
    setFlyingItems([flySticker]);

    setTimeout(() => {
      soundEngine.playPop(1.4);
      setGiftPlusOne(true);
      setFlyingItems([]);
      setTimeout(() => setGiftPlusOne(false), 1100);

      // If a Legend badge was unlocked (00:35), shoot the Crowned Star Badge from bottom-left to center!
      if (pendingBadge) {
        const badgeFly: FlyingItem = {
          id: `badge-fly-${Date.now()}`,
          type: 'BADGE',
          startX: 55,
          startY: 740,
          endX: 195,
          endY: 380,
          delayMs: 0,
          durationMs: 700,
        };
        setFlyingItems([badgeFly]);
        soundEngine.playUpgradeFlash();

        setTimeout(() => {
          setFlyingItems([]);
          setActiveModal('NEW_BADGE');
        }, 720);
      }
    }, 640);
  };

  const handleDismissNewBadge = () => {
    setPendingBadge(null);
    setActiveModal('NONE');
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-gradient-to-br from-[#2E1065] via-[#4C1D95] to-[#1E0538] font-['Plus_Jakarta_Sans'] text-white select-none lg:flex-row lg:gap-12 lg:px-10 lg:py-6">
      {/* LEFT DESKTOP SHOWCASE COLUMN (Visible on lg+ 1440px desktop viewports, matches 00:40 showcase layout) */}
      <section className="hidden max-w-md flex-col justify-between lg:flex">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wider text-pink-300 uppercase">
            <span>Expo · React Native · Skia · Reanimated · Three.js</span>
          </div>

          <div className="-ml-4 mb-2">
            <StickerGachaLogo className="w-80" />
          </div>

          <h1
            className="font-['Fredoka'] text-4xl font-bold tracking-tight text-white"
            style={{ textWrap: 'balance' }}
          >
            One more pull?
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-purple-200">
            Experience 60fps glossy 3D bevels, volume-preserving squash-and-stretch spring physics,
            custom Skia/WebGPU runtime shaders, and cubic-bezier reward trails.
          </p>
        </div>

        {/* Interactive Storyboard / Video Chapters Quick-Jump Panel */}
        <div className="mt-6 rounded-3xl border border-white/15 bg-purple-950/60 p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="font-['Fredoka'] text-base font-bold text-pink-200">
              Interactive Game Flow & Chapters
            </span>
            <span className="font-mono text-xs text-purple-300 tabular-nums">
              Coins: {coins} · Pulls: {pullCount}
            </span>
          </div>

          <div className="mt-3.5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleOpenLuckySpin}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-pink-400/30 bg-purple-900/50 px-3.5 py-2.5 text-left text-xs font-bold text-white transition-colors hover:bg-purple-800/70 whitespace-nowrap shrink-0"
            >
              <span>1. Lucky Spin (+2)</span>
              <ChevronRight className="h-4 w-4 text-pink-300" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (coins === 0) setCoins(2);
                setTimeout(() => handlePullGacha(), 60);
              }}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-pink-400/30 bg-purple-900/50 px-3.5 py-2.5 text-left text-xs font-bold text-white transition-colors hover:bg-purple-800/70 whitespace-nowrap shrink-0"
            >
              <span>2. Pull Gacha Machine</span>
              <ChevronRight className="h-4 w-4 text-pink-300" />
            </button>

            <button
              type="button"
              onClick={() => {
                const luckyStar = STICKER_CATALOG.find((s) => s.id === 'lucky-star')!;
                const added = addStickerToCollection(collection, luckyStar);
                setCollection(added.updated);
                setCurrentOutcome({
                  sticker: luckyStar,
                  entry: added.entry,
                  isNew: added.isNew,
                  didUpgrade: true,
                  skipPackTear: true,
                });
                const legendBadge = badges.find((b) => b.id === 'badge-legend')!;
                setPendingBadge({ ...legendBadge, unlocked: true });
                setBadges((prev) =>
                  prev.map((b) => (b.id === 'badge-legend' ? { ...b, unlocked: true } : b))
                );
                setActiveModal('LUCKY_PICK_CHEST');
              }}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-amber-400/30 bg-purple-900/50 px-3.5 py-2.5 text-left text-xs font-bold text-amber-200 transition-colors hover:bg-purple-800/70 whitespace-nowrap shrink-0"
            >
              <span>3. Lucky Pick Chests</span>
              <ChevronRight className="h-4 w-4 text-amber-300" />
            </button>

            <button
              type="button"
              onClick={() => setActiveModal('MY_STICKERS')}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-purple-400/30 bg-purple-900/50 px-3.5 py-2.5 text-left text-xs font-bold text-purple-100 transition-colors hover:bg-purple-800/70 whitespace-nowrap shrink-0"
            >
              <span>4. My Stickers ({Object.keys(collection).length}/8)</span>
              <ChevronRight className="h-4 w-4 text-purple-300" />
            </button>
          </div>
        </div>

        {/* Blender MCP & Three.js Live 3D Scene Inspector */}
        <div className="mt-4 rounded-3xl border border-white/15 bg-purple-950/60 p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-amber-300" />
              <span className="font-['Fredoka'] text-sm font-bold text-white">
                Blender MCP · Three.js 3D Mesh Inspector
              </span>
            </div>
            <span className="font-mono text-[11px] text-purple-300">12-Part Group · PBR</span>
          </div>

          {/* Exploded View Slider */}
          <div className="mt-3.5">
            <div className="flex items-center justify-between text-xs text-purple-200">
              <span>Exploded Assembly View</span>
              <span className="font-mono tabular-nums">{Math.round(explodedFactor * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={explodedFactor}
              onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
              aria-label="Exploded Assembly View"
              className="mt-1.5 h-2 w-full cursor-pointer accent-pink-500"
            />
          </div>

          {/* Camera & Wireframe Controls */}
          <div className="mt-3.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWireframe((w) => !w)}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                wireframe
                  ? 'bg-pink-500 text-white'
                  : 'bg-purple-900/60 text-purple-200 hover:bg-purple-800/70'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Wireframe</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setCameraPreset((p) =>
                  p === 'DEFAULT'
                    ? 'BACK_VIEW'
                    : p === 'BACK_VIEW'
                    ? 'CLOSEUP'
                    : p === 'CLOSEUP'
                    ? 'TOP_ANGLE'
                    : 'DEFAULT'
                )
              }
              className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-purple-900/60 py-2 text-xs font-bold text-purple-200 transition-colors hover:bg-purple-800/70 whitespace-nowrap shrink-0"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Cam: {cameraPreset}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setWireframe(false);
                setExplodedFactor(0);
                setCameraPreset('DEFAULT');
              }}
              aria-label="Reset 3D View"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-purple-900/60 text-purple-200 hover:bg-purple-800/70"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* CENTER / RIGHT INTERACTIVE MOBILE GAME VIEWPORT (Full-screen on mobile 390x844, sleek iPhone 16 Pro frame on desktop) */}
      <section
        ref={phoneFrameRef}
        className="relative flex h-[100dvh] w-full max-w-[430px] flex-col justify-between overflow-hidden lg:h-[820px] lg:w-[390px] lg:rounded-[52px] lg:border-[10px] lg:border-[#2A1B3D] lg:shadow-[0_28px_80px_rgba(0,0,0,0.75),0_0_0_2px_rgba(255,255,255,0.18)]"
      >
        {/* 1. Custom Skia/WebGPU Procedural Cloud & Sunset Shader Backdrop */}
        <SkiaShaderBackdrop mode="IDLE_CLOUDS" />

        {/* 2. Top iOS Status Bar + Dynamic Island Notification Banner (00:34 in video) */}
        <div className="relative z-30 flex w-full items-center justify-between px-6 pt-3 text-xs font-bold text-white">
          <span className="tabular-nums drop-shadow">09:41</span>

          {/* Dynamic Island */}
          <div
            className={`flex items-center justify-center rounded-full bg-black text-white shadow-lg transition-all duration-300 ${
              islandToast ? 'px-4 py-1.5 min-w-[235px]' : 'h-6 w-24'
            }`}
          >
            {islandToast && (
              <div className="flex items-center gap-2 text-[11px] font-bold text-amber-200 whitespace-nowrap">
                <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{islandToast}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 drop-shadow">
            <span className="text-[10px]">5G</span>
            <div className="h-3 w-5 rounded-[4px] border border-white p-0.5">
              <div className="h-full w-full rounded-[2px] bg-emerald-400" />
            </div>
          </div>
        </div>

        {/* 3. Top Game HUD: Sticker Gacha Logo + Right Coin Pill & Circular Action Stack (00:01 & 00:11) */}
        <div className="relative z-20 flex w-full items-start justify-between px-4 pt-2">
          {/* Left 360° Front/Back Quick Orbit Pill */}
          <div className="flex w-12 shrink-0 flex-col items-start pt-1">
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop(1.05);
                setCameraPreset((p) => (p === 'BACK_VIEW' ? 'DEFAULT' : 'BACK_VIEW'));
              }}
              aria-label="Toggle 360 Back View"
              data-testid="toggle-360-btn"
              className="flex h-10 w-10 cursor-pointer flex-col items-center justify-center rounded-full border-2 border-purple-200/80 bg-gradient-to-b from-purple-500 via-purple-700 to-purple-950 text-white shadow-[0_4px_0_#1E0538] transition-transform active:scale-90"
            >
              <RotateCcw className="h-3.5 w-3.5 stroke-[2.5]" />
              <span className="font-['Fredoka'] text-[8px] font-bold leading-none text-amber-200">
                360°
              </span>
            </button>
          </div>

          {/* Centered 3D "Sticker Gacha" Cloud Logo */}
          <div className="-mt-1 flex flex-col items-center justify-center">
            <StickerGachaLogo className="h-24 w-52 shrink-0" />
          </div>

          {/* Right Vertical Stack: Coin Pill + Home, Mute, Spin/Inspector Buttons */}
          <div className="flex flex-col items-end gap-2">
            {/* Coin Counter Pill */}
            <button
              type="button"
              onClick={handleOpenLuckySpin}
              aria-label={`Coins: ${coins}. Open Lucky Spin`}
              data-testid="coin-counter-pill"
              className="flex h-9 min-w-[66px] cursor-pointer items-center justify-between gap-1.5 rounded-full border-2 border-purple-200/80 bg-purple-950/80 px-2.5 py-1 shadow-[0_4px_0_#1E0538] transition-transform active:scale-95"
            >
              <StarCoinIcon size={22} />
              <span className="font-['Fredoka'] text-base font-bold text-white tabular-nums">
                {coins}
              </span>
            </button>

            {/* Circular Glossy Pink Icon Buttons (matching right stack in video) */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop(1.0);
                setActiveModal('NONE');
                setCameraPreset('DEFAULT');
              }}
              aria-label="Home Screen"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-pink-100 bg-gradient-to-b from-pink-400 via-pink-500 to-rose-600 text-white shadow-[0_4px_0_#831843] transition-transform active:scale-90"
            >
              <Home className="h-4 w-4 stroke-[2.5]" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-pink-100 bg-gradient-to-b from-pink-400 via-pink-500 to-rose-600 text-white shadow-[0_4px_0_#831843] transition-transform active:scale-90"
            >
              {muted ? (
                <VolumeX className="h-4 w-4 stroke-[2.5]" />
              ) : (
                <Volume2 className="h-4 w-4 stroke-[2.5]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowMobileInspector((s) => !s)}
              aria-label="Toggle 3D Mesh Inspector"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-pink-100 bg-gradient-to-b from-pink-400 via-pink-500 to-rose-600 text-white shadow-[0_4px_0_#831843] transition-transform active:scale-90"
            >
              <Sliders className="h-4 w-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Optional Compact 3D Inspector Bar inside Mobile Viewport when toggled */}
        {showMobileInspector && (
          <div className="relative z-30 mx-4 mt-1 flex items-center justify-between gap-2 rounded-2xl border border-white/25 bg-purple-950/85 px-3 py-2 text-xs">
            <button
              type="button"
              onClick={() => setWireframe((w) => !w)}
              className="cursor-pointer rounded-lg bg-pink-500/80 px-2.5 py-1 font-bold text-white whitespace-nowrap"
            >
              {wireframe ? 'Solid PBR' : 'Wireframe'}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={explodedFactor}
              onChange={(e) => setExplodedFactor(parseFloat(e.target.value))}
              aria-label="Mobile Exploded View Slider"
              className="w-24 accent-pink-400"
            />
            <button
              type="button"
              onClick={() =>
                setCameraPreset((p) =>
                  p === 'DEFAULT' ? 'BACK_VIEW' : p === 'BACK_VIEW' ? 'CLOSEUP' : 'DEFAULT'
                )
              }
              className="cursor-pointer rounded-lg bg-purple-800 px-2.5 py-1 font-bold text-purple-100 whitespace-nowrap"
            >
              {cameraPreset}
            </button>
          </div>
        )}

        {/* 4. CENTER 3D GACHA SLOT MACHINE ON FLOATING CLOUD ISLAND (Synchronized 3D Body + 360° Drag Orbit) */}
        <div className="relative z-10 -my-4 flex flex-1 items-center justify-center">
          <GachaMachine3DCanvas
            coins={coins}
            isPulling={isPulling}
            pullTriggerCount={pullTriggerCount}
            targetReels={targetReels}
            packDropped={packDropped}
            packRarity={currentOutcome?.sticker.rarity || 'RARE'}
            wireframe={wireframe}
            explodedFactor={explodedFactor}
            cameraPreset={cameraPreset}
            onLeverClick={handlePullGacha}
            onPackClick={() => setActiveModal('PACK_REVEAL')}
          />

          {/* "PULL!" Floating 3D Speech Bubble next to 3D Lever when player has coins */}
          {coins > 0 && !isPulling && cameraPreset !== 'BACK_VIEW' && (
            <button
              type="button"
              onClick={handlePullGacha}
              data-testid="lever-pull-bubble"
              className="absolute top-[24%] right-[14%] z-20 animate-bounce cursor-pointer rounded-2xl border-2 border-pink-300 bg-gradient-to-b from-white via-pink-50 to-pink-200 px-3.5 py-1 font-['Fredoka'] text-xs font-extrabold tracking-wider text-pink-600 shadow-[0_5px_0_#9D174D,0_10px_16px_rgba(0,0,0,0.35)]"
            >
              PULL!
            </button>
          )}

          {/* Clean Single-Line 360° Drag-to-Rotate Hint Pill at top of 3D stage */}
          <div className="pointer-events-none absolute top-1 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/25 bg-purple-950/65 px-3 py-0.5 text-[10px] font-bold tracking-wider text-purple-100 uppercase whitespace-nowrap shadow">
            <RotateCcw className="h-3 w-3 text-amber-300 shrink-0" />
            <span>
              {cameraPreset === 'BACK_VIEW' ? 'Rear Vault View · Drag 360°' : 'Drag Machine to Rotate 360°'}
            </span>
          </div>
        </div>

        {/* 5. BOTTOM ACTION ZONE + LUCKY METER + "MY STICKERS" 3D GIFT BOX (00:01, 00:11, 00:19, 00:34) */}
        <div className="relative z-20 flex w-full flex-col items-center px-5 pb-6">
          {/* Primary CTA: Either "Out of coins - spin the lucky wheel" + "Get coins" OR "Pull Gacha (1 Coin)" */}
          {coins === 0 ? (
            <div className="mb-4 flex w-full flex-col items-center">
              <p
                data-testid="out-of-coins-prompt"
                className="mb-2.5 text-center font-['Plus_Jakarta_Sans'] text-xs font-bold tracking-wide text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.65)]"
              >
                Out of coins - spin the lucky wheel
              </p>
              <button
                type="button"
                data-start="true"
                onClick={handleOpenLuckySpin}
                className="group relative h-14 w-60 cursor-pointer rounded-full border-2 border-amber-100 bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600 shadow-[0_7px_0_#92400E,0_14px_26px_rgba(0,0,0,0.5)] transition-transform active:translate-y-1"
              >
                <span className="pointer-events-none absolute inset-x-5 top-1 h-3.5 rounded-full bg-white/70" />
                <span className="relative font-['Fredoka'] text-xl font-bold tracking-wide text-amber-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]">
                  Get coins
                </span>
              </button>
            </div>
          ) : (
            <div className="mb-4 flex w-full flex-col items-center">
              <p className="mb-2 text-center text-xs font-bold text-amber-200 drop-shadow">
                Tap the 3D Lever or Pull Button to roll!
              </p>
              <button
                type="button"
                onClick={handlePullGacha}
                disabled={isPulling}
                data-testid="pull-gacha-btn"
                className="group relative flex h-14 w-60 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-pink-100 bg-gradient-to-b from-pink-400 via-rose-500 to-pink-700 shadow-[0_7px_0_#831843,0_14px_26px_rgba(0,0,0,0.5)] transition-transform active:translate-y-1 disabled:opacity-70"
              >
                <span className="pointer-events-none absolute inset-x-5 top-1 h-3.5 rounded-full bg-white/55" />
                <StarCoinIcon size={24} />
                <span className="relative font-['Fredoka'] text-xl font-bold tracking-wide text-white drop-shadow-[0_2px_0_#831843]">
                  {isPulling ? 'Rolling...' : 'Pull! (1 Coin)'}
                </span>
              </button>
            </div>
          )}

          {/* Bottom Bar: Left "LUCKY ★ ★ ★ ★ ★" 3D Pill & Right "MY STICKERS" 3D Gift Box */}
          <div className="flex w-full items-end justify-between">
            {/* Left Lucky Meter 3D Beveled Pill (00:01 & 00:34) */}
            <div className="flex items-center gap-2">
              {badges.some((b) => b.id === 'badge-legend' && b.unlocked) && (
                <button
                  type="button"
                  onClick={() => setActiveModal('MY_STICKERS')}
                  aria-label="View Unlocked Legend Badge"
                  className="-mr-1 cursor-pointer transition-transform hover:scale-110"
                >
                  <LegendBadgeSvg className="h-11 w-11 drop-shadow-[0_5px_8px_rgba(0,0,0,0.45)]" />
                </button>
              )}
              <div
                data-testid="lucky-meter-pill"
                className="relative flex items-center gap-1.5 rounded-full border-2 border-purple-200/60 bg-gradient-to-b from-purple-900/90 to-purple-950/95 px-3.5 py-1.5 shadow-[0_5px_0_#1E0538,0_10px_18px_rgba(0,0,0,0.45),inset_0_2px_4px_rgba(0,0,0,0.6)]"
              >
                <span className="font-['Fredoka'] text-[11px] font-bold tracking-wider text-purple-200 uppercase drop-shadow">
                  LUCKY
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((starIdx) => {
                    const active = starIdx <= luckyMeter;
                    return (
                      <svg
                        key={starIdx}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className={active ? 'drop-shadow-[0_2px_0_#92400E]' : ''}
                      >
                        <path
                          d="M12,2 L15,9 L22,9.5 L16.5,14.5 L18,22 L12,18 L6,22 L7.5,14.5 L2,9.5 L9,9 Z"
                          fill={active ? '#FDE047' : 'rgba(192,132,252,0.28)'}
                          stroke={active ? '#B45309' : 'rgba(255,255,255,0.15)'}
                          strokeWidth="1.8"
                        />
                      </svg>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right "MY STICKERS" Sculpted 3D Purple & Gold Gift Box with "+1" Pop & Peek Sticker (00:19, 00:34) */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop(1.05);
                setActiveModal('MY_STICKERS');
              }}
              data-testid="my-stickers-btn"
              className="group relative flex cursor-pointer flex-col items-center transition-transform hover:scale-105 active:translate-y-0.5"
            >
              {/* "+1" Floating Glossy Pop when a sticker lands in the box (00:34) */}
              {giftPlusOne && (
                <div className="pointer-events-none absolute -top-9 z-30 animate-bounce font-['Fredoka'] text-2xl font-extrabold text-pink-300 drop-shadow-[0_3px_0_#831843]">
                  +1
                </div>
              )}

              {/* Peeking Sticker inside 3D Gift Box */}
              <div className="pointer-events-none -mb-5 z-10 transition-transform group-hover:-translate-y-1.5">
                <StickerArtSvg
                  stickerId={lastPulledStickerId || 'heart-beat'}
                  className="h-12 w-12 drop-shadow-[0_6px_8px_rgba(0,0,0,0.4)]"
                />
              </div>

              {/* Sculpted 3D Beveled Purple & Gold Ribbon Gift Box SVG */}
              <svg viewBox="0 0 110 82" className="h-15 w-22 overflow-visible drop-shadow-[0_8px_14px_rgba(0,0,0,0.5)]">
                <defs>
                  <linearGradient id="giftBoxBody3D" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#C084FC" />
                    <stop offset="45%" stopColor="#9333EA" />
                    <stop offset="100%" stopColor="#581C87" />
                  </linearGradient>
                  <linearGradient id="giftBoxLid3D" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E9D5FF" />
                    <stop offset="35%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#6B21A8" />
                  </linearGradient>
                  <linearGradient id="giftGoldRibbon3D" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="50%" stopColor="#FACC15" />
                    <stop offset="100%" stopColor="#CA8A04" />
                  </linearGradient>
                </defs>
                {/* 3D Base Extrusion Lip */}
                <rect x="16" y="30" width="78" height="46" rx="11" fill="#3B0764" />
                {/* Main 3D Box Hull */}
                <rect
                  x="16"
                  y="24"
                  width="78"
                  height="46"
                  rx="11"
                  fill="url(#giftBoxBody3D)"
                  stroke="#FDE047"
                  strokeWidth="3.5"
                />
                {/* Vertical Gold 3D Ribbon */}
                <rect x="48" y="24" width="14" height="46" fill="url(#giftGoldRibbon3D)" />
                {/* Lid Drop Shadow */}
                <rect x="11" y="19" width="88" height="15" rx="7" fill="#3B0764" opacity="0.7" />
                {/* 3D Overhanging Box Lid */}
                <rect
                  x="11"
                  y="14"
                  width="88"
                  height="15"
                  rx="7"
                  fill="url(#giftBoxLid3D)"
                  stroke="#FDE047"
                  strokeWidth="3.5"
                />
                {/* Lid Top Specular Highlight */}
                <rect x="18" y="16.5" width="74" height="3.5" rx="2" fill="#FFFFFF" opacity="0.55" />
                <rect x="47" y="14" width="16" height="15" fill="url(#giftGoldRibbon3D)" />
                {/* Sculpted 3D Gold Ribbon Bow */}
                <path
                  d="M55,14 C38,-2 24,7 36,16 C44,21 55,14 55,14 C55,14 66,21 74,16 C86,7 72,-2 55,14 Z"
                  fill="url(#giftGoldRibbon3D)"
                  stroke="#92400E"
                  strokeWidth="2.8"
                />
                <circle cx="55" cy="14" r="4.5" fill="#FEF08A" stroke="#92400E" strokeWidth="2" />
              </svg>

              {/* "MY STICKERS" 3D Extruded Pill Label */}
              <div className="relative -mt-2.5 z-20 rounded-full border-2 border-purple-100 bg-gradient-to-b from-fuchsia-400 via-purple-600 to-purple-900 px-3.5 py-0.5 shadow-[0_4px_0_#3B0764,0_8px_14px_rgba(0,0,0,0.4)]">
                <span className="pointer-events-none absolute inset-x-2 top-0.5 h-1.5 rounded-full bg-white/45" />
                <span className="relative font-['Fredoka'] text-[10px] font-bold tracking-wider text-white uppercase whitespace-nowrap drop-shadow-[0_1px_0_#3B0764]">
                  MY STICKERS
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 6. OVERLAYS & MODALS (Lucky Spin, Lucky Pick Chests, Pack Reveal, New Badge, My Stickers) */}
        {activeModal === 'LUCKY_SPIN' && (
          <LuckySpinModal
            spinCount={spinCount}
            streakCount={dailyLogin.streakCount}
            dailyBonusAvailable={dailyLogin.bonusAvailableToday}
            dailyBonusCoins={dailyLogin.bonusCoinsAmount}
            onClaimDailyBonus={handleClaimDailyBonus}
            onClose={() => setActiveModal('NONE')}
            onCollectCoins={handleCollectSpinCoins}
          />
        )}

        {activeModal === 'LUCKY_PICK_CHEST' && (
          <LuckyPickChestModal onComplete={handleChestUnlocked} />
        )}

        {activeModal === 'PACK_REVEAL' && currentOutcome && (
          <PackRevealOverlay
            sticker={currentOutcome.sticker}
            collectionEntry={currentOutcome.entry}
            isNew={currentOutcome.isNew}
            didUpgrade={currentOutcome.didUpgrade}
            skipPackTear={currentOutcome.skipPackTear}
            onCollect={handleCollectSticker}
          />
        )}

        {activeModal === 'NEW_BADGE' && pendingBadge && (
          <NewBadgeModal
            badgeTitle={pendingBadge.title}
            badgeSubtitle={pendingBadge.subtitle}
            onContinue={handleDismissNewBadge}
          />
        )}

        {activeModal === 'MY_STICKERS' && (
          <MyStickersDrawer
            collection={collection}
            badges={badges}
            onClose={() => setActiveModal('NONE')}
          />
        )}

        {/* 7. 60FPS CUBIC-BEZIER FLYING REWARD TRAILS */}
        <FlyingRewardLayer items={flyingItems} />
      </section>
    </main>
  );
}
