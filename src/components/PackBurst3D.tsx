import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Rarity, StickerDef, stepSpring, SpringState, getRarityParticleConfig } from '../game/rules';

export interface PackBurst3DProps {
  sticker: StickerDef;
  stage: 'PACK_BURST' | 'UPGRADE_FLASH' | 'STICKER_CARD';
  onTapPack?: () => void;
}

/**
 * Helper to paint the high-resolution sticker emblem onto a 2D canvas texture
 * for the 3D emerging sticker slab inside the foil pack.
 */
function createStickerSlabTexture(sticker: StickerDef): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;

  // Glossy radial card background based on rarity
  const bgGrad = ctx.createRadialGradient(256, 220, 30, 256, 256, 250);
  if (sticker.rarity === 'LEGEND') {
    bgGrad.addColorStop(0, '#FFFBEB');
    bgGrad.addColorStop(0.45, '#FDE047');
    bgGrad.addColorStop(1, '#D97706');
  } else if (sticker.rarity === 'EPIC') {
    bgGrad.addColorStop(0, '#FAF5FF');
    bgGrad.addColorStop(0.5, '#C084FC');
    bgGrad.addColorStop(1, '#6B21A8');
  } else {
    bgGrad.addColorStop(0, '#FFF1F2');
    bgGrad.addColorStop(0.5, '#F472B6');
    bgGrad.addColorStop(1, '#9D174D');
  }

  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.roundRect(24, 24, 464, 464, 72);
  ctx.fill();

  // Thick white sticker die-cut border
  ctx.lineWidth = 22;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();

  // Subtle diagonal holographic sheen stripes
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(36, 36, 440, 440, 60);
  ctx.clip();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.moveTo(60, 0);
  ctx.lineTo(170, 0);
  ctx.lineTo(0, 240);
  ctx.lineTo(0, 130);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Center Artwork Vector Drawing
  ctx.save();
  ctx.translate(256, 235);

  if (sticker.id === 'lucky-star' || sticker.rarity === 'LEGEND') {
    // Golden 5-Point Star with cute eyes
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 135 : 62;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cute Eyes & Smile
    ctx.fillStyle = '#451A03';
    ctx.beginPath();
    ctx.arc(-34, -8, 12, 0, Math.PI * 2);
    ctx.arc(34, -8, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-38, -12, 4.5, 0, Math.PI * 2);
    ctx.arc(30, -12, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 6, 18, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  } else {
    // Glossy 3D Heart Beat Emblem
    ctx.fillStyle = '#FB7185';
    ctx.strokeStyle = '#881337';
    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 105);
    ctx.bezierCurveTo(-150, 20, -155, -105, -65, -105);
    ctx.bezierCurveTo(-20, -105, 0, -65, 0, -45);
    ctx.bezierCurveTo(0, -65, 20, -105, 65, -105);
    ctx.bezierCurveTo(155, -105, 150, 20, 0, 105);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top-left specular highlight on heart
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.ellipse(-62, -58, 28, 15, -0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Bottom Name Banner on Slab
  ctx.fillStyle = '#3B0764';
  ctx.beginPath();
  ctx.roundRect(76, 392, 360, 64, 32);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#FDE047';
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sticker.name.toUpperCase(), 256, 425);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates a rich metallic foil booster pack texture with holographic gradient,
 * crimped seal lines, and "STICKER GACHA" arcade typography.
 */
function createFoilPackFrontTexture(rarity: Rarity): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 680;
  const ctx = c.getContext('2d')!;

  const g = ctx.createLinearGradient(0, 0, 512, 680);
  if (rarity === 'LEGEND') {
    g.addColorStop(0, '#FDE047');
    g.addColorStop(0.35, '#F59E0B');
    g.addColorStop(0.7, '#D946EF');
    g.addColorStop(1, '#7E22CE');
  } else {
    g.addColorStop(0, '#FF85C0');
    g.addColorStop(0.45, '#EC4899');
    g.addColorStop(0.8, '#9333EA');
    g.addColorStop(1, '#4C1D95');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 680);

  // Diagonal metallic foil sheen bands
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  for (let i = -200; i < 700; i += 140) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 55, 0);
    ctx.lineTo(i - 120, 680);
    ctx.lineTo(i - 175, 680);
    ctx.closePath();
    ctx.fill();
  }

  // Decorative inner foil frame
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(34, 42, 444, 596, 36);
  ctx.stroke();

  // Center glowing circle behind star emblem
  const rad = ctx.createRadialGradient(256, 310, 15, 256, 310, 165);
  rad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  rad.addColorStop(0.5, 'rgba(253, 224, 71, 0.35)');
  rad.addColorStop(1, 'rgba(147, 51, 234, 0)');
  ctx.fillStyle = rad;
  ctx.beginPath();
  ctx.arc(256, 310, 165, 0, Math.PI * 2);
  ctx.fill();

  // Embossed "STICKER GACHA" title on pack
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';

  ctx.font = 'bold 64px Fredoka, sans-serif';
  ctx.strokeStyle = '#4A044E';
  ctx.lineWidth = 16;
  ctx.strokeText('STICKER', 256, 155);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('STICKER', 256, 155);

  ctx.font = 'bold 74px Fredoka, sans-serif';
  ctx.strokeStyle = '#4A044E';
  ctx.lineWidth = 18;
  ctx.strokeText('GACHA', 256, 225);
  ctx.fillStyle = '#FDE047';
  ctx.fillText('GACHA', 256, 225);

  // Bottom pill tag on foil pack
  ctx.fillStyle = 'rgba(59, 7, 100, 0.75)';
  ctx.beginPath();
  ctx.roundRect(116, 540, 280, 54, 27);
  ctx.fill();
  ctx.strokeStyle = '#FDE047';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#FEF08A';
  ctx.font = 'bold 26px Plus Jakarta Sans, sans-serif';
  ctx.fillText('★ 3D FOIL PACK ★', 256, 574);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 3D Foil Sticker Pack that swells, rips open its crimped top tear-strip,
 * erupts with 3D holographic confetti shards, and physically launches the
 * 3D Sticker Card / Totem straight out from inside the open pack!
 */
