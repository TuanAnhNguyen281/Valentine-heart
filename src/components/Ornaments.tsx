import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

// Removed COUNT as we calculate density dynamically
export function Ornaments() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const mode = useStore(state => state.mode)
  const isShaking = useStore(state => state.isShaking)
  
  // Create dummy object for positioning
  const dummy = useMemo(() => new THREE.Object3D(), [])
  
  const particles = useMemo(() => {
    const temp = []
    const rows = 40
    const cols = 40
    
    // Parametric Heart Surface Generation for Ordered Look
    for (let u = 0; u < rows; u++) {
        for (let v = 0; v < cols; v++) {
            // Normalize u, v to 0..PI/2PI
            // const theta = (u / rows) * Math.PI // Unused
            // const phi = (v / cols) * Math.PI * 2 // Unused
            
            // Parametric Heart 3D:
            // x = 16 sin^3(u) sin^2(v)
            // y = (13 cos(u) - 5 cos(2u) - 2 cos(3u) - cos(4u)) * sin^2(v)
            // z = cos(v) * 4 ... roughly
            
            const t = (u / rows) * Math.PI * 2 
            const p = (v / cols) * Math.PI
            
            const heartX = 16 * Math.pow(Math.sin(t), 3) * Math.sin(p)
            const heartY = (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * Math.sin(p)
            const heartZ = 6 * Math.cos(p) // Thicker heart
            
            // Normalize size
            const scale = 0.25
            
            temp.push({ 
                t: Math.random() * 100, 
                factor: 20 + Math.random() * 100, 
                speed: 0.01 + Math.random() / 200, 
                xFactor: -50 + Math.random() * 100, 
                yFactor: -50 + Math.random() * 100, 
                zFactor: -50 + Math.random() * 100,
                cx: 0, cy: 0, cz: 0,
                hx: heartX * scale, 
                hy: heartY * scale, 
                hz: heartZ * scale 
            })
        }
    }
    return temp
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    // Auto Rotation in Formed Mode
    if (mode === 'FORMED' && !isShaking) {
         meshRef.current.rotation.y += delta * 0.5 // Slow spin
    } else if (isShaking) {
         // Turbo spin handled in particle logic or here?
         // Let's rely on the particle chaos for shaking visual
         meshRef.current.rotation.y += delta * 5.0
    } else {
        // Reset rotation slowly?
        meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.05)
    }

    // Animate each instance
    particles.forEach((particle, i) => {
        // Add time
        particle.t += particle.speed
        
        let targetX, targetY, targetZ
        const time = state.clock.getElapsedTime()
        
        if (mode === 'FORMED') {
             targetX = particle.hx
             targetY = particle.hy
             targetZ = particle.hz
        } else {
             // Chaos state
             targetX = Math.sin(particle.t) * particle.factor + particle.xFactor
             targetY = Math.cos(particle.t) * particle.factor + particle.yFactor
             targetZ = Math.sin(particle.t) * particle.factor + particle.zFactor
             
             if (isShaking) {
                 const rotSpeed = 12.0
                 const tx = targetX, tz = targetZ
                 targetX = tx * Math.cos(time * rotSpeed) - tz * Math.sin(time * rotSpeed)
                 targetZ = tx * Math.sin(time * rotSpeed) + tz * Math.cos(time * rotSpeed)
             }
        }

        // Interpolate current position to target
        const currentForce = mode === 'CHAOS' ? 0.02 : 0.05
        
        particle.cx = THREE.MathUtils.lerp(particle.cx, targetX, currentForce)
        particle.cy = THREE.MathUtils.lerp(particle.cy, targetY, currentForce)
        particle.cz = THREE.MathUtils.lerp(particle.cz, targetZ, currentForce)

        dummy.position.set(particle.cx, particle.cy, particle.cz)
        dummy.scale.setScalar(mode === 'FORMED' ? 1.0 : (1 + Math.sin(time + i) * 0.3)) // Uniform scale
        dummy.updateMatrix()
        meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  // Micro Beads Material
  const material = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: '#ff0f3b', // Deep Ruby
    roughness: 0.1,
    metalness: 0.4,
    transmission: 0.2,
    thickness: 0.5,
    emissive: '#590012',
    emissiveIntensity: 0.5
  }), [])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <primitive object={material} attach="material" />
    </instancedMesh>
  )
}
