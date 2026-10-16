"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Procedural Texture Generator for DJI Air 2S Canopy & Branding
 */
function createAir2SCanopyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  // Matte aircraft cool grey base
  ctx.fillStyle = "#a8adb5";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Aerodynamic panel seam lines
  ctx.strokeStyle = "#8e939c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(120, 0);
  ctx.lineTo(160, canvas.height);
  ctx.moveTo(canvas.width - 120, 0);
  ctx.lineTo(canvas.width - 160, canvas.height);
  ctx.stroke();

  // "AIR 2S" Brand typography
  ctx.fillStyle = "#334155";
  ctx.font = "bold 44px 'Segoe UI', -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AIR 2S", canvas.width / 2, 70);

  // Subtle DJI logo
  ctx.font = "bold 26px sans-serif";
  ctx.fillStyle = "#475569";
  ctx.fillText("DJI", canvas.width / 2, 120);

  // 1-INCH 20MP Sensor badge
  ctx.font = "bold 20px monospace";
  ctx.fillStyle = "#e11d48";
  ctx.fillText("1-INCH 20MP • APAS 4.0", canvas.width / 2, 175);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates high-speed rotor motion-blur disc texture with signature DJI orange perimeter
 */
function createRotorBlurTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const center = 128;
  const radius = 120;

  // Translucent motion blur gradient disc
  const grad = ctx.createRadialGradient(center, center, 10, center, center, radius);
  grad.addColorStop(0, "rgba(50, 50, 56, 0.45)");
  grad.addColorStop(0.7, "rgba(70, 70, 80, 0.25)");
  grad.addColorStop(0.88, "rgba(249, 115, 22, 0.7)"); // DJI Signature Orange Tip Streak
  grad.addColorStop(1, "rgba(249, 115, 22, 0.0)");

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export default function InteractiveDrone() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasHolderRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  // Viewport position coordinates (in percentages: 0 to 100)
  const posRef = useRef({ x: 82, y: 24 });
  const targetPosRef = useRef({ x: 82, y: 24 });

  // Aerodynamic flight angles (pitch, yaw, roll in degrees)
  const rotRef = useRef({ pitch: 0, yaw: 0, roll: 0 });
  const targetRotRef = useRef({ pitch: 0, yaw: 0, roll: 0 });

  // Mouse & Scroll Tracking - Decoupled from DOM layout reads
  const lastMousePosRef = useRef({ x: -1000, y: -1000 });
  const scrollYRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const scrollVelocityRef = useRef(0);

  useEffect(() => {
    const canvasHolder = canvasHolderRef.current;
    if (!canvasHolder) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // =========================================================================
    // 3D SCENE: DJI AIR 2S REALISTIC QUADCOPTER RIG
    // =========================================================================
    const width = 240;
    const height = 180;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 3.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    canvasHolder.appendChild(renderer.domElement);

    // Studio Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(3, 5, 4);
    scene.add(sunLight);

    const roseRimLight = new THREE.DirectionalLight(0xff2d55, 1.4);
    roseRimLight.position.set(-3, 2, -3);
    scene.add(roseRimLight);

    const bottomFillLight = new THREE.DirectionalLight(0xe0f2fe, 0.8);
    bottomFillLight.position.set(0, -3, 2);
    scene.add(bottomFillLight);

    // MATERIALS FOR DJI AIR 2S
    const djiAircraftGreyMat = new THREE.MeshStandardMaterial({
      color: 0xa4abb5, // Characteristic DJI Air 2S aircraft cool matte grey
      roughness: 0.42,
      metalness: 0.22,
    });

    const djiDarkCompositeMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.6,
      metalness: 0.4,
    });

    const djiCanopyDecalMat = new THREE.MeshStandardMaterial({
      map: createAir2SCanopyTexture(),
      roughness: 0.4,
      metalness: 0.2,
    });

    const sensorGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x09090b,
      metalness: 0.8,
      roughness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      reflectivity: 0.95,
    });

    const propellerBladeMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.35,
      metalness: 0.25,
      transparent: true,
      opacity: 0.9,
    });

    // Iconic DJI Air 2S Propeller Orange Aerodynamic Tips
    const orangeTipMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 0.35,
      roughness: 0.3,
    });

    // Motion-blur disc material for continuous high-speed rotation effect
    const rotorBlurMat = new THREE.MeshBasicMaterial({
      map: createRotorBlurTexture(),
      transparent: true,
      opacity: 0.82,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const cameraLensGoldRingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // 1-inch sensor gold accent ring
      metalness: 0.85,
      roughness: 0.25,
    });

    const opticalLensMat = new THREE.MeshPhysicalMaterial({
      color: 0x0369a1,
      metalness: 0.2,
      roughness: 0.05,
      transmission: 0.6,
      clearcoat: 1.0,
    });

    const batteryLedMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x22c55e,
      emissiveIntensity: 0.9,
    });

    const navRedLedMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.95,
    });

    const navGreenLedMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.95,
    });

    // AIRFRAME 3D ROOT GROUP
    const droneRoot = new THREE.Group();
    scene.add(droneRoot);

    // 1. Sleek Aerodynamic Fuselage / Body (Curved tapered canopy)
    const bodyGeo = new THREE.BoxGeometry(0.54, 0.22, 0.92);
    const bodyMesh = new THREE.Mesh(bodyGeo, djiAircraftGreyMat);
    bodyMesh.castShadow = true;
    droneRoot.add(bodyMesh);

    // Top Aerodynamic Canopy Shield with "AIR 2S" Decal
    const canopyGeo = new THREE.BoxGeometry(0.48, 0.08, 0.68);
    const canopyMesh = new THREE.Mesh(canopyGeo, djiCanopyDecalMat);
    canopyMesh.position.set(0, 0.13, -0.04);
    droneRoot.add(canopyMesh);

    // Top Battery Compartment & 4 Green Fuel Gauge LEDs
    const batteryPanelGeo = new THREE.BoxGeometry(0.38, 0.04, 0.36);
    const batteryPanel = new THREE.Mesh(batteryPanelGeo, djiDarkCompositeMat);
    batteryPanel.position.set(0, 0.17, -0.16);
    droneRoot.add(batteryPanel);

    for (let i = 0; i < 4; i++) {
      const ledGeo = new THREE.SphereGeometry(0.014, 8, 8);
      const led = new THREE.Mesh(ledGeo, batteryLedMat);
      led.position.set(-0.075 + i * 0.05, 0.19, -0.16);
      droneRoot.add(led);
    }

    // Circular Battery Power Button
    const pwrBtnGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.02, 16);
    const pwrBtn = new THREE.Mesh(pwrBtnGeo, djiDarkCompositeMat);
    pwrBtn.position.set(0, 0.185, -0.24);
    droneRoot.add(pwrBtn);

    // 2. SIGNATURE DJI AIR 2S FOUR-DIRECTIONAL OBSTACLE SENSING:
    // A. MasterShots Upward-Angled Dual Sensor Eyes on Nose Top
    const sensorLeftGeo = new THREE.SphereGeometry(0.038, 16, 16);
    const sensorLeft = new THREE.Mesh(sensorLeftGeo, sensorGlassMat);
    sensorLeft.position.set(-0.14, 0.12, 0.36);
    droneRoot.add(sensorLeft);

    const sensorRight = new THREE.Mesh(sensorLeftGeo, sensorGlassMat);
    sensorRight.position.set(0.14, 0.12, 0.36);
    droneRoot.add(sensorRight);

    // B. Forward Dual Collision Avoidance Sensors on Front Bumper
    const frontSensorLeftGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.04, 16);
    const frontSensorLeft = new THREE.Mesh(frontSensorLeftGeo, sensorGlassMat);
    frontSensorLeft.position.set(-0.16, 0.02, 0.46);
    frontSensorLeft.rotation.x = Math.PI / 2;
    droneRoot.add(frontSensorLeft);

    const frontSensorRight = new THREE.Mesh(frontSensorLeftGeo, sensorGlassMat);
    frontSensorRight.position.set(0.16, 0.02, 0.46);
    frontSensorRight.rotation.x = Math.PI / 2;
    droneRoot.add(frontSensorRight);

    // C. Rear Collision Sensors on Tail
    const rearSensorGeo = new THREE.BoxGeometry(0.08, 0.04, 0.04);
    const rearSensor = new THREE.Mesh(rearSensorGeo, sensorGlassMat);
    rearSensor.position.set(0, 0.04, -0.47);
    droneRoot.add(rearSensor);

    // 3. UNDERBODY 3-AXIS GIMBAL & 1-INCH 20MP CAMERA ASSEMBLY
    const gimbalRig = new THREE.Group();
    gimbalRig.position.set(0, -0.16, 0.34);
    droneRoot.add(gimbalRig);

    // Mechanical Gimbal U-Bracket
    const bracketGeo = new THREE.BoxGeometry(0.18, 0.06, 0.12);
    const bracket = new THREE.Mesh(bracketGeo, djiDarkCompositeMat);
    gimbalRig.add(bracket);

    // 1-Inch Camera Body
    const camGeo = new THREE.BoxGeometry(0.16, 0.14, 0.18);
    const camBody = new THREE.Mesh(camGeo, djiDarkCompositeMat);
    camBody.position.set(0, -0.06, 0.04);
    gimbalRig.add(camBody);

    // 1-Inch Sensor Gold Ring Accent
    const goldRingGeo = new THREE.TorusGeometry(0.052, 0.006, 16, 32);
    const goldRing = new THREE.Mesh(goldRingGeo, cameraLensGoldRingMat);
    goldRing.position.set(0, -0.06, 0.14);
    gimbalRig.add(goldRing);

    // Optical Lens Front Glass
    const lensFrontGeo = new THREE.SphereGeometry(0.048, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const lensFront = new THREE.Mesh(lensFrontGeo, opticalLensMat);
    lensFront.position.set(0, -0.06, 0.135);
    gimbalRig.add(lensFront);

    // 4. FOUR FOLDING ARMS & PROPELLER ASSEMBLIES
    // Persistent references to propeller assemblies for decoupled frame animation
    const propellerMeshes: THREE.Group[] = [];

    const createArmAndProp = (
      armStartX: number,
      armStartZ: number,
      armAngle: number,
      armLength: number,
      isFront: boolean,
      isLeft: boolean
    ) => {
      const armGroup = new THREE.Group();
      armGroup.position.set(armStartX, 0.02, armStartZ);
      droneRoot.add(armGroup);

      // Folding Arm structure (sleek tapered carbon composite)
      const armBarGeo = new THREE.CylinderGeometry(0.038, 0.046, armLength, 16);
      const armBar = new THREE.Mesh(armBarGeo, djiAircraftGreyMat);
      armBar.position.set(
        (Math.sin(armAngle) * armLength) / 2,
        0,
        (Math.cos(armAngle) * armLength) / 2
      );
      armBar.rotation.z = Math.sin(armAngle) * 1.5;
      armBar.rotation.x = Math.cos(armAngle) * 1.5;
      armGroup.add(armBar);

      // Motor end position
      const motorX = Math.sin(armAngle) * armLength;
      const motorZ = Math.cos(armAngle) * armLength;

      // Motor Bell Housing
      const motorGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.07, 24);
      const motor = new THREE.Mesh(motorGeo, djiDarkCompositeMat);
      motor.position.set(motorX, 0.04, motorZ);
      armGroup.add(motor);

      // Integrated Landing Antenna Leg (on front arms)
      if (isFront) {
        const legGeo = new THREE.CylinderGeometry(0.022, 0.016, 0.22, 12);
        const leg = new THREE.Mesh(legGeo, djiAircraftGreyMat);
        leg.position.set(motorX, -0.09, motorZ);
        leg.rotation.z = isLeft ? 0.2 : -0.2;
        armGroup.add(leg);

        // Navigation LED on front leg tip
        const navLedGeo = new THREE.SphereGeometry(0.016, 8, 8);
        const navLed = new THREE.Mesh(navLedGeo, isLeft ? navRedLedMat : navGreenLedMat);
        navLed.position.set(motorX, -0.18, motorZ);
        armGroup.add(navLed);
      } else {
        // Rear landing peg
        const pegGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.08, 8);
        const peg = new THREE.Mesh(pegGeo, djiDarkCompositeMat);
        peg.position.set(motorX, -0.04, motorZ);
        armGroup.add(peg);
      }

      // Propeller Hub & Dual Folding Blades with Orange Aerodynamic Tips
      const propGroup = new THREE.Group();
      propGroup.position.set(motorX, 0.09, motorZ);
      armGroup.add(propGroup);
      propellerMeshes.push(propGroup);

      // Center prop locking nut
      const nutGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.02, 12);
      const nut = new THREE.Mesh(nutGeo, djiDarkCompositeMat);
      propGroup.add(nut);

      // Blade 1
      const blade1Geo = new THREE.BoxGeometry(0.48, 0.008, 0.044);
      const blade1 = new THREE.Mesh(blade1Geo, propellerBladeMat);
      blade1.position.x = 0.22;
      propGroup.add(blade1);

      // Blade 1 Orange Tip
      const tip1Geo = new THREE.BoxGeometry(0.08, 0.009, 0.046);
      const tip1 = new THREE.Mesh(tip1Geo, orangeTipMat);
      tip1.position.x = 0.42;
      propGroup.add(tip1);

      // Blade 2 (opposite side)
      const blade2Geo = new THREE.BoxGeometry(0.48, 0.008, 0.044);
      const blade2 = new THREE.Mesh(blade2Geo, propellerBladeMat);
      blade2.position.x = -0.22;
      propGroup.add(blade2);

      // Blade 2 Orange Tip
      const tip2Geo = new THREE.BoxGeometry(0.08, 0.009, 0.046);
      const tip2 = new THREE.Mesh(tip2Geo, orangeTipMat);
      tip2.position.x = -0.42;
      propGroup.add(tip2);

      // High-speed rotor motion-blur disc (ensures persistent smooth blur rotation even on variable refresh rates)
      const blurDiscGeo = new THREE.PlaneGeometry(0.96, 0.96);
      const blurDisc = new THREE.Mesh(blurDiscGeo, rotorBlurMat);
      blurDisc.rotation.x = -Math.PI / 2;
      blurDisc.position.y = 0.005;
      propGroup.add(blurDisc);
    };

    // Front Left Arm (CCW)
    createArmAndProp(-0.18, 0.22, -Math.PI * 0.65, 0.58, true, true);
    // Front Right Arm (CW)
    createArmAndProp(0.18, 0.22, Math.PI * 0.65, 0.58, true, false);
    // Rear Left Arm (CW)
    createArmAndProp(-0.18, -0.24, -Math.PI * 0.28, 0.64, false, true);
    // Rear Right Arm (CCW)
    createArmAndProp(0.18, -0.24, Math.PI * 0.28, 0.64, false, false);

    // =========================================================================
    // APAS 4.0 AUTONOMOUS FLIGHT & CURSOR EVASION PHYSICS (ZERO LAYOUT REFLOW)
    // =========================================================================
    let animationFrameId: number;
    let lastDodgeTime = 0;
    let lastAutonomousShiftTime = Date.now();
    const startTime = performance.now();

    // Proximity detection radius in pixels around drone
    const DETECTION_RADIUS = 180;

    // Viewport safe boundary margins
    const MIN_X = 8;
    const MAX_X = 88;
    const MIN_Y = 12;
    const MAX_Y = 82;

    // Cached document height to avoid layout thrashing during scroll
    let cachedDocHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const updateDocHeight = () => {
      cachedDocHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    window.addEventListener("resize", updateDocHeight, { passive: true });

    /**
     * Pure mathematical dodge evasion without calling getBoundingClientRect()
     * Eliminates forced synchronous layout reflow on the main thread
     */
    const triggerDodge = (clientX: number, clientY: number, force = false) => {
      // Direct viewport pixel coordinates calculated from percentage state
      const droneCenterX = (posRef.current.x / 100) * window.innerWidth;
      const droneCenterY = (posRef.current.y / 100) * window.innerHeight;

      const dx = clientX - droneCenterX;
      const dy = clientY - droneCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const now = Date.now();
      if ((dist < DETECTION_RADIUS || force) && now - lastDodgeTime > 260) {
        lastDodgeTime = now;

        // Calculate evasion angle directly away from cursor
        const baseAngle = Math.atan2(dy, dx);
        const dodgeAngle = baseAngle + Math.PI + (Math.random() - 0.5) * 0.5;

        // Evasion leap distance
        const jumpDist = 26 + Math.random() * 16;
        let newX = posRef.current.x + Math.cos(dodgeAngle) * jumpDist;
        let newY = posRef.current.y + Math.sin(dodgeAngle) * jumpDist;

        // Bounce back if target exceeds safe viewport margins
        if (newX < MIN_X) newX = MIN_X + 14 + Math.random() * 10;
        if (newX > MAX_X) newX = MAX_X - 14 - Math.random() * 10;
        if (newY < MIN_Y) newY = MIN_Y + 12 + Math.random() * 12;
        if (newY > MAX_Y) newY = MAX_Y - 14 - Math.random() * 12;

        targetPosRef.current = { x: newX, y: newY };

        // Aerodynamic flight banking tilt
        const flightDx = newX - posRef.current.x;
        const flightDy = newY - posRef.current.y;
        targetRotRef.current = {
          pitch: Math.min(26, Math.max(-26, flightDy * 1.5)),
          yaw: Math.min(30, Math.max(-30, flightDx * 1.3)),
          roll: Math.min(24, Math.max(-24, flightDx * 0.95)),
        };
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      if (!prefersReducedMotion) {
        triggerDodge(e.clientX, e.clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (prefersReducedMotion || e.touches.length === 0) return;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      triggerDodge(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    // High-performance scroll listener: ZERO layout reads, only caches scrollY
    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Autonomous position glide if idle
    const handleAutonomousFlight = (now: number) => {
      if (now - lastAutonomousShiftTime > 7500 && now - lastDodgeTime > 3500) {
        lastAutonomousShiftTime = now;
        const currentX = posRef.current.x;
        const newX = currentX > 50 ? 15 + Math.random() * 22 : 62 + Math.random() * 22;
        const newY = 20 + Math.random() * 32;

        targetPosRef.current = {
          x: Math.max(MIN_X, Math.min(MAX_X, newX)),
          y: Math.max(MIN_Y, Math.min(MAX_Y, newY)),
        };

        const flightDx = targetPosRef.current.x - posRef.current.x;
        targetRotRef.current.yaw = flightDx * 0.7;
        targetRotRef.current.roll = flightDx * 0.5;
      }
    };

    // =========================================================================
    // 60FPS/120FPS HARDWARE-ACCELERATED ANIMATION LOOP
    // PROPELLERS ARE RIGIDLY TIED TO WALL-CLOCK TIME (IMMUNE TO SCROLL JANK)
    // =========================================================================
    const ROTATION_SPEED = prefersReducedMotion ? 6.0 : 36.0; // Radians per second

    const loop = (time: number) => {
      const elapsed = (time - startTime) * 0.001;

      // 1. CRITICAL: DECOUPLED CONTINUOUS TIME-BASED PROPELLER ROTATION
      // Rotation angle is a direct linear function of absolute elapsed time.
      // Scrolling, layout changes, and frame interval variations CANNOT pause or slow it down.
      const basePropAngle = elapsed * ROTATION_SPEED;
      propellerMeshes.forEach((prop, idx) => {
        const direction = idx % 2 === 0 ? 1 : -1;
        prop.rotation.y = basePropAngle * direction;
      });

      // 2. SCROLL PROCESSING (Executed safely inside rAF, eliminating scroll-event jank)
      const currentScrollY = scrollYRef.current;
      const scrollDelta = currentScrollY - lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;

      // Smooth scroll velocity decay
      scrollVelocityRef.current = scrollVelocityRef.current * 0.85 + scrollDelta * 0.15;

      const now = Date.now();
      if (now - lastDodgeTime > 2600) {
        const scrollProgress = Math.min(1, Math.max(0, currentScrollY / cachedDocHeight));

        // Smooth sinusoidal cruise path across the page
        const waveX = Math.sin(scrollProgress * Math.PI * 3.6);
        const cruiseX = 50 + waveX * 32;

        const waveY = Math.cos(scrollProgress * Math.PI * 2.4);
        const cruiseY = 34 + waveY * 18;

        targetPosRef.current.x = targetPosRef.current.x * 0.92 + cruiseX * 0.08;
        targetPosRef.current.y = targetPosRef.current.y * 0.92 + cruiseY * 0.08;
      }

      // Subtle dynamic scroll pitch tilt (capped to realistic aerodynamic limit)
      const scrollTilt = Math.min(18, Math.max(-18, scrollVelocityRef.current * 0.45));
      targetRotRef.current.pitch = targetRotRef.current.pitch * 0.85 + scrollTilt * 0.15;

      // 3. FLIGHT HOVER OSCILLATION & LERP EASING
      const hoverY = Math.sin(elapsed * 2.2) * 1.2;
      const hoverX = Math.cos(elapsed * 1.5) * 0.8;

      if (!prefersReducedMotion) {
        const posEase = 0.052;
        posRef.current.x += (targetPosRef.current.x - posRef.current.x) * posEase;
        posRef.current.y += (targetPosRef.current.y - posRef.current.y) * posEase;

        const rotEase = 0.075;
        rotRef.current.pitch += (targetRotRef.current.pitch - rotRef.current.pitch) * rotEase;
        rotRef.current.yaw += (targetRotRef.current.yaw - rotRef.current.yaw) * rotEase;
        rotRef.current.roll += (targetRotRef.current.roll - rotRef.current.roll) * rotEase;

        targetRotRef.current.pitch *= 0.94;
        targetRotRef.current.yaw *= 0.94;
        targetRotRef.current.roll *= 0.94;

        handleAutonomousFlight(now);
      }

      // 4. 3D AIRFRAME BANKING INSIDE THREE.JS
      droneRoot.rotation.x = (rotRef.current.pitch * Math.PI) / 180 + Math.sin(elapsed * 2.0) * 0.04;
      droneRoot.rotation.y = (rotRef.current.yaw * Math.PI) / 180 + Math.cos(elapsed * 1.4) * 0.03;
      droneRoot.rotation.z = (-rotRef.current.roll * Math.PI) / 180 + Math.sin(elapsed * 1.6) * 0.03;

      // Render 3D DJI Air 2S Scene
      renderer.render(scene, camera);

      // 5. SCREEN POSITIONING VIA DIRECT COMPOSITED STYLE UPDATE
      const currentX = posRef.current.x + hoverX;
      const currentY = posRef.current.y + hoverY;

      if (containerRef.current) {
        containerRef.current.style.left = `${currentX}%`;
        containerRef.current.style.top = `${currentY}%`;
      }

      if (shadowRef.current) {
        shadowRef.current.style.opacity = `${0.35 + Math.sin(elapsed * 2.2) * 0.1}`;
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateDocHeight);
      renderer.dispose();
      if (canvasHolder && renderer.domElement) {
        canvasHolder.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      id="website-animated-drone-viewport"
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 3D DJI Air 2S Quadcopter Rig Floating Container */}
      <div
        ref={containerRef}
        style={{
          left: "82%",
          top: "24%",
          transform: "translate(-50%, -50%)",
          willChange: "left, top",
        }}
        className="absolute cursor-default pointer-events-none transition-shadow"
      >
        {/* Soft Ambient Ground Shadow */}
        <div
          ref={shadowRef}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-crimson-950/15 rounded-full blur-md transition-opacity"
        />

        {/* 3D WebGL Canvas for DJI Air 2S */}
        <div ref={canvasHolderRef} className="relative filter drop-shadow-2xl" />
      </div>
    </div>
  );
}


