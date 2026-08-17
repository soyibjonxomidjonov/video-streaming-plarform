'use client'

import React from 'react'
import { Mic, MicOff, Sparkles, AlertCircle, Check, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useVoiceAssistant } from '@/components/voice-assistant-provider'

export function VoiceWidget() {
  const pathname = usePathname()
  const {
    mode,
    cycleMode,
    transcript,
    lastReply,
    status,
    pendingConfirm,
    resolveConfirm,
  } = useVoiceAssistant()

  const isWatching = pathname.startsWith('/watch')

  return (
    <>
      {/* ─── 1. NEON TOP INDICATOR LINE (Watch page only) ─── */}
      {isWatching && (
        <div className="fixed top-0 left-0 right-0 z-50 h-[2px] pointer-events-none">
          <div
            className={`size-full transition-all duration-500 ${
              mode === 'active'
                ? 'bg-[#00FFA3] shadow-[0_0_12px_#00FFA3]'
                : 'bg-white/8'
            }`}
          />
        </div>
      )}

      {/* ─── 2. FLOATING VOICE WIDGET ─── */}
      {/*
        Desktop: bottom-8 right-8
        Mobile: bottom-[calc(5rem+safe-area)] right-4 — bottom nav clearance
      */}
      <div
        className="fixed z-40 flex items-center gap-2.5
          bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4
          md:bottom-8 md:right-8"
      >
        {/* Status Bubble — visible when not minimized */}
        {mode !== 'minimized' && (
          <div
            className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 backdrop-blur-xl shadow-2xl transition-all duration-300 max-w-[220px] ${
              mode === 'active'
                ? 'border-[#00FFA3]/40 bg-[#0F171A]/95 text-[#F8FAFC]'
                : 'border-white/12 bg-[#141F24]/95 text-[#64748B]'
            }`}
          >
            {/* Audio wave bars */}
            {mode === 'active' && (
              <div className="flex shrink-0 items-end gap-0.5 h-4">
                {[0.35, 0.85, 1, 0.65, 0.45].map((h, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-[#00FFA3]"
                    style={{
                      height: `${h * 100}%`,
                      animation: `wave-bar 0.8s ease-in-out infinite`,
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <span className="truncate text-xs font-semibold leading-none tracking-wide">
              {mode === 'active'
                ? transcript || (status === 'thinking' ? "O'ylayapman..." : 'Tinglayapman...')
                : "Mikrofon o'chiq"}
            </span>
          </div>
        )}

        {/* Main Trigger Button */}
        <button
          onClick={cycleMode}
          className={`group relative flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 ${
            mode === 'active'
              ? 'size-16 sm:size-20 bg-gradient-to-tr from-[#0D4D38] via-[#00FFA3] to-[#80FFCB] text-[#070A0C] shadow-[0_0_30px_rgba(0,255,163,0.7)] scale-105'
              : mode === 'muted'
              ? 'size-16 sm:size-20 border-2 border-[rgba(0,255,163,0.3)] bg-[#141F24] text-[rgba(0,255,163,0.6)] shadow-xl hover:border-[#00FFA3] hover:text-[#00FFA3]'
              : 'size-16 sm:size-20 border-2 border-[#00FFA3] bg-[#070A0C]/90 backdrop-blur-xl text-[#00FFA3] shadow-[0_0_30px_rgba(0,255,163,0.5)] hover:scale-110 active:scale-95'
          }`}
          title="1-bosish: Faollashtirish | 2-bosish: Ovozni o'chirish | 3-bosish: Kichraytirish"
          aria-label="AI Voice Assistant"
        >
          {mode === 'active' ? (
            <Mic className="size-8 sm:size-10 stroke-[2.5] animate-pulse text-[#070A0C]" />
          ) : mode === 'muted' ? (
            <MicOff className="size-8 sm:size-10" />
          ) : (
            <Sparkles className="size-8 sm:size-10 transition-transform group-hover:rotate-12" />
          )}

          {/* Ping ring — active state only */}
          {mode === 'active' && (
            <span className="pointer-events-none absolute inset-0 rounded-full border-2 border-[#00FFA3] animate-ping opacity-30" />
          )}
        </button>
      </div>

      {/* ─── 3. AI Reply Bubble ─── */}
      {mode !== 'minimized' && lastReply && (
        <div
          className="pointer-events-none fixed z-[45] max-w-xs rounded-2xl border border-[rgba(0,255,163,0.25)] bg-[#0F171A]/95 px-4 py-3 text-xs text-[#94A3B8] shadow-2xl backdrop-blur-xl leading-relaxed
            bottom-[calc(9.5rem+env(safe-area-inset-bottom))] right-4
            md:bottom-36 md:right-8"
        >
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#00FFA3]">AI Javob</p>
          <p className="line-clamp-3">{lastReply}</p>
        </div>
      )}

      {/* ─── 4. CONFIRMATION DIALOG ─── */}
      {pendingConfirm && (
        <div
          className="fixed z-[60] max-w-xs rounded-2xl border border-[#EF4444]/35 bg-[#0F171A]/95 p-4 shadow-2xl backdrop-blur-xl
            bottom-[calc(10rem+env(safe-area-inset-bottom))] right-4
            md:bottom-40 md:right-8"
        >
          <p className="flex items-start gap-2 text-xs font-semibold text-[#EF4444]">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            {pendingConfirm.message}
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => resolveConfirm(true)}
              className="flex items-center gap-1 rounded-xl bg-[#00FFA3] px-4 py-1.5 text-xs font-bold text-[#070A0C] shadow-[0_0_10px_rgba(0,255,163,0.3)] transition hover:bg-[#1AFFA8] min-h-[36px]"
            >
              <Check size={12} /> Ha
            </button>
            <button
              onClick={() => resolveConfirm(false)}
              className="flex items-center gap-1 rounded-xl border border-white/12 bg-[#141F24] px-4 py-1.5 text-xs font-bold text-[#F8FAFC] transition hover:bg-[#0F171A] min-h-[36px]"
            >
              <X size={12} /> Yo&apos;q
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default VoiceWidget
