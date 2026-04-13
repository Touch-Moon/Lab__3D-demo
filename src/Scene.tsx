import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { Group } from 'three'
import LotMesh from './LotMesh'
import { LOTS } from './data'

// Map lot positions from SVG space (0-596 x 0-286) to 3D space (-10 to 10)
function svgToWorld(x: number, y: number): [number, number, number] {
  const wx = (x / 596) * 20 - 10
  const wz = (y / 286) * 10 - 5
  return [wx, 0, wz]
}

// Rough lot centers & sizes derived from SVG bounding boxes (approximated)
const LOT_LAYOUT: Record<string, { cx: number; cy: number; w: number; h: number }> = {
  'lot-1':   { cx: 51,  cy: 58,  w: 54, h: 118 },
  'lot-2':   { cx: 51,  cy: 265, w: 54, h: 42 },
  'lot-3':   { cx: 352, cy: 217, w: 25, h: 54 },
  'lot-4':   { cx: 352, cy: 262, w: 25, h: 49 },
  'lot-5':   { cx: 51,  cy: 161, w: 54, h: 53 },
  'lot-6':   { cx: 51,  cy: 209, w: 54, h: 43 },
  'lot-7':   { cx: 386, cy: 107, w: 30, h: 14 },
  'lot-8':   { cx: 380, cy: 96,  w: 30, h: 13 },
  'lot-9':   { cx: 374, cy: 84,  w: 30, h: 12 },
  'lot-10':  { cx: 580, cy: 66,  w: 18, h: 24 },
  'lot-11':  { cx: 569, cy: 63,  w: 13, h: 30 },
  'lot-12':  { cx: 558, cy: 63,  w: 12, h: 30 },
  'lot-13':  { cx: 546, cy: 64,  w: 15, h: 33 },
  'lot-14':  { cx: 532, cy: 66,  w: 15, h: 34 },
  'lot-15':  { cx: 521, cy: 70,  w: 18, h: 31 },
  'lot-16':  { cx: 403, cy: 6,   w: 28, h: 12 },
  'lot-17':  { cx: 403, cy: 17,  w: 28, h: 11 },
  'lot-18':  { cx: 403, cy: 28,  w: 28, h: 11 },
  'lot-19':  { cx: 404, cy: 40,  w: 28, h: 14 },
  'lot-20':  { cx: 405, cy: 54,  w: 30, h: 14 },
  'lot-21':  { cx: 408, cy: 66,  w: 30, h: 14 },
  'lot-22':  { cx: 416, cy: 75,  w: 30, h: 13 },
  'lot-23':  { cx: 422, cy: 87,  w: 30, h: 13 },
  'lot-24':  { cx: 435, cy: 113, w: 30, h: 13 },
  'lot-25':  { cx: 444, cy: 124, w: 30, h: 13 },
  'lot-26':  { cx: 449, cy: 133, w: 30, h: 13 },
  'lot-27':  { cx: 454, cy: 143, w: 30, h: 13 },
  'lot-28':  { cx: 459, cy: 153, w: 30, h: 15 },
  'lot-29':  { cx: 479, cy: 130, w: 30, h: 32 },
  'lot-30':  { cx: 475, cy: 118, w: 30, h: 13 },
  'lot-31':  { cx: 467, cy: 101, w: 30, h: 13 },
  'lot-32':  { cx: 461, cy: 91,  w: 30, h: 13 },
  'lot-33':  { cx: 501, cy: 69,  w: 32, h: 27 },
  'lot-34':  { cx: 507, cy: 80,  w: 30, h: 13 },
  'lot-35':  { cx: 513, cy: 89,  w: 30, h: 12 },
  'lot-36':  { cx: 518, cy: 97,  w: 30, h: 12 },
  'lot-37':  { cx: 521, cy: 107, w: 30, h: 16 },
  'lot-38':  { cx: 522, cy: 120, w: 30, h: 14 },
  'lot-39':  { cx: 516, cy: 132, w: 30, h: 14 },
  'lot-40':  { cx: 511, cy: 141, w: 28, h: 14 },
  'lot-41':  { cx: 505, cy: 151, w: 28, h: 14 },
  'lot-42':  { cx: 498, cy: 160, w: 28, h: 14 },
  'lot-43':  { cx: 491, cy: 169, w: 28, h: 14 },
  'lot-44':  { cx: 484, cy: 179, w: 28, h: 14 },
  'lot-45':  { cx: 477, cy: 187, w: 28, h: 14 },
  'lot-46':  { cx: 465, cy: 183, w: 22, h: 30 },
  'lot-47':  { cx: 457, cy: 186, w: 14, h: 30 },
  'lot-48':  { cx: 446, cy: 187, w: 15, h: 30 },
  'lot-49':  { cx: 433, cy: 183, w: 22, h: 30 },
  'lot-50':  { cx: 428, cy: 176, w: 28, h: 14 },
  'lot-51':  { cx: 423, cy: 161, w: 28, h: 14 },
  'lot-52':  { cx: 418, cy: 157, w: 28, h: 12 },
  'lot-53':  { cx: 412, cy: 147, w: 28, h: 12 },
  'lot-54':  { cx: 407, cy: 138, w: 28, h: 12 },
  'lot-55':  { cx: 399, cy: 128, w: 28, h: 12 },
  'lot-56':  { cx: 587, cy: 17,  w: 13, h: 34 },
  'lot-57':  { cx: 574, cy: 17,  w: 13, h: 34 },
  'lot-58':  { cx: 561, cy: 17,  w: 13, h: 34 },
  'lot-59':  { cx: 548, cy: 17,  w: 13, h: 34 },
  'lot-60':  { cx: 535, cy: 18,  w: 13, h: 36 },
  'lot-61':  { cx: 519, cy: 19,  w: 21, h: 38 },
  'lot-62':  { cx: 508, cy: 21,  w: 26, h: 43 },
  'lot-63':  { cx: 489, cy: 43,  w: 38, h: 30 },
  'lot-64':  { cx: 481, cy: 30,  w: 32, h: 28 },
  'lot-65':  { cx: 474, cy: 13,  w: 30, h: 25 },
  'lot-66':  { cx: 470, cy: 12,  w: 27, h: 24 },
  'lot-67':  { cx: 443, cy: 13,  w: 30, h: 26 },
  'lot-68':  { cx: 437, cy: 16,  w: 32, h: 32 },
  'lot-69':  { cx: 432, cy: 37,  w: 30, h: 22 },
  'lot-70':  { cx: 435, cy: 48,  w: 33, h: 18 },
  'lot-71':  { cx: 441, cy: 58,  w: 34, h: 18 },
  'lot-72':  { cx: 451, cy: 71,  w: 34, h: 18 },
  'lot-73':  { cx: 367, cy: 16,  w: 15, h: 32 },
  'lot-74':  { cx: 354, cy: 16,  w: 14, h: 32 },
  'lot-75':  { cx: 341, cy: 16,  w: 13, h: 33 },
  'lot-76':  { cx: 328, cy: 17,  w: 13, h: 34 },
  'lot-77':  { cx: 312, cy: 17,  w: 19, h: 35 },
  'lot-78':  { cx: 294, cy: 14,  w: 18, h: 28 },
  'lot-79':  { cx: 269, cy: 12,  w: 33, h: 25 },
  'lot-80':  { cx: 261, cy: 13,  w: 17, h: 25 },
  'lot-81':  { cx: 267, cy: 34,  w: 34, h: 18 },
  'lot-82':  { cx: 275, cy: 47,  w: 30, h: 22 },
  'lot-83':  { cx: 368, cy: 62,  w: 16, h: 32 },
  'lot-84':  { cx: 354, cy: 62,  w: 14, h: 32 },
  'lot-85':  { cx: 341, cy: 62,  w: 16, h: 32 },
  'lot-86':  { cx: 330, cy: 64,  w: 14, h: 32 },
  'lot-87':  { cx: 314, cy: 66,  w: 16, h: 32 },
  'lot-88':  { cx: 308, cy: 70,  w: 16, h: 30 },
  'lot-89':  { cx: 289, cy: 77,  w: 18, h: 29 },
  'lot-90':  { cx: 278, cy: 86,  w: 17, h: 29 },
  'lot-91':  { cx: 267, cy: 92,  w: 17, h: 29 },
  'lot-92':  { cx: 257, cy: 98,  w: 17, h: 29 },
  'lot-93':  { cx: 247, cy: 103, w: 17, h: 29 },
  'lot-94':  { cx: 237, cy: 110, w: 19, h: 28 },
  'lot-95':  { cx: 231, cy: 113, w: 22, h: 24 },
  'lot-96':  { cx: 222, cy: 120, w: 22, h: 24 },
  'lot-97':  { cx: 214, cy: 130, w: 22, h: 24 },
  'lot-98':  { cx: 207, cy: 142, w: 22, h: 24 },
  'lot-99':  { cx: 198, cy: 153, w: 22, h: 22 },
  'lot-100': { cx: 204, cy: 58,  w: 24, h: 20 },
  'lot-101': { cx: 185, cy: 61,  w: 14, h: 26 },
  'lot-102': { cx: 172, cy: 64,  w: 14, h: 32 },
  'lot-103': { cx: 159, cy: 64,  w: 14, h: 32 },
  'lot-104': { cx: 146, cy: 64,  w: 13, h: 32 },
  'lot-105': { cx: 132, cy: 64,  w: 16, h: 32 },
  'lot-106': { cx: 145, cy: 87,  w: 41, h: 13 },
  'lot-107': { cx: 141, cy: 100, w: 36, h: 14 },
  'lot-108': { cx: 138, cy: 113, w: 31, h: 15 },
  'lot-109': { cx: 163, cy: 127, w: 32, h: 16 },
  'lot-110': { cx: 169, cy: 112, w: 32, h: 16 },
  'lot-111': { cx: 176, cy: 93,  w: 33, h: 26 },
  'lot-112': { cx: 183, cy: 86,  w: 33, h: 26 },
  'lot-113': { cx: 194, cy: 80,  w: 28, h: 24 },
  'lot-114': { cx: 205, cy: 77,  w: 26, h: 24 },
  'lot-115': { cx: 217, cy: 71,  w: 24, h: 23 },
  'lot-116': { cx: 251, cy: 58,  w: 36, h: 30 },
  'lot-117': { cx: 244, cy: 46,  w: 34, h: 28 },
  'lot-118': { cx: 239, cy: 33,  w: 33, h: 28 },
  'lot-119': { cx: 230, cy: 20,  w: 27, h: 40 },
  'lot-120': { cx: 223, cy: 17,  w: 20, h: 34 },
  'lot-121': { cx: 209, cy: 17,  w: 18, h: 34 },
  'lot-122': { cx: 194, cy: 17,  w: 13, h: 34 },
  'lot-123': { cx: 181, cy: 17,  w: 13, h: 34 },
  'lot-124': { cx: 168, cy: 17,  w: 13, h: 34 },
  'lot-125': { cx: 155, cy: 17,  w: 13, h: 34 },
  'lot-126': { cx: 142, cy: 17,  w: 13, h: 34 },
  'lot-127': { cx: 129, cy: 17,  w: 14, h: 34 },
}

