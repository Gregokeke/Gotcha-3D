import React from 'react';
import { Rarity } from '../game/rules';

/**
 * Custom inline SVG Sticker Gacha Logo, Stickers, Coins, Keys, Chests, and Badges
 * crafted with glossy 3D bevels, thick cartoon borders, and specular highlights.
 */

export const StickerGachaLogo: React.FC<{ className?: string }> = ({ className = 'w-64' }) => {
  const uid = React.useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 360 155" className={`select-none overflow-visible ${className}`} aria-label="Sticker Gacha Logo">
      <defs>
        <linearGradient id={`stickerGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF0F7" />
          <stop offset="22%" stopColor="#FF75B5" />
          <stop offset="68%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#9D174D" />
        </linearGradient>
        <linearGradient id={`gachaGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5D0FE" />
          <stop offset="28%" stopColor="#D946EF" />
          <stop offset="70%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#581C87" />
        </linearGradient>
        <linearGradient id={`cloudBackGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="50%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
      </defs>

      <g>
        {/* Fluffy cloud backing silhouette */}
        <path
          d="M52,95 C25,95 16,74 30,56 C24,36 48,22 68,30 C84,12 120,14 134,30 C152,18 186,20 198,36 C216,18 255,20 268,38 C292,28 320,42 316,66 C336,76 332,106 308,115 C312,132 288,144 264,138 C240,148 198,146 180,136 C160,146 116,146 98,136 C70,144 40,130 44,110 C26,108 26,95 52,95 Z"
          fill={`url(#cloudBackGrad-${uid})`}
          stroke="#FFFFFF"
          strokeWidth="4.5"
        />

      {/* Sparkles & Mini Stars around Logo */}
      <circle cx="48" cy="48" r="5" fill="#FDE047" />
      <circle cx="305" cy="45" r="6" fill="#FDE047" />
      <circle cx="318" cy="96" r="4.5" fill="#7DD3FC" />
      <path d="M82,22 L85,30 L93,33 L85,36 L82,44 L79,36 L71,33 L79,30 Z" fill="#FFFBEB" />
      <path d="M276,18 L279,25 L286,28 L279,31 L276,38 L273,31 L266,28 L273,25 Z" fill="#FDE047" />

      {/* 3D Extrusion Shadow for "Sticker" */}
      <text
        x="180"
        y="74"
        textAnchor="middle"
        fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
        fontWeight="700"
        fontSize="50"
        letterSpacing="1"
        fill="#4A044E"
        stroke="#4A044E"
        strokeWidth="14"
        strokeLinejoin="round"
      >
        Sticker
      </text>
      {/* Main Glossy Fill for "Sticker" */}
      <text
        x="180"
        y="68"
        textAnchor="middle"
        fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
        fontWeight="700"
        fontSize="50"
        letterSpacing="1"
        fill={`url(#stickerGrad-${uid})`}
        stroke="#701A75"
        strokeWidth="8"
        strokeLinejoin="round"
        style={{ paintOrder: 'stroke fill' }}
      >
        Sticker
      </text>
      {/* Specular Highlight for "Sticker" */}
      <text
        x="180"
        y="66"
        textAnchor="middle"
        fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
        fontWeight="700"
        fontSize="50"
        letterSpacing="1"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeDasharray="12 18"
        opacity="0.85"
      >
        Sticker
      </text>

      {/* 3D Extrusion Shadow for "Gacha" */}
      <text
        x="180"
        y="128"
        textAnchor="middle"
        fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
        fontWeight="700"
        fontSize="62"
        letterSpacing="1.5"
        fill="#2E1065"
        stroke="#2E1065"
        strokeWidth="16"
        strokeLinejoin="round"
      >
        Gacha
      </text>
      {/* Main Glossy Fill for "Gacha" */}
      <text
        x="180"
        y="121"
        textAnchor="middle"
        fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
        fontWeight="700"
        fontSize="62"
        letterSpacing="1.5"
        fill={`url(#gachaGrad-${uid})`}
        stroke="#3B0764"
        strokeWidth="9"
        strokeLinejoin="round"
        style={{ paintOrder: 'stroke fill' }}
      >
        Gacha
      </text>
      {/* Top Specular Gloss on "Gacha" */}
      <text
        x="180"
        y="119"
        textAnchor="middle"
        fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
        fontWeight="700"
        fontSize="62"
        letterSpacing="1.5"
        fill="none"
        stroke="#FFF5FF"
        strokeWidth="2"
        strokeDasharray="16 22"
        opacity="0.85"
      >
        Gacha
      </text>
    </g>
  </svg>
  );
};

export const StarCoinIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" className={`select-none ${className}`} aria-hidden="true">
    <defs>
      <linearGradient id="coinGoldRim" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="30%" stopColor="#FDE047" />
        <stop offset="70%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="coinInnerFace" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="coinPinkStar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF85C0" />
        <stop offset="50%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#9D174D" />
      </linearGradient>
    </defs>
    {/* 3D Bottom Coin Edge */}
    <circle cx="32" cy="35" r="27" fill="#92400E" />
    {/* Main Gold Rim */}
    <circle cx="32" cy="30" r="27" fill="url(#coinGoldRim)" stroke="#78350F" strokeWidth="2.5" />
    {/* Coin Ridges */}
    <circle cx="32" cy="30" r="21" fill="url(#coinInnerFace)" stroke="#B45309" strokeWidth="2" />
    {/* Center Pink Star */}
    <path
      d="M32,13 L37,23 L48,24.5 L40,32 L42,43 L32,37.5 L22,43 L24,32 L16,24.5 L27,23 Z"
      fill="url(#coinPinkStar)"
      stroke="#831843"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Specular Shine */}
    <ellipse cx="22" cy="18" rx="6" ry="3" transform="rotate(-30 22 18)" fill="#FFFFFF" opacity="0.8" />
  </svg>
);

