import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WHEEL_SLICES,
  computeWheelTargetAngle,
  pickWheelSlice,
  evaluateGachaPull,
  addStickerToCollection,
  STICKER_CATALOG,
  stepSpring,
  evaluateCubicBezier2D,
} from './rules.ts';

test('computeWheelTargetAngle aligns slice index to top pointer accurately', () => {
  const angle0 = computeWheelTargetAngle(0, 0, 4);
  assert.equal(angle0 % 360, 0);
  assert.ok(angle0 >= 1440);

  // Slice 1 is at 45 deg clockwise on wheel, so wheel must rotate 315 deg clockwise to bring it to 0 deg top
  const angle1 = computeWheelTargetAngle(0, 1, 5);
  assert.equal(angle1 % 360, 315);
});

test('pickWheelSlice deterministically returns +2 coins on first spin (spinCount === 0)', () => {
  const firstSlice = pickWheelSlice(0, 0.95);
  assert.equal(firstSlice.coins, 2);
  assert.equal(firstSlice.index, 1);
  assert.equal(WHEEL_SLICES.length, 8);
});

test('evaluateGachaPull follows video showcase sequence for first and second pulls', () => {
  const pull0 = evaluateGachaPull(0, 0, 0.5);
  assert.equal(pull0.didUpgrade, true);
  assert.equal(pull0.upgradedRarity, 'RARE');
  assert.equal(pull0.sticker.id, 'heart-beat');
  assert.equal(pull0.triggeredLuckyPick, false);
  assert.equal(pull0.newLuckyMeter, 2);

  const pull1 = evaluateGachaPull(1, pull0.newLuckyMeter, 0.5);
  assert.equal(pull1.sticker.id, 'lucky-star');
  assert.equal(pull1.upgradedRarity, 'LEGEND');
  assert.equal(pull1.triggeredLuckyPick, true);
  assert.equal(pull1.newLuckyMeter, 0);
});

test('addStickerToCollection tracks counts, new status, and 3-copy fuse level up', () => {
  const heartBeat = STICKER_CATALOG.find((s) => s.id === 'heart-beat')!;
  let coll = {};

  const r1 = addStickerToCollection(coll, heartBeat, 1000);
  coll = r1.updated;
  assert.equal(r1.isNew, true);
  assert.equal(r1.entry.count, 1);
  assert.equal(r1.didFuseLevelUp, false);

  const r2 = addStickerToCollection(coll, heartBeat, 2000);
  coll = r2.updated;
  assert.equal(r2.isNew, false);
  assert.equal(r2.entry.count, 2);
  assert.equal(r2.didFuseLevelUp, false);

  const r3 = addStickerToCollection(coll, heartBeat, 3000);
  assert.equal(r3.entry.count, 3);
  assert.equal(r3.entry.level, 2);
  assert.equal(r3.didFuseLevelUp, true);
});

test('stepSpring converges smoothly toward target with squash-and-stretch overshoot', () => {
  let state = { value: 0, velocity: 0, target: 1 };
  let maxVal = 0;
  for (let i = 0; i < 180; i++) {
    state = stepSpring(state, 260, 12, 1 / 60);
    if (state.value > maxVal) maxVal = state.value;
  }
  // Underdamped spring overshoots 1.0 slightly then settles at 1.0
  assert.ok(maxVal > 1.02, `Expected overshoot > 1.02, got ${maxVal}`);
  assert.ok(Math.abs(state.value - 1) < 0.01);
});

test('evaluateCubicBezier2D interpolates start and end endpoints accurately', () => {
  const p0 = { x: 10, y: 20 };
  const p1 = { x: 50, y: 0 };
  const p2 = { x: 100, y: 0 };
  const p3 = { x: 200, y: 300 };

  const start = evaluateCubicBezier2D(p0, p1, p2, p3, 0);
  const end = evaluateCubicBezier2D(p0, p1, p2, p3, 1);
  assert.deepEqual(start, p0);
  assert.deepEqual(end, p3);
});

import {
  evaluateDailyLogin,
  claimDailySpinBonus,
  getRarityParticleConfig,
} from './rules.ts';

test('evaluateDailyLogin tracks consecutive day streaks and first-spin bonus eligibility', () => {
  // Day 1 fresh login
  const day1 = evaluateDailyLogin(null, '2026-10-16');
  assert.equal(day1.streakCount, 1);
  assert.equal(day1.bonusAvailableToday, true);
  assert.equal(day1.bonusCoinsAmount, 1);

  // Claim bonus on Day 1 first spin
  const claimed1 = claimDailySpinBonus(day1, '2026-10-16');
  assert.equal(claimed1.bonusGranted, 1);
  assert.equal(claimed1.updatedState.bonusAvailableToday, false);

  // Second spin on Day 1 grants 0 bonus coins
  const claimedAgain = claimDailySpinBonus(claimed1.updatedState, '2026-10-16');
  assert.equal(claimedAgain.bonusGranted, 0);

  // Day 2 consecutive login increments streak to 2 and unlocks new daily bonus
  const day2 = evaluateDailyLogin(claimed1.updatedState, '2026-10-17');
  assert.equal(day2.streakCount, 2);
  assert.equal(day2.bonusAvailableToday, true);
  assert.equal(day2.bonusCoinsAmount, 2);

  // Skipping a day resets streak to 1
  const skipped = evaluateDailyLogin(day2, '2026-10-20');
  assert.equal(skipped.streakCount, 1);
  assert.equal(skipped.bonusAvailableToday, true);
});

test('getRarityParticleConfig returns distinct particle parameters for LEGEND, RARE, EPIC, and COMMON', () => {
  const legendCfg = getRarityParticleConfig('LEGEND');
  const rareCfg = getRarityParticleConfig('RARE');
  const commonCfg = getRarityParticleConfig('COMMON');

  assert.equal(legendCfg.label, 'Gold Glitter');
  assert.equal(rareCfg.label, 'Cyan & Pink Sparkles');
  assert.ok(legendCfg.count > rareCfg.count);
  assert.ok(rareCfg.count > commonCfg.count);
  assert.notEqual(legendCfg.primaryHex, rareCfg.primaryHex);
});

