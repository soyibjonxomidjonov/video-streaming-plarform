'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Mic, Shield, Check } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

export default function SettingsPage() {
  const { user } = useAuth()
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [voiceLanguage, setVoiceLanguage] = useState('uz-UZ')
  const [voiceRate, setVoiceRate] = useState('1')
  const [notifications, setNotifications] = useState(true)
  const [savedNotice, setSavedNotice] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTts = localStorage.getItem('sm_tts_enabled')
      if (savedTts !== null) setTtsEnabled(savedTts === 'true')
      const savedLang = localStorage.getItem('sm_voice_lang')
      if (savedLang) setVoiceLanguage(savedLang)
      const savedRate = localStorage.getItem('sm_voice_rate')
      if (savedRate) setVoiceRate(savedRate)
    }
  }, [])

  const saveSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sm_tts_enabled', String(ttsEnabled))
      localStorage.setItem('sm_voice_lang', voiceLanguage)
      localStorage.setItem('sm_voice_rate', voiceRate)
    }
    setSavedNotice(true)
    setTimeout(() => setSavedNotice(false), 2500)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-[#00FFA3]">
          SOZLAMALAR & KONFIGURATSIYA
        </p>
        <h1 className="font-display text-3xl font-extrabold text-[#F8FAFC] sm:text-4xl tracking-tight">
          Tizim va Ovoz Sozlamalari
        </h1>
      </div>

      <div className="flex flex-col gap-8 w-full">
        {/* OVOZLI YORDAMCHI SOZLAMALARI */}
        <section className="w-full space-y-4">
          <h2 className="flex items-center gap-3 font-display text-2xl sm:text-3xl font-bold text-white mb-4">
            <Mic size={28} className="text-[#00FFA3]" />
            AI Ovozli Yordamchi
          </h2>

          <div className="flex flex-col gap-4 w-full">
            {/* TTS Switch */}
            <div className="w-full p-5 sm:p-6 rounded-2xl bg-[#0F171A] border border-[#00FFA3]/15 flex items-center justify-between gap-4 hover:border-[#00FFA3]/30 transition-all">
              <div>
                <p className="text-lg font-semibold text-white">Ovozli javob (TTS)</p>
                <p className="text-sm text-slate-400 mt-1">AI har bir buyruq bajarilgach ovozli javob qaytarishi</p>
              </div>
              <button
                onClick={() => setTtsEnabled(!ttsEnabled)}
                data-checked={ttsEnabled}
                className="w-14 h-8 bg-[#141F24] rounded-full p-1 border border-[#00FFA3]/30 cursor-pointer data-[checked=true]:bg-[#00FFA3] flex items-center transition-colors"
                style={{ justifyContent: ttsEnabled ? 'flex-end' : 'flex-start' }}
              >
                <span className={`size-6 rounded-full shadow-md transition-transform ${ttsEnabled ? 'bg-[#070A0C]' : 'bg-[#64748B]'}`} />
              </button>
            </div>

            {/* Language selection */}
            <div className="w-full p-5 sm:p-6 rounded-2xl bg-[#0F171A] border border-[#00FFA3]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#00FFA3]/30 transition-all">
              <div>
                <p className="text-lg font-semibold text-white">Ovoz tili</p>
                <p className="text-sm text-slate-400 mt-1">Ovozni tanib olish va gapirish tili</p>
              </div>
              <select
                value={voiceLanguage}
                onChange={(e) => setVoiceLanguage(e.target.value)}
                className="h-12 px-4 rounded-xl bg-[#0B1013] border border-[#00FFA3]/20 text-white text-base outline-none min-w-[200px]"
              >
                <option value="uz-UZ">O&apos;zbekcha (uz-UZ)</option>
                <option value="ru-RU">Русский (ru-RU)</option>
                <option value="en-US">English (en-US)</option>
              </select>
            </div>

            {/* Voice Speed */}
            <div className="w-full p-5 sm:p-6 rounded-2xl bg-[#0F171A] border border-[#00FFA3]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#00FFA3]/30 transition-all">
              <div>
                <p className="text-lg font-semibold text-white">Ovoz tezligi</p>
                <p className="text-sm text-slate-400 mt-1">Sintez qilingan nutq tezligi</p>
              </div>
              <select
                value={voiceRate}
                onChange={(e) => setVoiceRate(e.target.value)}
                className="h-12 px-4 rounded-xl bg-[#0B1013] border border-[#00FFA3]/20 text-white text-base outline-none min-w-[200px]"
              >
                <option value="0.8">Sekin (0.8x)</option>
                <option value="1">Odatdagi (1.0x)</option>
                <option value="1.2">Tez (1.2x)</option>
              </select>
            </div>
          </div>
        </section>

        {/* BILDIRISHNOMALAR */}
        <section className="w-full space-y-4">
          <h2 className="flex items-center gap-3 font-display text-2xl sm:text-3xl font-bold text-white mb-4">
            <Bell size={28} className="text-[#00FFA3]" />
            Bildirishnomalar
          </h2>

          <div className="w-full p-5 sm:p-6 rounded-2xl bg-[#0F171A] border border-[#00FFA3]/15 flex items-center justify-between gap-4 hover:border-[#00FFA3]/30 transition-all">
            <div>
              <p className="text-lg font-semibold text-white">Yangi epizod bildirishnomalari</p>
              <p className="text-sm text-slate-400 mt-1">Sevimli seriallarga yangi qism qo&apos;shilganda xabar berish</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              data-checked={notifications}
              className="w-14 h-8 bg-[#141F24] rounded-full p-1 border border-[#00FFA3]/30 cursor-pointer data-[checked=true]:bg-[#00FFA3] flex items-center transition-colors"
              style={{ justifyContent: notifications ? 'flex-end' : 'flex-start' }}
            >
              <span className={`size-6 rounded-full shadow-md transition-transform ${notifications ? 'bg-[#070A0C]' : 'bg-[#64748B]'}`} />
            </button>
          </div>
        </section>

        {/* AKKAUNT & XAVFSIZLIK */}
        <section className="w-full space-y-4">
          <h2 className="flex items-center gap-3 font-display text-2xl sm:text-3xl font-bold text-white mb-4">
            <Shield size={28} className="text-[#00FFA3]" />
            Akkaunt va Xavfsizlik
          </h2>

          <div className="w-full p-5 sm:p-6 rounded-2xl bg-[#0F171A] border border-[#00FFA3]/15 flex flex-col gap-4 hover:border-[#00FFA3]/30 transition-all">
            <div className="flex justify-between items-center py-3 border-b border-[rgba(0,255,163,0.1)]">
              <span className="text-base text-slate-400">Email manzili:</span>
              <span className="text-lg font-bold text-white">{user?.email ?? 'Mehmon'}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-base text-slate-400">Ruxsat darajasi:</span>
              <span className="text-lg font-bold text-[#00FFA3]">
                {user?.is_staff || user?.is_superuser ? 'Admin (Staff)' : 'Foydalanuvchi'}
              </span>
            </div>
          </div>
        </section>

        {/* SAVE BUTTON */}
        <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between border-t border-[rgba(0,255,163,0.15)]">
          {savedNotice ? (
            <span className="flex items-center gap-2 text-base font-bold text-[#00FFA3] bg-[rgba(0,255,163,0.1)] px-4 py-2 rounded-xl">
              <Check size={20} /> Sozlamalar muvaffaqiyatli saqlandi!
            </span>
          ) : (
            <span />
          )}
          <button
            onClick={saveSettings}
            className="px-8 py-4 text-base font-bold bg-[#00FFA3] text-black rounded-xl hover:shadow-[0_0_25px_rgba(0,255,163,0.5)] transition-all flex-shrink-0"
          >
            Sozlamalarni Saqlash
          </button>
        </div>
      </div>
    </div>
  )
}
