import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Disc } from 'lucide-react'
import { useStore } from '../store'

export function MusicControls() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.5)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const rafRef = useRef<number>(0)
  
  // Direct access to store setter to avoid re-renders in this component
  const setAudioLevel = useStore(state => state.setAudioLevel)

  useEffect(() => {
    // Create audio instance
    const audio = new Audio('/music.mp3')
    audio.loop = true
    audio.volume = volume
    // Important for audio context to work with local file/same domain
    audio.crossOrigin = "anonymous" 
    audioRef.current = audio

    // Cleanup
    return () => {
      audio.pause()
      audioRef.current = null
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const setupAudioContext = () => {
    if (audioContextRef.current) return; // Already setup

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256; // Smaller FFT size for performance, sufficient for beat
    analyserRef.current = analyser;

    if (audioRef.current) {
        const source = ctx.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        sourceRef.current = source;
    }
  }

  const updateAudioLevel = () => {
    if (!analyserRef.current || !isPlaying) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Calculate average volume (simple beat detection)
    let sum = 0;
    // Low frequency range usually 0-10 roughly with fft 256
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    
    // Normalize to 0-1
    const level = average / 128.0; 
    
    // Smooth/Dampen could be done here or in receiver 
    // We send raw normalized level
    setAudioLevel(level)

    rafRef.current = requestAnimationFrame(updateAudioLevel)
  }

  const togglePlay = async () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      cancelAnimationFrame(rafRef.current)
      setAudioLevel(0)
    } else {
      try {
          if (!audioContextRef.current) {
              setupAudioContext()
          }
           if (audioContextRef.current?.state === 'suspended') {
              await audioContextRef.current.resume();
          }

          await audioRef.current.play()
          setIsPlaying(true)
          
          // Start analysis loop
          updateAudioLevel()

      } catch (e) {
          console.error("Audio playback failed:", e)
          alert("Vui lòng thêm file 'music.mp3' vào thư mục 'public' để phát nhạc!")
      }
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    
    const newMutedState = !isMuted
    audioRef.current.muted = newMutedState
    setIsMuted(newMutedState)
  }

  // Autoplay attempt
  useEffect(() => {
    const tryPlay = async () => {
        if (!audioRef.current) return
        try {
             // Try playing immediately (might be blocked)
             await audioRef.current.play()
             setIsPlaying(true)
             updateAudioLevel()
        } catch {
             console.log("Autoplay blocked. Waiting for interaction.")
             // If blocked, add one-time listener to document
             const unlock = async () => {
                 if (audioRef.current && audioRef.current.paused) {
                    try {
                        if (!audioContextRef.current) setupAudioContext()
                        if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume()
                        
                        await audioRef.current.play()
                        setIsPlaying(true)
                        updateAudioLevel()
                    } catch (e) { console.error(e) }
                 }
                 document.removeEventListener('click', unlock)
                 document.removeEventListener('keydown', unlock)
                 document.removeEventListener('touchstart', unlock)
             }
             document.addEventListener('click', unlock)
             document.addEventListener('keydown', unlock)
             document.addEventListener('touchstart', unlock)
        }
    }
    
    // Slight delay to allow DOM render? Not strictly needed but safe
    setTimeout(tryPlay, 1000)
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-3">
      {/* Vinyl Record Player UI */}
      <div className="relative group cursor-pointer" onClick={togglePlay}>
        {/* The Disc */}
        <div className={`
             w-16 h-16 rounded-full bg-black border-2 border-rose-gold/50 
             shadow-[0_0_20px_rgba(183,110,121,0.5)]
             flex items-center justify-center
             transition-transform duration-[4s] ease-linear
             ${isPlaying ? 'animate-spin-slow' : ''}
        `}>
             {/* Disc grooves */}
             <div className="absolute inset-1 rounded-full border border-zinc-800/80"></div>
             <div className="absolute inset-2 rounded-full border border-zinc-800/80"></div>
             <div className="absolute inset-3 rounded-full border border-zinc-800/80"></div>
             
             {/* Center Label */}
             <div className="w-6 h-6 rounded-full bg-rose-500/80 border border-rose-200 flex items-center justify-center z-10">
                 <div className="w-1.5 h-1.5 rounded-full bg-black/50"></div>
             </div>
             
             {/* Reflection highlight */}
             <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
        </div>
        
        {/* Play Status Indicator (visible on hover or when paused) */}
        {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-[1px] transition-opacity">
                <Disc size={24} className="text-rose-200 animate-pulse" />
            </div>
        )}
      </div>

      {/* Volume Control Group (Slide out on hover of container? Or always visible?) */}
      {/* Let's keep it visible but styled nicer */}
      <div className={`
        flex items-center gap-2 bg-rose-950/40 backdrop-blur-md rounded-full px-3 py-1.5
        border border-rose-gold/20 transition-all duration-300
        ${isPlaying ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-2 hovered:opacity-100'}
      `}>
        <button 
          onClick={toggleMute}
          className="text-rose-200 hover:text-rose-100 transition-colors"
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={(e) => {
            setVolume(parseFloat(e.target.value))
            if (isMuted && parseFloat(e.target.value) > 0) setIsMuted(false)
          }}
          className="w-16 accent-rose-500 h-1 bg-rose-200/20 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </div>
  )
}
