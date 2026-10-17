/**
 * Pure game rules, gacha probability engine, wheel physics math,
 * sticker fusion logic, and spring kinematics for Sticker Gacha.
 */

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGEND';

export interface StickerDef {
  id: string;
  name: string;
  rarity: Rarity;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fuseTarget: number;
  baseValue: number;
}

export interface StickerCollectionEntry {
  stickerId: string;
  count: number;
  level: number;
  unlockedAt: number;
}

export interface BadgeDef {
  id: string;
  title: string;
  subtitle: string;
  iconType: 'STAR_CROWN' | 'HEART_WINGS' | 'LUCKY_CHEST' | 'MASTER_COLLECTOR';
  unlocked: boolean;
}

export interface WheelSlice {
  index: number;
  coins: number;
  label: string;
  color: 'LIGHT' | 'DARK' | 'GOLD';
  weight: number;
}

export interface GachaPullOutcome {
  reels: [number, number, number];
  initialRarity: Rarity;
  upgradedRarity: Rarity;
  didUpgrade: boolean;
  sticker: StickerDef;
  triggeredLuckyPick: boolean;
  newLuckyMeter: number;
}

export const STICKER_CATALOG: StickerDef[] = [
  {
    id: 'heart-beat',
    name: 'Heart Beat',
    rarity: 'RARE',
    tagline: 'Fluttering crystal heart with angel wings',
    primaryColor: '#FF4791',
    secondaryColor: '#7CE8FF',
    accentColor: '#FFE066',
    fuseTarget: 3,
    baseValue: 250,
  },
  {
    id: 'lucky-star',
    name: 'Lucky Star',
    rarity: 'LEGEND',
    tagline: 'Celestial shooting star with rainbow orbit ring',
    primaryColor: '#FFD93D',
    secondaryColor: '#A855F7',
    accentColor: '#60A5FA',
    fuseTarget: 3,
    baseValue: 1000,
  },
  {
    id: 'cosmic-kitty',
    name: 'Cosmic Kitty',
    rarity: 'EPIC',
    tagline: 'Dreamy nebula kitten riding a lavender crescent',
    primaryColor: '#C084FC',
    secondaryColor: '#F472B6',
    accentColor: '#FEF08A',
    fuseTarget: 3,
    baseValue: 500,
  },
  {
    id: 'sugar-cloud',
    name: 'Sugar Cloud',
    rarity: 'COMMON',
    tagline: 'Fluffy cotton-candy cloud with golden sprinkles',
    primaryColor: '#F9A8D4',
    secondaryColor: '#E9D5FF',
    accentColor: '#FDE047',
    fuseTarget: 3,
    baseValue: 100,
  },
  {
    id: 'royal-crown',
    name: 'Royal Crown',
    rarity: 'EPIC',
    tagline: 'Beveled ruby & gold crown of the Sky Kingdom',
    primaryColor: '#FBBF24',
    secondaryColor: '#EC4899',
    accentColor: '#FFFBEB',
    fuseTarget: 3,
    baseValue: 550,
  },
  {
    id: 'moon-prism',
    name: 'Moon Prism',
    rarity: 'RARE',
    tagline: 'Iridescent diamond brooch bathed in starlight',
    primaryColor: '#38BDF8',
    secondaryColor: '#F43F5E',
    accentColor: '#FDE047',
    fuseTarget: 3,
    baseValue: 280,
  },
  {
    id: 'rainbow-pegasus',
    name: 'Rainbow Pegasus',
    rarity: 'LEGEND',
    tagline: 'Mythic winged steed of the Remea Cloud Sanctuary',
    primaryColor: '#F472B6',
    secondaryColor: '#34D399',
    accentColor: '#FBBF24',
    fuseTarget: 3,
    baseValue: 1250,
  },
  {
    id: 'berry-macaron',
    name: 'Berry Macaron',
    rarity: 'COMMON',
    tagline: 'Sweet glossy patisserie treat with star filling',
    primaryColor: '#FB7185',
    secondaryColor: '#FDE68A',
    accentColor: '#FFF1F2',
    fuseTarget: 3,
    baseValue: 120,
  },
];

