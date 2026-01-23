import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { vertexShader, fragmentShader } from '../shaders'
import { useStore } from '../store'

const COUNT = 4000 // Reduced for better performance
const RADIUS = 15 // Spread of chaos

// Heart Function (returns boolean if point x,y,z is inside heart)
function isInsideHeart(x: number, y: number, z: number) {
  // Scaling
  x /= 1.5
  y /= 1.5
  z /= 1.5
  

  const a = x * x + (9/4) * y * y + z * z - 1
  return (a * a * a - x * x * z * z * z - (9/80) * y * y * z * z * z) < 0
}

function generatePositions() {
  const randomPositions = new Float32Array(COUNT * 3)
  const heartPositions = new Float32Array(COUNT * 3)
  const sizes = new Float32Array(COUNT)
  const speeds = new Float32Array(COUNT)

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3

    // Random Position (Chaos)
    randomPositions[i3] = (Math.random() - 0.5) * RADIUS * 2
    randomPositions[i3 + 1] = (Math.random() - 0.5) * RADIUS * 2
    randomPositions[i3 + 2] = (Math.random() - 0.5) * RADIUS * 2

    // Heart Position (Target)
    // Rejection sampling for volume
    let x, y, z
    while (true) {
      x = (Math.random() - 0.5) * 4
      y = (Math.random() - 0.5) * 4
      z = (Math.random() - 0.5) * 4
      if (isInsideHeart(x, y, z)) break
    }
    // Scale up heart
    heartPositions[i3] = x * 3.5
    heartPositions[i3 + 1] = y * 3.5
    heartPositions[i3 + 2] = z * 3.5
    
    sizes[i] = Math.random()
    speeds[i] = Math.random()
  }

  return { randomPositions, heartPositions, sizes, speeds }
}

export function HeartParticles() {
  const { randomPositions, heartPositions, sizes, speeds } = useMemo(() => generatePositions(), [])
  
  const shaderRef = useRef<THREE.ShaderMaterial>(null)
  const mode = useStore(state => state.mode)
  
  // Current progress value for interpolation
  const progress = useRef(0)

  useFrame((state) => {
    if (!shaderRef.current) return

    // Lerp progress based on mode
    const target = mode === 'FORMED' ? 1 : 0
    progress.current = THREE.MathUtils.lerp(progress.current, target, 0.02)
    
    // Update uniforms
    shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime
    shaderRef.current.uniforms.uProgress.value = progress.current
  })

  // Uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
  }), [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-aRandomPosition"
          count={COUNT}
          array={randomPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aHeartPosition"
          count={COUNT}
          array={heartPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={COUNT}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aSpeed"
          count={COUNT}
          array={speeds}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        transparent={true}
      />
    </points>
  )
}
