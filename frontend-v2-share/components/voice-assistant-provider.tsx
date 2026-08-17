'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getToken, api, unwrapList } from '@/lib/api'
import { connectAgentSocket, type AgentFrontendState, type AgentMessage, type AgentSocketHandle } from '@/lib/agent-socket'
import { matchLocalCommand, normalizeUzbekSTT } from '@/lib/voice-commands'
import { DESTRUCTIVE_TOOLS, getConfirmationPrompt, type PlayerBridge } from '@/lib/voice-tools'
import { useAuth } from '@/components/auth-provider'

export type AssistantStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error'

export type PendingConfirm = {
  tool: string
  params?: Record<string, any>
  message: string
}

export type VoiceWidgetMode = 'active' | 'muted' | 'minimized'

type VoiceAssistantState = {
  enabled: boolean
  mode: VoiceWidgetMode
  status: AssistantStatus
  transcript: string
  lastReply: string
  errorMessage: string
  pendingConfirm: PendingConfirm | null
  isVideoPlaying: boolean
  hasPlayer: boolean
  toggle: () => void
  cycleMode: () => void
  setMode: (mode: VoiceWidgetMode) => void
  resolveConfirm: (accepted: boolean) => void
  registerPlayer: (bridge: PlayerBridge) => void
  unregisterPlayer: () => void
  speakText: (text: string) => void
}

const VoiceAssistantContext = createContext<VoiceAssistantState | null>(null)

function speak(_text: string, onEnd?: () => void) {
  // Silent execution — no intrusive robotic voice announcements
  onEnd?.()
}

