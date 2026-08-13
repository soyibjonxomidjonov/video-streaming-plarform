'use client'

import { useEffect, useState } from 'react'
import { Loader2, Mic, MicOff, Volume2, X } from 'lucide-react'
import { useVoiceAssistant } from '@/components/voice-assistant-provider'

const STATUS_LABEL: Record<string, string> = {
  idle: '',
  connecting: 'Ulanmoqda...',
  listening: 'Tinglayapman...',
  thinking: "O'ylayapman...",
  speaking: 'Javob beryapman...',
  error: 'Xatolik yuz berdi',
}

const STATUS_COLOR: Record<string, string> = {
  listening: '#22c55e',
  thinking: '#8b5cf6',
  speaking: '#a78bfa',
  error: '#ef4444',
}

export default function VoiceOrb() {
  const {
    enabled,
    status,
    transcript,
    lastReply,
    errorMessage,
    pendingConfirm,
    isVideoPlaying,
    toggle,
    resolveConfirm,
  } = useVoiceAssistant()
  const [manuallyExpanded, setManuallyExpanded] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (enabled) {
      const t = setTimeout(() => setVisible(true), 50)
      return () => clearTimeout(t)
    }
    setVisible(false)
  }, [enabled])

  useEffect(() => {
    if (!isVideoPlaying) setManuallyExpanded(false)
  }, [isVideoPlaying])

  const minimized = enabled && isVideoPlaying && !manuallyExpanded
  const message = pendingConfirm?.message || errorMessage || lastReply || transcript
  const label = STATUS_LABEL[status] ?? ''
  const dotColor = STATUS_COLOR[status] ?? '#8b5cf6'

  if (minimized) {
    return (
      <button
        onClick={() => setManuallyExpanded(true)}
        aria-label="Ovozli yordamchini kengaytirish"
        className="fixed right-0 top-1/2 z-50 flex h-20 w-3 -translate-y-1/2 items-center justify-center rounded-l-xl bg-violet-600 shadow-lg transition hover:w-4"
      >
        <span className="sr-only">Ovozli yordamchi faol</span>
      </button>
    )
  }

  if (!enabled && status !== 'error') return null

  return (
    <div
      className={`fixed right-4 top-1/2 z-50 flex -translate-y-1/2 flex-col items-end gap-3 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {(message || label) && (
        <div
          className="max-w-[260px] rounded-2xl p-4 text-right shadow-2xl animate-slide-up"
          style={{
            background: 'rgba(18, 18, 23, 0.96)',
            border: '1px solid #27272a',
            backdropFilter: 'blur(20px)',
          }}
        >
          {label && (
            <div className="mb-2 flex items-center justify-end gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: dotColor }}>
                {label}
              </span>
              <span className="size-1.5 rounded-full animate-pulse" style={{ background: dotColor }} />
            </div>
          )}

          {message && (
            <p className="text-xs leading-relaxed text-slate-200">{message}</p>
          )}

          {pendingConfirm && (
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => resolveConfirm(true)}
                className="rounded-lg bg-violet-600 px-3 py-1 text-xs font-bold text-white"
              >
                Ha
              </button>
              <button
                onClick={() => resolveConfirm(false)}
                className="rounded-lg border border-border bg-surface px-3 py-1 text-xs font-semibold text-slate-300"
              >
                Yo&apos;q
              </button>
            </div>
          )}
        </div>
      )}

      {/* ORB BUTTON */}
      <button
        onClick={toggle}
        aria-label={enabled ? "Ovozli yordamchini o'chirish" : 'Ovozli yordamchini yoqish'}
        aria-pressed={enabled}
        className="relative flex size-14 items-center justify-center rounded-full"
      >
        {enabled && status === 'listening' && (
          <span className="absolute inset-0 rounded-full bg-violet-500/40 animate-orb-pulse" />
        )}
        <span
          className={`relative flex size-12 items-center justify-center rounded-full shadow-xl transition-all ${
            enabled ? 'bg-violet-600 text-white glow-primary' : 'bg-surface text-slate-400 border border-border'
          }`}
        >
          {status === 'thinking' || status === 'connecting' ? (
            <Loader2 size={20} className="animate-spin" />
          ) : status === 'speaking' ? (
            <Volume2 size={20} />
          ) : status === 'error' ? (
            <MicOff size={20} />
          ) : (
            <Mic size={20} />
          )}
        </span>
      </button>
    </div>
  )
}
