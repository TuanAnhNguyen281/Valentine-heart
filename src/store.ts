import { create } from 'zustand'
import * as THREE from 'three'

type AppState = {
  mode: 'CHAOS' | 'FORMED'
  handPosition: THREE.Vector3
  isHandDetected: boolean
  isShaking: boolean
  focusedPolaroidIndex: number | null
  
  setMode: (mode: 'CHAOS' | 'FORMED') => void
  setHandPosition: (pos: THREE.Vector3) => void
  setHandDetected: (detected: boolean) => void
  setIsShaking: (shaking: boolean) => void
  setFocusedPolaroidIndex: (index: number | null) => void
}

export const useStore = create<AppState>((set) => ({
  mode: 'CHAOS',
  handPosition: new THREE.Vector3(0, 0, 0),
  isHandDetected: false,
  isShaking: false,
  focusedPolaroidIndex: null,

  setMode: (mode) => set({ mode }),
  setHandPosition: (pos) => set({ handPosition: pos }),
  setHandDetected: (detected) => set({ isHandDetected: detected }),
  setIsShaking: (shaking) => set({ isShaking: shaking }),
  setFocusedPolaroidIndex: (index) => set({ focusedPolaroidIndex: index }),
}))
