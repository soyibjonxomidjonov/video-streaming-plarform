'use client'

import { useEffect, useState } from 'react'
import { Loader2, Mic, MicOff, Volume2 } from 'lucide-react'
import { useVoiceAssistant } from '@/components/voice-assistant-provider'

const STATUS_LABEL: Record<string, string> = {
  idle: '',
  connecting: 'Ulanmoqda...',
  listening: 'Tinglayapman...',
  thinking: "O'ylayapman...",
  speaking: 'Javob beryapman...',
  error: 'Xatolik',
}

export default function VoiceOrb() {
  const { enabled, status, transcript, lastReply, errorMessage, pendingConfirm, isVideoPlaying, toggle, resolveConfirm } = useVoiceAssistant()
  const [manuallyExpanded, setManuallyExpanded] = useState(false)

  useEffect(() => {
    if (!isVideoPlaying) setManuallyExpanded(false)
  }, [isVideoPlaying])

  const minimized = enabled && isVideoPlaying && !manuallyExpanded
  const message = pendingConfirm?.message || errorMessage || lastReply || transcript
  const label = STATUS_LABEL[status] ?? ''

  if (minimized) {
    return (
      <button
        onClick={() => setManuallyExpanded(true)}
        aria-label="Ovozli yordamchini kengaytirish"
        className="fixed right-0 top-1/2 z-50 flex h-24 w-2.5 -translate-y-1/2 items-center justify-center rounded-l-full bg-primary/80 shadow-lg transition hover:w-3.5 hover:bg-primary"
      >
        <span className="sr-only">Ovozli yordamchi faol</span>
      </button>
    )
  }

  return (
    <div className="fixed right-4 top-1/2 z-50 flex -translate-y-1/2 flex-col items-end gap-3">
      {(enabled || status === 'error') && (message || label) && (
        <div className="max-w-64 rounded-2xl border border-border bg-card/95 p-4 text-right shadow-2xl backdrop-blur-xl">
          {label && <p className="text-xs font-semibold uppercase tracking-[.14em] text-primary">{label}</p>}
          {message && <p className="mt-1 text-sm leading-relaxed text-foreground">{message}</p>}
          {pendingConfirm && (
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => resolveConfirm(true)}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                Ha
              </button>
              <button
                onClick={() => resolveConfirm(false)}
                className="rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-semibold"
              >
                Yo&apos;q
              </button>
            </div>
          )}
          {enabled && isVideoPlaying && (
            <button onClick={() => setManuallyExpanded(false)} className="mt-3 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Yig&apos;ish
            </button>
          )}
        </div>
      )}

      <button
        onClick={toggle}
        aria-label={enabled ? "Ovozli yordamchini o'chirish" : 'Ovozli yordamchini yoqish'}
        aria-pressed={enabled}
        className="relative flex size-16 items-center justify-center rounded-full"
      >
        {enabled && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary/40 animate-orb-pulse" />
            <span className="absolute inset-[-6px] rounded-full border border-primary/30 animate-orb-spin-slow" style={{ borderStyle: 'dashed' }} />
          </>
        )}
        <span
          className={`relative flex size-14 items-center justify-center rounded-full shadow-2xl transition ${
            status === 'error'
              ? 'bg-secondary text-accent ring-2 ring-accent/60'
              : enabled
                ? 'bg-primary text-primary-foreground glow-primary'
                : 'bg-card text-muted-foreground ring-1 ring-border hover:text-primary'
          }`}
        >
          {status === 'thinking' || status === 'connecting' ? (
            <Loader2 size={22} className="animate-spin" />
          ) : status === 'speaking' ? (
            <Volume2 size={22} />
          ) : status === 'error' ? (
            <MicOff size={22} />
          ) : (
            <Mic size={22} />
          )}
        </span>
      </button>
    </div>
  )
}
