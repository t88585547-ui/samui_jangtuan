"use client";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Compass, Crosshair, Flag } from "lucide-react";
import {
  SAMUI_RING_ROAD,
  SAMUI_LANDMARKS
} from "../constants/samuiGeoData";
import {
  latLngToXZ,
  xzToLatLng,
  isPointInIsland,
  getSamuiTerrainHeight,
  calculateDynamicSpotRisk
} from "../utils/riskEngine";
import {
  TOPO_VERTEX_SHADER,
  TOPO_FRAGMENT_SHADER
} from "../shaders/topographicShader";

export default function Samui3DViewport({
  hotspots,
  selectedSpot,
  hoveredSpotId,
  onSelectSpot,
  onHoverSpot,
  rainMm,
  windKmh,
  viewMode,
  showFloodPlane,
  showAllLabels,
  showLandmarks,
  isPinningMode,
  onMapPinClick,
  cameraResetTrigger,
  themeMode,
  polyXZ,
  isLandingMode
}) {
  const mountRef = useRef(null);
  const sceneObjectsRef = useRef({});
  const objsMarkersPulseRef = useRef([]);

  const selectedSpotRef = useRef(selectedSpot);
  const hoveredSpotIdRef = useRef(hoveredSpotId);
  const rainMmRef = useRef(rainMm);
  const viewModeRef = useRef(viewMode);
  const showFloodRef = useRef(showFloodPlane);
  const isPinningRef = useRef(isPinningMode);
  const onMapPinClickRef = useRef(onMapPinClick);
  const themeRef = useRef(themeMode);
  const isLandingRef = useRef(isLandingMode);

  const [markerScreenCoords, setMarkerScreenCoords] = useState([]);
  const [landmarkScreenCoords, setLandmarkScreenCoords] = useState([]);
  const [hoverPinReadout, setHoverPinReadout] = useState(null);

  selectedSpotRef.current = selectedSpot;
  hoveredSpotIdRef.current = hoveredSpotId;
  rainMmRef.current = rainMm;
  viewModeRef.current = viewMode;
  showFloodRef.current = showFloodPlane;
  isPinningRef.current = isPinningMode;
  onMapPinClickRef.current = onMapPinClick;
  themeRef.current = themeMode;
  isLandingRef.current = isLandingMode;

  useEffect(() => {
    const objs = sceneObjectsRef.current;
    if (!objs.targetLookAt || !objs.targetSpherical) return;
    if (isLandingMode) {
      objs.targetLookAt.set(-1.1, 0.15, 0.2);
      objs.targetSpherical.radius = 7.8;
      objs.targetSpherical.phi = 0.98;
    } else if (!selectedSpot) {
      objs.targetLookAt.set(0, 0.1, 0);
      objs.targetSpherical.radius = 8.6;
      objs.targetSpherical.phi = 0.84;
      objs.targetSpherical.theta = 0.28;
    }
  }, [isLandingMode, selectedSpot]);

  useEffect(() => {
    const objs = sceneObjectsRef.current;
    if (objs.targetLookAt && objs.targetSpherical) {
      objs.targetLookAt.set(0, 0.1, 0);
      objs.targetSpherical.radius = 8.6;
      objs.targetSpherical.phi = 0.84;
      objs.targetSpherical.theta = 0.28;
    }
  }, [cameraResetTrigger]);

  useEffect(() => {
    const objs = sceneObjectsRef.current;
    if (!objs.targetLookAt) return;
    if (selectedSpot) {
      const [x, z] = latLngToXZ(selectedSpot.lat, selectedSpot.lng);
      const y = getSamuiTerrainHeight(selectedSpot.lat, selectedSpot.lng, polyXZ);
      objs.targetLookAt.set(x, y, z);
      objs.targetSpherical.radius = 4.6;
      objs.targetSpherical.phi = 0.76;
    }
  }, [selectedSpot, polyXZ]);

  useEffect(() => {
    const objs = sceneObjectsRef.current;
    if (!objs.scene) return;
    const isLight = themeMode === "light";
    const bgHex = isLight ? 0xf4f4f5 : 0x09090b;
    objs.scene.fog.color.setHex(bgHex);
    objs.renderer.setClearColor(bgHex, 1);

    if (objs.baseMaterial) {
      objs.baseMaterial.color.setHex(isLight ? 0xd4d4d8 : 0x121215);
      objs.baseMaterial.emissive.setHex(isLight ? 0xe4e4e7 : 0x09090b);
    }
    if (objs.coastLineMat) {
      objs.coastLineMat.color.setHex(isLight ? 0x18181b : 0xfafafa);
    }
    if (objs.outerRingMat) {
      objs.outerRingMat.color.setHex(isLight ? 0x71717a : 0x52525b);
    }
    if (objs.terrainUniforms) {
      objs.terrainUniforms.uIsLight.value = isLight ? 1.0 : 0.0;
    }
  }, [themeMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const isLightInit = themeRef.current === "light";
    const bgHex = isLightInit ? 0xf4f4f5 : 0x09090b;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(bgHex, 0.032);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 120);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(bgHex, 1);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(10, 18, 12);
    scene.add(keyLight);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    const islandShape = new THREE.Shape();
    polyXZ.forEach(([x, z], idx) => {
      if (idx === 0) islandShape.moveTo(x, -z);
      else islandShape.lineTo(x, -z);
    });

    const baseExtrudeGeo = new THREE.ExtrudeGeometry(islandShape, {
      depth: 0.14,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.025,
      bevelThickness: 0.025
    });
    baseExtrudeGeo.rotateX(-Math.PI / 2);

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: isLightInit ? 0xd4d4d8 : 0x121215,
      emissive: isLightInit ? 0xe4e4e7 : 0x09090b,
      emissiveIntensity: 0.25,
      roughness: 0.6,
      metalness: 0.2
    });
    rootGroup.add(new THREE.Mesh(baseExtrudeGeo, baseMaterial));

    const segX = 180, segZ = 180;
    const minLat = 9.414, maxLat = 9.578;
    const minLng = 99.928, maxLng = 100.085;
    const positions = [];
    const indices = [];

    for (let iz = 0; iz <= segZ; iz++) {
      const lat = maxLat - (iz / segZ) * (maxLat - minLat);
      for (let ix = 0; ix <= segX; ix++) {
        const lng = minLng + (ix / segX) * (maxLng - minLng);
        const [x, z] = latLngToXZ(lat, lng);
        const y = getSamuiTerrainHeight(lat, lng, polyXZ);
        positions.push(x, y, z);
      }
    }

    for (let iz = 0; iz < segZ; iz++) {
      for (let ix = 0; ix < segX; ix++) {
        const a = iz * (segX + 1) + ix;
        const b = a + 1;
        const c = (iz + 1) * (segX + 1) + ix;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const terrainGeo = new THREE.BufferGeometry();
    terrainGeo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    terrainGeo.setIndex(indices);
    terrainGeo.computeVertexNormals();

    const terrainUniforms = {
      uTime: { value: 0 },
      uIsLight: { value: isLightInit ? 1.0 : 0.0 },
      uFloodLevel: { value: 0.0 }
    };

    const terrainMesh = new THREE.Mesh(
      terrainGeo,
      new THREE.ShaderMaterial({
        vertexShader: TOPO_VERTEX_SHADER,
        fragmentShader: TOPO_FRAGMENT_SHADER,
        uniforms: terrainUniforms,
        side: THREE.DoubleSide,
        transparent: true
      })
    );
    rootGroup.add(terrainMesh);

    const terrainWireMat = new THREE.MeshBasicMaterial({
      color: 0xa1a1aa,
      wireframe: true,
      transparent: true,
      opacity: 0.0
    });
    const terrainWireMesh = new THREE.Mesh(terrainGeo, terrainWireMat);
    terrainWireMesh.position.y = 0.003;
    rootGroup.add(terrainWireMesh);

    const coastVecs = polyXZ.map(([x, z]) => new THREE.Vector3(x, 0.145, z));
    const coastLineMat = new THREE.LineBasicMaterial({
      color: isLightInit ? 0x18181b : 0xfafafa,
      transparent: true,
      opacity: 0.9
    });
    rootGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(coastVecs), coastLineMat));

    const roadVecs = SAMUI_RING_ROAD.map(([lat, lng]) => {
      const [x, z] = latLngToXZ(lat, lng);
      return new THREE.Vector3(x, getSamuiTerrainHeight(lat, lng, polyXZ) + 0.02, z);
    });
    const roadLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(roadVecs),
      new THREE.LineDashedMaterial({ color: 0xef4444, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.65 })
    );
    roadLine.computeLineDistances();
    rootGroup.add(roadLine);

    const floodGeo = new THREE.ExtrudeGeometry(islandShape, { depth: 0.015, bevelEnabled: false });
    floodGeo.rotateX(-Math.PI / 2);
    const floodMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.0, side: THREE.DoubleSide });
    const floodMesh = new THREE.Mesh(floodGeo, floodMat);
    floodMesh.position.y = 0.145;
    rootGroup.add(floodMesh);

    const gridHelper = new THREE.GridHelper(26, 40, 0x27272a, 0x18181b);
    gridHelper.position.y = -0.02;
    scene.add(gridHelper);

    const outerRingGeo = new THREE.RingGeometry(5.15, 5.19, 128);
    outerRingGeo.rotateX(-Math.PI / 2);
    const outerRingMat = new THREE.MeshBasicMaterial({ color: 0x52525b, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    rootGroup.add(new THREE.Mesh(outerRingGeo, outerRingMat));

    const rainCount = 900;
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 11;
      rainPositions[i * 3 + 1] = Math.random() * 5;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 11;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({ color: 0xd4d4d8, size: 0.04, transparent: true, opacity: 0 });
    const rainParticles = new THREE.Points(rainGeo, rainMat);
    rootGroup.add(rainParticles);

    const reticleGroup = new THREE.Group();
    reticleGroup.visible = false;
    const retRingGeo = new THREE.RingGeometry(0.12, 0.18, 32);
    retRingGeo.rotateX(-Math.PI / 2);
    const retRingMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    reticleGroup.add(new THREE.Mesh(retRingGeo, retRingMat));
    rootGroup.add(reticleGroup);

    const markersGroup = new THREE.Group();
    rootGroup.add(markersGroup);

    const cameraSpherical = new THREE.Spherical(8.8, 0.86, 0.28);
    const targetSpherical = new THREE.Spherical(8.8, 0.86, 0.28);
    const cameraTarget = new THREE.Vector3(0, 0.1, 0);
    const targetLookAt = new THREE.Vector3(0, 0.1, 0);

    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2();
    let isDragging = false;
    let pointerDownPos = { x: 0, y: 0 };
    let prevMouse = { x: 0, y: 0 };

    const onPointerDown = (e) => {
      isDragging = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isPinningRef.current) {
        raycaster.setFromCamera(mouseNDC, camera);
        const hits = raycaster.intersectObject(terrainMesh);
        if (hits.length > 0) {
          const pt = hits[0].point;
          if (isPointInIsland(pt.x, pt.z, polyXZ) && pt.y >= 0.135) {
            reticleGroup.position.copy(pt);
            reticleGroup.visible = true;
            const coords = xzToLatLng(pt.x, pt.z);
            const elev = Math.max(2, Math.round(((pt.y - 0.14) / 1.38) * 420));
            setHoverPinReadout({ ...coords, elev });
          } else {
            reticleGroup.visible = false;
            setHoverPinReadout(null);
          }
        }
      } else if (reticleGroup.visible) {
        reticleGroup.visible = false;
        setHoverPinReadout(null);
      }

      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      prevMouse = { x: e.clientX, y: e.clientY };
      targetSpherical.theta -= dx * 0.0065;
      targetSpherical.phi = Math.max(0.30, Math.min(Math.PI / 2.15, targetSpherical.phi - dy * 0.0055));
    };

    const onPointerUp = (e) => {
      const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      isDragging = false;
      if (isPinningRef.current && moveDist < 6) {
        raycaster.setFromCamera(mouseNDC, camera);
        const hits = raycaster.intersectObject(terrainMesh);
        if (hits.length > 0) {
          const pt = hits[0].point;
          if (isPointInIsland(pt.x, pt.z, polyXZ) && pt.y >= 0.135) {
            const coords = xzToLatLng(pt.x, pt.z);
            const elev = Math.max(2, Math.round(((pt.y - 0.14) / 1.38) * 420));
            reticleGroup.visible = false;
            setHoverPinReadout(null);
            if (onMapPinClickRef.current) {
              onMapPinClickRef.current({ lat: coords.lat, lng: coords.lng, elevation_m: elev });
            }
          }
        }
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      targetSpherical.radius = Math.max(3.2, Math.min(14.5, targetSpherical.radius + e.deltaY * 0.005));
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    domEl.addEventListener("wheel", onWheel, { passive: false });

    sceneObjectsRef.current = {
      scene, camera, renderer, rootGroup, markersGroup, baseMaterial,
      terrainUniforms, terrainWireMat, coastLineMat, outerRingMat,
      floodMesh, floodMat, rainParticles, rainMat,
      cameraSpherical, targetSpherical, cameraTarget, targetLookAt
    };

    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      terrainUniforms.uTime.value = elapsed;
      terrainWireMat.opacity = viewModeRef.current === "wireframe" ? 0.45 : 0.05;

      const currentRain = Number(rainMmRef.current || 0);
      if (currentRain > 0.5) {
        rainMat.opacity = Math.min(0.75, 0.15 + currentRain / 70);
        const posAttr = rainParticles.geometry.attributes.position;
        const speed = 0.07 + (currentRain / 100) * 0.14;
        for (let i = 0; i < posAttr.count; i++) {
          let y = posAttr.getY(i) - speed;
          if (y < 0.1) y = 4.8;
          posAttr.setY(i, y);
        }
        posAttr.needsUpdate = true;
      } else {
        rainMat.opacity = 0;
      }

      if (showFloodRef.current && currentRain > 5) {
        const floodRatio = Math.min(1, currentRain / 90);
        const fLevel = 0.145 + floodRatio * 0.22;
        floodMat.opacity = 0.18 + floodRatio * 0.28;
        floodMesh.position.y = fLevel;
        terrainUniforms.uFloodLevel.value = fLevel;
      } else {
        floodMat.opacity = 0;
        terrainUniforms.uFloodLevel.value = 0.0;
      }

      if (objsMarkersPulseRef.current.length > 0) {
        const s = 1 + ((elapsed * 1.8) % 1.6);
        const op = Math.max(0, 0.75 * (1 - (s - 1) / 1.6));
        objsMarkersPulseRef.current.forEach(({ ring, pinGroup, laserBeam, spotId }) => {
          const isHoveredOrSelected =
            hoveredSpotIdRef.current === spotId || selectedSpotRef.current?.id === spotId;
          ring.scale.set(isHoveredOrSelected ? s * 1.45 : s, isHoveredOrSelected ? s * 1.45 : s, 1);
          ring.material.opacity = isHoveredOrSelected ? Math.min(1, op * 1.4) : op;
          const targetScale = isHoveredOrSelected ? 1.28 : 1.0;
          pinGroup.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
          laserBeam.visible = isHoveredOrSelected;
        });
      }

      if (!isDragging && !selectedSpotRef.current && !isPinningRef.current && !hoveredSpotIdRef.current) {
        targetSpherical.theta += isLandingRef.current ? 0.0018 : 0.00055;
      }

      cameraSpherical.radius += (targetSpherical.radius - cameraSpherical.radius) * 0.06;
      cameraSpherical.phi += (targetSpherical.phi - cameraSpherical.phi) * 0.06;
      cameraSpherical.theta += (targetSpherical.theta - cameraSpherical.theta) * 0.06;
      cameraTarget.lerp(targetLookAt, 0.06);

      camera.position.setFromSpherical(cameraSpherical).add(cameraTarget);
      camera.lookAt(cameraTarget);
      renderer.render(scene, camera);

      const w = container.clientWidth;
      const h = container.clientHeight;

      if (sceneObjectsRef.current.currentHotspots) {
        const projected = sceneObjectsRef.current.currentHotspots.map((spot) => {
          const [x, z] = latLngToXZ(spot.lat, spot.lng);
          const y = getSamuiTerrainHeight(spot.lat, spot.lng, polyXZ) + 0.62;
          const vec = new THREE.Vector3(x, y, z);
          vec.project(camera);
          return {
            spot,
            x: (vec.x * 0.5 + 0.5) * w,
            y: (-(vec.y * 0.5) + 0.5) * h,
            visible: vec.z < 1
          };
        });
        setMarkerScreenCoords(projected);
      }

      const projLandmarks = SAMUI_LANDMARKS.map((lm) => {
        const [x, z] = latLngToXZ(lm.lat, lm.lng);
        const y = getSamuiTerrainHeight(lm.lat, lm.lng, polyXZ) + 0.18;
        const vec = new THREE.Vector3(x, y, z);
        vec.project(camera);
        return {
          ...lm,
          x: (vec.x * 0.5 + 0.5) * w,
          y: (-(vec.y * 0.5) + 0.5) * h,
          visible: vec.z < 1
        };
      });
      setLandmarkScreenCoords(projLandmarks);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      domEl.removeEventListener("pointerdown", onPointerDown);
      domEl.removeEventListener("wheel", onWheel);
      renderer.dispose();
    };
  }, [polyXZ]);

  useEffect(() => {
    const objs = sceneObjectsRef.current;
    if (!objs.markersGroup) return;
    objs.currentHotspots = hotspots;
    objsMarkersPulseRef.current = [];

    while (objs.markersGroup.children.length > 0) {
      objs.markersGroup.remove(objs.markersGroup.children[0]);
    }

    hotspots.forEach((spot) => {
      const [x, z] = latLngToXZ(spot.lat, spot.lng);
      const groundY = getSamuiTerrainHeight(spot.lat, spot.lng, polyXZ);

      const pinGroup = new THREE.Group();
      pinGroup.position.set(x, groundY, z);

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.56, 12),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      pole.position.y = 0.28;
      pinGroup.add(pole);

      const flagShape = new THREE.Shape();
      flagShape.moveTo(0, 0);
      flagShape.lineTo(0.24, 0.07);
      flagShape.lineTo(0, 0.14);
      flagShape.closePath();
      const flagMesh = new THREE.Mesh(
        new THREE.ShapeGeometry(flagShape),
        new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
      );
      flagMesh.position.set(0, 0.42, 0);
      pinGroup.add(flagMesh);

      const laserBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.03, 1.8, 12),
        new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.45 })
      );
      laserBeam.position.y = 0.9;
      laserBeam.visible = false;
      pinGroup.add(laserBeam);

      const pulseGeo = new THREE.RingGeometry(0.11, 0.18, 32);
      pulseGeo.rotateX(-Math.PI / 2);
      const pulseMesh = new THREE.Mesh(
        pulseGeo,
        new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
      );
      pulseMesh.position.y = 0.015;
      pinGroup.add(pulseMesh);

      objsMarkersPulseRef.current.push({ ring: pulseMesh, pinGroup, laserBeam, spotId: spot.id });
      objs.markersGroup.add(pinGroup);
    });
  }, [hotspots, polyXZ]);

  const isLight = themeMode === "light";

  return (
    <div className={`relative w-full h-full select-none overflow-hidden transition-colors duration-300 ${isLight ? "bg-zinc-100" : "bg-[#09090b]"}`}>
      <div ref={mountRef} className={`w-full h-full ${isPinningMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`} />

      {isPinningMode && (
        <div className="pointer-events-none absolute top-[72px] left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-mono font-semibold shadow-2xl border border-red-400">
          <Crosshair className="w-4 h-4 animate-spin" />
          <span>
            คลิกตำแหน่งใดก็ได้บนโมเดลเกาะสมุย 3D เพื่อปักธงแดงจุดเสี่ยงใหม่
            {hoverPinReadout ? ` • [${hoverPinReadout.lat}N, ${hoverPinReadout.lng}E | ELEV ${hoverPinReadout.elev}M]` : ""}
          </span>
        </div>
      )}

      {showLandmarks && !isLandingMode && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {landmarkScreenCoords.map((lm) =>
            lm.visible ? (
              <div
                key={lm.id}
                style={{ transform: `translate3d(${lm.x}px, ${lm.y}px, 0) translate(-50%, -50%)` }}
                className="absolute top-0 left-0 z-0"
              >
                <div className={`px-1.5 py-0.5 rounded border text-[9px] font-mono tracking-wider uppercase opacity-60 ${isLight ? "bg-white/80 border-zinc-300 text-zinc-700" : "bg-zinc-950/75 border-zinc-800 text-zinc-400"}`}>
                  {lm.code} • {lm.name}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {markerScreenCoords.map(({ spot, x, y, visible }) => {
          if (!visible) return null;
          const isSelected = selectedSpot?.id === spot.id;
          const isHovered = hoveredSpotId === spot.id;
          const isExpanded = isSelected || isHovered || showAllLabels;
          const risk = calculateDynamicSpotRisk(spot, rainMm, windKmh);

          return (
            <div
              key={spot.id}
              style={{ transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)` }}
              className={`pointer-events-auto absolute top-0 left-0 transition-all duration-150 ${isSelected || isHovered ? "z-30" : "z-10"}`}
            >
              <button
                type="button"
                onMouseEnter={() => onHoverSpot(spot.id)}
                onMouseLeave={() => onHoverSpot(null)}
                onClick={() => onSelectSpot(spot)}
                className={`group flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-150 border shadow-xl cursor-pointer ${
                  isSelected
                    ? "bg-red-600 text-white border-white font-semibold scale-110 ring-4 ring-red-500/30"
                    : isHovered
                    ? "bg-red-600 text-white border-red-300 scale-105"
                    : risk.isCritical
                    ? "bg-zinc-950/95 text-white border-red-500/90 hover:bg-red-600"
                    : "bg-zinc-950/90 text-zinc-200 border-zinc-700 hover:border-red-500 hover:text-white"
                }`}
              >
                <Flag className="w-3 h-3 text-red-500 group-hover:text-white fill-current shrink-0" />
                <span className="font-mono text-[10px] font-bold tracking-tight">{spot.code}</span>
                {isExpanded && (
                  <span className="tracking-tight whitespace-nowrap pl-1 border-l border-current/20">
                    {spot.name.split(" (")[0]} ({risk.score}%)
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {!isLandingMode && (
        <div className={`pointer-events-none absolute bottom-3 right-4 hidden lg:flex items-center gap-3 px-3 py-1 rounded-md border text-[10px] font-mono ${isLight ? "bg-white/90 border-zinc-300 text-zinc-600" : "bg-zinc-950/90 border-zinc-800 text-zinc-400"}`}>
          <div className="flex items-center gap-1.5 font-semibold text-red-500">
            <Compass className="w-3 h-3" />
            <span>KOH SAMUI 9.5120°N 100.0136°E</span>
          </div>
          <span className="opacity-30">|</span>
          <span>PEAK: 635M</span>
        </div>
      )}
    </div>
  );
}
