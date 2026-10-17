import React, { useState } from 'react';
import {
  STICKER_CATALOG,
  StickerCollectionEntry,
  BadgeDef,
  Rarity,
} from '../game/rules';
import { StickerArtSvg, LegendBadgeSvg } from './StickerArt';
import { SkiaShaderBackdrop } from './SkiaShaderBackdrop';
import { X, Sparkles, Award } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface MyStickersDrawerProps {
  collection: Record<string, StickerCollectionEntry>;
  badges: BadgeDef[];
  onClose: () => void;
}

export const MyStickersDrawer: React.FC<MyStickersDrawerProps> = ({
  collection,
  badges,
  onClose,
}) => {
  const [tab, setTab] = useState<'STICKERS' | 'BADGES'>('STICKERS');
  const [rarityFilter, setRarityFilter] = useState<'ALL' | Rarity>('ALL');

  const filteredStickers = STICKER_CATALOG.filter((s) =>
    rarityFilter === 'ALL' ? true : s.rarity === rarityFilter
  );

  const totalUnlocked = Object.keys(collection).length;

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col justify-between px-4 py-7"
      data-testid="my-stickers-drawer"
    >
      <SkiaShaderBackdrop mode="WHEEL_GLOW" />

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between pt-3">
        <button
          type="button"
          onClick={() => {
            soundEngine.playPop(0.95);
            onClose();
          }}
          aria-label="Close Sticker Book"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-pink-200 bg-gradient-to-b from-pink-400 to-pink-600 text-white shadow-[0_3px_0_#831843] active:scale-95"
        >
          <X className="h-5 w-5 stroke-[3]" />
        </button>

        <div className="text-center">
          <h2 className="font-['Fredoka'] text-2xl font-bold tracking-wide text-white drop-shadow-[0_2px_0_#3B0764]">
            My Sticker Book
          </h2>
          <p className="text-xs font-semibold text-pink-200 tabular-nums">
            {totalUnlocked} / {STICKER_CATALOG.length} Collected
          </p>
        </div>

        <div className="w-10" />
      </div>

      {/* Interactive Segmented Tab Bar */}
      <div className="relative z-10 mt-3 flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-purple-950/70 p-1">
        <button
          type="button"
          onClick={() => {
            soundEngine.playPop(1.05);
            setTab('STICKERS');
          }}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 font-['Fredoka'] text-sm font-bold transition-colors whitespace-nowrap shrink-0 ${
            tab === 'STICKERS'
              ? 'bg-gradient-to-b from-pink-400 to-rose-600 text-white shadow'
              : 'text-purple-200 hover:text-white'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Stickers ({totalUnlocked}/{STICKER_CATALOG.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            soundEngine.playPop(1.05);
            setTab('BADGES');
          }}
          className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 font-['Fredoka'] text-sm font-bold transition-colors whitespace-nowrap shrink-0 ${
            tab === 'BADGES'
              ? 'bg-gradient-to-b from-amber-300 to-amber-500 text-amber-950 shadow'
              : 'text-purple-200 hover:text-white'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Badges ({badges.filter((b) => b.unlocked).length}/{badges.length})</span>
        </button>
      </div>

      {tab === 'STICKERS' && (
        <>
          {/* Rarity Filter Strip */}
          <div className="relative z-10 mt-2.5 flex items-center justify-center gap-1">
            {(['ALL', 'LEGEND', 'EPIC', 'RARE', 'COMMON'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRarityFilter(r)}
                className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition-colors whitespace-nowrap shrink-0 ${
                  rarityFilter === r
                    ? 'bg-white text-purple-950 shadow-sm'
                    : 'bg-purple-900/50 text-purple-200 hover:bg-purple-800/60'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* 2-Column Scrollable Sticker Grid */}
          <div className="relative z-10 mt-3 grid flex-1 grid-cols-2 gap-3 overflow-y-auto pr-1 pb-2">
            {filteredStickers.map((sticker) => {
              const entry = collection[sticker.id];
              const unlocked = Boolean(entry);
              const fuseProgress = entry ? ((entry.count - 1) % sticker.fuseTarget) + 1 : 0;

              return (
                <div
                  key={sticker.id}
                  className={`flex flex-col items-center justify-between rounded-2xl border-2 p-3 transition-transform ${
                    unlocked
                      ? 'border-pink-300/80 bg-purple-900/65 shadow-[0_6px_0_rgba(59,7,100,0.7)]'
                      : 'border-white/15 bg-purple-950/45 opacity-60'
                  }`}
                >
                  <div className="flex w-full items-center justify-between text-[11px] font-bold text-pink-200">
                    <span>{sticker.rarity}</span>
                    {unlocked && (
                      <span className="tabular-nums text-amber-300">Lv.{entry.level}</span>
                    )}
                  </div>

                  <div className={`my-1 ${unlocked ? '' : 'grayscale contrast-50'}`}>
                    <StickerArtSvg stickerId={sticker.id} className="h-24 w-24" />
                  </div>

                  <div className="w-full text-center">
                    <div className="font-['Fredoka'] text-sm font-bold text-white truncate">
                      {sticker.name}
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full border border-white/40 bg-purple-950">
                      <div
                        className="h-full bg-gradient-to-r from-pink-400 to-amber-300"
                        style={{
                          width: unlocked ? `${(fuseProgress / sticker.fuseTarget) * 100}%` : '0%',
                        }}
                      />
                    </div>
                    <div className="mt-0.5 text-[10px] font-semibold text-purple-200 tabular-nums">
                      {unlocked ? `Owned: ${entry.count} · Fuse ${fuseProgress}/${sticker.fuseTarget}` : 'Locked'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'BADGES' && (
        <div className="relative z-10 mt-3 flex flex-1 flex-col gap-3 overflow-y-auto pr-1 pb-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`flex items-center gap-3.5 rounded-2xl border-2 p-3.5 ${
                badge.unlocked
                  ? 'border-amber-300/90 bg-purple-900/75 shadow-[0_5px_0_rgba(59,7,100,0.75)]'
                  : 'border-white/15 bg-purple-950/50 opacity-65'
              }`}
            >
              <div className={badge.unlocked ? '' : 'grayscale'}>
                <LegendBadgeSvg className="h-16 w-16 shrink-0" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-['Fredoka'] text-base font-bold text-white">
                    {badge.title}
                  </h3>
                  <span className="text-xs font-extrabold text-amber-300">
                    {badge.unlocked ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-purple-200">{badge.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
