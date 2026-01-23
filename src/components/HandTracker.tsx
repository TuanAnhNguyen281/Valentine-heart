import { useEffect, useRef, useState } from 'react'
import { GestureRecognizer, FilesetResolver } from '@mediapipe/tasks-vision'
import { useStore } from '../store'
import * as THREE from 'three'

export function HandTracker() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const setMode = useStore(state => state.setMode)
  const setHandPosition = useStore(state => state.setHandPosition)
  const setHandDetected = useStore(state => state.setHandDetected)
  const setIsShaking = useStore(state => state.setIsShaking)
  const focusedPolaroidIndex = useStore(state => state.focusedPolaroidIndex)
  const setFocusedPolaroidIndex = useStore(state => state.setFocusedPolaroidIndex)
  const [loaded, setLoaded] = useState(false)
  
  const historyRef = useRef<number[]>([])
  
  // Navigation debounce
  const lastNavTime = useRef(0)

  useEffect(() => {
    let gestureRecognizer: GestureRecognizer | null = null
    let animationFrameId: number
    let running = true

    const startWebcam = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        )
        gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        })
        setLoaded(true)

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
           const stream = await navigator.mediaDevices.getUserMedia({ video: true })
           if (videoRef.current) {
             videoRef.current.srcObject = stream
             videoRef.current.play()
             videoRef.current.addEventListener('loadeddata', predictWebcam)
           }
        }
      } catch (error) {
        console.error("Error initializing hand tracking:", error)
      }
    }

    const predictWebcam = async () => {
      if (!running || !videoRef.current || !gestureRecognizer) return

      let nowInMs = Date.now()
      const results = gestureRecognizer.recognizeForVideo(videoRef.current, nowInMs)

      if (results.gestures.length > 0) {
        setHandDetected(true)
        const categoryName = results.gestures[0][0].categoryName
        const score = results.gestures[0][0].score
        
        // Map gestures
        if (categoryName === "Open_Palm") {
          // If we are in Detail View, Open Palm acts as navigation controller (Swipe/Shake)
          if (focusedPolaroidIndex !== null) {
              setMode('FORMED') // Keep formed
              
              if (results.landmarks.length > 0) {
                  const x = results.landmarks[0][0].x
                  const history = historyRef.current
                  history.push(x)
                  if (history.length > 15) history.shift()
                  
                  // Simple Swipe/Shake Detection for Navigation
                  if (history.length > 10 && Date.now() - lastNavTime.current > 1000) {
                      const start = history[0]
                      const end = history[history.length-1]
                      const diff = end - start
                      
                      if (diff > 0.2) { // Moved Right -> Prev
                          setFocusedPolaroidIndex((focusedPolaroidIndex - 1 + 20) % 20)
                          lastNavTime.current = Date.now()
                      } else if (diff < -0.2) { // Moved Left -> Next
                          setFocusedPolaroidIndex((focusedPolaroidIndex + 1) % 20)
                          lastNavTime.current = Date.now()
                      }
                  }
              }
          } else {
              setMode('CHAOS')
              setFocusedPolaroidIndex(null)
              
              // Standard Chaos Shake
               if (results.landmarks.length > 0) {
                  const x = results.landmarks[0][0].x
                  const history = historyRef.current
                  history.push(x)
                  if (history.length > 20) history.shift()
                  
                  // Count direction changes
                  let directionChanges = 0
                  if (history.length > 10) {
                      for(let i=1; i<history.length-1; i++) {
                          if ((history[i] > history[i-1] && history[i] > history[i+1]) || 
                              (history[i] < history[i-1] && history[i] < history[i+1])) {
                              directionChanges++
                          }
                      }
                  }
                  setIsShaking(directionChanges > 3)
              }
          }

        } else if (categoryName === "Closed_Fist") {
          setMode('FORMED')
          setIsShaking(false)
          setFocusedPolaroidIndex(null)
          useStore.getState().setSpecialGesture(null)
          
        } else if (categoryName === "ILoveYou") {
            setMode('FORMED') // Keep formed
            useStore.getState().setSpecialGesture('ILoveYou')
            setIsShaking(false)

        } else if (categoryName === "Thumb_Up") {
            // Keep current mode but trigger effect
            useStore.getState().setSpecialGesture('Thumb_Up')
            setIsShaking(false)
            
        } else if ((categoryName === "Victory" || categoryName === "Pointing_Up") && score > 0.5) {
           // DETAIL VIEW
           // Always pick a new random one when gesture is detected
           useStore.getState().setSpecialGesture(null)
           if (!focusedPolaroidIndex || Math.random() > 0.9) { 
                setFocusedPolaroidIndex(Math.floor(Math.random() * 20)) 
           }
           setIsShaking(false)
        } else {
            setIsShaking(false)
            useStore.getState().setSpecialGesture(null)
        }
        
        // Map position (Palm center)
        if (results.landmarks.length > 0) {
            const landmarks = results.landmarks[0]
            const x = 1 - landmarks[9].x // Mirror
            const y = 1 - landmarks[9].y // Invert Y
            setHandPosition(new THREE.Vector3(x, y, 0))
        }

      } else {
        setHandDetected(false)
        setIsShaking(false)
      }

      animationFrameId = requestAnimationFrame(predictWebcam)
    }

    startWebcam()

    return () => {
      running = false
      if (videoRef.current && videoRef.current.srcObject) {
         (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop())
      }
      cancelAnimationFrame(animationFrameId)
    }
  }, [setMode, setHandPosition, setHandDetected])

  return (
    <div className="fixed bottom-4 right-4 z-50 opacity-50 hover:opacity-100 transition-opacity">
        {/* Video feed for user feedback */}
        <video 
            ref={videoRef} 
            className="w-32 h-24 rounded-lg border border-rose-gold/50 object-cover transform scale-x-[-1]" 
            autoPlay 
            playsInline 
            muted 
        />
        {!loaded && <div className="text-xs text-rose-gold text-center mt-1">Đang khởi động Camera...</div>}
    </div>
  )
}
