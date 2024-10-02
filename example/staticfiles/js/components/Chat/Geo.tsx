import * as THREE from 'three'
import React, { PropsWithRef, useRef } from 'react'
import { GroupProps, ReactThreeFiber, ThreeElements, useFrame } from '@react-three/fiber'
import { Shadow, MeshDistortMaterial, useGLTF } from '@react-three/drei'

const ModelUrl = `${process.env.PUBLIC_URL}/static/example/models/geo.min.glb`; // Adjust the path as needed

export default function Geo(props: GroupProps) {
  const group = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Group>(null)
  const { nodes } = useGLTF('/geo.min.glb') as any
  useFrame(({ clock }) => {
    if (!group.current || !shadow.current) return
    const t = (1 + Math.sin(clock.getElapsedTime() * 1.5)) / 2
    group.current.position.y = t / 3
    shadow.current.scale.y = shadow.current.scale.z = 1 + t
    shadow.current.scale.x = (1 + t) * 1.25
    group.current.rotation.x = group.current.rotation.z += 0.005

  })
  return (
    <group {...props} dispose={null}>
      <group ref={group}>
        <mesh geometry={nodes.geo.geometry} castShadow receiveShadow>
          <MeshDistortMaterial color="black" flatShading roughness={10} metalness={2.66} factor={5} speed={5} />
        </mesh>
        <mesh geometry={nodes.geo.geometry}>
          <meshBasicMaterial wireframe color='hotpink' />
        </mesh>
        
      </group>
     
    
    </group>
  )

} 

