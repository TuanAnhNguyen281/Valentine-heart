
import { useRef, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Sparkles, Text, Trail } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { HeartParticles } from './components/HeartParticles'
import { GestureDecorations } from './components/GestureDecorations'
import { Ornaments } from './components/Ornaments'
import { Polaroids } from './components/Polaroids'
import { useStore } from './store'
import * as THREE from 'three'

function CameraController() {
  const { camera } = useThree()
  const handPosition = useStore(state => state.handPosition)
  const isHandDetected = useStore(state => state.isHandDetected)

  useFrame(() => {
    // Responsive Camera Setup
    const isMobile = window.innerWidth < 768
    const baseZ = isMobile ? 28 : 18 // Zoom out more on mobile
    
    if (isHandDetected) {
      // Subtle camera movement based on hand interaction
      const targetX = (handPosition.x - 0.5) * 5
      const targetY = (handPosition.y - 0.5) * 5
      
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.05)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.05)
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, baseZ, 0.05) // Smooth transition to baseZ
      camera.lookAt(0, 0, 0)
    } else {
       // Return to center even if no hand
       camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.05)
       camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, 0.05)
       camera.position.z = THREE.MathUtils.lerp(camera.position.z, baseZ, 0.05)
       camera.lookAt(0, 0, 0)
    }
  })
  return null
}

export function Experience() {
  return (
    <Canvas
      camera={{ position: [0, 0, 18], fov: 45 }}
      gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
      dpr={[1, 2]} // Optimize performance
    >
      <color attach="background" args={['#050001']} />
      
      <CameraController />
      <OrbitControls enableDamping dampingFactor={0.05} />
      
      {/* Atmosphere Sparkles */}
      <Sparkles count={500} scale={15} size={2} speed={0.4} opacity={0.5} color="#ffd700" />
      <Sparkles count={300} scale={10} size={5} speed={0.2} opacity={0.3} color="#ff0000" />
      
      <Environment preset="studio" />
      
      {/* Ambient warmer light */}
      <ambientLight intensity={0.5} color="#b76e79" />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ff0000" />
      
      <HeartParticles />
      <Ornaments />
      <Polaroids />
      
      <Suspense fallback={null}>
        <ValentineText />
      </Suspense>
      <MagicTrail />
      <GestureDecorations />
      
      <EffectComposer>
        <Bloom 
          luminanceThreshold={0.2} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.6}
        />
      </EffectComposer>
    </Canvas>
  )
}

function ValentineText() {
    const mode = useStore(state => state.mode)
    const specialGesture = useStore(state => state.specialGesture)
    
    // Using a standard WOFF v1 font (Roboto) which has better compatibility than WOFF2 in some 3D parsers
    const fontUrl = 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff'

    const text = specialGesture === 'ILoveYou' ? "I LOVE YOU !!!" : "Happy Valentine"
    const color = specialGesture === 'Thumb_Up' ? "#ffd700" : "#ffebec"

    return (
        <group visible={mode === 'FORMED'}>
            <Text
                position={[0, 0, 0]}
                fontSize={1.5}
                color={color}
                font={fontUrl}
                anchorX="center"
                anchorY="middle"
                maxWidth={10}
                textAlign="center"
                outlineWidth={0.02}
                outlineColor="#b76e79"
            >
                {text}
                <meshStandardMaterial emissive="#ff0000" emissiveIntensity={0.5} toneMapped={false} />
            </Text>
        </group>
    )
}

function MagicTrail() {
    const handPosition = useStore(state => state.handPosition)
    const isHandDetected = useStore(state => state.isHandDetected)
    const targetRef = useRef<THREE.Mesh>(null)
    
    useFrame((state) => {
        if (!targetRef.current) return
        
        let tx = 0, ty = 0, tz = 5
        
        if (isHandDetected) {
            // Map hand pos (0..1) to scene coords (-10..10 roughly)
            tx = (handPosition.x - 0.5) * 15
            ty = (1.0 - handPosition.y - 0.5) * 10 
             // Invert Y because screen Y is top-down, 3D Y is bottom-up
        } else {
            // Idle animation for trail
            const t = state.clock.getElapsedTime()
            tx = Math.sin(t) * 5
            ty = Math.cos(t * 1.5) * 3
        }
        
        targetRef.current.position.lerp(new THREE.Vector3(tx, ty, tz), 0.1)
    })

    return (
        <>
            <mesh ref={targetRef} position={[0,0,5]} visible={false}>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial color="white" />
            </mesh>
            <Trail
                width={2}
                length={8}
                color={new THREE.Color("#ffd700")}
                attenuation={(t) => t * t}
                target={targetRef as any} 
            />
        </>
    )
}
