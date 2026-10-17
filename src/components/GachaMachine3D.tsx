import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { stepSpring, SpringState, Rarity, getRarityParticleConfig } from '../game/rules';

export interface GachaMachine3DProps {
  coins: number;
  isPulling: boolean;
  pullTriggerCount: number;
  targetReels: [number, number, number];
  packDropped: boolean;
  packRarity?: Rarity;
  wireframe?: boolean;
  explodedFactor?: number;
  cameraPreset?: 'DEFAULT' | 'CLOSEUP' | 'TOP_ANGLE' | 'BACK_VIEW';
  onLeverClick: () => void;
  onPackClick: () => void;
}

/**
 * Watertight, Unified 12-Part 3D Gacha Slot Machine built with Three.js PBR materials,
 * RoomEnvironment studio reflections, Reanimated-style second-order spring squash-and-stretch,
 * high-visibility 3D relief slot reels (Star, Heart, Crown, Legend Star), embedded 3D LED coin counter,
 * detailed rear vault door & cooling vents, and full 360° interactive drag-to-orbit rotation.
 */
export const GachaMachine3DCanvas: React.FC<GachaMachine3DProps> = ({
  coins,
  isPulling,
  pullTriggerCount,
  targetReels,
  packDropped,
  packRarity = 'RARE',
  wireframe = false,
  explodedFactor = 0,
  cameraPreset = 'DEFAULT',
  onLeverClick,
  onPackClick,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Store mutable props in refs so the WebGL canvas is never torn down on React state updates
  const stateRef = useRef({
    coins,
    isPulling,
    pullTriggerCount,
    targetReels,
    packDropped,
    packRarity,
    wireframe,
    explodedFactor,
    cameraPreset,
    onLeverClick,
    onPackClick,
  });

  useEffect(() => {
    stateRef.current = {
      coins,
      isPulling,
      pullTriggerCount,
      targetReels,
      packDropped,
      packRarity,
      wireframe,
      explodedFactor,
      cameraPreset,
      onLeverClick,
      onPackClick,
    };
  }, [
    coins,
    isPulling,
    pullTriggerCount,
    targetReels,
    packDropped,
    packRarity,
    wireframe,
    explodedFactor,
    cameraPreset,
    onLeverClick,
    onPackClick,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const width = container.clientWidth || 390;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.set(0, 1.25, 9.2);
    camera.lookAt(0, 0.2, 0);

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
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment Reflection Map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Warm/Cool 3-Point Studio Lighting Rig + Dedicated Reel Spotlight
    const hemiLight = new THREE.HemisphereLight(0xfce7f3, 0x581c87, 1.45);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.35);
    keyLight.position.set(4.5, 7.5, 6.5);
    if (!isHeadless) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 1;
      keyLight.shadow.camera.far = 20;
      const d = 4.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const backRimLight = new THREE.DirectionalLight(0xf472b6, 1.85);
    backRimLight.position.set(-4, 5, -6);
    scene.add(backRimLight);

    // Dedicated front fill light so the spinning slot reels are always bright and readable
    const reelFrontLight = new THREE.PointLight(0xffffff, 2.4, 8);
    reelFrontLight.position.set(0, 1.2, 3.2);
    scene.add(reelFrontLight);

    // Materials Library (PBR Glossy Clearcoat & Anisotropic Gold)
    const candyPinkMat = new THREE.MeshPhysicalMaterial({
      color: 0xff2a85,
      roughness: 0.15,
      metalness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.07,
    });

    const deepMagentaMat = new THREE.MeshPhysicalMaterial({
      color: 0xbe185d,
      roughness: 0.22,
      metalness: 0.16,
      clearcoat: 0.85,
    });

    const plumPedestalMat = new THREE.MeshStandardMaterial({
      color: 0x831843,
      roughness: 0.32,
      metalness: 0.25,
    });

    const brushedGoldMat = new THREE.MeshPhysicalMaterial({
      color: 0xfbbf24,
      roughness: 0.16,
      metalness: 0.92,
      clearcoat: 0.9,
      emissive: 0x78350f,
      emissiveIntensity: 0.12,
    });

    const chromeAxleMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.12,
      metalness: 0.95,
    });

    const heartTopperMat = new THREE.MeshPhysicalMaterial({
      color: 0xff5ca8,
      roughness: 0.1,
      metalness: 0.08,
      clearcoat: 1.0,
      emissive: 0x9d174d,
      emissiveIntensity: 0.18,
    });

    const cloudPuffMat = new THREE.MeshStandardMaterial({
      color: 0xd8b4fe,
      roughness: 0.8,
      metalness: 0.02,
      emissive: 0x581c87,
      emissiveIntensity: 0.22,
    });

    const darkSlotMat = new THREE.MeshStandardMaterial({
      color: 0x16032b,
      roughness: 0.45,
      metalness: 0.25,
    });

    // Helper for rounded rectangle shapes
    const createRoundedRectShape = (w: number, h: number, r: number) => {
      const s = new THREE.Shape();
      const x = -w / 2;
      const y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    };

    const createStarMesh = (scale: number, mat: THREE.Material = brushedGoldMat) => {
      const starShape = new THREE.Shape();
      const pts = 5;
      for (let i = 0; i < pts * 2; i++) {
        const rad = i % 2 === 0 ? 0.14 * scale : 0.065 * scale;
        const a = (i / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
        if (i === 0) starShape.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else starShape.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      starShape.closePath();
      const geo = new THREE.ExtrudeGeometry(starShape, {
        depth: 0.045,
        bevelEnabled: true,
        bevelSize: 0.015,
        bevelThickness: 0.015,
      });
      geo.center();
      return new THREE.Mesh(geo, mat);
    };

    // =========================================================================
    // ROOT ORBIT GROUP (Everything rotates together when user drags 360°!)
    // =========================================================================
    const rootGroup = new THREE.Group();
    rootGroup.position.set(0, -0.15, 0);
    scene.add(rootGroup);

    // 1. Sculpted Floating Cloud Island Base (Welded directly underneath the Pedestal)
    const cloudGroup = new THREE.Group();
    cloudGroup.position.set(0, -1.55, 0);
    rootGroup.add(cloudGroup);

    const cloudPuffs: [number, number, number, number][] = [
      [0, -0.15, 0, 1.55],
      [-1.3, 0.02, 0.4, 0.98],
      [1.3, 0.02, 0.4, 0.98],
      [-0.85, 0.08, 1.02, 0.86],
      [0.85, 0.08, 1.02, 0.86],
      [0, 0.08, 1.22, 0.92],
      [-1.55, -0.1, -0.35, 0.88],
      [1.55, -0.1, -0.35, 0.88],
      [-0.85, 0.05, -1.02, 0.88],
      [0.85, 0.05, -1.02, 0.88],
      [0, 0.05, -1.22, 0.92],
      [-0.6, -0.55, 0.55, 0.92],
      [0.6, -0.55, 0.55, 0.92],
      [0, -0.75, 0, 1.15],
    ];
    const sphereGeo = new THREE.SphereGeometry(1, 20, 16);
    cloudPuffs.forEach(([x, y, z, r]) => {
      const puff = new THREE.Mesh(sphereGeo, cloudPuffMat);
      puff.position.set(x, y, z);
      puff.scale.set(r * 1.15, r * 0.78, r);
      puff.receiveShadow = !isHeadless;
      cloudGroup.add(puff);
    });

    // 2. Circular Stage Pedestal with Glowing Marquee Bulbs (Sits flush on Cloud Island)
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, -1.12, 0);
    rootGroup.add(pedestalGroup);

    const tier1 = new THREE.Mesh(
      new THREE.CylinderGeometry(2.15, 2.28, 0.28, 36),
      deepMagentaMat
    );
    tier1.position.y = 0;
    pedestalGroup.add(tier1);

    const tier2 = new THREE.Mesh(
      new THREE.CylinderGeometry(1.88, 1.98, 0.36, 36),
      plumPedestalMat
    );
    tier2.position.y = 0.24;
    pedestalGroup.add(tier2);

    const goldRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.92, 0.05, 14, 48),
      brushedGoldMat
    );
    goldRing.rotation.x = Math.PI / 2;
    goldRing.position.y = 0.41;
    pedestalGroup.add(goldRing);

    // 18 Marquee LED Bulbs embedded into the Pedestal Rim
    const bulbGeo = new THREE.SphereGeometry(0.068, 12, 12);
    const bulbMats: THREE.MeshStandardMaterial[] = [];
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const bMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.5,
        roughness: 0.2,
      });
      bulbMats.push(bMat);
      const bulb = new THREE.Mesh(bulbGeo, bMat);
      bulb.position.set(Math.sin(angle) * 1.92, 0.24, Math.cos(angle) * 1.92);
      pedestalGroup.add(bulb);
    }

    // =========================================================================
    // 3. SYNCHRONIZED GACHA MACHINE BODY (machinePivot at y = -0.70, flush with pedestal top!)
    // Every single component of the slot machine is a child of machinePivot so
    // nothing ever floats or detaches!
    // =========================================================================
    const machinePivot = new THREE.Group();
    machinePivot.position.set(0, -0.7, 0);
    rootGroup.add(machinePivot);

    // 3A. Heavy Molded Plinth Base & 4 Integrated Corner Feet (Connects Cabinet solidly to Pedestal)
    const plinthBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.52, 0.26, 1.38),
      deepMagentaMat
    );
    plinthBase.position.set(0, 0.13, 0);
    machinePivot.add(plinthBase);

    const plinthGoldTrim = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.07, 1.46),
      brushedGoldMat
    );
    plinthGoldTrim.position.set(0, 0.25, 0);
    machinePivot.add(plinthGoldTrim);

    const footGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.18, 20);
    const footCoords: [number, number][] = [
      [-1.08, 0.56],
      [1.08, 0.56],
      [-1.08, -0.56],
      [1.08, -0.56],
    ];
    footCoords.forEach(([fx, fz]) => {
      const foot = new THREE.Mesh(footGeo, brushedGoldMat);
      foot.position.set(fx, 0.09, fz);
      machinePivot.add(foot);
    });

    // 3B. Main Beveled Extruded Cabinet Hull (Spans Y: 0.20 to 2.12, X: -1.42 to +1.42, Z: -0.78 to +0.78)
    const cabinetGeo = new THREE.ExtrudeGeometry(createRoundedRectShape(2.6, 1.68, 0.3), {
      depth: 1.24,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 1,
      bevelSize: 0.12,
      bevelThickness: 0.15,
    });
    cabinetGeo.center();
    const cabinetMesh = new THREE.Mesh(cabinetGeo, candyPinkMat);
    cabinetMesh.position.set(0, 1.14, 0);
    cabinetMesh.castShadow = !isHeadless;
    cabinetMesh.receiveShadow = !isHeadless;
    machinePivot.add(cabinetMesh);

    // Side Flank Bumper Panels & Gold Medallions (Flush welded on Left & Right walls x = ±1.41)
    [-1, 1].forEach((side) => {
      const sidePanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 1.25, 0.92),
        deepMagentaMat
      );
      sidePanel.position.set(side * 1.4, 1.14, 0);
      machinePivot.add(sidePanel);

      const sideGoldFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 1.05, 0.74),
        brushedGoldMat
      );
      sideGoldFrame.position.set(side * 1.41, 1.14, 0);
      machinePivot.add(sideGoldFrame);

      const sideInset = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.92, 0.62),
        candyPinkMat
      );
      sideInset.position.set(side * 1.415, 1.14, 0);
      machinePivot.add(sideInset);
    });

    // 3C. Detailed Back of the Slot Machine (Visible when user rotates 360°!)
    const backAssembly = new THREE.Group();
    // Cabinet rear face is at z = -0.77; mount flush into z = -0.75
    backAssembly.position.set(0, 1.14, -0.75);
    machinePivot.add(backAssembly);

    // Rear Brushed Gold Vault Frame
    const rearVaultFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 1.38, 0.08),
      brushedGoldMat
    );
    backAssembly.add(rearVaultFrame);

    // Rear Deep Magenta Service Door Panel
    const rearDoorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(1.92, 1.2, 0.1),
      deepMagentaMat
    );
    rearDoorPanel.position.z = -0.01;
    backAssembly.add(rearDoorPanel);

    // 4 Corner Gold Bolts on the Back Vault Door
    [
      [-0.84, 0.48],
      [0.84, 0.48],
      [-0.84, -0.48],
      [0.84, -0.48],
    ].forEach(([bx, by]) => {
      const bolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.14, 12),
        chromeAxleMat
      );
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(bx, by, -0.03);
      backAssembly.add(bolt);
    });

    // Louvered Cooling Vents on Rear Door
    for (let v = 0; v < 4; v++) {
      const slat = new THREE.Mesh(
        new THREE.BoxGeometry(1.25, 0.05, 0.12),
        darkSlotMat
      );
      slat.position.set(0, -0.18 - v * 0.11, -0.02);
      backAssembly.add(slat);
    }

    // Glowing Rear Star Core Emblem on Back Upper Panel
    const rearStar = createStarMesh(1.65, brushedGoldMat);
    rearStar.rotation.y = Math.PI;
    rearStar.position.set(0, 0.24, -0.06);
    backAssembly.add(rearStar);

    // =========================================================================
    // 4. FRONT REEL WINDOW BAY & HIGH-VISIBILITY 3D SLOT REELS
    // =========================================================================
    const reelBayGroup = new THREE.Group();
    // Cabinet front face is at z = +0.77; embed reel bay solidly at z = +0.74
    reelBayGroup.position.set(0, 1.32, 0.74);
    machinePivot.add(reelBayGroup);

    // Solid Dark Recessed Shadowbox Backing (Behind the reels so cabinet never clips through reels!)
    const recessBacking = new THREE.Mesh(
      new THREE.BoxGeometry(2.04, 0.84, 0.12),
      darkSlotMat
    );
    recessBacking.position.set(0, 0, -0.12);
    reelBayGroup.add(recessBacking);

    // Top, Bottom, Left, Right Solid Gold Window Walls framing the Reels flush to the cabinet
    const frameOuter = createRoundedRectShape(2.22, 0.98, 0.16);
    const frameHole = createRoundedRectShape(1.96, 0.74, 0.1);
    frameOuter.holes.push(frameHole);
    const bezelGeo = new THREE.ExtrudeGeometry(frameOuter, {
      depth: 0.22,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.035,
      bevelThickness: 0.04,
    });
    bezelGeo.center();
    const bezelMesh = new THREE.Mesh(bezelGeo, brushedGoldMat);
    bezelMesh.position.set(0, 0, 0.08);
    reelBayGroup.add(bezelMesh);

    // 4 Corner Gold Stars Physically Bolted onto the Front Cabinet Corners
    const starPositions: [number, number][] = [
      [-1.16, 1.72],
      [1.16, 1.72],
      [-1.16, 0.56],
      [1.16, 0.56],
    ];
    starPositions.forEach(([sx, sy]) => {
      const s = createStarMesh(1.05);
      // Positioned at z = 0.77 so the back of the star is embedded right into the front cabinet face!
      s.position.set(sx, sy, 0.77);
      machinePivot.add(s);
    });

    /**
     * HIGH-VISIBILITY SLOT REEL DRUMS:
     * Note on CylinderGeometry UVs:
     * In Three.js, CylinderGeometry wraps U (0..1) horizontally around the circumference (theta)
     * and V (0..1) along the cylinder height axis.
     * When we rotate the cylinder by Z = Math.PI / 2 so its axle runs along X,
     * the spinning direction around the X axis corresponds to U (0..1)!
     * So we draw the 4 giant slot symbols horizontally across a 1024x256 canvas (U axis)
     * AND we also bolt 3D Relief Symbol Plaques at 0°, 90°, 180°, 270° around each drum!
     */
    const createCircumferentialReelTexture = () => {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 256;
      const ctx = c.getContext('2d')!;

      // Glossy ivory-white drum background so symbols pop with maximum contrast
      ctx.fillStyle = '#FFFBEB';
      ctx.fillRect(0, 0, 1024, 256);

      // 4 High-Contrast Slot Symbols spaced at 256px intervals along U (circumference)
      const symbols = [
        { bg: '#0369A1', rim: '#38BDF8', label: 'STAR', type: 'STAR' },
        { bg: '#FFF1F2', rim: '#FB7185', label: 'HEART', type: 'HEART' },
        { bg: '#581C87', rim: '#C084FC', label: 'CROWN', type: 'CROWN' },
        { bg: '#991B1B', rim: '#FACC15', label: 'JACKPOT', type: 'LEGEND' },
      ];

      symbols.forEach((sym, i) => {
        const cx = i * 256 + 128;
        const cy = 128;

        ctx.save();
        ctx.translate(cx, cy);
        // Rotate by -90 deg so the symbol stands upright on the front of the horizontal X-axis drum!
        ctx.rotate(-Math.PI / 2);

        // Slot divider lines
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 6;
        ctx.strokeRect(-118, -118, 236, 236);

        // Vibrant Badge Card Background
        ctx.fillStyle = sym.rim;
        ctx.beginPath();
        ctx.roundRect(-100, -106, 200, 212, 28);
        ctx.fill();

        ctx.fillStyle = sym.bg;
        ctx.beginPath();
        ctx.roundRect(-90, -96, 180, 192, 22);
        ctx.fill();

        // Giant High-Visibility Symbol Icon in Center
        ctx.lineWidth = 9;
        ctx.lineJoin = 'round';
        if (sym.type === 'HEART') {
          ctx.fillStyle = '#E11D48';
          ctx.strokeStyle = '#881337';
          ctx.beginPath();
          ctx.moveTo(0, 38);
          ctx.bezierCurveTo(-62, -2, -66, -54, -27, -54);
          ctx.bezierCurveTo(-8, -54, 0, -34, 0, -24);
          ctx.bezierCurveTo(0, -34, 8, -54, 27, -54);
          ctx.bezierCurveTo(66, -54, 62, -2, 0, 38);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (sym.type === 'CROWN') {
          ctx.fillStyle = '#FDE047';
          ctx.strokeStyle = '#451A03';
          ctx.beginPath();
          ctx.moveTo(-50, 26);
          ctx.lineTo(-58, -36);
          ctx.lineTo(-20, -6);
          ctx.lineTo(0, -50);
          ctx.lineTo(20, -6);
          ctx.lineTo(58, -36);
          ctx.lineTo(50, 26);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Giant 5-Point Star (Blazing Gold on Deep Blue or Jackpot Crimson)
          ctx.fillStyle = '#FDE047';
          ctx.strokeStyle = '#78350F';
          ctx.beginPath();
          for (let p = 0; p < 10; p++) {
            const rad = p % 2 === 0 ? 56 : 25;
            const a = (p * Math.PI) / 5 - Math.PI / 2;
            if (p === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad - 8);
            else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad - 8);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Bold Readable Label Pill Under Symbol
        ctx.fillStyle = '#1E0538';
        ctx.beginPath();
        ctx.roundRect(-72, 46, 144, 36, 12);
        ctx.fill();

        ctx.fillStyle = '#FEF08A';
        ctx.font = '900 24px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sym.label, 0, 65);

        ctx.restore();
      });

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    };

    const reelTex = createCircumferentialReelTexture();
    const reelDrumMat = new THREE.MeshStandardMaterial({
      map: reelTex,
      roughness: 0.16,
      metalness: 0.05,
      emissive: 0xffffff,
      emissiveMap: reelTex,
      emissiveIntensity: 0.35, // Bright self-illuminated arcade reel glow!
    });

    // Build Bold Contrasting 3D Relief Emblems around each drum so spinning symbols pop in 3D!
    const reliefHeartShape = new THREE.Shape();
    reliefHeartShape.moveTo(0, -0.11);
    reliefHeartShape.bezierCurveTo(-0.16, -0.01, -0.17, 0.11, -0.08, 0.135);
    reliefHeartShape.bezierCurveTo(-0.02, 0.145, 0, 0.09, 0, 0.06);
    reliefHeartShape.bezierCurveTo(0, 0.09, 0.02, 0.145, 0.08, 0.135);
    reliefHeartShape.bezierCurveTo(0.17, 0.11, 0.16, -0.01, 0, -0.11);
    const reliefHeartGeo = new THREE.ExtrudeGeometry(reliefHeartShape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
    });
    reliefHeartGeo.center();

    const reliefStarShape = new THREE.Shape();
    for (let p = 0; p < 10; p++) {
      const rad = p % 2 === 0 ? 0.145 : 0.065;
      const a = (p * Math.PI) / 5 - Math.PI / 2;
      if (p === 0) reliefStarShape.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      else reliefStarShape.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    reliefStarShape.closePath();
    const reliefStarGeo = new THREE.ExtrudeGeometry(reliefStarShape, {
      depth: 0.03,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
    });
    reliefStarGeo.center();

    const reliefDiamondGeo = new THREE.OctahedronGeometry(0.125, 0);

    const reliefStarGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xd97706,
      emissiveIntensity: 0.55,
      roughness: 0.12,
      metalness: 0.85,
    });
    const reliefHeartRubyMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      emissive: 0x9f1239,
      emissiveIntensity: 0.55,
      roughness: 0.12,
      metalness: 0.35,
    });
    const reliefCrownGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xb45309,
      emissiveIntensity: 0.55,
      roughness: 0.12,
      metalness: 0.85,
    });
    const reliefLegendGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.75,
      roughness: 0.1,
      metalness: 0.9,
    });

    const reelRadius = 0.34;
    const reelWidth = 0.56;
    const reelGeo = new THREE.CylinderGeometry(reelRadius, reelRadius, reelWidth, 36);
    reelGeo.rotateZ(Math.PI / 2);

    const reelsGroup = new THREE.Group();
    reelsGroup.position.set(0, 0, -0.08);
    reelBayGroup.add(reelsGroup);

    // Continuous Steel Axle Rod running through all 3 reels into the cabinet walls
    const reelAxleRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2.1, 16),
      chromeAxleMat
    );
    reelAxleRod.rotation.z = Math.PI / 2;
    reelsGroup.add(reelAxleRod);

    const reelPivots: THREE.Group[] = [];
    [-0.63, 0, 0.63].forEach((rx) => {
      const drumPivot = new THREE.Group();
      drumPivot.position.set(rx, 0, 0);

      const drumMesh = new THREE.Mesh(reelGeo, reelDrumMat);
      drumMesh.rotation.x = Math.PI / 4;
      drumPivot.add(drumMesh);

      // Attach 4 High-Contrast 3D Relief Emblems around the drum perimeter!
      const emblemConfigs = [
        { angle: 0, geo: reliefStarGeo, mat: reliefStarGoldMat },
        { angle: Math.PI / 2, geo: reliefHeartGeo, mat: reliefHeartRubyMat },
        { angle: Math.PI, geo: reliefDiamondGeo, mat: reliefCrownGoldMat },
        { angle: (3 * Math.PI) / 2, geo: reliefStarGeo, mat: reliefLegendGoldMat },
      ];
      emblemConfigs.forEach(({ angle, geo, mat }) => {
        const holder = new THREE.Group();
        holder.rotation.x = -angle;
        const emb = new THREE.Mesh(geo, mat);
        emb.position.set(0, 0.04, reelRadius + 0.015);
        holder.add(emb);
        drumPivot.add(holder);
      });

      reelsGroup.add(drumPivot);
      reelPivots.push(drumPivot);
    });

    // Gold Vertical Reel Dividers (welded inside the bezel frame between the 3 drums)
    [-0.315, 0.315].forEach((dx) => {
      const div = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.76, 0.24),
        brushedGoldMat
      );
      div.position.set(dx, 0, 0.08);
      reelBayGroup.add(div);
    });

    // =========================================================================
    // 5. DISPENSER CHUTE & EMBEDDED 3D DIGITAL COIN COUNTER SCREEN
    // =========================================================================
    const chuteGroup = new THREE.Group();
    // Mounted flush on the lower front face of the cabinet (z = 0.76)
    chuteGroup.position.set(-0.26, 0.56, 0.76);
    machinePivot.add(chuteGroup);

    const chuteBezel = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 0.28, 0.14),
      brushedGoldMat
    );
    chuteGroup.add(chuteBezel);

    const chuteOpening = new THREE.Mesh(
      new THREE.BoxGeometry(1.04, 0.16, 0.16),
      darkSlotMat
    );
    chuteOpening.position.z = 0.01;
    chuteGroup.add(chuteOpening);

    // Physical Chute Lip / Tray extending slightly beneath the slot opening
    const chuteTray = new THREE.Mesh(
      new THREE.BoxGeometry(1.14, 0.05, 0.24),
      deepMagentaMat
    );
    chuteTray.position.set(0, -0.11, 0.06);
    chuteGroup.add(chuteTray);

    // Embedded 3D LED Coin Counter Display (Mounted right next to the chute on the front cabinet face!)
    const ledCanvas = document.createElement('canvas');
    ledCanvas.width = 256;
    ledCanvas.height = 128;
    const ledCtx = ledCanvas.getContext('2d')!;
    const ledTex = new THREE.CanvasTexture(ledCanvas);
    ledTex.colorSpace = THREE.SRGBColorSpace;

    const paintLedCounter = (coinVal: number) => {
      ledCtx.fillStyle = '#1E0538';
      ledCtx.fillRect(0, 0, 256, 128);
      ledCtx.strokeStyle = '#FBBF24';
      ledCtx.lineWidth = 10;
      ledCtx.strokeRect(8, 8, 240, 112);

      // Draw Star Icon
      ledCtx.fillStyle = '#FDE047';
      ledCtx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 32 : 14;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const px = 72 + Math.cos(a) * r;
        const py = 64 + Math.sin(a) * r;
        if (i === 0) ledCtx.moveTo(px, py);
        else ledCtx.lineTo(px, py);
      }
      ledCtx.closePath();
      ledCtx.fill();

      // Draw Coin Count
      ledCtx.fillStyle = '#FEF08A';
      ledCtx.font = '900 68px JetBrains Mono, monospace';
      ledCtx.textAlign = 'center';
      ledCtx.textBaseline = 'middle';
      ledCtx.fillText(String(coinVal), 172, 68);
      ledTex.needsUpdate = true;
    };
    paintLedCounter(stateRef.current.coins);

    const ledHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.28, 0.12),
      brushedGoldMat
    );
    ledHousing.position.set(0.68, 0.56, 0.76);
    machinePivot.add(ledHousing);

    const ledScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.22),
      new THREE.MeshBasicMaterial({ map: ledTex })
    );
    ledScreen.position.set(0.68, 0.56, 0.825);
    machinePivot.add(ledScreen);

    // =========================================================================
    // 6. PHYSICALLY CONNECTED CROWN HEART TOPPER (Welded into Cabinet Roof!)
    // =========================================================================
    const topperGroup = new THREE.Group();
    // Cabinet top roof is at y = 2.04; embed topper collar at y = 1.98 so there is zero gap!
    topperGroup.position.set(0, 1.98, 0);
    machinePivot.add(topperGroup);

    const topperBasePlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.48, 0.14, 28),
      deepMagentaMat
    );
    topperBasePlate.position.y = 0.04;
    topperGroup.add(topperBasePlate);

    const topperCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.36, 0.16, 24),
      brushedGoldMat
    );
    topperCollar.position.y = 0.14;
    topperGroup.add(topperCollar);

    // Continuous Golden Support Pedestal Stem reaching all the way up into the Heart (y = 0.14 to y = 0.52)
    const topperStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.12, 0.42, 16),
      brushedGoldMat
    );
    topperStem.position.y = 0.34;
    topperGroup.add(topperStem);

    // Golden Cradle Ring holding the base of the Heart
    const heartCradle = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.04, 12, 24),
      brushedGoldMat
    );
    heartCradle.rotation.x = Math.PI / 2;
    heartCradle.position.y = 0.44;
    topperGroup.add(heartCradle);

    // 3D Extruded Glossy Heart Topper seated directly inside the Golden Cradle
    const heartShape = new THREE.Shape();
    heartShape.moveTo(0, -0.28);
    heartShape.bezierCurveTo(-0.38, -0.05, -0.44, 0.28, -0.2, 0.36);
    heartShape.bezierCurveTo(-0.08, 0.4, 0, 0.28, 0, 0.18);
    heartShape.bezierCurveTo(0, 0.28, 0.08, 0.4, 0.2, 0.36);
    heartShape.bezierCurveTo(0.44, 0.28, 0.38, -0.05, 0, -0.28);

    const heartGeo = new THREE.ExtrudeGeometry(heartShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 6,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    });
    heartGeo.center();
    const heartMesh = new THREE.Mesh(heartGeo, heartTopperMat);
    // Seated at y = 0.64 so its bottom point (-0.28) is embedded inside the stem & cradle at y = 0.36!
    heartMesh.position.y = 0.64;
    topperGroup.add(heartMesh);

    // =========================================================================
    // 7. PHYSICALLY CONNECTED ARTICULATED RIGHT-HAND PULL LEVER ASSEMBLY
    // =========================================================================
    const leverGroup = new THREE.Group();
    // Cabinet right wall is at x = 1.41; embed lever mount at x = 1.36 so it bolts solidly into the cabinet!
    leverGroup.position.set(1.36, 1.14, 0);
    machinePivot.add(leverGroup);

    // Heavy Magenta & Gold Shoulder Housing bolted flush into the side wall
    const leverMountFlange = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.36, 0.22, 24),
      brushedGoldMat
    );
    leverMountFlange.rotation.z = Math.PI / 2;
    leverMountFlange.position.x = 0.04;
    leverGroup.add(leverMountFlange);

    const leverMountDrum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.26, 0.28, 24),
      deepMagentaMat
    );
    leverMountDrum.rotation.z = Math.PI / 2;
    leverMountDrum.position.x = 0.12;
    leverGroup.add(leverMountDrum);

    // Pivoting Lever Arm Group (Rotates around the X axis when pulled!)
    const leverArmPivot = new THREE.Group();
    leverArmPivot.position.set(0.18, 0, 0);
    leverGroup.add(leverArmPivot);

    // Horizontal Chrome Axle Shaft physically connecting the side housing to the vertical rod elbow!
    const horizontalAxle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.32, 16),
      chromeAxleMat
    );
    horizontalAxle.rotation.z = Math.PI / 2;
    horizontalAxle.position.set(0.1, 0, 0);
    leverArmPivot.add(horizontalAxle);

    // Spherical Gold Elbow Joint connecting the horizontal axle to the vertical rod
    const leverElbow = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      brushedGoldMat
    );
    leverElbow.position.set(0.24, 0, 0);
    leverArmPivot.add(leverElbow);

    // Vertical Chrome/Gold Lever Rod rising straight out of the Elbow Joint
    const leverRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.075, 1.05, 16),
      chromeAxleMat
    );
    leverRod.position.set(0.24, 0.52, 0);
    leverArmPivot.add(leverRod);

    // Oversized Glossy Pink Ball Knob with Gold Collar seated solidly on top of the Lever Rod
    const knobCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.09, 0.1, 16),
      brushedGoldMat
    );
    knobCollar.position.set(0.24, 1.02, 0);
    leverArmPivot.add(knobCollar);

    const leverKnob = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 24, 20),
      heartTopperMat
    );
    leverKnob.position.set(0.24, 1.2, 0);
    leverArmPivot.add(leverKnob);

    // =========================================================================
    // 8. EJECTED SCULPTED 3D PILLOWED FOIL STICKER PACK (Parented to machinePivot!)
    // =========================================================================
    const createPackTexture = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 340;
      const ctx = c.getContext('2d')!;
      const g = ctx.createLinearGradient(0, 0, 256, 340);
      g.addColorStop(0, '#FF85C0');
      g.addColorStop(0.5, '#D946EF');
      g.addColorStop(1, '#6B21A8');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 340);

      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath();
      ctx.moveTo(40, 0);
      ctx.lineTo(110, 0);
      ctx.lineTo(0, 180);
      ctx.lineTo(0, 110);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
      ctx.lineWidth = 6;
      ctx.strokeRect(18, 28, 220, 284);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 38px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STICKER', 128, 128);
      ctx.fillStyle = '#FEF08A';
      ctx.font = 'bold 44px Fredoka, sans-serif';
      ctx.fillText('GACHA', 128, 178);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    };

    const packMat = new THREE.MeshPhysicalMaterial({
      map: createPackTexture(),
      roughness: 0.14,
      metalness: 0.65,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      iridescence: 0.85,
    });

    const packMesh = new THREE.Group();
    const packPillowShape = createRoundedRectShape(0.72, 0.92, 0.12);
    const packPillowGeo = new THREE.ExtrudeGeometry(packPillowShape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelSegments: 5,
      bevelSize: 0.055,
      bevelThickness: 0.065,
    });
    packPillowGeo.center();
    const pPos = packPillowGeo.attributes.position;
    const pUv = packPillowGeo.attributes.uv;
    for (let i = 0; i < pPos.count; i++) {
      pUv.setXY(i, (pPos.getX(i) + 0.42) / 0.84, (pPos.getY(i) + 0.52) / 1.04);
    }
    pUv.needsUpdate = true;

    const packBodyMesh = new THREE.Mesh(packPillowGeo, packMat);
    packMesh.add(packBodyMesh);

    const topCrimpFin = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.09, 0.045),
      brushedGoldMat
    );
    topCrimpFin.position.set(0, 0.52, 0);
    const botCrimpFin = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.09, 0.045),
      brushedGoldMat
    );
    botCrimpFin.position.set(0, -0.52, 0);
    packMesh.add(topCrimpFin, botCrimpFin);

    const packSealStar = createStarMesh(0.95);
    packSealStar.position.set(0, -0.14, 0.11);
    packMesh.add(packSealStar);

    // Positioned right in front of the dispenser chute on the pedestal top!
    packMesh.position.set(-0.26, 0.42, 1.12);
    packMesh.rotation.set(-0.28, 0.12, -0.08);
    packMesh.visible = false;
    machinePivot.add(packMesh);

    // =========================================================================
    // 9. POOLED 3D RARITY PARTICLE BURST EMITTER (Gold Glitter for LEGEND, Sparkles for RARE)
    // =========================================================================
    const MAX_PARTICLES = 36;
    const particleGeo = new THREE.OctahedronGeometry(0.085, 0);
    const particleMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.4,
      roughness: 0.15,
      metalness: 0.85,
    });
    const particleInstanced = new THREE.InstancedMesh(particleGeo, particleMat, MAX_PARTICLES);
    particleInstanced.frustumCulled = false;
    particleInstanced.visible = false;
    machinePivot.add(particleInstanced);

    interface ParticleSlot {
      active: boolean;
      life: number;
      maxLife: number;
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      rx: number;
      ry: number;
      vrx: number;
      vry: number;
      baseScale: number;
    }

    const particlePool: ParticleSlot[] = Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      life: 0,
      maxLife: 1,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      rx: 0,
      ry: 0,
      vrx: 0,
      vry: 0,
      baseScale: 1,
    }));

    const dummyMat4 = new THREE.Matrix4();
    const dummyPos = new THREE.Vector3();
    const dummyQuat = new THREE.Quaternion();
    const dummyEuler = new THREE.Euler();
    const dummyScale = new THREE.Vector3();
    const dummyColor = new THREE.Color();

    const spawnRarityParticles = (rarity: Rarity) => {
      const cfg = getRarityParticleConfig(rarity);
      particleMat.emissive.setHex(cfg.emissiveHex);
      particleInstanced.visible = true;

      for (let i = 0; i < MAX_PARTICLES; i++) {
        const slot = particlePool[i];
        if (i < cfg.count) {
          slot.active = true;
          slot.life = 0;
          slot.maxLife = 0.75 + (i % 5) * 0.12;
          slot.x = -0.26 + ((i % 3) - 1) * 0.12;
          slot.y = 0.45;
          slot.z = 1.12;

          const angle = (i / cfg.count) * Math.PI * 2 + (i % 2) * 0.2;
          const speed = cfg.burstSpeed * (0.55 + ((i * 17) % 10) * 0.06);
          slot.vx = Math.cos(angle) * speed * 0.85;
          slot.vy = 1.35 + ((i * 13) % 7) * 0.26;
          slot.vz = Math.sin(angle) * speed * 0.65 + 0.35;
          slot.rx = i * 0.4;
          slot.ry = i * 0.7;
          slot.vrx = 4 + (i % 5) * 1.5;
          slot.vry = 5 + (i % 4) * 1.5;
          slot.baseScale = cfg.particleScale * (0.75 + (i % 3) * 0.2);

          dummyColor.setHex(i % 2 === 0 ? cfg.primaryHex : cfg.secondaryHex);
          particleInstanced.setColorAt(i, dummyColor);
        } else {
          slot.active = false;
          dummyMat4.makeScale(0, 0, 0);
          particleInstanced.setMatrixAt(i, dummyMat4);
        }
      }
      if (particleInstanced.instanceColor) {
        particleInstanced.instanceColor.needsUpdate = true;
      }
      particleInstanced.instanceMatrix.needsUpdate = true;
    };

    renderer.compile(scene, camera);

    // =========================================================================
    // 10. 360° INTERACTIVE ORBIT DRAG ROTATION + RAYCASTER CLICK HANDLER
    // =========================================================================
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    let isPointerDown = false;
    let isDragging = false;
    let downX = 0;
    let downY = 0;
    let lastDragX = 0;
    let lastDragY = 0;
    let userYaw = 0;
    let userPitch = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      isDragging = false;
      downX = e.clientX;
      downY = e.clientY;
      lastDragX = e.clientX;
      lastDragY = e.clientY;
      renderer.domElement.setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPointerDown) return;
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist > 5) {
        isDragging = true;
      }
      if (isDragging) {
        const dx = e.clientX - lastDragX;
        const dy = e.clientY - lastDragY;
        lastDragX = e.clientX;
        lastDragY = e.clientY;
        userYaw += dx * 0.012;
        userPitch = Math.max(-0.35, Math.min(0.55, userPitch + dy * 0.008));
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isPointerDown) return;
      isPointerDown = false;
      renderer.domElement.releasePointerCapture?.(e.pointerId);

      // If it was a clean tap (not a 360° orbit drag), check raycast hits on Pack or Lever/Machine
      if (!isDragging) {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);

        if (stateRef.current.packDropped) {
          const packHits = raycaster.intersectObject(packMesh, true);
          if (packHits.length > 0) {
            stateRef.current.onPackClick();
            return;
          }
        }

        const hits = raycaster.intersectObjects(
          [leverKnob, leverRod, leverElbow, cabinetMesh],
          true
        );
        if (hits.length > 0) {
          stateRef.current.onLeverClick();
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);
    renderer.domElement.addEventListener('pointercancel', handlePointerUp);

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

    // Spring Physics States (Reanimated-style second-order springs)
    let squashSpring: SpringState = { value: 1, velocity: 0, target: 1 };
    let leverSpring: SpringState = { value: 0, velocity: 0, target: 0 };
    let packScaleSpring: SpringState = { value: 0, velocity: 0, target: 0 };
    let lastTriggerCount = stateRef.current.pullTriggerCount;
    let lastCoins = stateRef.current.coins;
    let lastPreset = stateRef.current.cameraPreset;
    let wasPackDropped = stateRef.current.packDropped;
    let reelSpinTimers = [0, 0, 0];
    let reelAngles = [0, 0, 0];

    let animId = 0;
    let lastTime = performance.now();

    const animate = (now: number) => {
      const rawDt = (now - lastTime) * 0.001;
      if (isHeadless && rawDt < 0.065) {
        animId = requestAnimationFrame(animate);
        return;
      }
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);
      const elapsed = now * 0.001;

      const st = stateRef.current;

      // Update 3D Embedded LED Coin Counter when coin count changes
      if (st.coins !== lastCoins) {
        lastCoins = st.coins;
        paintLedCounter(st.coins);
      }

      // Snap orbit yaw when user switches camera preset (e.g. BACK_VIEW vs DEFAULT)
      if (st.cameraPreset !== lastPreset) {
        lastPreset = st.cameraPreset;
        if (st.cameraPreset === 'BACK_VIEW') {
          userYaw = Math.PI;
          userPitch = 0.05;
        } else if (st.cameraPreset === 'DEFAULT') {
          userYaw = 0;
          userPitch = 0;
        }
      }

      // Detect new Lever Pull trigger
      if (st.pullTriggerCount !== lastTriggerCount) {
        lastTriggerCount = st.pullTriggerCount;
        // Reset view toward front when pulling so user sees the reels spin!
        userYaw = 0;
        userPitch = 0;
        squashSpring = { value: 0.76, velocity: -3.8, target: 1 };
        leverSpring = { value: 1.35, velocity: 6.0, target: 0 };
        reelSpinTimers = [0.85, 1.25, 1.65];
      }

      // Detect Pack Dropped edge transition -> spawn rarity-specific 3D particle burst!
      if (st.packDropped && !wasPackDropped) {
        spawnRarityParticles(st.packRarity || 'RARE');
      }
      wasPackDropped = st.packDropped;

      // Step Springs
      squashSpring = stepSpring(squashSpring, 260, 13, dt);
      leverSpring = stepSpring(leverSpring, 180, 14, dt);
      packScaleSpring.target = st.packDropped ? 1 : 0;
      packScaleSpring = stepSpring(packScaleSpring, 280, 15, dt);

      // Apply Volume-Preserving Squash-and-Stretch to the Unified Machine Pivot
      const sy = Math.max(0.68, Math.min(1.32, squashSpring.value));
      const sxz = 1 / Math.sqrt(sy);
      machinePivot.scale.set(sxz, sy, sxz);

      // Apply Lever Pull Rotation around the connected horizontal axle
      leverArmPivot.rotation.x = leverSpring.value * 1.15;

      // Gentle Floating Hover + Interactive 360° Orbit Rotation on Root Group
      rootGroup.position.y = -0.15 + Math.sin(elapsed * 2.1) * 0.05;
      const idleSway = isDragging ? 0 : Math.sin(elapsed * 0.85) * 0.045;
      rootGroup.rotation.y = THREE.MathUtils.damp(
        rootGroup.rotation.y,
        userYaw + idleSway,
        10,
        dt
      );
      rootGroup.rotation.x = THREE.MathUtils.damp(rootGroup.rotation.x, userPitch, 10, dt);

      // Connected Heart Topper Subtle Twist (Stays seated inside the Golden Cradle!)
      heartMesh.rotation.y = Math.sin(elapsed * 2.4) * 0.22;

      // Slot Reels High-Visibility Spin & Snap
      const symbolAngle = (Math.PI * 2) / 4;
      for (let i = 0; i < 3; i++) {
        if (reelSpinTimers[i] > 0) {
          reelSpinTimers[i] -= dt;
          reelAngles[i] += dt * (16 - i * 1.8);
          if (reelSpinTimers[i] <= 0) {
            const targetSym = st.targetReels[i] ?? 1;
            reelAngles[i] = targetSym * symbolAngle;
            squashSpring.velocity += 1.35;
          }
        } else {
          const desired = (st.targetReels[i] ?? 1) * symbolAngle;
          reelAngles[i] = THREE.MathUtils.damp(reelAngles[i], desired, 12, dt);
        }
        reelPivots[i].rotation.x = reelAngles[i];
      }

      // Ejected Foil Sticker Pack Animation
      packMesh.visible = packScaleSpring.value > 0.02;
      if (packMesh.visible) {
        const ps = Math.max(0.001, packScaleSpring.value);
        packMesh.scale.set(ps, ps, ps);
        packMesh.position.y = 0.42 + Math.sin(elapsed * 5) * 0.035;
        packMesh.rotation.z = -0.08 + Math.sin(elapsed * 4) * 0.05;
      }

      // Update Pooled Rarity Particles
      if (particleInstanced.visible) {
        let anyAlive = false;
        for (let i = 0; i < MAX_PARTICLES; i++) {
          const p = particlePool[i];
          if (!p.active) continue;
          p.life += dt;
          if (p.life >= p.maxLife) {
            p.active = false;
            dummyMat4.makeScale(0, 0, 0);
            particleInstanced.setMatrixAt(i, dummyMat4);
            continue;
          }
          anyAlive = true;
          const progress = p.life / p.maxLife;
          p.vy -= dt * (st.packRarity === 'LEGEND' ? 1.8 : 2.9);
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.z += p.vz * dt;
          p.rx += p.vrx * dt;
          p.ry += p.vry * dt;

          const scaleEnvelope = Math.sin(progress * Math.PI) * p.baseScale;
          dummyPos.set(p.x, p.y, p.z);
          dummyEuler.set(p.rx, p.ry, 0);
          dummyQuat.setFromEuler(dummyEuler);
          dummyScale.set(scaleEnvelope, scaleEnvelope, scaleEnvelope);
          dummyMat4.compose(dummyPos, dummyQuat, dummyScale);
          particleInstanced.setMatrixAt(i, dummyMat4);
        }
        particleInstanced.instanceMatrix.needsUpdate = true;
        if (!anyAlive) {
          particleInstanced.visible = false;
        }
      }

      // Chase Pedestal Marquee Bulbs
      const chaseSpeed = st.isPulling ? 16 : 5;
      bulbMats.forEach((bMat, idx) => {
        const wave = Math.sin(elapsed * chaseSpeed - idx * 0.7);
        bMat.emissiveIntensity = wave > 0.2 ? 2.2 : 0.35;
      });

      // Blender MCP Inspector Live Overrides (Wireframe, Exploded View, Camera Presets)
      const exp = st.explodedFactor || 0;
      topperGroup.position.y = THREE.MathUtils.damp(
        topperGroup.position.y,
        1.98 + exp * 0.75,
        10,
        dt
      );
      reelBayGroup.position.z = THREE.MathUtils.damp(
        reelBayGroup.position.z,
        0.74 + exp * 0.55,
        10,
        dt
      );
      backAssembly.position.z = THREE.MathUtils.damp(
        backAssembly.position.z,
        -0.75 - exp * 0.55,
        10,
        dt
      );
      leverGroup.position.x = THREE.MathUtils.damp(
        leverGroup.position.x,
        1.36 + exp * 0.65,
        10,
        dt
      );
      cloudGroup.position.y = THREE.MathUtils.damp(
        cloudGroup.position.y,
        -1.55 - exp * 0.45,
        10,
        dt
      );

      [candyPinkMat, deepMagentaMat, plumPedestalMat, brushedGoldMat, heartTopperMat, cloudPuffMat].forEach(
        (m) => {
          m.wireframe = Boolean(st.wireframe);
        }
      );

      // Camera Preset Smooth Damping
      const camTargetPos =
        st.cameraPreset === 'CLOSEUP'
          ? { x: 0.15, y: 1.05, z: 6.4 }
          : st.cameraPreset === 'TOP_ANGLE'
          ? { x: 0, y: 3.6, z: 8.2 }
          : { x: 0, y: 1.25, z: 9.2 };

      camera.position.x = THREE.MathUtils.damp(camera.position.x, camTargetPos.x, 6, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, camTargetPos.y, 6, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, camTargetPos.z, 6, dt);
      camera.lookAt(0, 0.2, 0);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      cancelAnimationFrame(resizeRafId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      renderer.domElement.removeEventListener('pointercancel', handlePointerUp);
      ledTex.dispose();
      reelTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="gacha-3d-canvas"
      className="relative h-full w-full cursor-grab active:cursor-grabbing select-none touch-none"
    />
  );
};