// 8 slices matching the video's Lucky Spin wheel:
// Numbers visible on the inner ring: 10, 2, 1, 3, 1, 5, 2, 1
export const WHEEL_SLICES: WheelSlice[] = [
  { index: 0, coins: 10, label: '10', color: 'GOLD', weight: 6 },
  { index: 1, coins: 2, label: '2', color: 'LIGHT', weight: 22 },
  { index: 2, coins: 1, label: '1', color: 'DARK', weight: 20 },
  { index: 3, coins: 3, label: '3', color: 'LIGHT', weight: 14 },
  { index: 4, coins: 1, label: '1', color: 'DARK', weight: 16 },
  { index: 5, coins: 5, label: '5', color: 'LIGHT', weight: 8 },
  { index: 6, coins: 2, label: '2', color: 'DARK', weight: 18 },
  { index: 7, coins: 1, label: '1', color: 'LIGHT', weight: 16 },
];

export const INITIAL_BADGES: BadgeDef[] = [
  {
    id: 'badge-first-pull',
    title: 'Dream Puller',
    subtitle: 'Pull your first Gacha sticker pack',
    iconType: 'HEART_WINGS',
    unlocked: false,
  },
  {
    id: 'badge-legend',
    title: 'Legend',
    subtitle: 'Pull a Legend sticker',
    iconType: 'STAR_CROWN',
    unlocked: false,
  },
  {
    id: 'badge-lucky-chest',
    title: 'Chest Breaker',
    subtitle: 'Unlock a Lucky Pick treasure chest',
    iconType: 'LUCKY_CHEST',
    unlocked: false,
  },
  {
    id: 'badge-fuser',
    title: 'Star Fuser',
    subtitle: 'Collect 3 copies of any sticker to Fuse',
    iconType: 'MASTER_COLLECTOR',
    unlocked: false,
  },
];

/**
 * Computes the exact target rotation in degrees for the Lucky Spin wheel
 * so that `sliceIndex` lands directly under the top heart pointer (0 deg / 12 o'clock).
 */
export function computeWheelTargetAngle(
  currentAngleDeg: number,
  sliceIndex: number,
  extraSpins: number = 5
): number {
  const numSlices = WHEEL_SLICES.length;
  const sliceAngle = 360 / numSlices; // 45 degrees per slice
  const clampedIndex = ((sliceIndex % numSlices) + numSlices) % numSlices;
  // Slice 0 is centered at top (0 deg). Moving clockwise by angle theta brings slice i (at i * 45 deg)
  // to top when (theta + i * 45) % 360 === 0 => theta % 360 === (360 - i * 45) % 360
  const desiredMod = (360 - clampedIndex * sliceAngle) % 360;
  const currentMod = ((currentAngleDeg % 360) + 360) % 360;
  let delta = desiredMod - currentMod;
  if (delta <= 0) {
    delta += 360;
  }
  return currentAngleDeg + extraSpins * 360 + delta;
}

/**
 * Selects a deterministic or weighted slice from WHEEL_SLICES.
 * Notice in the reference video, the first spin lands on "+2" (sliceIndex 1)!
 */
export function pickWheelSlice(spinCount: number, rand: number = Math.random()): WheelSlice {
  // First spin when out of coins deterministically gives +2 coins (sliceIndex 1) just like the video!
  if (spinCount === 0) {
    return WHEEL_SLICES[1];
  }
  const totalWeight = WHEEL_SLICES.reduce((acc, s) => acc + s.weight, 0);
  let r = Math.max(0, Math.min(0.999999, rand)) * totalWeight;
  for (const slice of WHEEL_SLICES) {
    if (r < slice.weight) {
      return slice;
    }
    r -= slice.weight;
  }
  return WHEEL_SLICES[1];
}

/**
 * Evaluates a Gacha pull and updates the Lucky Meter (0..5).
 * Matches the video showcase progression:
 * - Pull #1: Reels spin -> drops Pink Pack -> UPGRADE! flash -> Rare "Heart Beat" sticker (1/3 Fuse)
 * - Pull #2 (or when Lucky Pick triggers): Opens Lucky Pick chest -> Legend "Lucky Star" -> unlocks "Legend" badge!
 */
