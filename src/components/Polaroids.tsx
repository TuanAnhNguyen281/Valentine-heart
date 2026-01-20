import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

const COUNT = 20

export function Polaroids() {
  const groupRef = useRef<THREE.Group>(null)
  const mode = useStore(state => state.mode)
  const focusedIndex = useStore(state => state.focusedPolaroidIndex)
  
  const photos = useMemo(() => {
    return new Array(COUNT).fill(0).map(() => ({
      // ... same init
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      ),
      rotation: new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        0
      ),
      speed: 0.2 + Math.random() * 0.5
    }))
  }, [])
  
  useFrame((state, delta) => {
    if (!groupRef.current) return
    const time = state.clock.getElapsedTime()
    const isShaking = useStore.getState().isShaking
    
    // Auto Rotation in Formed Mode (sync with Ornaments)
    if (mode === 'FORMED' && !isShaking && focusedIndex === null) {
         groupRef.current.rotation.y += delta * 0.5
    } else {
        // Reset or free spin? Let's just stop spinning when focused or chaos
        if (mode === 'CHAOS') {
             groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0, 0.05)
        }
    }
    
    groupRef.current.children.forEach((child, i) => {
       const photo = photos[i]
       
       if (focusedIndex === i) {
           // DETAIL VIEW: Zoom to camera front
           const targetPos = state.camera.position.clone()
           targetPos.z -= 5 // In front of camera
           targetPos.y -= 1
           
           child.position.lerp(targetPos, 0.1)
           child.lookAt(state.camera.position)
           child.scale.setScalar(THREE.MathUtils.lerp(child.scale.x, 2, 0.1))
           return
       } else {
           child.scale.setScalar(THREE.MathUtils.lerp(child.scale.x, 1, 0.1))
       }
       
       // Floating animation
       child.position.y += Math.sin(time * photo.speed + i) * 0.01
       
       if (mode === 'FORMED') {
           // Move closer to center but keep some distance
           const angle = (i / COUNT) * Math.PI * 2
           const radius = 8 // Increased radius to stand out from heart
           const targetX = Math.cos(angle) * radius
           const targetZ = Math.sin(angle) * radius
           
           child.position.x = THREE.MathUtils.lerp(child.position.x, targetX, 0.02)
           child.position.z = THREE.MathUtils.lerp(child.position.z, targetZ, 0.02)
           child.position.y = THREE.MathUtils.lerp(child.position.y, Math.sin(i) * 5, 0.02)
           
           // FACE OUTWARDS: Look at center then rotate 180 deg
           child.lookAt(0,0,0)
           child.rotateY(Math.PI)
       } else {
           // Scatter
           child.position.lerp(photo.position, 0.01)
           child.rotation.x = THREE.MathUtils.lerp(child.rotation.x, photo.rotation.x, 0.02)
           child.rotation.y = THREE.MathUtils.lerp(child.rotation.y, photo.rotation.y, 0.02)
       }
    })
  })

  // Placeholder texture logic
  const textureLoader = useMemo(() => new THREE.TextureLoader(), [])
  
  // Try to load up to 20 photos
  // Note: Client side can't check file existence easily without a list.
  // We assume files are named photo1.jpg ... photo20.jpg in public/photos/
  const materials = useMemo(() => {
     return new Array(COUNT).fill(0).map((_, i) => {
         // Create texture
         // Use a placeholder if fails? THREE.TextureLoader handles it gracefully usually
         // Let's assume user uploads photo1.jpg to photoN.jpg
         // But for now, let's just try loading index + 1
         const texture = textureLoader.load(
             `photos/photo${i + 1}.jpg`, 
             (t) => {
                 t.colorSpace = THREE.SRGBColorSpace
             }, // onLoad
             undefined, // onProgress
             () => {
                 // Fallback to a placeholder color/texture on error
                 console.warn(`Missing photo: photos/photo${i+1}.jpg`)
             }
         )
         
         return texture
     })
  }, [])
  
  return (
    <group ref={groupRef}>
      {photos.map((_, i) => (
        <mesh key={i} position={[0,0,0]}>
          <boxGeometry args={[1.5, 1.8, 0.05]} />
          <meshStandardMaterial 
            color="#fff" 
            roughness={0.8}
            metalness={0.1}
          />
          {/* Inner image area */}
          <mesh position={[0, 0.1, 0.03]}>
             <planeGeometry args={[1.3, 1.3]} />
             <meshBasicMaterial map={materials[i]} color={materials[i].image ? 'white' : '#333'} />
             {/* If texture is missing, it will show dark grey */}
          </mesh>
        </mesh>
      ))}
    </group>
  )
}
