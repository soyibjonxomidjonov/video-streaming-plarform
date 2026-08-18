'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  FastForward,
  Rewind,
  Settings,
  Loader2,
} from 'lucide-react'

interface CustomVideoPlayerProps {
  src: string
  poster?: string
  autoPlay?: boolean
  onError?: () => void
  onTimeUpdate?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void
}

export default function CustomVideoPlayer({
  src,
  poster,
  autoPlay,
  onError,
  onTimeUpdate,
}: CustomVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [isHoveringProgress, setIsHoveringProgress] = useState(false)
  const [hoverTime, setHoverTime] = useState(0)
  const [hoverPosition, setHoverPosition] = useState(0)
  const [showCenterAction, setShowCenterAction] = useState<'play' | 'pause' | 'forward' | 'rewind' | null>(null)

  // -- Initialize & Cleanup --
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => setDuration(video.duration)
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1))
      }
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleWaiting = () => setIsWaiting(true)
    const handlePlaying = () => setIsWaiting(false)

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)

    if (autoPlay) {
      video.play().catch(() => {})
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
    }
  }, [autoPlay])

  // -- Controls Visibility --
  const resetHideControlsTimeout = useCallback(() => {
    setShowControls(true)
    if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current)
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        if (!showSettings && !isHoveringProgress) {
          setShowControls(false)
        }
      }, 2500)
    }
  }, [isPlaying, showSettings, isHoveringProgress])

  useEffect(() => {
    resetHideControlsTimeout()
    return () => {
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current)
    }
  }, [resetHideControlsTimeout])

  // -- Time Formatting --
  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00'
    const hours = Math.floor(time / 3600)
    const mins = Math.floor((time % 3600) / 60)
    const secs = Math.floor(time % 60)
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // -- Playback Controls --
  const triggerCenterAction = (action: 'play' | 'pause' | 'forward' | 'rewind') => {
    setShowCenterAction(action)
    setTimeout(() => setShowCenterAction(null), 500)
  }

  const togglePlay = (fromUI = false) => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      if (fromUI) triggerCenterAction('pause')
    } else {
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Ignore abort errors caused by rapid play/pause
        })
      }
      if (fromUI) triggerCenterAction('play')
    }
  }

  const skip = (seconds: number) => {
    if (!videoRef.current) return
    videoRef.current.currentTime += seconds
    triggerCenterAction(seconds > 0 ? 'forward' : 'rewind')
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    const newMuted = !isMuted
    setIsMuted(newMuted)
    videoRef.current.muted = newMuted
    if (!newMuted && volume === 0) {
      setVolume(0.5)
      videoRef.current.volume = 0.5
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const val = parseFloat(e.target.value)
    setVolume(val)
    videoRef.current.volume = val
    if (val === 0) {
      setIsMuted(true)
      videoRef.current.muted = true
    } else {
      setIsMuted(false)
      videoRef.current.muted = false
    }
  }

  const changePlaybackRate = (rate: number) => {
    if (!videoRef.current) return
    setPlaybackRate(rate)
    videoRef.current.playbackRate = rate
    setShowSettings(false)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // -- Progress Bar Interaction --
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    setCurrentTime(e.currentTarget.currentTime)
    if (onTimeUpdate) onTimeUpdate(e)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    videoRef.current.currentTime = pos * duration
  }

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    let pos = (e.clientX - rect.left) / rect.width
    pos = Math.max(0, Math.min(1, pos))
    setHoverPosition(pos * 100)
    setHoverTime(pos * duration)
  }

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      
      if (e.repeat) return // Prevent rapid firing

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault()
          togglePlay(true)
          break
        case 'ArrowRight':
          e.preventDefault()
          skip(10)
          break
        case 'ArrowLeft':
          e.preventDefault()
          skip(-10)
          break
        case 'KeyF':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, isFullscreen, isMuted, volume])

  const progressPercent = duration ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className={`relative group flex items-center justify-center bg-black overflow-hidden select-none font-sans ${
        isFullscreen ? 'w-full h-full' : 'w-full h-full'
      }`}
      onMouseMove={resetHideControlsTimeout}
      onMouseLeave={() => {
        if (isPlaying && !showSettings) setShowControls(false)
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain cursor-pointer"
        onClick={() => togglePlay(true)}
        onDoubleClick={toggleFullscreen}
        onTimeUpdate={handleTimeUpdate}
        onError={onError}
        playsInline
      />

      {/* Invisible Overlay for Double Tap Seek (Left) */}
      <div 
        className="absolute inset-y-0 left-0 w-[30%] z-10 cursor-pointer" 
        onDoubleClick={(e) => { e.stopPropagation(); skip(-10); }}
        onClick={() => togglePlay(true)}
      />

      {/* Invisible Overlay for Double Tap Seek (Right) */}
      <div 
        className="absolute inset-y-0 right-0 w-[30%] z-10 cursor-pointer" 
        onDoubleClick={(e) => { e.stopPropagation(); skip(10); }}
        onClick={() => togglePlay(true)}
      />

      {/* Loading Spinner */}
      {isWaiting && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/10">
          <Loader2 size={48} className="text-[#00FFA3] animate-spin drop-shadow-2xl" />
        </div>
      )}

      {/* Center Action Animation (Play/Pause/Skip) */}
      {showCenterAction && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/40 backdrop-blur-md rounded-full p-6 text-white animate-center-action scale-150 opacity-0 shadow-2xl">
            {showCenterAction === 'play' && <Play size={48} fill="currentColor" />}
            {showCenterAction === 'pause' && <Pause size={48} fill="currentColor" />}
            {showCenterAction === 'forward' && <FastForward size={48} fill="currentColor" />}
            {showCenterAction === 'rewind' && <Rewind size={48} fill="currentColor" />}
          </div>
        </div>
      )}

      {/* Main Controls Overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col justify-end px-4 pb-4 sm:px-6 sm:pb-6 transition-all duration-300 z-20 ${
          showControls || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 40%, transparent 100%)',
        }}
      >
        {/* Floating Controls Bar */}
        <div className="w-full flex flex-col gap-2">
          
          {/* Progress Bar Area */}
          <div 
            ref={progressRef}
            className="relative w-full h-4 group/progress cursor-pointer flex items-center"
            onMouseEnter={() => setIsHoveringProgress(true)}
            onMouseLeave={() => setIsHoveringProgress(false)}
            onMouseMove={handleProgressMouseMove}
            onClick={handleProgressClick}
          >
            {/* Background track */}
            <div className="absolute w-full h-1.5 bg-white/20 rounded-full transition-all duration-300 group-hover/progress:h-2 group-hover/progress:bg-white/30" />
            
            {/* Buffered track */}
            <div 
              className="absolute h-1.5 bg-white/40 rounded-full transition-all duration-300 group-hover/progress:h-2" 
              style={{ width: `${bufferedPercent}%` }} 
            />

            {/* Hover highlight */}
            {isHoveringProgress && (
              <div 
                className="absolute h-1.5 bg-white/50 rounded-full pointer-events-none transition-all duration-300 group-hover/progress:h-2" 
                style={{ width: `${hoverPosition}%` }} 
              />
            )}

            {/* Progress track */}
            <div 
              className="absolute h-1.5 bg-gradient-to-r from-[#00FFA3] to-[#1AFFA8] rounded-full transition-all duration-300 group-hover/progress:h-2 shadow-[0_0_15px_rgba(0,255,163,0.6)]" 
              style={{ width: `${progressPercent}%` }} 
            >
              {/* Playhead thumb */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full scale-0 group-hover/progress:scale-100 transition-transform duration-300 shadow-[0_0_15px_rgba(0,255,163,0.8)]" />
            </div>

            {/* Hover Time Tooltip */}
            {isHoveringProgress && duration > 0 && (
              <div 
                className="absolute bottom-full mb-4 -translate-x-1/2 px-3 py-1.5 bg-[#0F171A]/90 text-white text-xs font-bold rounded-lg shadow-xl backdrop-blur-md border border-[rgba(0,255,163,0.2)] pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                style={{ left: `${hoverPosition}%` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between gap-4 mt-1">
            <div className="flex items-center gap-1 sm:gap-4">
              <button
                onClick={() => togglePlay(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 hover:text-[#00FFA3] transition-all active:scale-90 focus:outline-none"
              >
                {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
              </button>

              <button
                onClick={() => skip(-10)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 hover:text-[#00FFA3] transition-all active:scale-90 focus:outline-none"
                title="Orqaga 10s"
              >
                <Rewind size={20} />
              </button>
              
              <button
                onClick={() => skip(10)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 hover:text-[#00FFA3] transition-all active:scale-90 focus:outline-none"
                title="Oldinga 10s"
              >
                <FastForward size={20} />
              </button>

              {/* Volume Control */}
              <div className="flex items-center gap-2 group/volume relative ml-2 hidden sm:flex">
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 hover:text-[#00FFA3] transition-all active:scale-90 focus:outline-none"
                >
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 ease-out origin-left">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#00FFA3] hover:accent-[#1AFFA8]"
                  />
                </div>
              </div>

              <div className="text-white/90 text-[13px] font-medium font-mono ml-2 tracking-wide hidden sm:block">
                {formatTime(currentTime)} <span className="text-white/40 mx-1">/</span> {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <div className="text-white/90 text-[13px] font-medium font-mono tracking-wide sm:hidden mr-2">
                {formatTime(currentTime)}
              </div>

              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 focus:outline-none ${
                    showSettings ? 'bg-white/10 text-[#00FFA3]' : 'text-white hover:bg-white/10 hover:text-[#00FFA3]'
                  }`}
                >
                  <Settings size={20} className={showSettings ? 'animate-spin-slow' : 'transition-transform hover:rotate-90 duration-300'} />
                </button>
                
                {showSettings && (
                  <div className="absolute bottom-full right-0 mb-4 bg-[#0F171A]/95 border border-[rgba(0,255,163,0.15)] rounded-2xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl w-36 flex flex-col z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="px-3 pb-2 pt-1 mb-1 border-b border-white/10 text-xs text-white/50 font-bold uppercase tracking-wider">
                      Tezlik
                    </div>
                    {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        className={`text-left px-3 py-2 text-sm rounded-xl transition-all flex items-center justify-between group/rate ${
                          playbackRate === rate ? 'bg-[rgba(0,255,163,0.1)] text-[#00FFA3] font-bold' : 'text-white hover:bg-white/5'
                        }`}
                      >
                        {rate === 1 ? 'Normal' : `${rate}x`}
                        {playbackRate === rate && <div className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] shadow-[0_0_8px_#00FFA3]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-white/10 hover:text-[#00FFA3] transition-all active:scale-90 focus:outline-none"
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
