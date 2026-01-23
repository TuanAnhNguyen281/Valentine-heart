import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

// Reusable particle system for different gestures
function ParticleBurst({ count = 20, color = "#ff0000", speed = 1, life = 1, shape = "circle" }) {
    const handPosition = useStore(state => state.handPosition)
    const isHandDetected = useStore(state => state.isHandDetected)
    
    // Manage instances manually for performance
    const particles = useMemo(() => {
        return new Array(count).fill(0).map(() => ({
            position: new THREE.Vector3(),
            velocity: new THREE.Vector3(),
            life: 0,
            active: false
        }))
    }, [count])
    
    const dummy = useMemo(() => new THREE.Object3D(), [])
    const instancesRef = useRef<THREE.InstancedMesh>(null)
    
    useFrame((_state, delta) => {
        if (!instancesRef.current) return
        
        // Spawn logic
        if (isHandDetected) {
             // Map hand pos
            const tx = (handPosition.x - 0.5) * 15
            const ty = (1.0 - handPosition.y - 0.5) * 10 
            
            // Randomly spawn a particle
            if (Math.random() > 0.8) {
                const p = particles.find(p => !p.active)
                if (p) {
                    p.active = true
                    p.life = 1.0
                    p.position.set(tx, ty, 5) // Start at hand z=5
                    
                    // Explosion velocity
                    p.velocity.set(
                        (Math.random() - 0.5) * speed,
                        (Math.random() - 0.5) * speed,
                        (Math.random() - 0.5) * speed
                    )
                }
            }
        }
        
        // Update particles
        particles.forEach((p, i) => {
             if (p.active) {
                 p.life -= delta / life
                 p.position.add(p.velocity)
                 p.velocity.y += 0.01 // Gravity/Float up? Let's float up
                 
                 if (p.life <= 0) p.active = false
                 
                 dummy.position.copy(p.position)
                 const scale = p.life * (Math.random() * 0.5 + 0.5)
                 dummy.scale.setScalar(scale)
                 dummy.updateMatrix()
                 instancesRef.current!.setMatrixAt(i, dummy.matrix)
             } else {
                 dummy.position.set(0,0,0)
                 dummy.scale.setScalar(0)
                 dummy.updateMatrix()
                 instancesRef.current!.setMatrixAt(i, dummy.matrix)
             }
        })
        instancesRef.current.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={instancesRef} args={[undefined, undefined, count]}>
            {shape === 'heart' ? (
                <planeGeometry args={[0.5, 0.5]} /> // Placeholder for heart shape, use texture or shape
            ) : (
                <dodecahedronGeometry args={[0.2, 0]} />
            )}
             <meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
        </instancedMesh>
    )
}

export function GestureDecorations() {
    const mode = useStore(state => state.mode)
    const specialGesture = useStore(state => state.specialGesture)
    
    return (
        <>
            {/* Love Mode Decorations: Floating Hearts from hand */}
            {mode === 'FORMED' && specialGesture !== 'ILoveYou' && (
                <ParticleBurst count={50} color="#ff0055" speed={5} shape="heart" />
            )}
            
            {/* Chaos Mode Decorations: Wild Sparkles */}
            {mode === 'CHAOS' && (
                <ParticleBurst count={50} color="#ffd700" speed={8} shape="star" />
            )}

            {/* I Love You Gesture: Massive Explosion of Hearts */}
            {specialGesture === 'ILoveYou' && (
                <ParticleBurst count={200} color="#ff3366" speed={15} shape="heart" life={2.0} />
            )}

            {/* Thumb Up Gesture: Golden Rain */}
            {specialGesture === 'Thumb_Up' && (
                <ParticleBurst count={100} color="#ffdd00" speed={10} shape="circle" life={1.5} />
            )}
        </>
    )
}