const SCALE = 20 / 596

function RotatingGroup({ children, hoveredId }: { children: React.ReactNode; hoveredId: string | null }) {
  const groupRef = useRef<Group>(null)
  useFrame((_, delta) => {
    if (!groupRef.current || hoveredId) return
    groupRef.current.rotation.y += delta * 0.08
  })
  return <group ref={groupRef}>{children}</group>
}

interface SceneProps {
  onHover: (label: string | null) => void
  hoveredId: string | null
}

export default function Scene({ onHover, hoveredId }: SceneProps) {
  const lots = useMemo(() => {
    return LOTS.map(lot => {
      const layout = LOT_LAYOUT[lot.id]
      if (!layout) return null
      const [wx, , wz] = svgToWorld(layout.cx, layout.cy)
      const ww = layout.w * SCALE
      const wh = layout.h * SCALE
      return (
        <LotMesh
          key={lot.id}
          position={[wx, 0, wz]}
          size={[ww, wh]}
          status={lot.status}
          label={lot.label}
          onHover={onHover}
        />
      )
    }).filter(Boolean)
  }, [onHover])

  return (
    <Canvas
      camera={{ position: [0, 12, 8], fov: 45 }}
      style={{ width: '100%', height: '100%' }}
      shadows
    >
      <ambientLight intensity={0.5} />
      <hemisphereLight color="#b9d5ff" groundColor="#444466" intensity={0.8} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-8, 8, -6]} intensity={0.3} />

      <RotatingGroup hoveredId={hoveredId}>
        {lots}
      </RotatingGroup>

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[22, 12]} />
        <meshStandardMaterial color="#c7d4c8" roughness={0.9} />
      </mesh>

      <Grid
        position={[0, 0.001, 0]}
        cellSize={0.5}
        cellThickness={0.3}
        cellColor="#a0adb4"
        sectionSize={2}
        sectionThickness={0.6}
        sectionColor="#8090a0"
        fadeDistance={25}
        fadeStrength={1}
        infiniteGrid
      />

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={25}
      />
    </Canvas>
  )
}
