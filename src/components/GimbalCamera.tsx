"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/**
 * Procedural Texture Generators for Sony Alpha 7 II & DJI Ronin RS 4
 * High-resolution canvas-based textures with zero external asset latency
 */
function createSonyLogoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#121214";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 68px 'Segoe UI', -apple-system, Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SONY", canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createRoninArmLogoTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f8fafc";
  ctx.font = "900 76px 'Segoe UI', -apple-system, Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Bold crisp DJI Ronin signature typography
  ctx.fillText("RONIN", canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createAlphaBadgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#161618";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Orange Alpha Greek symbol
  ctx.fillStyle = "#e05814";
  ctx.font = "bold 64px serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("α", 24, canvas.height / 2);
  // "7 II" in crisp white
  ctx.fillStyle = "#f4f4f5";
  ctx.font = "bold 44px 'Segoe UI', sans-serif";
  ctx.fillText("7 II", 96, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createSonyCinnamonRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(128, 128, 60, 128, 128, 128);
  grad.addColorStop(0, "#d95710");
  grad.addColorStop(0.5, "#f07228");
  grad.addColorStop(0.85, "#b54206");
  grad.addColorStop(1, "#732502");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createModeDialTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#1e1e22";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#38383e";
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

  const modes = ["AUTO", "P", "A", "S", "M", "1", "2", "SCN", "🎥"];
  ctx.font = "bold 34px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const step = canvas.width / modes.length;
  modes.forEach((m, i) => {
    ctx.fillStyle = m === "AUTO" ? "#22c55e" : m === "🎥" ? "#e11d48" : "#ffffff";
    ctx.fillText(m, i * step + step / 2, canvas.height / 2);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function createExposureDialTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#18181b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const vals = ["-3", "-2", "-1", "0", "+1", "+2", "+3"];
  ctx.font = "bold 36px 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const step = canvas.width / vals.length;
  vals.forEach((v, i) => {
    ctx.fillStyle = v === "0" ? "#e11d48" : "#e4e4e7";
    ctx.fillText(v, i * step + step / 2, canvas.height / 2);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function createSonyViewfinderTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 400;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const previewGrad = ctx.createRadialGradient(320, 200, 20, 320, 200, 260);
  previewGrad.addColorStop(0, "rgba(225, 29, 72, 0.12)");
  previewGrad.addColorStop(1, "rgba(10, 10, 14, 0.95)");
  ctx.fillStyle = previewGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Framing Rule of Thirds grid
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 3, 0);
  ctx.lineTo(canvas.width / 3, canvas.height);
  ctx.moveTo((canvas.width * 2) / 3, 0);
  ctx.lineTo((canvas.width * 2) / 3, canvas.height);
  ctx.moveTo(0, canvas.height / 3);
  ctx.lineTo(canvas.width, canvas.height / 3);
  ctx.moveTo(0, (canvas.height * 2) / 3);
  ctx.lineTo(canvas.width, (canvas.height * 2) / 3);
  ctx.stroke();

  // Active AF target box in center
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 2;
  const afSize = 64;
  ctx.strokeRect(canvas.width / 2 - afSize / 2, canvas.height / 2 - afSize / 2, afSize, afSize);
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(canvas.width / 2 - 2, canvas.height / 2 - 2, 4, 4);

  // Top Status Bar: Sony Alpha HUD
  ctx.font = "bold 22px 'Segoe UI', sans-serif";
  ctx.fillStyle = "#ef4444";
  ctx.fillText("● REC", 24, 38);
  ctx.fillStyle = "#f4f4f5";
  ctx.fillText("XAVC S 4K  24p", 110, 38);
  ctx.textAlign = "right";
  ctx.fillText("🔋 88%", canvas.width - 24, 38);

  // Bottom Parameters Bar
  ctx.textAlign = "left";
  ctx.font = "bold 24px monospace";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("1/125", 28, canvas.height - 24);
  ctx.fillText("F2.8", 160, canvas.height - 24);
  ctx.fillText("ISO 400", 280, canvas.height - 24);
  ctx.fillStyle = "#e05814";
  ctx.fillText("RAW", 440, canvas.height - 24);
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("AWB", 540, canvas.height - 24);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createGMasterBadgeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#e65100"; // Signature Sony G Master Orange
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 88px 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("G", canvas.width / 2, canvas.height / 2 + 4);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createDjiRs4OledTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 384;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#050507";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top header: lowercase "dji" logo + RS 4 model
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "900 24px 'Segoe UI', sans-serif";
  ctx.fillText("dji", 20, 36);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 22px 'Segoe UI', sans-serif";
  ctx.fillText("RS 4", 62, 36);

  // Battery bar icon
  ctx.strokeStyle = "#22c55e";
  ctx.strokeRect(canvas.width - 76, 18, 52, 22);
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(canvas.width - 72, 22, 38, 14);

  // Active Mode Badge: PTF (Pan Tilt Follow)
  ctx.fillStyle = "#0284c7";
  ctx.fillRect(20, 60, 110, 46);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px 'Segoe UI', sans-serif";
  ctx.fillText("PTF", 38, 94);

  // Calibration and Bluetooth status
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "20px 'Segoe UI', sans-serif";
  ctx.fillText("STABILIZATION: ACTIVE", 20, 150);
  ctx.fillText("JOYSTICK: SMOOTH", 20, 184);

  // Bottom Ronin status line
  ctx.fillStyle = "#e11d48";
  ctx.font = "bold 20px monospace";
  ctx.fillText("AUTOLOCK 2.0 • BALANCED", 20, 228);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createCarbonFiberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#1c1c20";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#27272e";
  for (let y = 0; y < canvas.height; y += 8) {
    for (let x = 0; x < canvas.width; x += 8) {
      if ((x / 8 + y / 8) % 2 === 0) {
        ctx.fillRect(x, y, 8, 8);
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

export default function GimbalCamera() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // SCENE SETUP
    const scene = new THREE.Scene();

    // Perspective Camera:
    // Carefully framed to show ONLY the upper half of the gimbal handle & stabilization arms,
    // with the camera large, prominent, and visually detailed.
    // The lower half of the handle and tripod naturally extend below the composition.
    const aspect = container.clientWidth / container.clientHeight;
    const camera = new THREE.PerspectiveCamera(33, aspect, 0.1, 100);
    camera.position.set(0.92, 0.38, 2.70);
    camera.lookAt(0, 0.14, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    container.appendChild(renderer.domElement);

    // LIGHTING: Premium Studio Lighting matching DJI Pro product photography
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.45);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Liquid Glass Signature Rose Rim Light
    const rimLight = new THREE.DirectionalLight(0xff2d55, 1.8);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xf0f4ff, 1.1);
    fillLight.position.set(-3, -2, 3);
    scene.add(fillLight);

    const topSoft = new THREE.PointLight(0xffffff, 1.2, 10);
    topSoft.position.set(0, 4, 1);
    scene.add(topSoft);

    // COMMON MATERIALS
    const magnesiumChassisMat = new THREE.MeshStandardMaterial({
      color: 0x1b1b1e,
      roughness: 0.52,
      metalness: 0.35,
    });

    const rubberGripMat = new THREE.MeshStandardMaterial({
      color: 0x141416,
      roughness: 0.88,
      metalness: 0.08,
    });

    const djiAnodizedMat = new THREE.MeshStandardMaterial({
      color: 0x222226,
      roughness: 0.28,
      metalness: 0.85,
    });

    const carbonArmMat = new THREE.MeshStandardMaterial({
      map: createCarbonFiberTexture(),
      roughness: 0.35,
      metalness: 0.65,
    });

    const chromeMountMat = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7,
      roughness: 0.12,
      metalness: 0.96,
    });

    const djiRedAccentMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48, // DJI Ronin Signature Red Anodized Accent
      roughness: 0.22,
      metalness: 0.75,
    });

    const roninLogoMat = new THREE.MeshBasicMaterial({
      map: createRoninArmLogoTexture(),
      transparent: true,
    });

    const sonyCinnamonRingMat = new THREE.MeshStandardMaterial({
      map: createSonyCinnamonRingTexture(),
      roughness: 0.25,
      metalness: 0.88,
    });

    const sonyLogoMat = new THREE.MeshBasicMaterial({
      map: createSonyLogoTexture(),
      transparent: true,
    });

    const alphaBadgeMat = new THREE.MeshBasicMaterial({
      map: createAlphaBadgeTexture(),
      transparent: true,
    });

    const gMasterBadgeMat = new THREE.MeshBasicMaterial({
      map: createGMasterBadgeTexture(),
    });

    const oledScreenMat = new THREE.MeshBasicMaterial({
      map: createDjiRs4OledTexture(),
    });

    const lcdScreenMat = new THREE.MeshBasicMaterial({
      map: createSonyViewfinderTexture(),
    });

    const modeDialMat = new THREE.MeshStandardMaterial({
      map: createModeDialTexture(),
      roughness: 0.4,
      metalness: 0.5,
    });

    const expDialMat = new THREE.MeshStandardMaterial({
      map: createExposureDialTexture(),
      roughness: 0.4,
      metalness: 0.5,
    });

    // Real Camera Recording Tally LED Material
    const tallyLightMat = new THREE.MeshStandardMaterial({
      color: 0xff1e38,
      emissive: 0xff002b,
      emissiveIntensity: 1.8,
      roughness: 0.15,
      metalness: 0.1,
    });

    const opticalLensGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x102030,
      metalness: 0.25,
      roughness: 0.05,
      transmission: 0.85,
      thickness: 0.45,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.92,
      attenuationColor: new THREE.Color(0x22d3ee),
      attenuationDistance: 0.6,
    });

    // =========================================================================
    // 1. STATIONARY GIMBAL BASE & HANDLE (UPPER HALF VISIBLE, LOWER EXTENDS BELOW)
    // (NO CIRCULAR BASE, NO PEDESTAL, NO TURNTABLE - STAYS 100% FIXED & UPRIGHT)
    // =========================================================================
    const stationaryGroup = new THREE.Group();
    scene.add(stationaryGroup);

    // A. Detachable Mini Tripod (DJI Extended Grip / Tabletop Tripod)
    // Located at bottom of grip (extends below the visible hero composition)
    const tripodHubGroup = new THREE.Group();
    tripodHubGroup.position.y = -0.91;
    stationaryGroup.add(tripodHubGroup);

    // Tapered machined aluminum hub collar
    const hubBodyGeo = new THREE.CylinderGeometry(0.092, 0.082, 0.07, 24);
    const hubBody = new THREE.Mesh(hubBodyGeo, djiAnodizedMat);
    tripodHubGroup.add(hubBody);

    // Bottom center 1/4" screw thread cap
    const screwCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 0.015, 16),
      chromeMountMat
    );
    screwCap.position.y = -0.04;
    tripodHubGroup.add(screwCap);

    // 3 sculpted folding legs spaced at 120°
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3 - 0.35;
      const legPivot = new THREE.Group();
      legPivot.rotation.y = angle;
      tripodHubGroup.add(legPivot);

      // Machined hinge clevis on the hub
      const clevisGeo = new THREE.BoxGeometry(0.048, 0.042, 0.035);
      const clevis = new THREE.Mesh(clevisGeo, djiAnodizedMat);
      clevis.position.set(0, -0.012, 0.076);
      legPivot.add(clevis);

      // Chrome pivot pin through the hinge
      const pinGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.052, 12);
      const pin = new THREE.Mesh(pinGeo, chromeMountMat);
      pin.position.set(0, -0.012, 0.076);
      pin.rotation.z = Math.PI / 2;
      legPivot.add(pin);

      // The Articulated Leg Arm: Pivots at the hinge pin (0, -0.012, 0.076)
      const legArm = new THREE.Group();
      legArm.position.set(0, -0.012, 0.076);
      legArm.rotation.x = -0.38; // ~21.8° downward stance matching sample
      legPivot.add(legArm);

      // 1. Hinge knuckle rounding
      const knuckleGeo = new THREE.CylinderGeometry(0.021, 0.021, 0.044, 16);
      const knuckle = new THREE.Mesh(knuckleGeo, djiAnodizedMat);
      knuckle.rotation.z = Math.PI / 2;
      legArm.add(knuckle);

      // 2. Main Sculpted Aluminum Leg Beam
      const upperLegGeo = new THREE.BoxGeometry(0.072, 0.034, 0.22);
      const upperLeg = new THREE.Mesh(upperLegGeo, djiAnodizedMat);
      upperLeg.position.set(0, 0, 0.11);
      legArm.add(upperLeg);

      const lowerLegGeo = new THREE.BoxGeometry(0.060, 0.026, 0.22);
      const lowerLeg = new THREE.Mesh(lowerLegGeo, djiAnodizedMat);
      lowerLeg.position.set(0, -0.003, 0.32);
      legArm.add(lowerLeg);

      // 3. Molded Rubber Grip Panel along outer spine
      const spineGripGeo = new THREE.BoxGeometry(0.052, 0.01, 0.36);
      const spineGrip = new THREE.Mesh(spineGripGeo, rubberGripMat);
      spineGrip.position.set(0, 0.017, 0.21);
      legArm.add(spineGrip);

      // 4. Underside structural rib
      const underRibGeo = new THREE.BoxGeometry(0.042, 0.008, 0.32);
      const underRib = new THREE.Mesh(underRibGeo, djiAnodizedMat);
      underRib.position.set(0, -0.016, 0.21);
      legArm.add(underRib);

      // 5. Solid Molded Curved Rubber Foot at Tip
      const footGeo = new THREE.BoxGeometry(0.062, 0.032, 0.08);
      const foot = new THREE.Mesh(footGeo, rubberGripMat);
      foot.position.set(0, -0.006, 0.43);
      legArm.add(foot);
    }

    // B. DJI BG70 High-Capacity Vertical Battery Grip / Handle (Straight, upright & stationary)
    // Extends from Y = -0.88 to Y = -0.32; upper half is visible above bottom of frame
    const handleGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.58, 32);
    const handle = new THREE.Mesh(handleGeo, djiAnodizedMat);
    handle.position.y = -0.60;
    handle.castShadow = true;
    stationaryGroup.add(handle);

    // Ergonomic high-traction rubber grip wrap on handle
    const gripWrapGeo = new THREE.CylinderGeometry(0.102, 0.102, 0.46, 32, 1, true);
    const gripWrap = new THREE.Mesh(gripWrapGeo, rubberGripMat);
    gripWrap.position.y = -0.61;
    stationaryGroup.add(gripWrap);

    // Rear ergonomic palm swell & index-finger curve contour
    const palmSwellGeo = new THREE.BoxGeometry(0.08, 0.38, 0.04);
    const palmSwell = new THREE.Mesh(palmSwellGeo, djiAnodizedMat);
    palmSwell.position.set(0, -0.55, -0.09);
    stationaryGroup.add(palmSwell);

    // Bottom battery release latch
    const latchGeo = new THREE.BoxGeometry(0.04, 0.03, 0.02);
    const latch = new THREE.Mesh(latchGeo, chromeMountMat);
    latch.position.set(0, -0.86, 0.095);
    stationaryGroup.add(latch);

    // C. DJI RS 4 Control Body (Upper handle housing - clearly visible in hero frame)
    const controlBodyGeo = new THREE.BoxGeometry(0.16, 0.20, 0.13);
    const controlBody = new THREE.Mesh(controlBodyGeo, djiAnodizedMat);
    controlBody.position.set(0, -0.22, 0);
    stationaryGroup.add(controlBody);

    // 1.4" OLED Touchscreen display with rounded bezel
    const oledGeo = new THREE.PlaneGeometry(0.13, 0.085);
    const oledScreen = new THREE.Mesh(oledGeo, oledScreenMat);
    oledScreen.position.set(0, -0.17, 0.066);
    stationaryGroup.add(oledScreen);

    // 4-Way Ergonomic Thumb Joystick
    const joystickBaseGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.015, 16);
    const joystickBase = new THREE.Mesh(joystickBaseGeo, chromeMountMat);
    joystickBase.position.set(-0.038, -0.25, 0.068);
    joystickBase.rotation.x = Math.PI / 2;
    stationaryGroup.add(joystickBase);

    const joystickCapGeo = new THREE.SphereGeometry(0.016, 16, 16);
    const joystickCap = new THREE.Mesh(joystickCapGeo, djiAnodizedMat);
    joystickCap.position.set(-0.038, -0.25, 0.082);
    stationaryGroup.add(joystickCap);

    // Mode "M" Button and Red Record Button
    const mBtnGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.012, 16);
    const mBtn = new THREE.Mesh(mBtnGeo, djiAnodizedMat);
    mBtn.position.set(0.036, -0.24, 0.066);
    mBtn.rotation.x = Math.PI / 2;
    stationaryGroup.add(mBtn);

    const recBtnGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.012, 16);
    const recBtn = new THREE.Mesh(recBtnGeo, djiRedAccentMat);
    recBtn.position.set(0.036, -0.28, 0.066);
    recBtn.rotation.x = Math.PI / 2;
    stationaryGroup.add(recBtn);

    // Power button on right flank
    const pwrBtnGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.012, 16);
    const pwrBtn = new THREE.Mesh(pwrBtnGeo, chromeMountMat);
    pwrBtn.position.set(0.082, -0.22, 0.02);
    pwrBtn.rotation.z = Math.PI / 2;
    stationaryGroup.add(pwrBtn);

    // Front Index-Finger Trigger Button on rear of handle
    const triggerGeo = new THREE.BoxGeometry(0.045, 0.09, 0.035);
    const trigger = new THREE.Mesh(triggerGeo, djiAnodizedMat);
    trigger.position.set(0, -0.22, -0.08);
    stationaryGroup.add(trigger);

    // Left & Right NATO Accessory Expansion Rails
    const natoRailGeo = new THREE.BoxGeometry(0.025, 0.14, 0.04);
    const natoRailLeft = new THREE.Mesh(natoRailGeo, chromeMountMat);
    natoRailLeft.position.set(-0.092, -0.22, 0);
    stationaryGroup.add(natoRailLeft);

    const natoRailRight = new THREE.Mesh(natoRailGeo, chromeMountMat);
    natoRailRight.position.set(0.092, -0.22, 0);
    stationaryGroup.add(natoRailRight);

    // D. Stationary Pan Axis Base Collar (Bottom half of Pan Axis)
    const panBaseCollarGeo = new THREE.CylinderGeometry(0.13, 0.125, 0.06, 32);
    const panBaseCollar = new THREE.Mesh(panBaseCollarGeo, djiAnodizedMat);
    panBaseCollar.position.y = -0.09;
    stationaryGroup.add(panBaseCollar);

    // DJI Signature Red Anodized Accent Ring at the pan axis seam
    const panAccentRingGeo = new THREE.TorusGeometry(0.131, 0.005, 16, 32);
    const panAccentRing = new THREE.Mesh(panAccentRingGeo, djiRedAccentMat);
    panAccentRing.position.y = -0.06;
    panAccentRing.rotation.x = Math.PI / 2;
    stationaryGroup.add(panAccentRing);

    // Automated Axis Lock 2.0 Red Slider Switch
    const autoLockSliderGeo = new THREE.BoxGeometry(0.035, 0.045, 0.02);
    const autoLockSlider = new THREE.Mesh(autoLockSliderGeo, djiRedAccentMat);
    autoLockSlider.position.set(0, -0.09, 0.132);
    stationaryGroup.add(autoLockSlider);

    // =========================================================================
    // 2. ARTICULATED GIMBAL PAN & ROLL ASSEMBLY (MATCHING SAMPLE IMAGE)
    // =========================================================================
    // Pivots cleanly at the pan axis (y = -0.06)
    // The handle and mini tripod remain 100% stationary and upright!
    const panAssemblyGroup = new THREE.Group();
    panAssemblyGroup.position.set(0, -0.06, 0);
    scene.add(panAssemblyGroup);

    // A. Rotating Upper Pan Motor Bell
    const upperPanBellGeo = new THREE.CylinderGeometry(0.125, 0.125, 0.06, 32);
    const upperPanBell = new THREE.Mesh(upperPanBellGeo, djiAnodizedMat);
    upperPanBell.position.y = 0.03;
    panAssemblyGroup.add(upperPanBell);

    // B. L-Shaped Pan Arm (Extending from Pan Motor to the LEFT and UP to Roll Motor)
    const panArmHorizGeo = new THREE.BoxGeometry(0.32, 0.05, 0.07);
    const panArmHoriz = new THREE.Mesh(panArmHorizGeo, djiAnodizedMat);
    panArmHoriz.position.set(-0.16, 0.05, 0);
    panAssemblyGroup.add(panArmHoriz);

    // Angled elbow rising upward to the Roll Motor
    const panArmElbowGeo = new THREE.BoxGeometry(0.07, 0.12, 0.07);
    const panArmElbow = new THREE.Mesh(panArmElbowGeo, djiAnodizedMat);
    panArmElbow.position.set(-0.32, 0.10, 0);
    panAssemblyGroup.add(panArmElbow);

    // C. Roll Motor Housing (Positioned on lower-left, cylindrical with beveled circular cap)
    const rollMotorGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.12, 32);
    const rollMotor = new THREE.Mesh(rollMotorGeo, djiAnodizedMat);
    rollMotor.position.set(-0.34, 0.16, 0);
    rollMotor.rotation.x = Math.PI / 2;
    panAssemblyGroup.add(rollMotor);

    // Roll Motor Beveled Circular End Cap
    const rollCapGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.015, 32);
    const rollCap = new THREE.Mesh(rollCapGeo, chromeMountMat);
    rollCap.position.set(-0.34, 0.16, 0.065);
    rollCap.rotation.x = Math.PI / 2;
    panAssemblyGroup.add(rollCap);

    // Signature Red Accent Ring on Roll Motor
    const rollMotorRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.111, 0.004, 16, 32),
      djiRedAccentMat
    );
    rollMotorRing.position.set(-0.34, 0.16, 0);
    panAssemblyGroup.add(rollMotorRing);

    // D. The Iconic DJI RS 4 Sweeping Carbon-Fiber Arm with Bold "RONIN" Logo!
    // Sweeps from Roll Motor (left) up and across to the Tilt Motor (right)
    const roninArmGeo = new THREE.BoxGeometry(0.64, 0.065, 0.08);
    const roninArm = new THREE.Mesh(roninArmGeo, carbonArmMat);
    roninArm.position.set(0.02, 0.28, -0.16);
    roninArm.rotation.z = 0.24;
    roninArm.rotation.y = -0.22;
    panAssemblyGroup.add(roninArm);

    // Bold Crisp White "RONIN" Logo printed across the arm face!
    const roninLogoGeo = new THREE.PlaneGeometry(0.36, 0.075);
    const roninLogoMesh = new THREE.Mesh(roninLogoGeo, roninLogoMat);
    roninLogoMesh.position.set(0.02, 0.28, -0.118);
    roninLogoMesh.rotation.z = 0.24;
    roninLogoMesh.rotation.y = -0.22;
    panAssemblyGroup.add(roninLogoMesh);

    // E. Right Tilt Motor Housing (Mounted on the right side of the camera)
    const tiltMotorGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.12, 32);
    const tiltMotor = new THREE.Mesh(tiltMotorGeo, djiAnodizedMat);
    tiltMotor.position.set(0.42, 0.38, 0);
    tiltMotor.rotation.z = Math.PI / 2;
    panAssemblyGroup.add(tiltMotor);

    // Tilt Motor Beveled Circular End Cap
    const tiltCapGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.015, 32);
    const tiltCap = new THREE.Mesh(tiltCapGeo, chromeMountMat);
    tiltCap.position.set(0.485, 0.38, 0);
    tiltCap.rotation.z = Math.PI / 2;
    panAssemblyGroup.add(tiltCap);

    const tiltMotorRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.111, 0.004, 16, 32),
      djiRedAccentMat
    );
    tiltMotorRing.position.set(0.42, 0.38, 0);
    tiltMotorRing.rotation.y = Math.PI / 2;
    panAssemblyGroup.add(tiltMotorRing);

    // Millimeter fine-tuning balance dial on tilt bracket
    const tiltTuningKnobGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.045, 24);
    const tiltTuningKnob = new THREE.Mesh(tiltTuningKnobGeo, chromeMountMat);
    tiltTuningKnob.position.set(0.35, 0.44, 0.04);
    tiltTuningKnob.rotation.x = Math.PI / 2;
    panAssemblyGroup.add(tiltTuningKnob);

    // =========================================================================
    // 3. TILT ASSEMBLY & SONY ALPHA 7 II CAMERA RIG (ROTATES IN PITCH & ROLL)
    // =========================================================================
    // Pivots at the tilt axis (y = 0.38 inside panAssemblyGroup)
    const tiltAssemblyGroup = new THREE.Group();
    tiltAssemblyGroup.position.set(0, 0.38, 0);
    panAssemblyGroup.add(tiltAssemblyGroup);

    // A. Arca-Swiss Camera Mounting Cradle
    // Vertical drop bracket from tilt motor to baseplate
    const cradleHangerGeo = new THREE.BoxGeometry(0.045, 0.24, 0.06);
    const cradleHanger = new THREE.Mesh(cradleHangerGeo, djiAnodizedMat);
    cradleHanger.position.set(0.36, -0.12, 0);
    tiltAssemblyGroup.add(cradleHanger);

    // Lower Arca-Swiss quick-release baseplate directly under the camera
    const baseplateGeo = new THREE.BoxGeometry(0.78, 0.035, 0.44);
    const baseplate = new THREE.Mesh(baseplateGeo, djiAnodizedMat);
    baseplate.position.set(-0.02, -0.22, 0);
    tiltAssemblyGroup.add(baseplate);

    // Upper quick-release camera mounting plate (Arca-Swiss standard)
    const upperPlateGeo = new THREE.BoxGeometry(0.70, 0.02, 0.38);
    const upperPlate = new THREE.Mesh(upperPlateGeo, djiAnodizedMat);
    upperPlate.position.set(-0.02, -0.19, 0);
    tiltAssemblyGroup.add(upperPlate);

    // Silver/titanium quick-release clamp lever with red safety stop
    const qrLeverGeo = new THREE.BoxGeometry(0.06, 0.024, 0.12);
    const qrLever = new THREE.Mesh(qrLeverGeo, chromeMountMat);
    qrLever.position.set(-0.40, -0.21, 0.04);
    tiltAssemblyGroup.add(qrLever);

    const qrSafetyPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12),
      djiRedAccentMat
    );
    qrSafetyPin.position.set(-0.40, -0.21, 0.11);
    tiltAssemblyGroup.add(qrSafetyPin);

    // Front lens support bracket reaching forward under the lens barrel
    const lensSupportGeo = new THREE.BoxGeometry(0.035, 0.08, 0.14);
    const lensSupport = new THREE.Mesh(lensSupportGeo, djiAnodizedMat);
    lensSupport.position.set(-0.02, -0.15, 0.22);
    tiltAssemblyGroup.add(lensSupport);

    // =========================================================================
    // 4. SONY ALPHA 7 II (ILCE-7M2) CAMERA BODY (CLAMPED IN CRADLE - LARGE & DETAILED)
    // =========================================================================
    const cameraBodyGroup = new THREE.Group();
    // Clamped firmly flush on top of the Arca-Swiss plate (no air gap, no floating)
    cameraBodyGroup.position.set(-0.02, 0.06, 0);
    tiltAssemblyGroup.add(cameraBodyGroup);

    // A. Main Magnesium Alloy Chassis (Distinctive Sony α7 II angular chamfers)
    const bodyBoxGeo = new THREE.BoxGeometry(0.88, 0.48, 0.36);
    const bodyChassis = new THREE.Mesh(bodyBoxGeo, magnesiumChassisMat);
    bodyChassis.castShadow = true;
    cameraBodyGroup.add(bodyChassis);

    // B. Sony α7 II Ergonomic Hand Grip (Sculpted forward right grip)
    const gripGeo = new THREE.BoxGeometry(0.22, 0.46, 0.24);
    const cameraGrip = new THREE.Mesh(gripGeo, rubberGripMat);
    cameraGrip.position.set(0.38, -0.01, 0.12);
    cameraBodyGroup.add(cameraGrip);

    // Front Command Dial on grip top-front
    const frontDialGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.028, 24);
    const frontDial = new THREE.Mesh(frontDialGeo, chromeMountMat);
    frontDial.position.set(0.38, 0.17, 0.24);
    frontDial.rotation.x = Math.PI / 2;
    cameraBodyGroup.add(frontDial);

    // Angled Shutter Plateau with Power ON/OFF collar switch
    const shutterCollarGeo = new THREE.CylinderGeometry(0.044, 0.044, 0.02, 24);
    const shutterCollar = new THREE.Mesh(shutterCollarGeo, djiAnodizedMat);
    shutterCollar.position.set(0.36, 0.25, 0.15);
    cameraBodyGroup.add(shutterCollar);

    const shutterBtnGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.028, 24);
    const shutterBtn = new THREE.Mesh(shutterBtnGeo, chromeMountMat);
    shutterBtn.position.set(0.36, 0.27, 0.15);
    cameraBodyGroup.add(shutterBtn);

    // C1 & C2 Custom Function Buttons
    const c1BtnGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.015, 16);
    const c1Btn = new THREE.Mesh(c1BtnGeo, djiAnodizedMat);
    c1Btn.position.set(0.30, 0.25, 0.03);
    cameraBodyGroup.add(c1Btn);

    const c2Btn = new THREE.Mesh(c1BtnGeo, djiAnodizedMat);
    c2Btn.position.set(0.36, 0.25, 0.03);
    cameraBodyGroup.add(c2Btn);

    // C. Sony Exposure Compensation Dial (+3 to -3) on top right
    const expDialGeo = new THREE.CylinderGeometry(0.064, 0.064, 0.035, 32);
    const expDial = new THREE.Mesh(expDialGeo, expDialMat);
    expDial.position.set(0.28, 0.25, -0.08);
    cameraBodyGroup.add(expDial);

    // D. Sony Shooting Mode Dial (Auto, P, A, S, M, Movie) on top left
    const modeDialGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 32);
    const modeDial = new THREE.Mesh(modeDialGeo, modeDialMat);
    modeDial.position.set(-0.28, 0.26, -0.04);
    cameraBodyGroup.add(modeDial);

    // E. Sony α7 II Angular EVF Pentaprism Hump
    const evfHumpGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.16, 4);
    const evfHump = new THREE.Mesh(evfHumpGeo, magnesiumChassisMat);
    evfHump.position.set(0, 0.29, 0);
    evfHump.rotation.y = Math.PI / 4;
    cameraBodyGroup.add(evfHump);

    // SONY White Brand Logo on front bevel of EVF hump
    const sonyLogoPlaneGeo = new THREE.PlaneGeometry(0.17, 0.048);
    const sonyLogoPlane = new THREE.Mesh(sonyLogoPlaneGeo, sonyLogoMat);
    sonyLogoPlane.position.set(0, 0.28, 0.12);
    cameraBodyGroup.add(sonyLogoPlane);

    // Sony Multi Interface Hot Shoe on top of EVF
    const hotShoeGeo = new THREE.BoxGeometry(0.10, 0.016, 0.12);
    const hotShoe = new THREE.Mesh(hotShoeGeo, chromeMountMat);
    hotShoe.position.set(0, 0.38, 0);
    cameraBodyGroup.add(hotShoe);

    // Rear EVF Eyecup (Soft rubber viewfinder)
    const eyecupGeo = new THREE.BoxGeometry(0.13, 0.085, 0.05);
    const eyecup = new THREE.Mesh(eyecupGeo, rubberGripMat);
    eyecup.position.set(0, 0.29, -0.20);
    cameraBodyGroup.add(eyecup);

    // F. Sony "α 7 II" Emblem on Front Right Shoulder
    const alphaBadgePlaneGeo = new THREE.PlaneGeometry(0.12, 0.06);
    const alphaBadgePlane = new THREE.Mesh(alphaBadgePlaneGeo, alphaBadgeMat);
    alphaBadgePlane.position.set(0.26, 0.16, 0.182);
    cameraBodyGroup.add(alphaBadgePlane);

    // =========================================================================
    // REALISTIC RECORDING TALLY INDICATOR (Small, bright red LED with smooth blink)
    // Positioned near upper-front area on camera body, rotating naturally with camera!
    // =========================================================================
    // Dark metallic bezel ring collar
    const tallyBezelGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.006, 16);
    const tallyBezel = new THREE.Mesh(tallyBezelGeo, djiAnodizedMat);
    tallyBezel.position.set(-0.24, 0.18, 0.181);
    tallyBezel.rotation.x = Math.PI / 2;
    cameraBodyGroup.add(tallyBezel);

    // Domed red translucent LED indicator lens
    const tallyLensGeo = new THREE.SphereGeometry(0.012, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const tallyLens = new THREE.Mesh(tallyLensGeo, tallyLightMat);
    tallyLens.position.set(-0.24, 0.18, 0.183);
    cameraBodyGroup.add(tallyLens);

    // Localized subtle red glow light (attached directly to camera body)
    const tallyPointLight = new THREE.PointLight(0xff1834, 0.75, 0.40);
    tallyPointLight.position.set(-0.24, 0.18, 0.20);
    cameraBodyGroup.add(tallyPointLight);

    // G. Sony Unmistakable Cinnamon / Burnt-Orange E-Mount Metal Ring!
    const cinnamonRingGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.025, 48);
    const cinnamonRing = new THREE.Mesh(cinnamonRingGeo, sonyCinnamonRingMat);
    cinnamonRing.position.set(0, -0.02, 0.185);
    cinnamonRing.rotation.x = Math.PI / 2;
    cameraBodyGroup.add(cinnamonRing);

    // Inner Chrome Bayonet Flange with Locking Pins
    const bayonetGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.018, 48);
    const bayonetRing = new THREE.Mesh(bayonetGeo, chromeMountMat);
    bayonetRing.position.set(0, -0.02, 0.20);
    bayonetRing.rotation.x = Math.PI / 2;
    cameraBodyGroup.add(bayonetRing);

    // Lens release button on right of mount
    const lensReleaseBtnGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.012, 16);
    const lensReleaseBtn = new THREE.Mesh(lensReleaseBtnGeo, chromeMountMat);
    lensReleaseBtn.position.set(0.21, -0.08, 0.185);
    lensReleaseBtn.rotation.x = Math.PI / 2;
    cameraBodyGroup.add(lensReleaseBtn);

    // H. Rear 3.0" Tilting LCD Screen (Live Viewfinder Display)
    const lcdFrameGeo = new THREE.BoxGeometry(0.56, 0.35, 0.025);
    const lcdFrame = new THREE.Mesh(lcdFrameGeo, djiAnodizedMat);
    lcdFrame.position.set(-0.05, -0.02, -0.185);
    cameraBodyGroup.add(lcdFrame);

    const lcdScreenPlaneGeo = new THREE.PlaneGeometry(0.51, 0.30);
    const lcdScreenPlane = new THREE.Mesh(lcdScreenPlaneGeo, lcdScreenMat);
    lcdScreenPlane.position.set(-0.05, -0.02, -0.199);
    lcdScreenPlane.rotation.y = Math.PI; // Faces rear
    cameraBodyGroup.add(lcdScreenPlane);

    // Rear Control Wheel & Menu buttons
    const rearWheelGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.016, 24);
    const rearWheel = new THREE.Mesh(rearWheelGeo, djiAnodizedMat);
    rearWheel.position.set(0.30, -0.05, -0.185);
    rearWheel.rotation.x = Math.PI / 2;
    cameraBodyGroup.add(rearWheel);

    // =========================================================================
    // 5. SONY FE 24-70mm F2.8 GM PRO LENS (RECESSED PRO OPTICS & PETAL HOOD)
    // =========================================================================
    const lensGroup = new THREE.Group();
    lensGroup.position.set(0, -0.02, 0.21);
    cameraBodyGroup.add(lensGroup);

    // A. Base metal barrel attached to E-Mount
    const barrelBaseGeo = new THREE.CylinderGeometry(0.195, 0.205, 0.16, 48);
    const barrelBase = new THREE.Mesh(barrelBaseGeo, djiAnodizedMat);
    barrelBase.position.z = 0.08;
    barrelBase.rotation.x = Math.PI / 2;
    barrelBase.castShadow = true;
    lensGroup.add(barrelBase);

    // Sony G Master Signature Orange Square Badge on Lens Barrel
    const gmBadgeGeo = new THREE.PlaneGeometry(0.054, 0.054);
    const gmBadge = new THREE.Mesh(gmBadgeGeo, gMasterBadgeMat);
    gmBadge.position.set(-0.20, 0.04, 0.11);
    gmBadge.rotation.y = -Math.PI / 2;
    lensGroup.add(gmBadge);

    // AF / MF switch on lens
    const afSwitchGeo = new THREE.BoxGeometry(0.014, 0.036, 0.022);
    const afSwitch = new THREE.Mesh(afSwitchGeo, djiAnodizedMat);
    afSwitch.position.set(-0.202, -0.04, 0.11);
    lensGroup.add(afSwitch);

    // B. Ribbed Zoom Ring (24-70mm)
    const zoomRingGeo = new THREE.CylinderGeometry(0.202, 0.202, 0.16, 48);
    const zoomRing = new THREE.Mesh(zoomRingGeo, rubberGripMat);
    zoomRing.position.z = 0.24;
    zoomRing.rotation.x = Math.PI / 2;
    lensGroup.add(zoomRing);

    // C. Intermediate barrel with signature Pro Red Ring Accent
    const midBarrelGeo = new THREE.CylinderGeometry(0.198, 0.198, 0.08, 48);
    const midBarrel = new THREE.Mesh(midBarrelGeo, djiAnodizedMat);
    midBarrel.position.z = 0.36;
    midBarrel.rotation.x = Math.PI / 2;
    lensGroup.add(midBarrel);

    const proRingGeo = new THREE.TorusGeometry(0.20, 0.0035, 16, 48);
    const proRing = new THREE.Mesh(proRingGeo, djiRedAccentMat);
    proRing.position.z = 0.40;
    lensGroup.add(proRing);

    // D. Ribbed Focus Ring
    const focusRingGeo = new THREE.CylinderGeometry(0.20, 0.20, 0.15, 48);
    const focusRing = new THREE.Mesh(focusRingGeo, rubberGripMat);
    focusRing.position.z = 0.48;
    focusRing.rotation.x = Math.PI / 2;
    lensGroup.add(focusRing);

    // E. Front Barrel with 82mm Filter Thread (Recessed opening)
    const frontRimGeo = new THREE.CylinderGeometry(0.205, 0.198, 0.10, 48);
    const frontRim = new THREE.Mesh(frontRimGeo, djiAnodizedMat);
    frontRim.position.z = 0.60;
    frontRim.rotation.x = Math.PI / 2;
    lensGroup.add(frontRim);

    // Inner beveled aperture ring / filter threading
    const innerThreadGeo = new THREE.CylinderGeometry(0.178, 0.185, 0.05, 32);
    const innerThread = new THREE.Mesh(innerThreadGeo, djiAnodizedMat);
    innerThread.position.z = 0.62;
    innerThread.rotation.x = Math.PI / 2;
    lensGroup.add(innerThread);

    // F. Multi-coated Optical Front Glass Element (RECESSED inside barrel with iridescent AR sheen)
    const glassGeo = new THREE.CircleGeometry(0.172, 32);
    const frontGlass = new THREE.Mesh(glassGeo, opticalLensGlassMat);
    frontGlass.position.z = 0.58;
    lensGroup.add(frontGlass);

    // Subtle internal aperture disc behind front element
    const apertureDiscGeo = new THREE.RingGeometry(0.06, 0.17, 24);
    const apertureDisc = new THREE.Mesh(
      apertureDiscGeo,
      new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 0.9 })
    );
    apertureDisc.position.z = 0.575;
    lensGroup.add(apertureDisc);

    // G. Authentic Sony ALC-SH141 Petal Lens Hood (4 distinct scalloped petals)
    const petalHoodGroup = new THREE.Group();
    petalHoodGroup.position.z = 0.65;
    lensGroup.add(petalHoodGroup);

    // Hood base collar
    const hoodCollarGeo = new THREE.CylinderGeometry(0.208, 0.205, 0.04, 32);
    const hoodCollar = new THREE.Mesh(hoodCollarGeo, djiAnodizedMat);
    hoodCollar.rotation.x = Math.PI / 2;
    petalHoodGroup.add(hoodCollar);

    // Top and Bottom long petals
    for (let j = 0; j < 2; j++) {
      const petalGeo = new THREE.CylinderGeometry(0.218, 0.208, 0.09, 24, 1, true, -Math.PI / 4, Math.PI / 2);
      const petal = new THREE.Mesh(petalGeo, djiAnodizedMat);
      petal.position.z = 0.05;
      petal.rotation.x = Math.PI / 2;
      petal.rotation.z = j * Math.PI; // Top and Bottom
      petalHoodGroup.add(petal);
    }

    // Left and Right shorter side petals
    for (let j = 0; j < 2; j++) {
      const sidePetalGeo = new THREE.CylinderGeometry(0.214, 0.208, 0.06, 24, 1, true, -Math.PI / 6, Math.PI / 3);
      const sidePetal = new THREE.Mesh(sidePetalGeo, djiAnodizedMat);
      sidePetal.position.z = 0.035;
      sidePetal.rotation.x = Math.PI / 2;
      sidePetal.rotation.z = Math.PI / 2 + j * Math.PI; // Left and Right
      petalHoodGroup.add(sidePetal);
    }

    // =========================================================================
    // 6. REALISTIC MOTORIZED GIMBAL CAMERA TRACKING (DJI RS 4 SMOOTHTRACK)
    // =========================================================================
    // Mechanical mapping:
    // Pointer moves left  -> gimbal yaws left  (panAssemblyGroup.rotation.y < 0)
    // Pointer moves right -> gimbal yaws right (panAssemblyGroup.rotation.y > 0)
    // Pointer moves up    -> camera tilts upward   (tiltAssemblyGroup.rotation.x < 0)
    // Pointer moves down  -> camera tilts downward (tiltAssemblyGroup.rotation.x > 0)
    // Pointer leaves      -> smoothly glides back to neutral
    // CRITICAL: Stand, handle, OLED screen & tripod remain 100% upright and stationary!
    let targetYaw = 0;
    let targetPitch = 0;
    let currentYaw = 0;
    let currentPitch = 0;
    let currentRoll = 0;

    // Realistic mechanical rotation stops within DJI RS 4 cage clearances
    const MAX_YAW = 0.44; // ~25 degrees left/right
    const MAX_PITCH = 0.25; // ~14 degrees up/down

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (prefersReducedMotion) return;

      let clientX = 0;
      let clientY = 0;

      if ("touches" in e) {
        if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        }
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const heroEl = container.closest("section") || container;
      const heroRect = heroEl.getBoundingClientRect();

      // Normalized coordinates (-1 to +1) centered on hero section
      const nx = ((clientX - heroRect.left) / heroRect.width) * 2 - 1;
      const ny = ((clientY - heroRect.top) / heroRect.height) * 2 - 1;

      const clampedX = Math.max(-1, Math.min(1, nx));
      const clampedY = Math.max(-1, Math.min(1, ny));

      // Pointer right -> yaw right (+), Pointer left -> yaw left (-)
      targetYaw = clampedX * MAX_YAW;

      // Pointer down -> tilt down (+), Pointer up -> tilt up (-)
      targetPitch = clampedY * MAX_PITCH;
    };

    const onPointerLeave = () => {
      // Smooth return to neutral forward-facing position
      targetYaw = 0;
      targetPitch = 0;
    };

    const heroSection = container.closest("section") || window;
    heroSection.addEventListener("mousemove", onPointerMove as any);
    heroSection.addEventListener("mouseleave", onPointerLeave as any);
    heroSection.addEventListener("touchmove", onPointerMove as any, { passive: true });
    heroSection.addEventListener("touchend", onPointerLeave as any);

    // RESIZE LISTENER
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // ANIMATION LOOP (FRAME-RATE INDEPENDENT SMOOTHTRACK MOTOR DAMPING & BLINKING TALLY)
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.08); // Safeguard against background tab pauses
      const elapsedTime = clock.getElapsedTime();

      // Frame-rate-independent DJI RS 4 SmoothTrack motorized damping
      const trackingAgility = prefersReducedMotion ? 2.5 : 5.4;
      const smoothFactor = 1.0 - Math.exp(-trackingAgility * delta);

      // Smooth mechanical easing lerp
      currentYaw += (targetYaw - currentYaw) * smoothFactor;
      currentPitch += (targetPitch - currentPitch) * smoothFactor;

      // Subtle organic stabilizer roll response during horizontal pan
      const targetRoll = (targetYaw - currentYaw) * 0.12;
      currentRoll += (targetRoll - currentRoll) * smoothFactor;

      // PHYSICAL ARTICULATION HIERARCHY:
      // 1. Stationary Group (handle, screen, tripod) stays 100% stationary and upright!
      // 2. Pan Assembly rotates in YAW around vertical axis (horizontal arm stays horizontal):
      panAssemblyGroup.rotation.y = currentYaw;

      // 3. Tilt Assembly rotates in PITCH around horizontal axis (camera tilts up/down):
      tiltAssemblyGroup.rotation.x = currentPitch;
      tiltAssemblyGroup.rotation.z = -currentRoll;

      // REALISTIC CAMERA RECORDING TALLY LED (Continuous smooth blinking, 1.25s interval)
      const tallyCycle = 1.25;
      const tallyPhase = (elapsedTime % tallyCycle) / tallyCycle; // 0.0 to 1.0
      let tallyWeight = 0;
      if (tallyPhase < 0.55) {
        // Smooth sine curve rising and falling during recording ON phase
        tallyWeight = Math.sin((tallyPhase / 0.55) * Math.PI);
      } else {
        // Subtle standby glow during OFF phase (never totally dead, realistic LED phosphor)
        tallyWeight = 0.04;
      }
      tallyLightMat.emissiveIntensity = 0.2 + tallyWeight * 2.8;
      tallyPointLight.intensity = tallyWeight * 0.75;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      heroSection.removeEventListener("mousemove", onPointerMove as any);
      heroSection.removeEventListener("mouseleave", onPointerLeave as any);
      heroSection.removeEventListener("touchmove", onPointerMove as any);
      heroSection.removeEventListener("touchend", onPointerLeave as any);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] md:h-[540px] lg:h-[600px] flex items-center justify-center select-none overflow-hidden">
      {/* 3D WebGL Canvas Container - Clean, without tooltip or title popup */}
      <div
        ref={containerRef}
        id="camera-interactive-canvas"
        className="w-full h-full cursor-crosshair z-10"
      />
    </div>
  );
}
