'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh } from 'three'

const STATUS_COLOR: Record<string, string> = {
  available:   '#22c55e',
  sold:        '#9ca3af',
  phase2:      '#f97316',
  ready:       '#3b82f6',
  commercial:  '#8b5cf6',
  unavailable: '#e2e8f0',
}

const STATUS_HEIGHT: Record<string, number> = {
  available:   0.4,
  sold:        0.15,
  phase2:      0.6,
  ready:       0.5,
  commercial:  0.8,
  unavailable: 0.1,
}

interface LotMeshProps {
  position: [number, number, number]
  size: [number, number]
  status: string
  label: string
  onHover: (label: string | null) => void
}

export default function LotMesh({ position, size, status, label, onHover }: LotMeshProps) {
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const baseHeight = STATUS_HEIGHT[status] ?? 0.2
  const targetHeight = hovered ? baseHeight * 2.2 : baseHeight
  const color = STATUS_COLOR[status] ?? '#e2e8f0'

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const current = meshRef.current.scale.y
    const target = targetHeight / baseHeight
    meshRef.current.scale.y += (target - current) * Math.min(delta * 12, 1)
    meshRef.current.position.y = (meshRef.current.scale.y * baseHeight) / 2
  })

  return (
    <mesh
      ref={meshRef}
      position={[position[0], baseHeight / 2, position[2]]}
      onPointerOver={() => { setHovered(true); onHover(label) }}
      onPointerOut={() => { setHovered(false); onHover(null) }}
    >
      <boxGeometry args={[size[0] * 0.88, baseHeight, size[1] * 0.88]} />
      <meshStandardMaterial
        color={hovered ? '#ffffff' : color}
        emissive={color}
        emissiveIntensity={hovered ? 0.4 : 0.05}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  )
}
