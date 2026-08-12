'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar/Navbar';
import { BottomNav } from '@/components/layout/BottomNav/BottomNav';
import { VoiceOverlay } from '@/components/voice/VoiceOverlay/VoiceOverlay';
import { VoiceDispatcher } from '@/voice/dispatcher';
import { usePlayerStore } from '@/store/player.store';
import { useAuthStore } from '@/store/auth.store';
import { AuthGuard } from '@/components/auth/AuthGuard';
import type { VoiceState, FrontendState } from '@/types';
import { ttsService } from '@/voice/tts';
import { usePathname, useRouter } from 'next/navigation';
import { handleApiAction } from '@/voice/apiActionHandler';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceCaption, setVoiceCaption] = useState('');
  const dispatcherRef = useRef<VoiceDispatcher | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const playerStore = usePlayerStore();
  const { isAuthenticated } = useAuthStore();

  const isAdmin = pathname.startsWith('/admin');

  const getFrontendState = useCallback((): FrontendState => {
    let content_type: 'movie' | 'series' | 'episode' | null = null;
    let content_id: number | null = null;

    const movieMatch = pathname.match(/\/movies\/(\d+)/);
    const seriesMatch = pathname.match(/\/series\/(\d+)/);
    const episodeMatch = pathname.match(/\/episode\/(\d+)/);

    if (movieMatch) {
      content_type = 'movie';
      content_id = parseInt(movieMatch[1]);
    } else if (episodeMatch) {
      content_type = 'episode';
      content_id = parseInt(episodeMatch[1]);
    } else if (seriesMatch) {
      content_type = 'series';
      content_id = parseInt(seriesMatch[1]);
    }

    return {
      content_type,
      content_id,
      content_title: null,
      is_playing: playerStore.isPlaying,
      current_time_seconds: playerStore.currentTime,
    };
  }, [pathname, playerStore.isPlaying, playerStore.currentTime]);

  const executePlaybackAction = useCallback(async (tool: string, params: Record<string, unknown>): Promise<boolean> => {
    const video = document.querySelector('[data-role="main-player"]') as HTMLVideoElement | null;

    switch (tool) {
      case 'pause_video':
        if (video) { video.pause(); return true; }
        return false;
      case 'play_video':
        if (video) { video.play(); return true; }
        return false;
      case 'seek_forward': {
        if (!video) return false;
        const secs = (params.seconds as number) || 10;
        video.currentTime = Math.min(video.currentTime + secs, video.duration);
        return true;
      }
      case 'seek_backward': {
        if (!video) return false;
        const secs = (params.seconds as number) || 10;
        video.currentTime = Math.max(video.currentTime - secs, 0);
        return true;
      }
      case 'set_volume': {
        if (!video) return false;
        const vol = typeof params.volume === 'number' ? params.volume : 0.5;
        video.volume = Math.max(0, Math.min(1, vol));
        return true;
      }
      case 'increase_volume': {
        if (!video) return false;
        video.volume = Math.min(1, video.volume + 0.1);
        return true;
      }
      case 'decrease_volume': {
        if (!video) return false;
        video.volume = Math.max(0, video.volume - 0.1);
        return true;
      }
      case 'mute':
        if (video) { video.muted = true; return true; }
        return false;
      case 'unmute':
        if (video) { video.muted = false; return true; }
        return false;
      case 'toggle_fullscreen': {
        const playerContainer = document.querySelector('[data-role="player-container"]') as HTMLElement | null;
        if (!playerContainer) return false;
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          playerContainer.requestFullscreen();
        }
        return true;
      }
      case 'toggle_picture_in_picture':
        if (video) {
          if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
          } else {
            video.requestPictureInPicture();
          }
          return true;
        }
        return false;
      case 'set_playback_speed': {
        if (!video) return false;
        if (params.speed) {
          video.playbackRate = params.speed as number;
        } else if (params.delta) {
          video.playbackRate = Math.max(0.25, Math.min(4, video.playbackRate + (params.delta as number)));
        }
        return true;
      }
      case 'restart_episode':
        if (video) { video.currentTime = 0; video.play(); return true; }
        return false;
      case 'scroll_down':
        window.scrollBy({ top: 400, behavior: 'smooth' }); return true;
      case 'scroll_up':
        window.scrollBy({ top: -400, behavior: 'smooth' }); return true;
      case 'scroll_to_top':
        window.scrollTo({ top: 0, behavior: 'smooth' }); return true;
      case 'scroll_to_bottom':
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); return true;
      case 'go_back':
        router.back(); return true;
      case 'refresh_page':
        window.location.reload(); return true;
      case 'go_home':
        router.push('/'); return true;
      case 'open_favorites_page':
        router.push('/favorites'); return true;
      case 'open_search_page':
        router.push('/search'); return true;
      case 'open_profile_page':
        router.push('/profile'); return true;
      default:
        return false;
    }
  }, [router]);

  const executeApiAction = useCallback(async (tool: string, params: Record<string, unknown>): Promise<boolean> => {
    // Some tools might still be handled by the player (like backend-assisted playback?),
    // but the main LLM tool calls are handled here.
    const state = getFrontendState();
    return await handleApiAction(tool, params, router, pathname, state);
  }, [router, pathname, getFrontendState]);

  // ─── CORE: Dispatcher faqat isAuthenticated=true bo'lganda init qilinadi ─────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Avvalgi dispatcher ni to'xtatamiz
    if (dispatcherRef.current) {
      dispatcherRef.current.destroy();
      dispatcherRef.current = null;
    }

    // Faqat autentifikatsiya qilingan foydalanuvchi uchun WebSocket ni yoqamiz
    if (!isAuthenticated) {
      console.log('[Voice] Foydalanuvchi login qilmagan — dispatcher yoqilmadi');
      return;
    }

    console.log('[Voice] Login qilindi — dispatcher va WebSocket ishga tushmoqda...');

    const dispatcher = new VoiceDispatcher({
      onStateChange: setVoiceState,
      onSocketStatusChange: (status) => {
        console.log('[WS Status]', status);
      },
      getFrontendState,
      executePlaybackAction,
      executeApiAction,
      speak: async (text: string) => {
        setVoiceCaption(text);
        if (ttsService) {
          await ttsService.speak(text);
        }
      },
      requestConfirmation: async (tool: string) => {
        return window.confirm(`"${tool}" ni bajarishni tasdiqlaysizmi?`);
      },
    });

    dispatcher.init();
    dispatcherRef.current = dispatcher;

    return () => {
      dispatcher.destroy();
      dispatcherRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // ← faqat isAuthenticated o'zgarganda qayta ulanamiz

  // getFrontendState o'zgarganda dispatcherga xabar beramiz (agarda bor bo'lsa)
  useEffect(() => {
    // Bu hook dispatcherning ichidagi getFrontendState ni yangilaydi
    // Dispatcher o'zi har safar `send()` chaqirilganda getFrontendState() ni chaqiradi
    // Shuning uchun bu yerda qo'shimcha narsa qilishning hojati yo'q.
  }, [getFrontendState, executePlaybackAction, executeApiAction]);

  const handleVoiceClick = () => {
    if (!isAuthenticated) {
      // Login bo'lmagan holda Voice tugmasini bossangiz → loginga yo'naltiramiz
      router.push('/login?next=' + encodeURIComponent(pathname));
      return;
    }

    if (voiceState === 'idle') {
      dispatcherRef.current?.startListening();
    } else {
      dispatcherRef.current?.stopListening();
      setVoiceState('idle');
      setVoiceCaption('');
    }
  };

  const handleVoiceClose = () => {
    dispatcherRef.current?.stopListening();
    setVoiceState('idle');
    setVoiceCaption('');
  };

  return (
    <>
      {/* AuthGuard — barcha sahifalar uchun route himoyasi */}
      <AuthGuard>
        {!isAdmin && <Navbar onVoiceClick={handleVoiceClick} />}
        <div style={{
          paddingTop: isAdmin ? 0 : 'var(--nav-height)',
          paddingBottom: isAdmin ? 0 : 'var(--bottom-nav-height)',
          minHeight: '100vh',
        }}>
          {children}
        </div>
        {!isAdmin && <BottomNav />}
        <VoiceOverlay
          state={voiceState}
          caption={voiceCaption}
          onClose={handleVoiceClose}
          onOrbClick={handleVoiceClick}
        />
      </AuthGuard>
    </>
  );
}
