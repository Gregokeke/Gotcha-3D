import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { stepSpring, SpringState } from '../game/rules';

export type ChestVariant = 'PINK' | 'PURPLE' | 'GOLD';

export interface TreasureChest3DProps {
  selectedChest: ChestVariant | null;
  tapCount: number;
  isBursting: boolean;
  onSelectChest: (variant: ChestVariant) => void;
  onTapChest: () => void;
}

interface ChestRig {
  variant: ChestVariant;
  root: THREE.Group;
  squashPivot: THREE.Group;
  lidPivot: THREE.Group;
  lockMesh: THREE.Mesh;
  innerGlowLight: THREE.PointLight;
  emergingPack: THREE.Group;
  baseX: number;
}

/**
 * Unified Three.js 3D Royal Treasure Chest Stage for LuckyPickChestModal:
 * - Phase 1 (selectedChest === null): Renders 3 sculpted 3D Royal Treasure Chests (PINK, PURPLE, GOLD)
 *   with beveled lacquer hulls, arched 3D dome lids, metallic gold banding, 3D rivets, and star lockplates.
 * - Phase 2 (selectedChest !== null): Smoothly zooms the chosen 3D chest to center stage, summons a
 *   sculpted 3D Magic Star Key that strikes & twists on each tap, cracks the hinged 3D lid open with
 *   squash-and-stretch spring physics, and erupts with 3D golden gems & an emerging 3D Foil Pack on tap 3!
 */