export function evaluateGachaPull(
  pullNumber: number,
  currentLuckyMeter: number,
  rand: number = Math.random()
): GachaPullOutcome {
  // Video fidelity: Pull #0 (first pull) always demonstrates the dramatic UPGRADE! to Rare "Heart Beat"
  if (pullNumber === 0) {
    const heartBeat = STICKER_CATALOG.find((s) => s.id === 'heart-beat')!;
    return {
      reels: [1, 1, 1],
      initialRarity: 'COMMON',
      upgradedRarity: 'RARE',
      didUpgrade: true,
      sticker: heartBeat,
      triggeredLuckyPick: false,
      newLuckyMeter: Math.min(5, currentLuckyMeter + 2),
    };
  }

  // Pull #1 (second pull) or when lucky meter reaches >= 4 triggers Lucky Pick chest -> Legend "Lucky Star"
  if (pullNumber === 1 || currentLuckyMeter >= 4) {
    const luckyStar = STICKER_CATALOG.find((s) => s.id === 'lucky-star')!;
    return {
      reels: [3, 3, 3],
      initialRarity: 'EPIC',
      upgradedRarity: 'LEGEND',
      didUpgrade: true,
      sticker: luckyStar,
      triggeredLuckyPick: true,
      newLuckyMeter: 0,
    };
  }

  // General pulls with weighted rarity & upgrade chance
  const nextLucky = currentLuckyMeter + 1;
  const triggeredLuckyPick = nextLucky >= 5;

  let initialRarity: Rarity = 'COMMON';
  let upgradedRarity: Rarity = 'COMMON';
  let didUpgrade = false;

  if (triggeredLuckyPick || rand > 0.82) {
    initialRarity = 'EPIC';
    upgradedRarity = rand > 0.88 ? 'LEGEND' : 'EPIC';
    didUpgrade = upgradedRarity !== initialRarity;
  } else if (rand > 0.45) {
    initialRarity = 'COMMON';
    upgradedRarity = 'RARE';
    didUpgrade = true;
  } else {
    initialRarity = 'COMMON';
    upgradedRarity = 'COMMON';
    didUpgrade = false;
  }

  const pool = STICKER_CATALOG.filter((s) => s.rarity === upgradedRarity);
  const chosen = pool[Math.floor(rand * pool.length) % pool.length] || STICKER_CATALOG[0];
  const symbolIdx =
    upgradedRarity === 'LEGEND' ? 3 : upgradedRarity === 'EPIC' ? 2 : upgradedRarity === 'RARE' ? 1 : 0;

  return {
    reels: [symbolIdx, symbolIdx, symbolIdx],
    initialRarity,
    upgradedRarity,
    didUpgrade,
    sticker: chosen,
    triggeredLuckyPick,
    newLuckyMeter: triggeredLuckyPick ? 0 : Math.min(5, nextLucky),
  };
}

/**
 * Adds a pulled sticker to the player's collection and calculates fuse progression.
 */
export function addStickerToCollection(
  collection: Record<string, StickerCollectionEntry>,
  sticker: StickerDef,
  now: number = Date.now()
): {
  updated: Record<string, StickerCollectionEntry>;
  entry: StickerCollectionEntry;
  isNew: boolean;
  didFuseLevelUp: boolean;
} {
  const existing = collection[sticker.id];
  const isNew = !existing;
  const prevCount = existing ? existing.count : 0;
  const prevLevel = existing ? existing.level : 1;
  const nextCount = prevCount + 1;

  let nextLevel = prevLevel;
  let didFuseLevelUp = false;
  if (nextCount > 0 && nextCount % sticker.fuseTarget === 0) {
    nextLevel += 1;
    didFuseLevelUp = true;
  }

  const entry: StickerCollectionEntry = {
    stickerId: sticker.id,
    count: nextCount,
    level: nextLevel,
    unlockedAt: existing ? existing.unlockedAt : now,
  };

  return {
    updated: {
      ...collection,
      [sticker.id]: entry,
    },
    entry,
    isNew,
    didFuseLevelUp,
  };
}

/**
 * Second-order Reanimated-style spring physics step for 60fps squash-and-stretch.
 */
export interface SpringState {
  value: number;
  velocity: number;
  target: number;
}

export function stepSpring(
  state: SpringState,
  stiffness: number = 220,
  damping: number = 16,
  dt: number = 1 / 60
): SpringState {
  const clampedDt = Math.min(dt, 0.05);
  const displacement = state.value - state.target;
  const springForce = -stiffness * displacement;
  const dampingForce = -damping * state.velocity;
  const acceleration = springForce + dampingForce;
  const nextVelocity = state.velocity + acceleration * clampedDt;
  const nextValue = state.value + nextVelocity * clampedDt;

  if (Math.abs(nextVelocity) < 0.0005 && Math.abs( state.target - nextValue ) < 0.0005) {
    return { value: state.target, velocity: 0, target: state.target };
  }
  return {
    value: nextValue,
    velocity: nextVelocity,
    target: state.target,
  };
}

/**
 * Quadratic / Cubic Bezier interpolation for flying coin and badge trails.
 */
export function evaluateCubicBezier2D(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const u = Math.max(0, Math.min(1, t));
  const inv = 1 - u;
  const b0 = inv * inv * inv;
  const b1 = 3 * inv * inv * u;
  const b2 = 3 * inv * u * u;
  const b3 = u * u * u;
  return {
    x: b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x,
    y: b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y,
  };
}