export function VoiceAssistantProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, logout, user } = useAuth()

  const [enabled, setEnabled] = useState(false)
  const [status, setStatus] = useState<AssistantStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [lastReply, setLastReply] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [hasPlayer, setHasPlayer] = useState(false)

  const activeRef = useRef(false)
  const recognitionRef = useRef<any>(null)
  const socketRef = useRef<AgentSocketHandle | null>(null)
  const playerRef = useRef<PlayerBridge | null>(null)
  const pendingConfirmRef = useRef<PendingConfirm | null>(null)
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname

  const speakAndStatus = useCallback((text: string, nextStatus: AssistantStatus = 'listening') => {
    setLastReply(text)
    if (activeRef.current) {
      setStatus(nextStatus)
    } else {
      setStatus('idle')
    }
  }, [])

  const buildFrontendState = useCallback((): AgentFrontendState => {
    const player = playerRef.current
    const video = player?.videoRef.current
    return {
      page: pathnameRef.current,
      content_type: player?.contentType,
      content_id: player?.contentId ? String(player.contentId) : undefined,
      content_title: player?.contentTitle,
      is_playing: video ? !video.paused : undefined,
      current_time_seconds: video?.currentTime,
    }
  }, [])

  // Execute full suite of DOM / local actions + Tool executions
  const executeAction = useCallback(
    async (action: string, params: Record<string, any> = {}) => {
      const player = playerRef.current
      const video = player?.videoRef.current ?? (typeof document !== 'undefined' ? document.querySelector('video[data-role="main-player"]') as HTMLVideoElement : null)

      switch (action) {
        // === PLAYBACK CONTROLS ===
        case 'play_video':
          if (video) {
            void video.play()
            speakAndStatus("Ijro etilmoqda")
          }
          return
        case 'pause_video':
          if (video) {
            video.pause()
            speakAndStatus("Pauza qilindi")
          }
          return
        case 'restart_video':
          if (video) {
            video.currentTime = 0
            void video.play()
            speakAndStatus("Boshidan qo'yildi")
          }
          return
        case 'seek_forward':
          if (video) {
            const secs = params.seconds ?? 10
            video.currentTime = Math.min(video.duration || Infinity, video.currentTime + secs)
            speakAndStatus(`${secs} soniya oldinga`)
          }
          return
        case 'seek_backward':
          if (video) {
            const secs = params.seconds ?? 10
            video.currentTime = Math.max(0, video.currentTime - secs)
            speakAndStatus(`${secs} soniya orqaga`)
          }
          return
        case 'seek_to_time':
          if (video && typeof params.seconds === 'number') {
            video.currentTime = Math.max(0, params.seconds)
            speakAndStatus(`${Math.floor(params.seconds / 60)} daqiqaga o'tkazildi`)
          }
          return
        case 'set_volume':
          if (video) {
            const val = params.value ?? 100
            video.volume = Math.max(0, Math.min(1, val > 1 ? val / 100 : val))
            video.muted = video.volume === 0
            speakAndStatus(`Ovoz ${Math.round(video.volume * 100)} foiz`)
          }
          return
        case 'increase_volume':
          if (video) {
            video.muted = false
            video.volume = Math.min(1, video.volume + 0.15)
            speakAndStatus(`Ovoz ko'tarildi: ${Math.round(video.volume * 100)}%`)
          }
          return
        case 'decrease_volume':
          if (video) {
            video.volume = Math.max(0, video.volume - 0.15)
            speakAndStatus(`Ovoz pasaytirildi: ${Math.round(video.volume * 100)}%`)
          }
          return
        case 'mute':
          if (video) {
            video.muted = true
            speakAndStatus("Ovoz o'chirildi")
          }
          return
        case 'unmute':
          if (video) {
            video.muted = false
            speakAndStatus("Ovoz yoqildi")
          }
          return
        case 'enter_fullscreen':
        case 'toggle_fullscreen':
          if (typeof document !== 'undefined') {
            if (document.fullscreenElement) {
              void document.exitFullscreen()
            } else {
              const target = video?.parentElement || document.documentElement
              void target.requestFullscreen?.()
            }
          }
          return
        case 'exit_fullscreen':
          if (typeof document !== 'undefined' && document.fullscreenElement) {
            void document.exitFullscreen()
          }
          return
        case 'toggle_picture_in_picture':
          if (video && typeof document !== 'undefined') {
            if (document.pictureInPictureElement) {
              void document.exitPictureInPicture()
            } else if (document.pictureInPictureEnabled) {
              void video.requestPictureInPicture()
            }
          }
          return
        case 'set_speed':
          if (video && params.speed) {
            video.playbackRate = Math.max(0.25, Math.min(2, params.speed))
            speakAndStatus(`Tezlik ${video.playbackRate}x qilindi`)
          }
          return
        case 'next_episode':
          player?.nextEpisode?.()
          speakAndStatus("Keyingi qism ochilmoqda")
          return
        case 'previous_episode':
          player?.previousEpisode?.()
          speakAndStatus("Oldingi qism ochilmoqda")
          return
        case 'enable_captions':
        case 'toggle_captions':
          if (video) {
            for (let i = 0; i < video.textTracks.length; i++) {
              video.textTracks[i].mode = 'showing'
            }
            speakAndStatus("Subtitrlar yoqildi")
          }
          return
        case 'disable_captions':
          if (video) {
            for (let i = 0; i < video.textTracks.length; i++) {
              video.textTracks[i].mode = 'disabled'
            }
            speakAndStatus("Subtitrlar o'chirildi")
          }
          return

        // === SCROLLING ===
        case 'scroll_down':
          if (typeof window !== 'undefined') window.scrollBy({ top: window.innerHeight * 0.7, behavior: 'smooth' })
          return
        case 'scroll_up':
          if (typeof window !== 'undefined') window.scrollBy({ top: -window.innerHeight * 0.7, behavior: 'smooth' })
          return
        case 'scroll_to_top':
          if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
          return
        case 'scroll_to_bottom':
          if (typeof window !== 'undefined') window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
          return

        // === APP NAVIGATION ===
        case 'go_home':
          router.push('/')
          speakAndStatus("Bosh sahifaga o'tildi")
          return
        case 'open_movies_page':
          router.push('/movies')
          speakAndStatus("Filmlar katalogi ochildi")
          return
        case 'open_series_page':
          router.push('/series')
          speakAndStatus("Seriallar katalogi ochildi")
          return
        case 'open_favorites_page':
        case 'show_favorites':
          router.push('/favorites')
          speakAndStatus("Sevimlilar ro'yxati ochildi")
          return
        case 'open_history_page':
        case 'show_watch_history':
        case 'show_continue_watching':
          router.push('/history')
          speakAndStatus("Tomosha tarixi ochildi")
          return
        case 'open_profile_page':
          router.push('/profile')
          speakAndStatus("Profil ochildi")
          return
        case 'open_settings_page':
          router.push('/settings')
          speakAndStatus("Sozlamalar ochildi")
          return
        case 'go_back':
          router.back()
          return
        case 'refresh_page':
          router.refresh()
          return
        case 'stop_listening':
          setEnabled(false)
          activeRef.current = false
          setStatus('idle')
          return

        // === LLM TOOL ACTIONS (Layer 3) ===
        case 'search_content':
        case 'search': {
          const q = params.query || params.q || ''
          router.push(`/search?q=${encodeURIComponent(q)}`)
          speakAndStatus(`"${q}" bo'yicha qidirilmoqda`)
          return
        }

        case 'filter_by_genre': {
          const g = params.genre || ''
          router.push(`/genre/${encodeURIComponent(g)}`)
          speakAndStatus(`${g} janridagi filmlar ochildi`)
          return
        }

        case 'show_trending':
          router.push('/movies?ordering=-created_at')
          speakAndStatus("Hozir trenddagi filmlar ochildi")
          return

        case 'show_new_releases':
          router.push('/movies?ordering=-created_at')
          speakAndStatus("Yangi chiqqan premyeralar ochildi")
          return

        case 'get_recommendations': {
          const based = params.based_on || 'tavsiya'
          router.push(`/search?q=${encodeURIComponent(based)}`)
          speakAndStatus(`Siz uchun tavsiyalar yuklanmoqda`)
          return
        }

        case 'open_content':
        case 'show_content_details': {
          const t = params.title || ''
          try {
            const res = await api.search(t, 5)
            const list = unwrapList(res)
            if (list.length > 0) {
              const item = list[0]
              const target = item.content_type === 'series' ? `/series/${item.object_id}` : `/movie/${item.object_id}`
              router.push(target)
              speakAndStatus(`"${item.title}" ochilmoqda`)
            } else {
              router.push(`/search?q=${encodeURIComponent(t)}`)
              speakAndStatus(`"${t}" topilmadi, qidiruv sahifasiga o'tildi`)
            }
          } catch {
            router.push(`/search?q=${encodeURIComponent(t)}`)
          }
          return
        }

        case 'toggle_favorite':
        case 'add_to_favorites':
        case 'favorite_content': {
          if (player?.toggleFavorite) {
            player.toggleFavorite()
            speakAndStatus("Sevimlilarga qo'shildi")
          } else if (player?.contentId) {
            try {
              if (player.contentType === 'series') await api.addFavoriteSeries(player.contentId)
              else await api.addFavoriteMovie(player.contentId)
              speakAndStatus("Sevimlilarga saqlandi")
            } catch {
              speakAndStatus("Sevimlilarga qo'shishda xatolik yuz berdi")
            }
          } else {
            speakAndStatus("Avval biror film yoki serialni oching")
          }
          return
        }

        case 'remove_from_favorites': {
          if (player?.contentId) {
            try {
              if (player.contentType === 'series') await api.removeFavoriteSeries(player.contentId)
              else await api.removeFavoriteMovie(player.contentId)
              speakAndStatus("Sevimlilardan o'chirildi")
            } catch {
              speakAndStatus("O'chirishda xatolik")
            }
          }
          return
        }

        case 'rate_content': {
          const stars = typeof params.stars === 'number' ? params.stars : (typeof params.value === 'number' ? params.value : 5)
          if (player?.rate) {
            player.rate(stars)
            speakAndStatus(`${stars} yulduz bilan baholandi`)
          } else if (player?.contentId) {
            try {
              if (player.contentType === 'series') await api.rateSeries(player.contentId, stars)
              else await api.rateMovie(player.contentId, stars)
              speakAndStatus(`${stars} yulduz bilan baholandi`)
            } catch {
              speakAndStatus("Baholashda xatolik yuz berdi")
            }
          }
          return
        }

        case 'add_comment': {
          const text = params.text || params.comment || ''
          if (text) {
            if (player?.addComment) {
              await player.addComment(text)
              speakAndStatus("Izohingiz qo'shildi")
            } else if (player?.contentId) {
              try {
                if (player.contentType === 'series') await api.addSeriesComment(player.contentId, text)
                else await api.addMovieComment(player.contentId, text)
                speakAndStatus("Izohingiz saqlandi")
              } catch {
                speakAndStatus("Izoh qoldirishda xatolik")
              }
            }
          }
          return
        }

        case 'select_search_result': {
          const idx = typeof params.index === 'number' ? params.index - 1 : 0
          if (typeof document !== 'undefined') {
            const cards = document.querySelectorAll('.media-card')
            if (cards[idx]) {
              (cards[idx] as HTMLElement).click()
            }
          }
          return
        }

        case 'sort_content': {
          const crit = params.criteria || 'newest'
          let ord = '-created_at'
          if (crit === 'rating') ord = '-rating'
          if (crit === 'popularity') ord = '-views'
          router.push(`/movies?ordering=${ord}`)
          return
        }

        case 'resume_watching': {
          if (video) {
            void video.play()
          } else {
            router.push('/history')
          }
          return
        }

        case 'list_episodes': {
          if (typeof window !== 'undefined') {
            const epSection = document.querySelector('#episodes-section') || document.querySelector('[data-role="episodes"]')
            if (epSection) epSection.scrollIntoView({ behavior: 'smooth' })
          }
          return
        }

        case 'show_comments': {
          if (typeof window !== 'undefined') {
            const cSection = document.querySelector('#comments-section') || document.querySelector('[data-role="comments"]')
            if (cSection) cSection.scrollIntoView({ behavior: 'smooth' })
          }
          return
        }

        case 'share_content': {
          if (typeof window !== 'undefined' && navigator.clipboard) {
            void navigator.clipboard.writeText(window.location.href)
          }
          return
        }

        case 'report_problem': {
          console.info('Problem reported:', params)
          return
        }

        case 'clear_watch_history': {
          router.push('/history')
          return
        }

        case 'check_login_status': {
          if (!isAuthenticated) {
            router.push('/login')
          }
          return
        }

        case 'logout': {
          logout()
          router.push('/login')
          return
        }

        default:
          console.warn('Unknown voice action:', action, params)
      }
    },
    [router, isAuthenticated, user, logout],
  )

  // Handle incoming agent message
  const handleAgentMessage = useCallback(
    (msg: AgentMessage) => {
      if (msg.type === 'status') {
        const s = msg.payload?.state
        if (s === 'thinking') setStatus('thinking')
        return
      }

      if (msg.type === 'response' && msg.payload?.text) {
        speakAndStatus(msg.payload.text)
        return
      }

      const actionName = msg.payload?.action || msg.payload?.tool || msg.action
      const params = msg.payload?.params || {}

      if (actionName) {
        if (DESTRUCTIVE_TOOLS.has(actionName)) {
          const prompt = getConfirmationPrompt(actionName, params)
          const confirmObj: PendingConfirm = { tool: actionName, params, message: prompt }
          setPendingConfirm(confirmObj)
          pendingConfirmRef.current = confirmObj
          speakAndStatus(prompt)
          return
        }

        void executeAction(actionName, params)
      }
    },
    [executeAction, speakAndStatus],
  )

  // Resolve user confirmation
  const resolveConfirm = useCallback(
    (accepted: boolean) => {
      const current = pendingConfirmRef.current
      setPendingConfirm(null)
      pendingConfirmRef.current = null

      if (!current) return

      if (accepted) {
        void executeAction(current.tool, current.params)
      } else {
        speakAndStatus("Amal bekor qilindi")
      }
    },
    [executeAction, speakAndStatus],
  )

  // Start Speech Recognition
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setErrorMessage("Brauzeringiz Web Speech API'ni qo'llab-quvvatlamaydi")
      setStatus('error')
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'uz-UZ'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setStatus('listening')
        setErrorMessage('')
      }

      let lastExecutedCmd = ''
      let lastExecutedTime = 0

      recognition.onresult = (event: any) => {
        const results = event.results
        const latest = results[results.length - 1]
        const transcriptText = latest[0]?.transcript || ''
        setTranscript(transcriptText)

        const cleanText = normalizeUzbekSTT(transcriptText)
        if (!cleanText) return

        // 1. Check if user is answering a pending confirmation
        if (pendingConfirmRef.current && latest.isFinal) {
          if (cleanText.includes('ha') || cleanText.includes('tasdiq') || cleanText.includes('mayli') || cleanText.includes("o'chir") || cleanText.includes('chiq')) {
            resolveConfirm(true)
            return
          }
          if (cleanText.includes("yo'q") || cleanText.includes('bekor') || cleanText.includes('kerakmas')) {
            resolveConfirm(false)
            return
          }
        }

        // 2. Fast Path DOM (Layer 0) — Zero Latency Instant Execution
        const localCmd = matchLocalCommand(cleanText)
        if (localCmd) {
          const now = Date.now()
          const cmdKey = `${localCmd.action}_${JSON.stringify(localCmd.params || {})}`
          if (cmdKey !== lastExecutedCmd || now - lastExecutedTime > 1500) {
            lastExecutedCmd = cmdKey
            lastExecutedTime = now
            void executeAction(localCmd.action, localCmd.params)
          }
          return
        }

        // 3. WebSocket LLM Tool call (Layer 1-2) if isFinal and not matched locally
        if (latest.isFinal && socketRef.current) {
          setStatus('thinking')
          socketRef.current.send(cleanText, buildFrontendState())
        }
      }

      recognition.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          setErrorMessage("Mikrofon ruxsati berilmagan")
          setStatus('error')
        }
      }

      recognition.onend = () => {
        if (activeRef.current) {
          try {
            recognition.start()
          } catch {
            /* ignore restart error */
          }
        }
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('Speech recognition error', err)
      setStatus('error')
    }
  }, [buildFrontendState, executeAction, resolveConfirm])

  // Toggle voice assistant ON/OFF
  const toggle = useCallback(() => {
    if (enabled) {
      setEnabled(false)
      activeRef.current = false
      setStatus('idle')
      setTranscript('')
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      if (socketRef.current) {
        try { socketRef.current.close() } catch {}
        socketRef.current = null
      }
    } else {
      setEnabled(true)
      activeRef.current = true
      setStatus('listening')

      // Start Web Speech API IMMEDIATELY and UNCONDITIONALLY for instant Layer 0 Fast Path!
      startListening()

      // Optional WebSocket connection in background
      const token = getToken() || ''
      try {
        socketRef.current = connectAgentSocket(token, {
          onOpen: () => {
            // WS connected
          },
          onMessage: handleAgentMessage,
          onError: () => {
            // Keep status listening for Fast Path
            setStatus('listening')
          },
          onClose: () => {
            // WS closed - keep local listening active
          },
        })
      } catch (err) {
        console.warn('Optional WS init failed, using local Fast Path', err)
      }
    }
  }, [enabled, handleAgentMessage, startListening])

  const [mode, setModeState] = useState<VoiceWidgetMode>('minimized')

  // Cycle 3 states: minimized -> active -> muted -> minimized
  const cycleMode = useCallback(() => {
    if (mode === 'minimized') {
      setModeState('active')
      if (!enabled) toggle()
    } else if (mode === 'active') {
      setModeState('muted')
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      setStatus('idle')
    } else {
      setModeState('minimized')
      if (enabled) toggle()
    }
  }, [mode, enabled, toggle])

  const setMode = useCallback((newMode: VoiceWidgetMode) => {
    setModeState(newMode)
    if (newMode === 'active') {
      if (!enabled) toggle()
      else startListening()
    } else if (newMode === 'muted') {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      setStatus('idle')
    } else {
      if (enabled) toggle()
    }
  }, [enabled, toggle, startListening])

  const registerPlayer = useCallback((bridge: PlayerBridge) => {
    playerRef.current = bridge
    setHasPlayer(true)
    const video = bridge.videoRef.current
    if (video) {
      setIsVideoPlaying(!video.paused)
      const onPlay = () => setIsVideoPlaying(true)
      const onPause = () => setIsVideoPlaying(false)
      video.addEventListener('play', onPlay)
      video.addEventListener('pause', onPause)
    }
  }, [])

  const unregisterPlayer = useCallback(() => {
    playerRef.current = null
    setHasPlayer(false)
    setIsVideoPlaying(false)
  }, [])

  const value = useMemo<VoiceAssistantState>(
    () => ({
      enabled,
      mode,
      status,
      transcript,
      lastReply,
      errorMessage,
      pendingConfirm,
      isVideoPlaying,
      hasPlayer,
      toggle,
      cycleMode,
      setMode,
      resolveConfirm,
      registerPlayer,
      unregisterPlayer,
      speakText: speakAndStatus,
    }),
    [
      enabled,
      mode,
      status,
      transcript,
      lastReply,
      errorMessage,
      pendingConfirm,
      isVideoPlaying,
      hasPlayer,
      toggle,
      cycleMode,
      setMode,
      resolveConfirm,
      registerPlayer,
      unregisterPlayer,
      speakAndStatus,
    ],
  )

  return <VoiceAssistantContext.Provider value={value}>{children}</VoiceAssistantContext.Provider>
}

export function useVoiceAssistant() {
  const context = useContext(VoiceAssistantContext)
  if (!context) throw new Error('useVoiceAssistant must be used within VoiceAssistantProvider')
  return context
}
