'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getToken } from '@/lib/api'
import { connectAgentSocket, type AgentFrontendState, type AgentMessage, type AgentSocketHandle } from '@/lib/agent-socket'
import { matchLocalCommand } from '@/lib/voice-commands'
import { DESTRUCTIVE_TOOLS, type PlayerBridge } from '@/lib/voice-tools'
import { useAuth } from '@/components/auth-provider'

export type AssistantStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error'

type PendingConfirm = { tool: string; params?: Record<string, any>; message: string }

type VoiceAssistantState = {
  enabled: boolean
  status: AssistantStatus
  transcript: string
  lastReply: string
  errorMessage: string
  pendingConfirm: PendingConfirm | null
  isVideoPlaying: boolean
  hasPlayer: boolean
  toggle: () => void
  resolveConfirm: (accepted: boolean) => void
  registerPlayer: (bridge: PlayerBridge) => void
  unregisterPlayer: () => void
}

const VoiceAssistantContext = createContext<VoiceAssistantState | null>(null)

function speak(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) {
    onEnd?.()
    return
  }
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'uz-UZ'
    utterance.rate = 1
    utterance.onend = () => onEnd?.()
    utterance.onerror = () => onEnd?.()
    window.speechSynthesis.speak(utterance)
  } catch {
    onEnd?.()
  }
}