export const StickerArtSvg: React.FC<{ stickerId: string; className?: string }> = ({
  stickerId,
  className = 'w-44 h-44',
}) => {
  if (stickerId === 'heart-beat') {
    // Matches 00:17 Rare "Heart Beat" winged crystal heart sticker with thick cyan-white 3D sticker border
    return (
      <svg viewBox="0 0 220 200" className={`select-none overflow-visible ${className}`}>
        <defs>
          <linearGradient id="hbBorder" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#A5F3FC" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient id="hbHeart" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF99CC" />
            <stop offset="45%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#9D174D" />
          </linearGradient>
          <linearGradient id="hbWing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF1F2" />
            <stop offset="60%" stopColor="#FBCFE8" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
        </defs>
        {/* Floor Shadow */}
        <ellipse cx="110" cy="182" rx="54" ry="10" fill="#3B0764" opacity="0.38" />
        {/* 3D Die-Cut Sticker Base Extrusion */}
        <path
          d="M110,168 C65,142 20,105 22,60 C24,32 52,22 76,38 C92,48 102,55 110,64 C118,55 128,48 144,38 C168,22 196,32 198,60 C200,105 155,142 110,168 Z"
          fill="#0891B2"
          transform="translate(0, 9)"
        />
        {/* Glossy Die-Cut Sticker Backing */}
        <path
          d="M110,168 C65,142 20,105 22,60 C24,32 52,22 76,38 C92,48 102,55 110,64 C118,55 128,48 144,38 C168,22 196,32 198,60 C200,105 155,142 110,168 Z"
          fill="url(#hbBorder)"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* Left Angel Wing */}
        <path
          d="M84,92 C52,78 36,56 42,46 C48,38 68,46 86,62 C60,62 44,74 48,84 C52,92 68,94 84,96 C62,98 54,108 60,115 C66,122 82,118 92,112 Z"
          fill="url(#hbWing)"
          stroke="#9D174D"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Right Angel Wing */}
        <path
          d="M136,92 C168,78 184,56 178,46 C172,38 152,46 134,62 C160,62 176,74 172,84 C168,92 152,94 136,96 C158,98 166,108 160,115 C154,122 138,118 128,112 Z"
          fill="url(#hbWing)"
          stroke="#9D174D"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Faceted Gem Heart Center */}
        <path
          d="M110,148 C82,126 64,102 66,78 C68,60 85,52 98,62 C104,67 108,72 110,77 C112,72 116,67 122,62 C135,52 152,60 154,78 C156,102 138,126 110,148 Z"
          fill="url(#hbHeart)"
          stroke="#831843"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Crystal Facet Lines & Glossy Highlight */}
        <path d="M82,74 L110,96 L138,74" fill="none" stroke="#FFD1E8" strokeWidth="2.5" opacity="0.7" />
        <path d="M110,96 L110,144" fill="none" stroke="#FFD1E8" strokeWidth="2.5" opacity="0.6" />
        <ellipse cx="86" cy="74" rx="10" ry="5" transform="rotate(-28 86 74)" fill="#FFFFFF" opacity="0.9" />
      </svg>
    );
  }

  if (stickerId === 'lucky-star') {
    // Matches 00:32 Legend "Lucky Star" cute kawaii star with rainbow swirl orbit ring
    return (
      <svg viewBox="0 0 220 200" className={`select-none overflow-visible ${className}`}>
        <defs>
          <linearGradient id="lsBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="35%" stopColor="#FDE047" />
            <stop offset="80%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="lsOrbit" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="50%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
        </defs>
        <ellipse cx="110" cy="182" rx="56" ry="10" fill="#78350F" opacity="0.32" />
        {/* 3D Die-Cut Sticker Base */}
        <path
          d="M110,20 L134,58 L178,66 L148,100 L155,145 L110,126 L65,145 L72,100 L42,66 L86,58 Z"
          fill="#C084FC"
          stroke="#9333EA"
          strokeWidth="22"
          strokeLinejoin="round"
          transform="translate(0, 8)"
        />
        <path
          d="M110,20 L134,58 L178,66 L148,100 L155,145 L110,126 L65,145 L72,100 L42,66 L86,58 Z"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="18"
          strokeLinejoin="round"
        />
        {/* Rainbow Orbit Ring Back */}
        <ellipse
          cx="110"
          cy="94"
          rx="76"
          ry="26"
          transform="rotate(-22 110 94)"
          fill="none"
          stroke="url(#lsOrbit)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Golden Chubby 3D Star */}
        <path
          d="M110,28 L131,62 L170,69 L142,98 L148,138 L110,120 L72,138 L78,98 L50,69 L89,62 Z"
          fill="url(#lsBody)"
          stroke="#92400E"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        {/* Cute Kawaii Eyes & Blush */}
        <circle cx="94" cy="86" r="5.5" fill="#451A03" />
        <circle cx="92" cy="84" r="2" fill="#FFFFFF" />
        <circle cx="126" cy="86" r="5.5" fill="#451A03" />
        <circle cx="124" cy="84" r="2" fill="#FFFFFF" />
        <ellipse cx="83" cy="94" rx="6" ry="3.5" fill="#F43F5E" opacity="0.65" />
        <ellipse cx="137" cy="94" rx="6" ry="3.5" fill="#F43F5E" opacity="0.65" />
        <path d="M104,92 Q110,98 116,92" fill="none" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
        {/* Rainbow Orbit Front Highlight */}
        <path
          d="M42,122 C72,138 148,112 178,68"
          fill="none"
          stroke="#A5F3FC"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.9"
        />
        {/* Top Gloss */}
        <ellipse cx="102" cy="52" rx="11" ry="5" transform="rotate(-15 102 52)" fill="#FFFFFF" opacity="0.85" />
      </svg>
    );
  }

  // Stylized general sticker artwork for other catalog stickers
  return (
    <svg viewBox="0 0 220 200" className={`select-none overflow-visible ${className}`}>
      <defs>
        <linearGradient id={`stGrad-${stickerId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FF85C0" />
          <stop offset="50%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="182" rx="52" ry="10" fill="#3B0764" opacity="0.35" />
      <circle cx="110" cy="98" r="66" fill="#06B6D4" />
      <circle cx="110" cy="92" r="66" fill="#FFFFFF" stroke="#E0F2FE" strokeWidth="6" />
      <circle cx="110" cy="92" r="54" fill={`url(#stGrad-${stickerId})`} stroke="#581C87" strokeWidth="4" />
      {/* Crown / Gem Motif */}
      <path
        d="M72,112 L82,70 L110,92 L138,70 L148,112 Z"
        fill="#FDE047"
        stroke="#78350F"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="82" cy="64" r="6" fill="#F43F5E" />
      <circle cx="110" cy="58" r="8" fill="#38BDF8" />
      <circle cx="138" cy="64" r="6" fill="#F43F5E" />
      <ellipse cx="90" cy="56" rx="14" ry="5" transform="rotate(-25 90 56)" fill="#FFFFFF" opacity="0.75" />
    </svg>
  );
};

export const TreasureChestSvg: React.FC<{
  variant?: 'PINK' | 'PURPLE' | 'GOLD';
  isOpen?: boolean;
  className?: string;
}> = ({ variant = 'PURPLE', isOpen = false, className = 'w-28 h-28' }) => {
  const colors =
    variant === 'PINK'
      ? { top: '#FF75B5', body: '#DB2777', dark: '#831843' }
      : variant === 'GOLD'
      ? { top: '#FEF08A', body: '#D97706', dark: '#78350F' }
      : { top: '#C084FC', body: '#7E22CE', dark: '#3B0764' };

  return (
    <svg viewBox="0 0 160 150" className={`select-none overflow-visible ${className}`}>
      <defs>
        <linearGradient id={`chestGold-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="40%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id={`chestBody-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.top} />
          <stop offset="65%" stopColor={colors.body} />
          <stop offset="100%" stopColor={colors.dark} />
        </linearGradient>
      </defs>
      {/* Shadow */}
      <ellipse cx="80" cy="136" rx="56" ry="11" fill="#000000" opacity="0.45" />
      {/* Inner glow when opening */}
      {isOpen && (
        <ellipse cx="80" cy="68" rx="48" ry="26" fill="#FEF08A" opacity="0.9" />
      )}
      {/* Chest Lower Box */}
      <rect
        x="26"
        y="68"
        width="108"
        height="60"
        rx="14"
        fill={`url(#chestBody-${variant})`}
        stroke={`url(#chestGold-${variant})`}
        strokeWidth="8"
      />
      {/* Chest Upper Dome Lid */}
      <g transform={isOpen ? 'translate(0, -18) rotate(-8 80 60)' : ''}>
        <path
          d="M24,70 C24,34 46,24 80,24 C114,24 136,34 136,70 Z"
          fill={`url(#chestBody-${variant})`}
          stroke={`url(#chestGold-${variant})`}
          strokeWidth="8"
          strokeLinejoin="round"
        />
        {/* Vertical Gold Straps */}
        <rect x="52" y="26" width="12" height="44" rx="4" fill={`url(#chestGold-${variant})`} />
        <rect x="96" y="26" width="12" height="44" rx="4" fill={`url(#chestGold-${variant})`} />
        {/* Top Specular Highlight */}
        <ellipse cx="64" cy="40" rx="18" ry="6" fill="#FFFFFF" opacity="0.55" />
      </g>
      {/* Center Star Lock Plate */}
      <circle
        cx="80"
        cy="72"
        r="19"
        fill={`url(#chestGold-${variant})`}
        stroke="#78350F"
        strokeWidth="3"
      />
      <path
        d="M80,59 L84,67 L93,68 L86,74 L88,83 L80,78 L72,83 L74,74 L67,68 L76,67 Z"
        fill="#3B0764"
      />
    </svg>
  );
};

export const MagicStarKeySvg: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg viewBox="0 0 120 120" className={`select-none overflow-visible ${className}`}>
    <defs>
      <linearGradient id="keyGoldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="40%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="keyGemGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF85C0" />
        <stop offset="60%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#9D174D" />
      </linearGradient>
    </defs>
    <g transform="rotate(-35 60 60)">
      {/* Key Shaft & Teeth */}
      <rect x="54" y="58" width="12" height="48" rx="5" fill="url(#keyGoldGrad)" stroke="#78350F" strokeWidth="3" />
      <rect x="64" y="84" width="12" height="7" rx="3" fill="url(#keyGoldGrad)" stroke="#78350F" strokeWidth="2.5" />
      <rect x="64" y="95" width="15" height="8" rx="3" fill="url(#keyGoldGrad)" stroke="#78350F" strokeWidth="2.5" />
      {/* Star Bow Head */}
      <path
        d="M60,12 L71,32 L94,36 L77,52 L81,74 L60,63 L39,74 L43,52 L26,36 L49,32 Z"
        fill="url(#keyGoldGrad)"
        stroke="#78350F"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Pink Swirl Gem Center */}
      <circle cx="60" cy="46" r="13" fill="url(#keyGemGrad)" stroke="#831843" strokeWidth="2.5" />
      <ellipse cx="56" cy="41" rx="4" ry="2.5" fill="#FFFFFF" opacity="0.85" />
    </g>
  </svg>
);

