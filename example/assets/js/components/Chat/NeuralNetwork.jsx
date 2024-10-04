import { useEffect, useMemo, useRef, useState } from 'react';
import { AdditiveBlending, Vector3, MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';
import Geo from './Geo.tsx';
import * as THREE from 'three';

export default function NeuralNetwork({ numLayers = 3 }) {
  const groupRef = useRef();
  const particlesRef = useRef();
  const linesGeometryRef = useRef();

  const maxParticleCount = 666;
  const particleCount = 600;
  const r = 13.66;  // Maximum radius for the particles
  const maxConnections =13;
  const minDistance = 2.6; // Base min distance for connections

  let vertexpos = 0;
  let colorpos = 0;
  let numConnected = 0;

  const segments = maxParticleCount * maxParticleCount;
  const positions = useMemo(() => new Float32Array(segments * 3), [segments]);
  const colors = useMemo(() => new Float32Array(segments * 3), [segments]);
  const particlePositions = useMemo(() => new Float32Array(maxParticleCount * 3), []);
  const particlesData = useMemo(() => Array.from({ length: maxParticleCount }, () => ({})), []);

  const v = useMemo(() => new Vector3(), []);

  // State to simulate network intensity and pulse effect
  const [intensity, setIntensity] = useState(Math.floor(Math.random() * 11) + 6);
  const [pulse, setPulse] = useState(1);

  // Change the intensity and pulse every 3 seconds to simulate network activity
  useEffect(() => {
    const interval = setInterval(() => {
      const newIntensity = Math.floor(Math.random() * 11) + 6;
      setIntensity(newIntensity);

      // Simulate pulse based on intensity
      setPulse(1 + newIntensity / 15);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const layerRadius = r / numLayers;

    for (let i = 0; i < maxParticleCount; i++) {
      const layer = Math.floor(i / (maxParticleCount / numLayers));

      const radius = layerRadius * (layer + 1);
      const theta = MathUtils.randFloat(0, 2 * Math.PI);
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      const velocity = new Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize().multiplyScalar(0.05);

      particlesData[i] = { velocity, numConnections: 0, layer };  // Correctly initialize particlesData
    }

    particlesRef.current.setDrawRange(0, particleCount);
  }, [maxParticleCount, numLayers, particlePositions, particlesData, r]);

  useFrame((_, delta) => {
    vertexpos = 0;
    colorpos = 0;
    numConnected = 0;

    for (let i = 0; i < particleCount; i++) {
      const particleData = particlesData[i];
      if (!particleData) continue;

      const layer = particleData.layer;

      v.set(
        particlePositions[i * 3],
        particlePositions[i * 3 + 1],
        particlePositions[i * 3 + 2]
      );

      if (particleData && particleData.velocity) {
        v.add(particleData.velocity.clone().multiplyScalar(delta));
      }

      // Safeguard for collapsing into the center: Add a repelling force if too close to center
      const distanceFromCenter = v.length();
      const minRadius = r * 0.009;  // Prevent particles from getting closer 

      if (distanceFromCenter < minRadius) {
        const repellingForce = new Vector3().subVectors(v, new Vector3()).normalize().multiplyScalar(0.05);
        v.add(repellingForce);  // Apply repelling force outward
      }

      // Ensure particles stay within the maximum radius
      if (distanceFromCenter > r) {
        v.setLength(r);
      }

      // Update particle positions
      particlePositions[i * 3] = v.x;
      particlePositions[i * 3 + 1] = v.y;
      particlePositions[i * 3 + 2] = v.z;

      particleData.numConnections = 0;
    }

    // Connection logic with dynamic minDistance based on intensity
    const dynamicMinDistance = minDistance + (intensity / 20); // Modify distance based on intensity

    for (let i = 0; i < particleCount; i++) {
      const particleData = particlesData[i];
      if (!particleData || particleData.numConnections >= maxConnections) continue;

      for (let j = i + 1; j < particleCount; j++) {
        const particleDataB = particlesData[j];
        if (!particleDataB || particleDataB.numConnections >= maxConnections) continue;

        const dx = particlePositions[i * 3] - particlePositions[j * 3];
        const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
        const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < dynamicMinDistance) {
          particleData.numConnections++;
          particleDataB.numConnections++;

          const alpha = 1.0 - dist / dynamicMinDistance;

          positions[vertexpos++] = particlePositions[i * 3];
          positions[vertexpos++] = particlePositions[i * 3 + 1];
          positions[vertexpos++] = particlePositions[i * 3 + 2];

          positions[vertexpos++] = particlePositions[j * 3];
          positions[vertexpos++] = particlePositions[j * 3 + 1];
          positions[vertexpos++] = particlePositions[j * 3 + 2];

          const color = i < particleCount / 2 ? 0.1 : 1.0;
          colors[colorpos++] = color;
          colors[colorpos++] = 0.5 * color * pulse;
          colors[colorpos++] = color;

          colors[colorpos++] = color;
          colors[colorpos++] = 6 * color * pulse;
          colors[colorpos++] = color;

          numConnected++;
        }
      }
    }

    // Update buffers and rotation
    linesGeometryRef.current.setDrawRange(0, numConnected * 2);
    linesGeometryRef.current.attributes.position.needsUpdate = true;
    linesGeometryRef.current.attributes.color.needsUpdate = true;
    particlesRef.current.attributes.position.needsUpdate = true;

    // Apply rotation on the y-axis
    groupRef.current.rotation.y += delta / 5;
  });

  return (
    <group ref={groupRef} dispose={null}>

      <group>
      <points>
          <bufferGeometry ref={particlesRef}>
            <bufferAttribute attach="attributes-position" count={particleCount} array={particlePositions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial color={'white'} itemSize={3} blending={AdditiveBlending} transparent={true} sizeAttenuation={false} />
        </points>
        <lineSegments>
          <bufferGeometry ref={linesGeometryRef}>
            <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
            <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial vertexColors={true} transparent={true} />
        </lineSegments>
      </group>
    </group>
  );
}
