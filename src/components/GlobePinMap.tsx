"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface PinData {
  lat: number;
  lng: number;
  char: string;
  location?: string;
}

// Convert lat/lng (degrees) to 3D point on unit sphere
function latLngToVec3(lat: number, lng: number, r = 1): THREE.Vector3 {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

interface GlobePinMapProps {
  pins: PinData[];
}

export function GlobePinMap({ pins }: GlobePinMapProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el || !pins.length) return;

    const w = el.clientWidth;
    const h = el.clientHeight;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 0, 2.9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // Globe core
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#0a0a0a"),
        metalness: 0.95,
        roughness: 0.12,
        emissive: new THREE.Color("#1a1000"),
        emissiveIntensity: 0.3,
      }),
    );
    scene.add(sphere);

    // Wireframe grid
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.003, 28, 28),
      new THREE.MeshBasicMaterial({ color: "#c9a84c", wireframe: true, transparent: true, opacity: 0.15 }),
    ));

    // Atmosphere
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.10, 32, 32),
      new THREE.MeshStandardMaterial({
        color: "#c9a84c", transparent: true, opacity: 0.05,
        side: THREE.BackSide, emissive: "#c9a84c", emissiveIntensity: 0.4,
      }),
    ));

    // Lights
    const key = new THREE.DirectionalLight("#d4a847", 2.8);
    key.position.set(-3, 4, 3);
    scene.add(key);
    scene.add(new THREE.DirectionalLight("#7a5020", 0.5).translateX(4).translateY(-2).translateZ(-3));
    const rim = new THREE.PointLight("#c9a84c", 1.4, 20);
    rim.position.set(3, 1, -2);
    scene.add(rim);
    scene.add(new THREE.AmbientLight("#ffffff", 0.06));

    // Pins — gold dot + spike
    const pinGroup = new THREE.Group();
    const dotGeo   = new THREE.SphereGeometry(0.022, 12, 12);
    const dotMat   = new THREE.MeshBasicMaterial({ color: "#c9a84c" });
    const lineMat  = new THREE.LineBasicMaterial({ color: "#c9a84c", transparent: true, opacity: 0.5 });

    // Pulse ring geo (reused, scaled per pin)
    const ringGeo  = new THREE.RingGeometry(0.028, 0.038, 24);
    const ringMat  = new THREE.MeshBasicMaterial({ color: "#c9a84c", transparent: true, opacity: 0.6, side: THREE.DoubleSide });

    pins.forEach((p) => {
      const pos    = latLngToVec3(p.lat, p.lng, 1.0);
      const tipPos = latLngToVec3(p.lat, p.lng, 1.032);

      // Dot at tip
      const dot = new THREE.Mesh(dotGeo, dotMat);
      dot.position.copy(tipPos);
      pinGroup.add(dot);

      // Line from surface to tip
      const lineGeo = new THREE.BufferGeometry().setFromPoints([pos, tipPos]);
      pinGroup.add(new THREE.Line(lineGeo, lineMat));

      // Pulse ring (faces outward from globe surface)
      const ring = new THREE.Mesh(ringGeo, ringMat.clone());
      ring.position.copy(latLngToVec3(p.lat, p.lng, 1.035));
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      ring.rotateX(Math.PI); // flip to face outward
      pinGroup.add(ring);
    });
    scene.add(pinGroup);

    // Auto-rotate slowly, centre on average pin lat/lng
    const avgLat = pins.reduce((s, p) => s + p.lat, 0) / pins.length;
    const avgLng = pins.reduce((s, p) => s + p.lng, 0) / pins.length;
    // Rotate globe so avg pin faces camera on load
    const initYaw   = -(avgLng + 180) * (Math.PI / 180);
    const initPitch = -(avgLat)        * (Math.PI / 180) * 0.5;
    sphere.rotation.y    = initYaw;
    pinGroup.rotation.y  = initYaw;
    sphere.rotation.x    = initPitch;
    pinGroup.rotation.x  = initPitch;

    // Drag to rotate
    let isDragging = false;
    let prevX = 0, prevY = 0;
    let rotY = initYaw, rotX = initPitch;
    let velX = 0.0008, velY = 0;

    function onPointerDown(e: PointerEvent) {
      isDragging = true; prevX = e.clientX; prevY = e.clientY;
      velX = 0; velY = 0;
      (el as HTMLDivElement).setPointerCapture(e.pointerId);
    }
    function onPointerMove(e: PointerEvent) {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX; prevY = e.clientY;
      velX = dx * 0.005;
      velY = dy * 0.005;
      rotY += velX;
      rotX += velY;
      rotX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotX));
    }
    function onPointerUp() { isDragging = false; }

    el.addEventListener("pointerdown",  onPointerDown);
    el.addEventListener("pointermove",  onPointerMove);
    el.addEventListener("pointerup",    onPointerUp);
    el.addEventListener("pointercancel",onPointerUp);

    // Pulse ring animation
    let tick = 0;
    let raf: number;
    const clock = new THREE.Clock();

    function animate() {
      raf = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      tick += dt;

      if (!isDragging) {
        velX *= 0.95;
        velY *= 0.95;
        rotY += velX + dt * 0.1;
        rotX += velY;
        rotX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotX));
      }

      sphere.rotation.y    = rotY;
      sphere.rotation.x    = rotX;
      pinGroup.rotation.y  = rotY;
      pinGroup.rotation.x  = rotX;

      // Pulse rings: scale in/out
      let ringIdx = 0;
      pinGroup.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child.geometry instanceof THREE.RingGeometry) {
          const phase = (tick * 1.4 + ringIdx * 0.7) % 1;
          const s = 0.9 + phase * 0.8;
          child.scale.setScalar(s);
          (child.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - phase);
          ringIdx++;
        }
      });

      renderer.render(scene, camera);
    }
    animate();

    const capturedEl = el;
    function onResize() {
      const nw = capturedEl.clientWidth;
      const nh = capturedEl.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    }
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      el.removeEventListener("pointerdown",   onPointerDown);
      el.removeEventListener("pointermove",   onPointerMove);
      el.removeEventListener("pointerup",     onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      capturedEl.removeChild(renderer.domElement);
    };
  }, [pins]);

  if (!pins.length) return null;

  return (
    <div
      ref={mountRef}
      style={{
        width: "100%",
        height: "100%",
        cursor: "grab",
        touchAction: "none",
      }}
    />
  );
}
