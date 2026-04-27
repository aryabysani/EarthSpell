"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function GlobeMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.08;
    if (wireRef.current) wireRef.current.rotation.y += delta * 0.08;
  });

  return (
    <group>
      {/* core sphere — dark with gold sheen */}
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <meshStandardMaterial
          color="#0a0a0a"
          metalness={0.9}
          roughness={0.15}
          emissive="#1a1100"
          emissiveIntensity={0.4}
        />
      </Sphere>

      {/* wireframe latitude/longitude lines — gold */}
      <Sphere ref={wireRef} args={[1.005, 32, 32]}>
        <meshBasicMaterial
          color="#c9a84c"
          wireframe
          opacity={0.18}
          transparent
        />
      </Sphere>

      {/* outer atmosphere — very faint gold */}
      <Sphere args={[1.08, 32, 32]}>
        <meshStandardMaterial
          color="#c9a84c"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          emissive="#c9a84c"
          emissiveIntensity={0.3}
        />
      </Sphere>
    </group>
  );
}

export function Globe3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 2.8], fov: 45 }}
      style={{ background: "transparent" }}
      gl={{ alpha: true, antialias: true }}
    >
      {/* gold key light from top-left */}
      <directionalLight position={[-3, 4, 3]} intensity={2.5} color="#d4a847" />
      {/* dim fill from opposite side */}
      <directionalLight position={[4, -2, -3]} intensity={0.4} color="#7a6030" />
      {/* ambient so dark side isn't pure black */}
      <ambientLight intensity={0.08} color="#ffffff" />
      {/* rim light for depth */}
      <pointLight position={[3, 1, -2]} intensity={1.2} color="#c9a84c" />

      <GlobeMesh />
    </Canvas>
  );
}