export const LegendBadgeSvg: React.FC<{ className?: string }> = ({ className = 'w-32 h-32' }) => (
  <svg viewBox="0 0 160 160" className={`select-none overflow-visible ${className}`}>
    <defs>
      <linearGradient id="badgeStarGold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="35%" stopColor="#FDE047" />
        <stop offset="80%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      <linearGradient id="badgeHeartPink" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF99CC" />
        <stop offset="50%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#9D174D" />
      </linearGradient>
    </defs>
    {/* Mini Crown on Top of Star */}
    <path
      d="M62,32 L68,14 L80,24 L92,14 L98,32 Z"
      fill="url(#badgeStarGold)"
      stroke="#78350F"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    {/* Big Golden Star */}
    <path
      d="M80,26 L98,58 L135,64 L108,90 L114,127 L80,110 L46,127 L52,90 L25,64 L62,58 Z"
      fill="url(#badgeStarGold)"
      stroke="#78350F"
      strokeWidth="4.5"
      strokeLinejoin="round"
    />
    {/* Pink Heart Gem Inside */}
    <path
      d="M80,100 C64,88 54,74 55,62 C56,52 66,48 73,54 C77,57 79,60 80,63 C81,60 83,57 87,54 C94,48 104,52 105,62 C106,74 96,88 80,100 Z"
      fill="url(#badgeHeartPink)"
      stroke="#831843"
      strokeWidth="3"
    />
    <ellipse cx="69" cy="60" rx="5" ry="2.5" transform="rotate(-25 69 60)" fill="#FFFFFF" opacity="0.85" />
  </svg>
);