export function VoiceAssistantProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, logout } = useAuth()

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

  const buildFrontendState = useCallback((): AgentFrontendState => {
    const player = playerRef.current
    const video = player?.videoRef.current
    return {
      page: pathnameRef.current,
      content_type: player?.contentType,
      content_id: player?.contentId,
      content_title: player?.contentTitle,
      is_playing: video ? !video.paused : undefined,
      current_time_seconds: video?.currentTime,
    }
  }, [])

  const executeAction = useCallback(
    (action: string, params: Record<string, any> = {}) => {
      const player = playerRef.current
      const video = player?.videoRef.current ?? null

      switch (action) {
        case 'play_video':
          void video?.play()
          return
        case 'pause_video':
          video?.pause()
          return
        case 'seek_forward':
          if (video) video.currentTime = Math.min(video.duration || Infinity, video.currentTime + (params.seconds ?? 10))
          return
        case 'seek_backward':
          if (video) video.currentTime = Math.max(0, video.currentTime - (params.seconds ?? 10))
          return
        case 'seek_to_time':
          if (video) video.currentTime = Math.max(0, params.seconds ?? 0)
          return
        case 'set_volume':
          if (video) {
            const value = params.value ?? 100
            video.volume = Math.max(0, Math.min(1, value > 1 ? value / 100 : value))
            video.muted = video.volume === 0
          }
          return
        case 'increase_volume':
          if (video) {
            video.muted = false
            video.volume = Math.min(1, video.volume + 0.1)
          }
          return
        case 'decrease_volume':
          if (video) video.volume = Math.max(0, video.volume - 0.1)
          return
        case 'mute':
          if (video) video.muted = true
          return
        case 'unmute':
          if (video) video.muted = false
          return
        case 'toggle_fullscreen':
          if (document.fullscreenElement) void document.exitFullscreen()
          else if (video) void video.requestFullscreen()
          return
        case 'exit_fullscreen':
          if (document.fullscreenElement) void document.exitFullscreen()
          return
        case 'set_speed':
          if (video && params.speed) video.playbackRate = Math.max(0.25, Math.min(2, params.speed))
          return
        case 'next_episode':
          player?.nextEpisode()
          return
        case 'previous_episode':
          player?.previousEpisode()
          return
        case 'toggle_favorite':
        case 'add_to_favorites':
        case 'favorite_content':
          player?.toggleFavorite()
          return
        case 'rate_content':
          if (typeof params.value === 'number') player?.rate(params.value)
          return
        case 'add_comment':
          if (typeof params.text === 'string') void player?.addComment(params.text)
          return
        case 'search':
        case 'search_content':
          router.push(`/explore?q=${encodeURIComponent(params.query ?? '')}`)
          return
        case 'go_home':
          router.push('/')
          return
        case 'go_back':
          router.back()
          return
        case 'refresh_page':
          window.location.reload()
          return
        case 'open_favorites_page':
        case 'open_profile_page':
          router.push('/profile')
          return
        case 'open_explore_page':
          router.push('/explore')
          return
        case 'scroll_up':
          window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' })
          return
        case 'scroll_down':
          window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })
          return
        case 'logout':
          logout()
          router.push('/')
          return
        case 'stop_listening':
          disable()
          return
        default:
          return
      }
    },
    [router, logout],
  )

  const handleAgentMessage = useCallback(
    (data: AgentMessage) => {
      if (data.type === 'connected') {
        setStatus('listening')
        return
      }
      if (data.type === 'status' && data.payload?.state === 'thinking') {
        setStatus('thinking')
        return
      }
      if (data.type === 'error') {
        const message = data.payload?.message ?? 'Ovozli xizmatda xatolik yuz berdi.'
        setErrorMessage(message)
        setStatus('speaking')
        speak(message, () => setStatus(prev => (prev === 'speaking' ? 'listening' : prev)))
        return
      }

      const toolName = data.payload?.tool ?? data.payload?.action ?? data.action
      const params = data.payload?.params ?? {}
      const spokenText = data.message ?? data.payload?.text ?? data.payload?.message ?? ''

      if (toolName) {
        const needsConfirm = data.payload?.requires_confirmation || DESTRUCTIVE_TOOLS.has(toolName)
        if (needsConfirm) {
          const confirm: PendingConfirm = { tool: toolName, params, message: spokenText || `${toolName} bajarilsinmi? Ha yoki yo'q deb ayting.` }
          pendingConfirmRef.current = confirm
          setPendingConfirm(confirm)
          setStatus('speaking')
          speak(confirm.message, () => setStatus(prev => (prev === 'speaking' ? 'listening' : prev)))
          return
        }
        executeAction(toolName, params)
      }

      if (spokenText) {
        setLastReply(spokenText)
        setStatus('speaking')
        speak(spokenText, () => setStatus(prev => (prev === 'speaking' ? 'listening' : prev)))
      } else if (!toolName) {
        setStatus('listening')
      }
    },
    [executeAction],
  )

  const handleUtterance = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      setTranscript(trimmed)

      if (pendingConfirmRef.current) {
        const confirm = pendingConfirmRef.current
        const normalized = trimmed.toLowerCase()
        const yes = /(^| )(ha|xa|tasdiqlayman|mayli|xop|ok|okay)( |$)/.test(normalized)
        const no = /(^| )(yo'q|yoq|bekor|kerak emas)( |$)/.test(normalized)
        if (yes) {
          pendingConfirmRef.current = null
          setPendingConfirm(null)
          executeAction(confirm.tool, confirm.params)
          setStatus('listening')
        } else if (no) {
          pendingConfirmRef.current = null
          setPendingConfirm(null)
          setStatus('speaking')
          speak('Bekor qilindi.', () => setStatus(prev => (prev === 'speaking' ? 'listening' : prev)))
        }
        return
      }

      const local = matchLocalCommand(trimmed)
      if (local) {
        executeAction(local.action, local.params)
        setStatus('listening')
        return
      }

      if (socketRef.current && socketRef.current.readyState() === WebSocket.OPEN) {
        setStatus('thinking')
        socketRef.current.send(trimmed, buildFrontendState())
      }
    },
    [executeAction, buildFrontendState],
  )

  const startRecognition = useCallback(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setErrorMessage('Bu brauzer ovozli boshqaruvni qo\'llamaydi.')
      setStatus('error')
      return
    }
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'uz-UZ'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const text = result[0]?.transcript ?? ''
      setTranscript(text)
      if (result.isFinal) handleUtterance(text)
    }
    recognition.onerror = (event: any) => {
      if (event?.error === 'not-allowed' || event?.error === 'service-not-allowed') {
        setErrorMessage('Mikrofonga ruxsat berilmadi.')
        setStatus('error')
        disable()
        return
      }
      // transient errors (no-speech, network blips) - keep the loop alive
    }
    recognition.onend = () => {
      if (activeRef.current) {
        try {
          recognition.start()
        } catch {
          /* already starting */
        }
      }
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
      setStatus('listening')
    } catch {
      setStatus('error')
    }
  }, [handleUtterance])

  const disable = useCallback(() => {
    activeRef.current = false
    setEnabled(false)
    setStatus('idle')
    setTranscript('')
    setPendingConfirm(null)
    pendingConfirmRef.current = null
    try {
      recognitionRef.current?.stop()
    } catch {
      /* ignore */
    }
    recognitionRef.current = null
    socketRef.current?.close()
    socketRef.current = null
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
  }, [])

  const enable = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!window.isSecureContext) {
      setErrorMessage('Ovozli boshqaruv uchun xavfsiz (HTTPS) ulanish kerak.')
      setStatus('error')
      return
    }
    const token = getToken()
    if (!isAuthenticated || !token) {
      setErrorMessage('Ovozli yordamchidan foydalanish uchun avval tizimga kiring.')
      setStatus('error')
      return
    }

    activeRef.current = true
    setEnabled(true)
    setErrorMessage('')
    setStatus('connecting')

    const socket = connectAgentSocket(token, {
      onOpen: () => {
        if (!activeRef.current) return
        startRecognition()
      },
      onMessage: handleAgentMessage,
      onClose: () => {
        if (activeRef.current) {
          setErrorMessage('Ovozli xizmat bilan aloqa uzildi.')
          setStatus('error')
        }
      },
      onError: () => {
        if (activeRef.current) {
          setErrorMessage('Ovozli xizmatga ulanib bo\'lmadi.')
          setStatus('error')
        }
      },
    })
    if (!socket) {
      setEnabled(false)
      activeRef.current = false
      setStatus('error')
      setErrorMessage('Ovozli xizmatga ulanib bo\'lmadi.')
      return
    }
    socketRef.current = socket
  }, [isAuthenticated, startRecognition, handleAgentMessage])

  const toggle = useCallback(() => {
    if (enabled) disable()
    else enable()
  }, [enabled, disable, enable])

  const resolveConfirm = useCallback(
    (accepted: boolean) => {
      const confirm = pendingConfirmRef.current
      pendingConfirmRef.current = null
      setPendingConfirm(null)
      if (accepted && confirm) executeAction(confirm.tool, confirm.params)
    },
    [executeAction],
  )

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
      video.addEventListener('ended', onPause)
      ;(video as any)._voiceListeners = { onPlay, onPause }
    }
  }, [])

  const unregisterPlayer = useCallback(() => {
    const video = playerRef.current?.videoRef.current
    const listeners = video && (video as any)._voiceListeners
    if (video && listeners) {
      video.removeEventListener('play', listeners.onPlay)
      video.removeEventListener('pause', listeners.onPause)
      video.removeEventListener('ended', listeners.onPause)
    }
    playerRef.current = null
    setHasPlayer(false)
    setIsVideoPlaying(false)
  }, [])

  useEffect(() => () => disable(), [disable])

  const value = useMemo<VoiceAssistantState>(
    () => ({
      enabled,
      status,
      transcript,
      lastReply,
      errorMessage,
      pendingConfirm,
      isVideoPlaying,
      hasPlayer,
      toggle,
      resolveConfirm,
      registerPlayer,
      unregisterPlayer,
    }),
    [enabled, status, transcript, lastReply, errorMessage, pendingConfirm, isVideoPlaying, hasPlayer, toggle, resolveConfirm, registerPlayer, unregisterPlayer],
  )

  return <VoiceAssistantContext.Provider value={value}>{children}</VoiceAssistantContext.Provider>
}

export function useVoiceAssistant() {
  const context = useContext(VoiceAssistantContext)
  if (!context) throw new Error('useVoiceAssistant must be used within VoiceAssistantProvider')
  return context
}
