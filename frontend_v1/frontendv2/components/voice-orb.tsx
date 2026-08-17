'use client'

import React, { useEffect, useState } from 'react'
import { Mic } from 'lucide-react'
import { useVoiceAssistant } from '@/components/voice-assistant-provider'

/**
 * VoiceOrb — yagona global AI voice toggle.
 * Sidebar va mobile nav'dan olib tashlandi.
 * Faqat shu komponent AI ni yoqadi/o'chiradi.
 *
 * Mobile: bottom nav ustida, o'ng pastda (bottom-[5rem] right-4)
 * Desktop: fixed bottom-8 right-8
 */
export function VoiceOrb() {
  const { enabled: voiceEnabled, toggle: toggleVoice } = useVoiceAssistant()
  const [mounted, setMounted] = useState(false)

  // Hydration mismatch oldini olish
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return (
    <button
      onClick={toggleVoice}
      aria-label={voiceEnabled ? 'AI Ovozli yordamchini o\'chirish' : 'AI Ovozli yordamchini yoqish'}
      aria-pressed={voiceEnabled}
      title={voiceEnabled ? 'AI faol — bosing o\'chirish uchun' : 'AI Ovozli yordamchini yoqish'}
      className={`
        fixed z-[60]
        bottom-[5.5rem] right-4
        lg:bottom-8 lg:right-8
        flex flex-col items-center justify-center gap-1
        rounded-2xl
        transition-all duration-300 ease-out
        focus-visible:outline-2 focus-visible:outline-[#00FFA3] focus-visible:outline-offset-2
        select-none
        ${voiceEnabled
          ? 'w-16 h-16 lg:w-[4.5rem] lg:h-[4.5rem] border-2 border-[#00FFA3] bg-[rgba(0,255,163,0.15)] text-[#00FFA3] shadow-[0_0_32px_rgba(0,255,163,0.55),0_0_8px_rgba(0,255,163,0.3)] scale-105'
          : 'w-14 h-14 lg:w-16 lg:h-16 border border-[rgba(0,255,163,0.3)] bg-[rgba(7,10,12,0.88)] text-[#64748B] shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-[rgba(0,255,163,0.6)] hover:text-[#00FFA3] hover:bg-[rgba(0,255,163,0.1)] hover:scale-105 active:scale-95'
        }
      `}
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Animated ring — faol holatda */}
      {voiceEnabled && (
        <span
          className="absolute inset-0 rounded-2xl border-2 border-[#00FFA3]/40 animate-ping"
          aria-hidden="true"
          style={{ animationDuration: '2s' }}
        />
      )}

      {/* Mic icon */}
      <Mic
        size={voiceEnabled ? 22 : 20}
        aria-hidden="true"
        className={voiceEnabled ? 'animate-pulse' : 'transition-all duration-200'}
      />

      {/* Label */}
      <span
        className={`text-[9px] font-black tracking-widest uppercase leading-none transition-colors ${
          voiceEnabled ? 'text-[#00FFA3]' : 'text-[#4B5563] group-hover:text-[#00FFA3]'
        }`}
      >
        AI
      </span>
    </button>
  )
}

export default VoiceOrb
