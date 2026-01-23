import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Disc } from 'lucide-react'

export function MusicControls() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio instance
    const audio = new Audio('/music.mp3')
    audio.loop = true
    audio.volume = volume
    // HTML5 Audio is enough, no AudioContext needed
    audioRef.current = audio

    // Cleanup
    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const togglePlay = async () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
          await audioRef.current.play()
          setIsPlaying(true)
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
             await audioRef.current.play()
             setIsPlaying(true)
        } catch {
             console.log("Autoplay blocked. Waiting for interaction.")
             const unlock = async () => {
                 if (audioRef.current && audioRef.current.paused) {
                    try {
                        await audioRef.current.play()
                        setIsPlaying(true)
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
             <div className="absolute inset-1 rounded-full border border-zinc-800/80"></div>
             <div className="absolute inset-2 rounded-full border border-zinc-800/80"></div>
             <div className="absolute inset-3 rounded-full border border-zinc-800/80"></div>
             
             <div className="w-6 h-6 rounded-full bg-rose-500/80 border border-rose-200 flex items-center justify-center z-10">
                 <div className="w-1.5 h-1.5 rounded-full bg-black/50"></div>
             </div>
             
             <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
        </div>
        
        {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-[1px] transition-opacity">
                <Disc size={24} className="text-rose-200 animate-pulse" />
            </div>
        )}
      </div>

      {/* Volume Control Group */}
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