export const TreasureChest3DCanvas: React.FC<TreasureChest3DProps> = ({
  selectedChest,
  tapCount,
  isBursting,
  onSelectChest,
  onTapChest,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef({
    selectedChest,
    tapCount,
    isBursting,
    onSelectChest,
    onTapChest,
  });

  useEffect(() => {
    stateRef.current = {
      selectedChest,
      tapCount,
      isBursting,
      onSelectChest,
      onTapChest,
    };
  }, [selectedChest, tapCount, isBursting, onSelectChest, onTapChest]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    const width = container.clientWidth || 350;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 60);
    camera.position.set(0, 1.15, 7.6);
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
    renderer.toneMappingExposure = 1.25;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio & Magical Rim Lighting
    const ambient = new THREE.AmbientLight(0xf5d0fe, 1.25);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.9);
    keyLight.position.set(4, 7, 6);
    scene.add(keyLight);

    const rimLightLeft = new THREE.PointLight(0xf472b6, 4.2, 14);
    rimLightLeft.position.set(-4.5, 2.5, -2);
    scene.add(rimLightLeft);

    const rimLightRight = new THREE.PointLight(0xfacc15, 4.2, 14);
    rimLightRight.position.set(4.5, 2.5, -2);
    scene.add(rimLightRight);

    // Shared Metallic Gold Trim & Stud Material
    const royalGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.18,
      metalness: 0.9,
      emissive: 0x78350f,
      emissiveIntensity: 0.18,
    });

    const darkInteriorMat = new THREE.MeshStandardMaterial({
      color: 0x1e0538,
      roughness: 0.6,
      metalness: 0.2,
    });

    const treasureGoldPileMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.12,
      metalness: 0.95,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.65,
    });

    // Helper to build a Star Shape for Lockplates & Key Bow
    const createStarExtrude = (outerR: number, innerR: number, depth: number) => {
      const shape = new THREE.Shape();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelSegments: 4,
        bevelSize: depth * 0.35,
        bevelThickness: depth * 0.35,
      });
      geo.center();
      return geo;
    };

    const starEmblemGeo = createStarExtrude(0.16, 0.075, 0.045);

    // Build a single sculpted 3D Royal Treasure Chest
    const buildChestRig = (variant: ChestVariant, baseX: number): ChestRig => {
      const root = new THREE.Group();
      root.position.set(baseX, -0.05, 0);
      scene.add(root);

      const squashPivot = new THREE.Group();
      root.add(squashPivot);

      const palette =
        variant === 'PINK'
          ? { hull: 0xec4899, panel: 0xbe185d, gem: 0xff85c0 }
          : variant === 'PURPLE'
          ? { hull: 0x9333ea, panel: 0x581c87, gem: 0xd8b4fe }
          : { hull: 0xf59e0b, panel: 0xb45309, gem: 0xfef08a };

      const hullMat = new THREE.MeshPhysicalMaterial({
        color: palette.hull,
        roughness: 0.16,
        metalness: 0.25,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
      });

      const panelMat = new THREE.MeshPhysicalMaterial({
        color: palette.panel,
        roughness: 0.22,
        metalness: 0.35,
        clearcoat: 0.85,
      });

      // 1. Floating Starlight Pedestal Base under Chest
      const cushionMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.76, 0.84, 0.14, 28),
        panelMat
      );
      cushionMesh.position.y = -0.56;
      squashPivot.add(cushionMesh);

      const cushionRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.78, 0.035, 12, 32),
        royalGoldMat
      );
      cushionRim.rotation.x = Math.PI / 2;
      cushionRim.position.y = -0.5;
      squashPivot.add(cushionRim);

      // 2. Lower Chest Hull (Tapered Beveled Box + Gold Corner Brackets & Claw Feet)
      const baseBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.18, 0.64, 0.84),
        hullMat
      );
      baseBox.position.y = -0.14;
      squashPivot.add(baseBox);

      // Recessed Front & Back Plush Panels
      const frontInset = new THREE.Mesh(
        new THREE.BoxGeometry(0.96, 0.46, 0.88),
        panelMat
      );
      frontInset.position.y = -0.14;
      squashPivot.add(frontInset);

      // 4 Gold Corner Pillars & Lion/Claw Feet
      const cornerOffsets: [number, number][] = [
        [-0.58, 0.41],
        [0.58, 0.41],
        [-0.58, -0.41],
        [0.58, -0.41],
      ];
      cornerOffsets.forEach(([cx, cz]) => {
        const pillar = new THREE.Mesh(
          new THREE.BoxGeometry(0.11, 0.68, 0.11),
          royalGoldMat
        );
        pillar.position.set(cx, -0.14, cz);
        squashPivot.add(pillar);

        const foot = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 14, 12),
          royalGoldMat
        );
        foot.scale.set(1.1, 0.7, 1.2);
        foot.position.set(cx * 1.03, -0.48, cz * 1.03);
        squashPivot.add(foot);
      });

      // Gold Middle Waist Band & Left/Right Vertical Straps on Lower Hull
      const waistRim = new THREE.Mesh(
        new THREE.BoxGeometry(1.26, 0.09, 0.92),
        royalGoldMat
      );
      waistRim.position.y = 0.18;
      squashPivot.add(waistRim);

      [-0.36, 0.36].forEach((sx) => {
        const strap = new THREE.Mesh(
          new THREE.BoxGeometry(0.09, 0.66, 0.9),
          royalGoldMat
        );
        strap.position.set(sx, -0.14, 0);
        squashPivot.add(strap);
      });

      // 3. Glowing Treasure Bed Inside the Chest Cavity (Visible when lid opens!)
      const cavityVoid = new THREE.Mesh(
        new THREE.BoxGeometry(1.06, 0.12, 0.72),
        darkInteriorMat
      );
      cavityVoid.position.y = 0.16;
      squashPivot.add(cavityVoid);

      for (let i = 0; i < 12; i++) {
        const mound = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.11 + (i % 3) * 0.03, 1),
          treasureGoldPileMat
        );
        mound.position.set(
          -0.38 + (i % 4) * 0.25,
          0.22 + (i % 2) * 0.04,
          -0.18 + Math.floor(i / 4) * 0.18
        );
        squashPivot.add(mound);
      }

      const innerGlowLight = new THREE.PointLight(0xfde047, 0.2, 5);
      innerGlowLight.position.set(0, 0.35, 0.1);
      squashPivot.add(innerGlowLight);

      // Emerging 3D Foil Pack / Star Totem inside the chest (pops up when chest bursts!)
      const emergingPack = new THREE.Group();
      emergingPack.position.set(0, 0.15, 0);
      emergingPack.scale.set(0.01, 0.01, 0.01);
      const miniPackBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.56, 0.74, 0.14),
        new THREE.MeshPhysicalMaterial({
          color: 0xff85c0,
          metalness: 0.6,
          roughness: 0.12,
          clearcoat: 1.0,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.4,
        })
      );
      const miniPackStar = new THREE.Mesh(starEmblemGeo, royalGoldMat);
      miniPackStar.position.z = 0.09;
      emergingPack.add(miniPackBody, miniPackStar);
      squashPivot.add(emergingPack);

      // 4. Articulated Hinged Arched 3D Dome Lid (Pivots around back edge z = -0.42, y = 0.18)
      const lidPivot = new THREE.Group();
      lidPivot.position.set(0, 0.18, -0.42);
      squashPivot.add(lidPivot);

      const lidContents = new THREE.Group();
      lidContents.position.set(0, 0, 0.42);
      lidPivot.add(lidContents);

      // Half-Cylinder Vaulted Lid Hull
      const lidCylinderGeo = new THREE.CylinderGeometry(
        0.42,
        0.42,
        1.18,
        24,
        1,
        false,
        0,
        Math.PI
      );
      lidCylinderGeo.rotateZ(Math.PI / 2);
      const lidDomeMesh = new THREE.Mesh(lidCylinderGeo, hullMat);
      lidDomeMesh.scale.set(1, 0.85, 1);
      lidContents.add(lidDomeMesh);

      // Gold Arched Ribs on the Dome Lid
      [-0.58, -0.36, 0.36, 0.58].forEach((rx) => {
        const ribGeo = new THREE.CylinderGeometry(
          0.445,
          0.445,
          0.09,
          24,
          1,
          false,
          0,
          Math.PI
        );
        ribGeo.rotateZ(Math.PI / 2);
        const ribMesh = new THREE.Mesh(ribGeo, royalGoldMat);
        ribMesh.scale.set(1, 0.86, 1);
        ribMesh.position.x = rx;
        lidContents.add(ribMesh);
      });

      // Top Crown Gem Finial on the Lid Crest
      const crownGem = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.12, 0),
        new THREE.MeshPhysicalMaterial({
          color: palette.gem,
          roughness: 0.08,
          metalness: 0.2,
          transmission: 0.4,
          clearcoat: 1.0,
          emissive: palette.gem,
          emissiveIntensity: 0.35,
        })
      );
      crownGem.position.set(0, 0.4, 0);
      lidContents.add(crownGem);

      // 5. Front Heavy 3D Shield Lockplate & Star Keyhole Emblem
      const lockGroup = new THREE.Group();
      lockGroup.position.set(0, 0.14, 0.46);
      squashPivot.add(lockGroup);

      const lockPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.38, 0.08),
        royalGoldMat
      );
      lockGroup.add(lockPlate);

      const lockStar = new THREE.Mesh(starEmblemGeo, panelMat);
      lockStar.position.z = 0.04;
      lockGroup.add(lockStar);

      // Glowing Keyhole Slot in Center of Lockplate
      const keyhole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.025, 0.1, 12),
        darkInteriorMat
      );
      keyhole.rotation.x = Math.PI / 2;
      keyhole.position.z = 0.045;
      lockGroup.add(keyhole);

      return {
        variant,
        root,
        squashPivot,
        lidPivot,
        lockMesh: lockPlate,
        innerGlowLight,
        emergingPack,
        baseX,
      };
    };

    const chestRigs: ChestRig[] = [
      buildChestRig('PINK', -1.85),
      buildChestRig('PURPLE', 0),
      buildChestRig('GOLD', 1.85),
    ];

    // =========================================================================
    // SCULPTED 3D MAGIC STAR KEY (Hovers & Strikes the Lockplate in Phase 2!)
    // =========================================================================
    const keyGroup = new THREE.Group();
    keyGroup.visible = false;
    scene.add(keyGroup);

    const keyBowGeo = createStarExtrude(0.32, 0.15, 0.07);
    const keyBowMesh = new THREE.Mesh(keyBowGeo, royalGoldMat);
    keyBowMesh.position.set(0, 0.42, 0);
    keyGroup.add(keyBowMesh);

    const keyCenterGem = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 16, 16),
      new THREE.MeshPhysicalMaterial({
        color: 0xff85c0,
        roughness: 0.1,
        metalness: 0.3,
        clearcoat: 1.0,
        emissive: 0xec4899,
        emissiveIntensity: 0.5,
      })
    );
    keyCenterGem.position.set(0, 0.42, 0.055);
    keyGroup.add(keyCenterGem);

    const keyCollar = new THREE.Mesh(
      new THREE.TorusGeometry(0.085, 0.03, 12, 20),
      royalGoldMat
    );
    keyCollar.rotation.x = Math.PI / 2;
    keyCollar.position.set(0, 0.14, 0);
    keyGroup.add(keyCollar);

    const keyShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.042, 0.62, 16),
      royalGoldMat
    );
    keyShaft.position.set(0, -0.16, 0);
    keyGroup.add(keyShaft);

    // Key Teeth
    const tooth1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.06, 0.045),
      royalGoldMat
    );
    tooth1.position.set(0.08, -0.32, 0);
    const tooth2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.06, 0.045),
      royalGoldMat
    );
    tooth2.position.set(0.1, -0.42, 0);
    keyGroup.add(tooth1, tooth2);

    // =========================================================================
    // POOLED 3D TREASURE BURST GEMS & COINS (Erupts on Tap 3!)
    // =========================================================================
    const PARTICLE_COUNT = 36;
    const gemGeo = new THREE.OctahedronGeometry(0.095, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.5,
      roughness: 0.1,
      metalness: 0.9,
    });
    const gemInstanced = new THREE.InstancedMesh(gemGeo, gemMat, PARTICLE_COUNT);
    gemInstanced.frustumCulled = false;
    scene.add(gemInstanced);

    const dummyColor = new THREE.Color();
    const burstParticles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      dummyColor.setHex(i % 3 === 0 ? 0xfde047 : i % 3 === 1 ? 0xff85c0 : 0xd8b4fe);
      gemInstanced.setColorAt(i, dummyColor);
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const speed = 1.4 + ((i * 17) % 9) * 0.24;
      return {
        vx: Math.cos(angle) * speed,
        vy: 2.2 + ((i * 13) % 7) * 0.35,
        vz: Math.sin(angle) * speed * 0.75 + 0.4,
        vrx: 5 + (i % 5) * 2,
        vry: 6 + (i % 4) * 2,
        scale: 0.75 + (i % 3) * 0.35,
      };
    });
    if (gemInstanced.instanceColor) gemInstanced.instanceColor.needsUpdate = true;

    const dummyMat4 = new THREE.Matrix4();
    const dummyPos = new THREE.Vector3();
    const dummyEuler = new THREE.Euler();
    const dummyQuat = new THREE.Quaternion();
    const dummyScale = new THREE.Vector3();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      dummyMat4.makeScale(0, 0, 0);
      gemInstanced.setMatrixAt(i, dummyMat4);
    }
    gemInstanced.instanceMatrix.needsUpdate = true;

    renderer.compile(scene, camera);

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

    // Spring Physics States per Chest + Key Strike
    const squashSprings: Record<ChestVariant, SpringState> = {
      PINK: { value: 1, velocity: 0, target: 1 },
      PURPLE: { value: 1, velocity: 0, target: 1 },
      GOLD: { value: 1, velocity: 0, target: 1 },
    };
    const lidSprings: Record<ChestVariant, SpringState> = {
      PINK: { value: 0, velocity: 0, target: 0 },
      PURPLE: { value: 0, velocity: 0, target: 0 },
      GOLD: { value: 0, velocity: 0, target: 0 },
    };
    let keyStrikeSpring: SpringState = { value: 0, velocity: 0, target: 0 };
    let emergePackSpring: SpringState = { value: 0, velocity: 0, target: 0 };

    let lastTapCount = stateRef.current.tapCount;
    let lastSelected = stateRef.current.selectedChest;
    let burstTimer = 0;

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

      // Detect chest selection impulse
      if (st.selectedChest && st.selectedChest !== lastSelected) {
        lastSelected = st.selectedChest;
        squashSprings[st.selectedChest] = { value: 0.78, velocity: 4.2, target: 1 };
      }

      // Detect Tap Impulse on the Chosen Chest
      if (st.tapCount !== lastTapCount && st.selectedChest) {
        lastTapCount = st.tapCount;
        squashSprings[st.selectedChest] = { value: 0.72, velocity: -5.2, target: 1 };
        keyStrikeSpring = { value: 1.25, velocity: 7.5, target: 0 };
        // Crack lid open progressively on tap 1 & 2, then fling wide open on tap 3!
        lidSprings[st.selectedChest].target =
          st.tapCount === 1 ? -0.18 : st.tapCount === 2 ? -0.38 : -1.35;
      }

      if (st.isBursting && st.selectedChest) {
        lidSprings[st.selectedChest].target = -1.38;
        emergePackSpring.target = 1;
        burstTimer += dt;
      } else {
        burstTimer = 0;
        emergePackSpring.target = 0;
      }

      keyStrikeSpring = stepSpring(keyStrikeSpring, 240, 14, dt);
      emergePackSpring = stepSpring(emergePackSpring, 210, 13, dt);

      // Update each of the 3 Chest Rigs
      chestRigs.forEach((rig, idx) => {
        const isChosen = st.selectedChest === rig.variant;
        const isUnchosen = st.selectedChest !== null && !isChosen;

        squashSprings[rig.variant] = stepSpring(squashSprings[rig.variant], 260, 13, dt);
        lidSprings[rig.variant] = stepSpring(lidSprings[rig.variant], 220, 13, dt);

        // Target Position & Scale
        const targetX = isChosen ? 0 : isUnchosen ? rig.baseX * 2.8 : rig.baseX;
        const targetY = isChosen
          ? -0.28 + Math.sin(elapsed * 2.6) * 0.05
          : -0.05 + Math.sin(elapsed * 2.4 + idx * 1.1) * 0.06;
        const targetZ = isChosen ? 1.85 : isUnchosen ? -3.5 : 0;
        const targetScale = isChosen ? 1.48 : isUnchosen ? 0.01 : 0.92;

        rig.root.position.x = THREE.MathUtils.damp(rig.root.position.x, targetX, 9, dt);
        rig.root.position.y = THREE.MathUtils.damp(rig.root.position.y, targetY, 9, dt);
        rig.root.position.z = THREE.MathUtils.damp(rig.root.position.z, targetZ, 9, dt);

        const s = THREE.MathUtils.damp(rig.root.scale.x, targetScale, 9, dt);
        rig.root.scale.set(s, s, s);
        rig.root.visible = s > 0.05;

        // Gentle 3D rotation
        const targetRotY = isChosen
          ? Math.sin(elapsed * 1.8) * 0.14
          : (idx === 0 ? 0.22 : idx === 2 ? -0.22 : 0) + Math.sin(elapsed * 1.7 + idx) * 0.1;
        rig.root.rotation.y = THREE.MathUtils.damp(rig.root.rotation.y, targetRotY, 8, dt);

        // Volume-preserving squash & stretch
        const sy = Math.max(0.65, Math.min(1.35, squashSprings[rig.variant].value));
        const sxz = 1 / Math.sqrt(sy);
        rig.squashPivot.scale.set(sxz, sy, sxz);

        // Hinged 3D Dome Lid Angle
        const idlePeek = st.selectedChest === null ? -0.06 - Math.abs(Math.sin(elapsed * 2 + idx)) * 0.05 : 0;
        rig.lidPivot.rotation.x = lidSprings[rig.variant].value + idlePeek;

        // Inner Treasure Light Intensity
        rig.innerGlowLight.intensity = isChosen ? 1.2 + Math.abs(lidSprings[rig.variant].value) * 4.5 : 0.4;

        // Emerging 3D Foil Pack rising out of the open chest on tap 3!
        if (isChosen && emergePackSpring.value > 0.02) {
          const ep = emergePackSpring.value;
          rig.emergingPack.scale.set(ep, ep, ep);
          rig.emergingPack.position.y = 0.15 + ep * 0.78;
          rig.emergingPack.rotation.y = elapsed * 3.5;
        } else {
          rig.emergingPack.scale.set(0.001, 0.001, 0.001);
        }
      });

      // Update 3D Magic Star Key in Phase 2
      if (st.selectedChest && !st.isBursting) {
        keyGroup.visible = true;
        const strike = keyStrikeSpring.value;
        keyGroup.position.set(
          -0.95 + strike * 0.55,
          0.35 - strike * 0.32 + Math.sin(elapsed * 4.2) * 0.06,
          2.65
        );
        keyGroup.rotation.z = -0.65 + strike * 0.55;
        keyGroup.rotation.y = strike * 1.4 + Math.sin(elapsed * 3) * 0.2;
      } else {
        keyGroup.visible = false;
      }

      // Update 36 Erupting 3D Treasure Gems & Coins when Bursting
      if (st.isBursting && burstTimer > 0) {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          const p = burstParticles[i];
          const life = Math.min(1, burstTimer / 0.95);
          const px = p.vx * burstTimer;
          const py = 0.1 + p.vy * burstTimer - 0.5 * 4.5 * burstTimer * burstTimer;
          const pz = 1.85 + p.vz * burstTimer;
          const env = Math.sin(life * Math.PI) * p.scale;

          dummyPos.set(px, py, pz);
          dummyEuler.set(p.vrx * burstTimer, p.vry * burstTimer, 0);
          dummyQuat.setFromEuler(dummyEuler);
          dummyScale.set(env, env, env);
          dummyMat4.compose(dummyPos, dummyQuat, dummyScale);
          gemInstanced.setMatrixAt(i, dummyMat4);
        }
        gemInstanced.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      cancelAnimationFrame(resizeRafId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="treasure-chest-3d-canvas"
      className="relative h-full w-full select-none"
    />
  );
};