/**
 * Daily Login Streak & First-Spin-of-the-Day Bonus System.
 */
export interface DailyLoginState {
  streakCount: number;
  lastLoginDate: string; // YYYY-MM-DD
  lastBonusSpinDate: string | null; // YYYY-MM-DD
  bonusAvailableToday: boolean;
  bonusCoinsAmount: number;
}

export function computeDaysBetweenDateKeys(prevDateKey: string, currentDateKey: string): number {
  const prev = Date.parse(`${prevDateKey}T00:00:00Z`);
  const curr = Date.parse(`${currentDateKey}T00:00:00Z`);
  if (Number.isNaN(prev) || Number.isNaN(curr)) return 0;
  return Math.round((curr - prev) / (1000 * 60 * 60 * 24));
}

export function evaluateDailyLogin(
  stored: Partial<DailyLoginState> | null | undefined,
  todayKey: string
): DailyLoginState {
  if (!stored || !stored.lastLoginDate) {
    const streakCount = 1;
    return {
      streakCount,
      lastLoginDate: todayKey,
      lastBonusSpinDate: null,
      bonusAvailableToday: true,
      bonusCoinsAmount: Math.min(5, streakCount),
    };
  }

  const diffDays = computeDaysBetweenDateKeys(stored.lastLoginDate, todayKey);
  let streakCount = stored.streakCount || 1;

  if (diffDays === 1) {
    streakCount += 1;
  } else if (diffDays > 1 || diffDays < 0) {
    streakCount = 1;
  }

  const lastBonusSpinDate = stored.lastBonusSpinDate || null;
  const bonusAvailableToday = lastBonusSpinDate !== todayKey;
  const bonusCoinsAmount = Math.min(5, Math.max(1, streakCount));

  return {
    streakCount,
    lastLoginDate: todayKey,
    lastBonusSpinDate,
    bonusAvailableToday,
    bonusCoinsAmount,
  };
}

export function claimDailySpinBonus(
  state: DailyLoginState,
  todayKey: string
): {
  updatedState: DailyLoginState;
  bonusGranted: number;
} {
  if (!state.bonusAvailableToday || state.lastBonusSpinDate === todayKey) {
    return {
      updatedState: { ...state, bonusAvailableToday: false },
      bonusGranted: 0,
    };
  }

  return {
    updatedState: {
      ...state,
      lastBonusSpinDate: todayKey,
      bonusAvailableToday: false,
    },
    bonusGranted: state.bonusCoinsAmount,
  };
}

/**
 * Rarity-specific 3D particle burst configuration when the foil pack drops onto the pedestal.
 */
export interface RarityParticleConfig {
  rarity: Rarity;
  count: number;
  primaryHex: number;
  secondaryHex: number;
  emissiveHex: number;
  burstSpeed: number;
  particleScale: number;
  label: string;
}

export function getRarityParticleConfig(rarity: Rarity): RarityParticleConfig {
  switch (rarity) {
    case 'LEGEND':
      return {
        rarity: 'LEGEND',
        count: 36,
        primaryHex: 0xfde047, // Gold glitter
        secondaryHex: 0xf59e0b,
        emissiveHex: 0xfbbf24,
        burstSpeed: 3.4,
        particleScale: 1.35,
        label: 'Gold Glitter',
      };
    case 'EPIC':
      return {
        rarity: 'EPIC',
        count: 28,
        primaryHex: 0xe879f9, // Arcane violet-magenta crystals
        secondaryHex: 0xa855f7,
        emissiveHex: 0xd946ef,
        burstSpeed: 2.8,
        particleScale: 1.15,
        label: 'Cosmic Crystals',
      };
    case 'RARE':
      return {
        rarity: 'RARE',
        count: 24,
        primaryHex: 0x7ce8ff, // Cyan & rose-pink sparkles
        secondaryHex: 0xff4791,
        emissiveHex: 0x38bdf8,
        burstSpeed: 2.5,
        particleScale: 1.05,
        label: 'Cyan & Pink Sparkles',
      };
    case 'COMMON':
    default:
      return {
        rarity: 'COMMON',
        count: 16,
        primaryHex: 0xfbcfe8, // Soft pastel star puffs
        secondaryHex: 0xe9d5ff,
        emissiveHex: 0xf472b6,
        burstSpeed: 1.9,
        particleScale: 0.85,
        label: 'Pastel Starlight',
      };
  }
}

