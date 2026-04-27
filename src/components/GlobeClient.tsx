"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function GlobeClient({ opacity = 1 }: { opacity?: number }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // scene
    const scene = new THREE.Scene();
    const w = el.clientWidth;
    const h = el.clientHeight;

    // camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, 2.8);

    // renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    // sphere geometry — shared
    const geo = new THREE.SphereGeometry(1, 64, 64);

    // core: dark metallic black
    const coreMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0a0a0a"),
      metalness: 0.95,
      roughness: 0.12,
      emissive: new THREE.Color("#1a1000"),
      emissiveIntensity: 0.35,
    });
    const core = new THREE.Mesh(geo, coreMat);
    scene.add(core);

    // wireframe: gold latitude/longitude grid
    const wireMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color("#c9a84c"),
      wireframe: true,
      transparent: true,
      opacity: 0.20,
    });
    const wireGeo = new THREE.SphereGeometry(1.003, 28, 28);
    const wire = new THREE.Mesh(wireGeo, wireMat);
    scene.add(wire);

    // atmosphere shell: faint gold backside
    const atmosMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#c9a84c"),
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
      emissive: new THREE.Color("#c9a84c"),
      emissiveIntensity: 0.4,
    });
    const atmos = new THREE.Mesh(new THREE.SphereGeometry(1.10, 32, 32), atmosMat);
    scene.add(atmos);

    // lights
    const keyLight = new THREE.DirectionalLight("#d4a847", 2.8);
    keyLight.position.set(-3, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight("#7a5020", 0.5);
    fillLight.position.set(4, -2, -3);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight("#c9a84c", 1.4, 20);
    rimLight.position.set(3, 1, -2);
    scene.add(rimLight);

    scene.add(new THREE.AmbientLight("#ffffff", 0.06));

    // animation loop
    let raf: number;
    const clock = new THREE.Clock();

    function animate() {
      raf = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      core.rotation.y += dt * 0.08;
      wire.rotation.y += dt * 0.08;
      atmos.rotation.y += dt * 0.02;
      renderer.render(scene, camera);
    }
    animate();

    // handle resize
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
      capturedEl.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", opacity }}
    />
  );
}