export const RarityHeaderBanner: React.FC<{ rarity: Rarity }> = ({ rarity }) => {
  const styles: Record<Rarity, { text: string; from: string; to: string; stroke: string }> = {
    COMMON: { text: 'COMMON!', from: '#E2E8F0', to: '#94A3B8', stroke: '#334155' },
    RARE: { text: 'RARE!', from: '#FF99CC', to: '#EC4899', stroke: '#831843' },
    EPIC: { text: 'EPIC!', from: '#E879F9', to: '#9333EA', stroke: '#4A044E' },
    LEGEND: { text: 'LEGEND!', from: '#FEF08A', to: '#F59E0B', stroke: '#78350F' },
  };
  const s = styles[rarity];
  return (
    <svg viewBox="0 0 260 70" className="w-56 h-16 select-none overflow-visible">
      <defs>
        <linearGradient id={`rarGrad-${rarity}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="30%" stopColor={s.from} />
          <stop offset="100%" stopColor={s.to} />
        </linearGradient>
      </defs>
      <text
        x="130"
        y="52"
        textAnchor="middle"
        fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
        fontWeight="700"
        fontSize="44"
        letterSpacing="1.5"
        fill={s.stroke}
        stroke={s.stroke}
        strokeWidth="12"
        strokeLinejoin="round"
      >
        {s.text}
      </text>
      <text
        x="130"
        y="47"
        textAnchor="middle"
        fontFamily="Fredoka, Plus Jakarta Sans, sans-serif"
        fontWeight="700"
        fontSize="44"
        letterSpacing="1.5"
        fill={`url(#rarGrad-${rarity})`}
        stroke={s.stroke}
        strokeWidth="7"
        strokeLinejoin="round"
        style={{ paintOrder: 'stroke fill' }}
      >
        {s.text}
      </text>
    </svg>
  );
};
