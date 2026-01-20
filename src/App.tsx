import { Suspense } from 'react'
import { Experience } from './Experience'
import { HandTracker } from './components/HandTracker'
import { useStore } from './store'

function UI() {
  const setMode = useStore(state => state.setMode)

  return (
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between p-8">
        <header className="text-center">
            <h1 className="text-4xl md:text-6xl font-serif text-rose-100 tracking-widest drop-shadow-[0_0_15px_rgba(183,110,121,0.8)]">
              HAPPY VALENTINE
            </h1>
            <p className="text-rose-200/80 mt-2 font-light tracking-wider text-sm md:text-base">
              HƯỚNG DẪN: Xòe tay (Hỗn loạn) • Nắm tay (Tình yêu) • Victory (Xem chi tiết) • Lắc tay (Xoay & Đổi ảnh)
            </p>
        </header>
        
        <div className="pointer-events-auto flex gap-6 justify-center items-end pb-10">
            <button 
              onClick={() => setMode('CHAOS')}
              className="px-8 py-3 border border-rose-gold/50 text-rose-gold rounded-full hover:bg-rose-gold/10 transition-all tracking-widest text-sm backdrop-blur-sm"
            >
              HỖN LOẠN
            </button>
            <button 
              onClick={() => setMode('FORMED')}
              className="px-8 py-3 bg-rose-gold/20 border border-rose-gold text-rose-100 rounded-full hover:bg-rose-gold/40 transition-all tracking-widest text-sm backdrop-blur-sm shadow-[0_0_20px_rgba(183,110,121,0.3)]"
            >
              TÌNH YÊU
            </button>
        </div>
      </div>
  )
}

function Loader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black text-rose-gold animate-pulse tracking-widest">
      LOADING LUXURY...
    </div>
  )
}

function App() {
  return (
    <div className="relative w-full h-full bg-black">
      <Suspense fallback={<Loader />}>
        <Experience />
        <HandTracker />
      </Suspense>
      <UI />
    </div>
  )
}

export default App
