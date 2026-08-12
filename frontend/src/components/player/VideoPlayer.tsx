'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Maximize, Minimize, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './VideoPlayer.module.css';
import { usePlayerStore } from '@/store/player.store';
import { useAuthStore } from '@/store/auth.store';
import { watchProgressService } from '@/services/interactions.service';

interface VideoPlayerProps {
  src: string;
  title: string;
  poster?: string;
  onProgress?: (time: number) => void;
  autoPlay?: boolean;
  contentId?: number;
  contentType?: 'movie' | 'episode';
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VideoPlayer({ src, title, poster, onProgress, autoPlay = false, contentId, contentType }: VideoPlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const progressIdRef = useRef<number | null>(null);
  const initialSeekDoneRef = useRef<boolean>(false);

  const playerStore = usePlayerStore();
  const { isAuthenticated, user } = useAuthStore();

  // Reset controls hide timer
  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (playerStore.isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playerStore.isPlaying]);

  // Sync Video Events -> Store
  const onPlay = () => { playerStore.setIsPlaying(true); resetControlsTimeout(); };
  const onPause = () => { playerStore.setIsPlaying(false); setShowControls(true); };
  const onVolumeChange = () => {
    if (!videoRef.current) return;
    playerStore.setVolume(videoRef.current.volume);
    playerStore.setIsMuted(videoRef.current.muted);
  };
  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    playerStore.setCurrentTime(currentTime);
    if (onProgress) onProgress(currentTime);

    // Save progress every 10 seconds
    if (isAuthenticated && user && contentId && contentType) {
       const now = Date.now();
       if (now - lastSaveTimeRef.current > 10000) {
          lastSaveTimeRef.current = now;
          const pos = Math.floor(currentTime);
          
          if (progressIdRef.current) {
             if (contentType === 'movie') watchProgressService.updateMovieProgress(progressIdRef.current, pos).catch(()=>{});
             else watchProgressService.updateEpisodeProgress(progressIdRef.current, pos).catch(()=>{});
          } else {
             if (contentType === 'movie') {
                watchProgressService.saveMovieProgress(contentId, (user as any).id, pos).then(res => progressIdRef.current = res.id).catch(()=>{});
             } else {
                watchProgressService.saveEpisodeProgress(contentId, (user as any).id, pos).then(res => progressIdRef.current = res.id).catch(()=>{});
             }
          }
       }
    }
  };
  const onDurationChange = () => {
    if (videoRef.current) playerStore.setDuration(videoRef.current.duration);
  };

  // Fetch initial progress
  useEffect(() => {
     if (!isAuthenticated || !contentId || !contentType || initialSeekDoneRef.current || !videoRef.current) return;
     const fetchProgress = async () => {
        try {
           let res;
           if (contentType === 'movie') res = await watchProgressService.getMovieProgress({ movie: contentId });
           else res = await watchProgressService.getEpisodeProgress({ episode: contentId });

           if (res.results.length > 0) {
              progressIdRef.current = res.results[0].id;
              if (res.results[0].position_seconds > 0 && videoRef.current) {
                 videoRef.current.currentTime = res.results[0].position_seconds;
              }
           }
        } catch(e) {}
        initialSeekDoneRef.current = true;
     };
     fetchProgress();
  }, [isAuthenticated, contentId, contentType]);

  // Sync Store (Voice Commands) -> Video Element
  useEffect(() => {
    const cmd = playerStore.lastCommand;
    if (!cmd || !videoRef.current || !containerRef.current) return;
    
    // Ignore old commands
    if (Date.now() - cmd.timestamp > 1000) return;

    const v = videoRef.current;
    switch (cmd.tool) {
      case 'play_video': v.play(); break;
      case 'pause_video': v.pause(); break;
      case 'set_volume': v.volume = Math.max(0, Math.min(1, cmd.params?.volume ?? 0.5)); break;
      case 'mute': v.muted = true; break;
      case 'unmute': v.muted = false; break;
      case 'seek_to_time': v.currentTime = cmd.params?.seconds ?? 0; break;
      case 'toggle_fullscreen':
        if (document.fullscreenElement) document.exitFullscreen();
        else containerRef.current.requestFullscreen();
        break;
      // Many other commands are handled by AppShell directly accessing the DOM or router,
      // but if we need specific component-level reactions, we do them here.
    }
  }, [playerStore.lastCommand]);

  // Click Handlers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play();
    else videoRef.current.pause();
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const val = parseFloat(e.target.value);
    videoRef.current.volume = val;
    videoRef.current.muted = val === 0;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      playerStore.setIsFullscreen(false);
    } else {
      containerRef.current.requestFullscreen();
      playerStore.setIsFullscreen(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      playerStore.setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [playerStore]);

  return (
    <div 
      className={styles.container} 
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => playerStore.isPlaying && setShowControls(false)}
      data-role="player-container"
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={styles.video}
        autoPlay={autoPlay}
        onClick={togglePlay}
        onPlay={onPlay}
        onPause={onPause}
        onVolumeChange={onVolumeChange}
        onTimeUpdate={onTimeUpdate}
        onDurationChange={onDurationChange}
        data-role="main-player"
        crossOrigin="anonymous"
      />

      <div className={`${styles.overlay} ${showControls ? styles.overlayVisible : ''}`}>
        
        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => router.back()} aria-label="Orqaga">
            <ArrowLeft size={24} />
          </button>
          <h2 className={styles.title}>{title}</h2>
          <div style={{ width: 40 }} /> {/* Spacer */}
        </div>

        <button className={styles.centerControl} onClick={togglePlay} aria-label={playerStore.isPlaying ? "Pause" : "Play"}>
          {playerStore.isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" style={{ marginLeft: 4 }} />}
        </button>

        <div className={styles.bottomBar}>
          
          <div className={styles.progressContainer} ref={progressRef} onClick={handleProgressClick}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${playerStore.duration ? (playerStore.currentTime / playerStore.duration) * 100 : 0}%` }} 
            />
          </div>

          <div className={styles.controlsRow}>
            
            <div className={styles.controlsLeft}>
              <button className={styles.controlBtn} onClick={togglePlay}>
                {playerStore.isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
              
              <div className={styles.volumeContainer}>
                <button className={styles.controlBtn} onClick={toggleMute}>
                  {playerStore.isMuted || playerStore.volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05"
                  value={playerStore.isMuted ? 0 : playerStore.volume}
                  onChange={handleVolumeChange}
                  className={styles.volumeSlider}
                />
              </div>

              <span className={styles.time}>
                {formatTime(playerStore.currentTime)} / {formatTime(playerStore.duration)}
              </span>
            </div>

            <div className={styles.controlsRight}>
              <button className={styles.controlBtn} onClick={toggleFullscreen}>
                {playerStore.isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