export const PackBurst3DCanvas: React.FC<PackBurst3DProps> = ({
  sticker,
  stage,
  onTapPack,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({ sticker, stage, onTapPack });

  useEffect(() => {
    stateRef.current = { sticker, stage, onTapPack };
  }, [sticker, stage, onTapPack]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 0.15, 6.2);
    camera.lookAt(0, 0.05, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Lighting
    const ambient = new THREE.AmbientLight(0xffe4f3, 1.35);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.8);
    keyLight.position.set(3.5, 5.5, 5.0);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xf472b6, 4.5, 12);
    rimLight.position.set(-3.0, 2.0, -2.5);
    scene.add(rimLight);

    const packGlowLight = new THREE.PointLight(0xfde047, 5.0, 8);
    packGlowLight.position.set(0, 0.6, 1.2);
    scene.add(packGlowLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // =========================================================================
    // 1. SCULPTED 3D PILLOW FOIL PACK BODY (Lower Pouch + Crimped Bottom Fin)
    // =========================================================================
    const packPouchGroup = new THREE.Group();
    rootGroup.add(packPouchGroup);

    const packTexture = createFoilPackFrontTexture(sticker.rarity);
    const foilBodyMat = new THREE.MeshPhysicalMaterial({
      map: packTexture,
      roughness: 0.14,
      metalness: 0.55,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      iridescence: 0.85,
      iridescenceIOR: 1.35,
    });

    const goldCrimpMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.2,
      metalness: 0.88,
      emissive: 0x78350f,
      emissiveIntensity: 0.2,
    });

    const innerFoilMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.15,
      metalness: 0.9,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.45,
    });

    // Pillowed 3D Pouch Shape using ExtrudeGeometry with lush multi-segment bevels
    const pouchShape = new THREE.Shape();
    const pw = 0.88;
    const ph = 1.08;
    const pr = 0.14;
    pouchShape.moveTo(-pw + pr, -ph);
    pouchShape.lineTo(pw - pr, -ph);
    pouchShape.quadraticCurveTo(pw, -ph, pw, -ph + pr);
    pouchShape.lineTo(pw, ph - pr);
    pouchShape.quadraticCurveTo(pw, ph, pw - pr, ph);
    pouchShape.lineTo(-pw + pr, ph);
    pouchShape.quadraticCurveTo(-pw, ph, -pw, ph - pr);
    pouchShape.lineTo(-pw, -ph + pr);
    pouchShape.quadraticCurveTo(-pw, -ph, -pw + pr, -ph);

    const pouchGeo = new THREE.ExtrudeGeometry(pouchShape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 1,
      bevelSize: 0.12,
      bevelThickness: 0.16,
    });
    pouchGeo.center();

    // Fix UVs so front texture maps cleanly onto the pillowed pouch face
    const posAttr = pouchGeo.attributes.position;
    const uvAttr = pouchGeo.attributes.uv;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      uvAttr.setXY(i, (vx + 1.02) / 2.04, (vy + 1.22) / 2.44);
    }
    uvAttr.needsUpdate = true;

    const pouchMesh = new THREE.Mesh(pouchGeo, foilBodyMat);
    packPouchGroup.add(pouchMesh);

    // Glowing Interior Slot Cavity at top of pouch (visible when top strip rips off!)
    const mouthCavity = new THREE.Mesh(
      new THREE.BoxGeometry(1.68, 0.18, 0.28),
      innerFoilMat
    );
    mouthCavity.position.set(0, 1.12, 0);
    packPouchGroup.add(mouthCavity);

    // Bottom Crimped Foil Fin with 14 Serrated 3D Ridges
    const bottomCrimpBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.96, 0.18, 0.08),
      goldCrimpMat
    );
    bottomCrimpBar.position.set(0, -1.24, 0);
    packPouchGroup.add(bottomCrimpBar);

    for (let i = 0; i < 14; i++) {
      const rx = -0.88 + (i / 13) * 1.76;
      const ridge = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.18, 8),
        goldCrimpMat
      );
      ridge.position.set(rx, -1.24, 0.04);
      packPouchGroup.add(ridge);
    }

    // 3D Embossed Star Crest on the Front Center of the Pack
    const starShape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? 0.36 : 0.16;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      if (i === 0) starShape.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else starShape.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    starShape.closePath();
    const starGeo = new THREE.ExtrudeGeometry(starShape, {
      depth: 0.06,
      bevelEnabled: true,
      bevelSize: 0.025,
      bevelThickness: 0.025,
    });
    starGeo.center();
    const packStarEmblem = new THREE.Mesh(starGeo, goldCrimpMat);
    packStarEmblem.position.set(0, -0.05, 0.28);
    packPouchGroup.add(packStarEmblem);

    // =========================================================================
    // 2. DETACHABLE 3D TOP FOIL TEAR-STRIP FIN (Rips off when bursting!)
    // =========================================================================
    const topTearStripGroup = new THREE.Group();
    topTearStripGroup.position.set(0, 1.24, 0);
    rootGroup.add(topTearStripGroup);

    const topCrimpMain = new THREE.Mesh(
      new THREE.BoxGeometry(1.98, 0.24, 0.12),
      goldCrimpMat
    );
    topTearStripGroup.add(topCrimpMain);

    // Serrated Zig-Zag Foil Teeth along the top edge
    for (let i = 0; i < 14; i++) {
      const tx = -0.88 + (i / 13) * 1.76;
      const tooth = new THREE.Mesh(
        new THREE.ConeGeometry(0.065, 0.12, 4),
        goldCrimpMat
      );
      tooth.position.set(tx, 0.16, 0);
      tooth.rotation.y = Math.PI / 4;
      topTearStripGroup.add(tooth);
    }

    // Glowing Laser Tear Seam between Pouch and Top Strip
    const seamMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
    });
    const tearSeamMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.94, 0.045, 0.18),
      seamMat
    );
    tearSeamMesh.position.set(0, -0.12, 0.02);
    topTearStripGroup.add(tearSeamMesh);

    // =========================================================================
    // 3. EMERGING 3D STICKER CARD / TOTEM (Starts INSIDE the pack, pops OUT!)
    // =========================================================================
    const emergingStickerGroup = new THREE.Group();
    // Starts tucked inside the pouch cavity
    emergingStickerGroup.position.set(0, -0.1, 0);
    emergingStickerGroup.scale.set(0.15, 0.15, 0.15);
    rootGroup.add(emergingStickerGroup);

    const slabShape = new THREE.Shape();
    const sw = 0.92;
    const sh = 0.92;
    const sr = 0.18;
    slabShape.moveTo(-sw + sr, -sh);
    slabShape.lineTo(sw - sr, -sh);
    slabShape.quadraticCurveTo(sw, -sh, sw, -sh + sr);
    slabShape.lineTo(sw, sh - sr);
    slabShape.quadraticCurveTo(sw, sh, sw - sr, sh);
    slabShape.lineTo(-sw + sr, sh);
    slabShape.quadraticCurveTo(-sw, sh, -sw, sh - sr);
    slabShape.lineTo(-sw, -sh + sr);
    slabShape.quadraticCurveTo(-sw, -sh, -sw + pr, -sh);

    const slabBevelGeo = new THREE.ExtrudeGeometry(slabShape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSegments: 5,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    });
    slabBevelGeo.center();

    const slabRimMat = new THREE.MeshPhysicalMaterial({
      color: sticker.rarity === 'LEGEND' ? 0xfacc15 : sticker.rarity === 'EPIC' ? 0xc084fc : 0xf472b6,
      roughness: 0.15,
      metalness: 0.78,
      clearcoat: 1.0,
    });
    const slabBaseMesh = new THREE.Mesh(slabBevelGeo, slabRimMat);
    emergingStickerGroup.add(slabBaseMesh);

    const stickerFaceTex = createStickerSlabTexture(sticker);
    const stickerFaceMat = new THREE.MeshPhysicalMaterial({
      map: stickerFaceTex,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      iridescence: 0.6,
    });
    const stickerFacePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.76, 1.76),
      stickerFaceMat
    );
    stickerFacePlane.position.z = 0.125;
    emergingStickerGroup.add(stickerFacePlane);

    // =========================================================================
    // 4. 3D SHOCKWAVE RING + POOLED 3D FOIL SHARDS ERUPTING OUT OF THE PACK
    // =========================================================================
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: sticker.rarity === 'LEGEND' ? 0xfde047 : 0xf472b6,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const shockwaveRing = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.52, 32),
      shockwaveMat
    );
    shockwaveRing.position.set(0, 0.65, 0.2);
    rootGroup.add(shockwaveRing);

    const SHARD_COUNT = 38;
    const shardGeo = new THREE.OctahedronGeometry(0.09, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: sticker.rarity === 'LEGEND' ? 0xf59e0b : 0xec4899,
      emissiveIntensity: 1.3,
      roughness: 0.15,
      metalness: 0.85,
    });
    const shardInstanced = new THREE.InstancedMesh(shardGeo, shardMat, SHARD_COUNT);
    shardInstanced.frustumCulled = false;
    rootGroup.add(shardInstanced);

    const cfg = getRarityParticleConfig(sticker.rarity);
    const dummyColor = new THREE.Color();
    const shards = Array.from({ length: SHARD_COUNT }, (_, i) => {
      dummyColor.setHex(i % 2 === 0 ? cfg.primaryHex : cfg.secondaryHex);
      shardInstanced.setColorAt(i, dummyColor);
      const angle = (i / SHARD_COUNT) * Math.PI * 2 + (i % 3) * 0.2;
      const speed = 1.6 + ((i * 19) % 10) * 0.25;
      return {
        x: ((i % 5) - 2) * 0.14,
        y: 0.75,
        z: 0.1,
        vx: Math.cos(angle) * speed,
        vy: 1.9 + ((i * 11) % 8) * 0.32,
        vz: Math.sin(angle) * speed * 0.8 + 0.5,
        rx: i * 0.5,
        ry: i * 0.8,
        vrx: 5 + (i % 4) * 2,
        vry: 6 + (i % 5) * 2,
        baseScale: 0.65 + (i % 3) * 0.35,
      };
    });
    if (shardInstanced.instanceColor) shardInstanced.instanceColor.needsUpdate = true;

    const dummyMat4 = new THREE.Matrix4();
    const dummyPos = new THREE.Vector3();
    const dummyEuler = new THREE.Euler();
    const dummyQuat = new THREE.Quaternion();
    const dummyScale = new THREE.Vector3(0, 0, 0);

    for (let i = 0; i < SHARD_COUNT; i++) {
      dummyMat4.makeScale(0, 0, 0);
      shardInstanced.setMatrixAt(i, dummyMat4);
    }
    shardInstanced.instanceMatrix.needsUpdate = true;

    renderer.compile(scene, camera);

    // Interactive Pointer Tilt & Click
    let pointerX = 0;
    let pointerY = 0;
    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    const handlePointerDown = () => {
      stateRef.current.onTapPack?.();
    };
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Safe ResizeObserver
    let resizeRafId = 0;
    let lastW = Math.round(width);
    let lastH = Math.round(height);
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.round(entry.contentRect.width);
      const h = Math.round(entry.contentRect.height);
      if (w <= 0 || h <= 0 || (w === lastW && h === lastH)) return;
      cancelAnimationFrame(resizeRafId);
      resizeRafId = requestAnimationFrame(() => {
        lastW = w;
        lastH = h;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
      });
    });
    resizeObserver.observe(container);

    // Burst Kinematics & Spring States
    let burstTriggered = false;
    let burstElapsed = 0;
    let packSquashSpring: SpringState = { value: 0.72, velocity: 4.5, target: 1.08 };
    let emergeYSpring: SpringState = { value: -0.15, velocity: 0, target: -0.15 };
    let emergeScaleSpring: SpringState = { value: 0.12, velocity: 0, target: 0.12 };
    let emergeSpinSpring: SpringState = { value: -Math.PI, velocity: 0, target: 0 };
    let pouchDropSpring: SpringState = { value: 0, velocity: 0, target: 0 };

    let animId = 0;
    const startTime = performance.now();
    let lastTime = startTime;

    const animate = (now: number) => {
      const rawDt = (now - lastTime) * 0.001;
      if (isHeadless && rawDt < 0.065) {
        animId = requestAnimationFrame(animate);
        return;
      }
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      const totalElapsed = (now - startTime) * 0.001;
      const st = stateRef.current;

      // Trigger the 3D Foil Tear & Burst at 0.34s OR immediately if stage moved past PACK_BURST
      if (!burstTriggered && (totalElapsed >= 0.34 || st.stage !== 'PACK_BURST')) {
        burstTriggered = true;
        burstElapsed = 0;
        packSquashSpring.velocity = -6.5;
        pouchDropSpring.target = 1;
        emergeYSpring.target = st.stage === 'STICKER_CARD' ? 0.18 : 0.38;
        emergeYSpring.velocity = 5.5;
        emergeScaleSpring.target = 1.05;
        emergeScaleSpring.velocity = 4.2;
        emergeSpinSpring.target = 0;
      }

      if (st.stage === 'STICKER_CARD') {
        emergeYSpring.target = 0.12;
        emergeScaleSpring.target = 1.12;
      }

      packSquashSpring = stepSpring(packSquashSpring, 260, 12, dt);
      pouchDropSpring = stepSpring(pouchDropSpring, 190, 14, dt);
      emergeYSpring = stepSpring(emergeYSpring, 210, 13, dt);
      emergeScaleSpring = stepSpring(emergeScaleSpring, 220, 13, dt);
      emergeSpinSpring = stepSpring(emergeSpinSpring, 160, 14, dt);

      if (!burstTriggered) {
        // Phase 1: Pack swells, trembles with anticipation, and top seam blazes
        const wobble = Math.sin(totalElapsed * 38) * 0.08;
        const sy = packSquashSpring.value;
        const sxz = 1 / Math.sqrt(Math.max(0.5, sy));
        packPouchGroup.scale.set(sxz, sy, sxz);
        packPouchGroup.rotation.z = wobble;
        topTearStripGroup.rotation.z = wobble * 1.2;
        seamMat.opacity = 0.6 + Math.abs(Math.sin(totalElapsed * 25)) * 0.4;
      } else {
        // Phase 2: Top Foil Strip rips off, Pouch drops & opens, Sticker Slab emerges OUT of the pack!
        burstElapsed += dt;

        // Top tear-strip flies up and spins away
        topTearStripGroup.position.x = burstElapsed * 2.6;
        topTearStripGroup.position.y = 1.24 + burstElapsed * 3.2 - 0.5 * 4.5 * burstElapsed * burstElapsed;
        topTearStripGroup.position.z = burstElapsed * 1.1;
        topTearStripGroup.rotation.z = -burstElapsed * 7.5;
        topTearStripGroup.rotation.x = burstElapsed * 4.2;

        // Lower Foil Pouch drops down to the bottom of the frame so we see the sticker emerging out of its mouth
        const dropVal = pouchDropSpring.value;
        packPouchGroup.position.y = -dropVal * 1.48;
        packPouchGroup.position.z = -dropVal * 0.45;
        packPouchGroup.rotation.x = dropVal * 0.28;
        const pouchScale = Math.max(0.55, 1 - dropVal * 0.22);
        packPouchGroup.scale.set(pouchScale, pouchScale, pouchScale);

        // Emerging 3D Sticker Card rises up and forward out of the open pouch!
        emergingStickerGroup.position.y = emergeYSpring.value + Math.sin(totalElapsed * 3.2) * 0.05;
        emergingStickerGroup.position.z = Math.min(0.95, dropVal * 0.95);
        const es = Math.max(0.05, emergeScaleSpring.value);
        emergingStickerGroup.scale.set(es, es, es);

        // Interactive 3D tilt + gentle float on emerged sticker slab
        const targetRotY = emergeSpinSpring.value + pointerX * 0.38 + Math.sin(totalElapsed * 2.2) * 0.14;
        const targetRotX = -pointerY * 0.28 + Math.cos(totalElapsed * 1.9) * 0.08;
        emergingStickerGroup.rotation.y = THREE.MathUtils.damp(
          emergingStickerGroup.rotation.y,
          targetRotY,
          10,
          dt
        );
        emergingStickerGroup.rotation.x = THREE.MathUtils.damp(
          emergingStickerGroup.rotation.x,
          targetRotX,
          10,
          dt
        );

        // Expand 3D Shockwave Ring
        if (burstElapsed < 0.65) {
          const ringProgress = burstElapsed / 0.65;
          const ringScale = 1 + ringProgress * 4.2;
          shockwaveRing.scale.set(ringScale, ringScale, 1);
          shockwaveMat.opacity = (1 - ringProgress) * 0.85;
        } else {
          shockwaveMat.opacity = 0;
        }

        // Update 38 Erupting 3D Foil & Star Shards
        for (let i = 0; i < SHARD_COUNT; i++) {
          const s = shards[i];
          const life = Math.min(1, burstElapsed / 1.35);
          if (life >= 1) {
            dummyMat4.makeScale(0, 0, 0);
            shardInstanced.setMatrixAt(i, dummyMat4);
            continue;
          }
          const px = s.x + s.vx * burstElapsed;
          const py = s.y + s.vy * burstElapsed - 0.5 * 4.8 * burstElapsed * burstElapsed;
          const pz = s.z + s.vz * burstElapsed;
          const env = Math.sin(life * Math.PI) * s.baseScale;

          dummyPos.set(px, py, pz);
          dummyEuler.set(s.rx + s.vrx * burstElapsed, s.ry + s.vry * burstElapsed, 0);
          dummyQuat.setFromEuler(dummyEuler);
          dummyScale.set(env, env, env);
          dummyMat4.compose(dummyPos, dummyQuat, dummyScale);
          shardInstanced.setMatrixAt(i, dummyMat4);
        }
        shardInstanced.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      cancelAnimationFrame(resizeRafId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      packTexture.dispose();
      stickerFaceTex.dispose();
      renderer.dispose();
    };
  }, [sticker]);

  return (
    <div
      ref={mountRef}
      data-testid="pack-burst-3d-canvas"
      className="relative h-full w-full cursor-pointer select-none"
    />
  );
};
