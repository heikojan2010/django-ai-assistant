import { useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, Vector3, MathUtils } from 'three';
import { useFrame, extend } from '@react-three/fiber';
import Geo from './Geo.tsx';
import { shaderMaterial } from '@react-three/drei';


export default function NeuralNetwork({ numLayers = 3 }) {
  const groupRef = useRef();
  const particlesRef = useRef();
  const linesGeometryRef = useRef();

  const maxParticleCount = 1000;
  const particleCount = 500;
  const r = 9.6;
  const maxConnections = 20;
  const minDistance = 2.5;

  let vertexpos = 0;
  let colorpos = 0;
  let numConnected = 0;

  const segments = maxParticleCount * maxParticleCount;
  const positions = useMemo(() => new Float32Array(segments * 3), [segments]);
  const colors = useMemo(() => new Float32Array(segments * 3), [segments]);
  const particlePositions = useMemo(() => new Float32Array(maxParticleCount * 3), []);
  const particlesData = useMemo(() => [], []);

  const v = useMemo(() => new Vector3(), []);

  useEffect(() => {
    const layerRadius = r / numLayers;

    for (let i = 0; i < maxParticleCount; i++) {
      const layer = Math.floor(i / (maxParticleCount / numLayers));
      if (layer === 0) continue; // Skip the innermost layer

      const radius = layerRadius * (layer + 1);

      const theta = MathUtils.randFloat(0, 2 * Math.PI);
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      const velocity = new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(0.05);
      particlesData.push({ velocity, numConnections: 0 });
    }

    particlesRef.current.setDrawRange(0, particleCount);
  }, [maxParticleCount, numLayers, particlePositions, particlesData, r]);

  useFrame((_, delta) => {
    vertexpos = 0;
    colorpos = 0;
    numConnected = 0;

    for (let i = 0; i < particleCount; i++) particlesData[i].numConnections = 0;

    for (let i = 0; i < particleCount; i++) {
      const particleData = particlesData[i];
      v.set(particlePositions[i * 3], particlePositions[i * 3 + 1], particlePositions[i * 3 + 2]).add(particleData.velocity);

      v.setLength(i < particleCount / 2 ? r / 2 : r);
      particlePositions[i * 3] = v.x;
      particlePositions[i * 3 + 1] = v.y;
      particlePositions[i * 3 + 2] = v.z;

      if (particleData.numConnections >= maxConnections) continue;

      for (let j = i + 1; j < particleCount; j++) {
        const particleDataB = particlesData[j];
        if (particleDataB.numConnections >= maxConnections) continue;

        const dx = particlePositions[i * 3] - particlePositions[j * 3];
        const dy = particlePositions[i * 3 + 1] - particlePositions[j * 3 + 1];
        const dz = particlePositions[i * 3 + 2] - particlePositions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < minDistance) {
          particleData.numConnections++;
          particleDataB.numConnections++;

          const alpha = 1.0 - dist / minDistance;

          positions[vertexpos++] = particlePositions[i * 3];
          positions[vertexpos++] = particlePositions[i * 3 + 1];
          positions[vertexpos++] = particlePositions[i * 3 + 2];

          positions[vertexpos++] = particlePositions[j * 3];
          positions[vertexpos++] = particlePositions[j * 3 + 1];
          positions[vertexpos++] = particlePositions[j * 3 + 2];

          const color = i < particleCount / 2 ? 0.1 : 1.0;
          colors[colorpos++] = color;
          colors[colorpos++] = 0.5 * color;
          colors[colorpos++] = color;

          colors[colorpos++] = color;
          colors[colorpos++] = 0.5 * color;
          colors[colorpos++] = color;

          numConnected++;
        }
      }
    }

    linesGeometryRef.current.setDrawRange(0, numConnected * 2);
    linesGeometryRef.current.attributes.position.needsUpdate = true;
    linesGeometryRef.current.attributes.color.needsUpdate = true;
    particlesRef.current.attributes.position.needsUpdate = true;
    groupRef.current.rotation.y += delta / 5;
  });

  return (
    <>

    <group ref={groupRef} dispose={null}>
      <Geo scale={3} />

     
      <group>
        <points>
          <bufferGeometry ref={particlesRef}>
            <bufferAttribute attach="attributes-position" count={particleCount} array={particlePositions} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial color={'white'} size={3} blending={AdditiveBlending} transparent={true} sizeAttenuation={false} />
        </points>
        <lineSegments>
          <bufferGeometry ref={linesGeometryRef}>
            <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
            <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial vertexColors={true} blending={AdditiveBlending} transparent={true} />
        </lineSegments>
      </group>
     
    </group>
    </>
  );
}
