'use client'

import { useState, useEffect } from 'react'
import { Bell, Mic, Moon, Shield, Volume2 } from 'lucide-react'
import AppChrome from '@/components/app-chrome'
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
    <AppChrome>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#f5a623' }}>
            Sozlamalar
          </p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Tizim Sozlamalari</h1>
        </div>

        <div className="flex flex-col gap-6">
          {/* OVOZLI YORDAMCHI SOZLAMALARI */}
          <section className="rounded-2xl p-6" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
              <Mic size={20} style={{ color: '#f5a623' }} />
              Ovozli Yordamchi
            </h2>

            <div className="flex flex-col gap-5">
              {/* TTS Switch */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Ovozli javob (TTS)</p>
                  <p className="text-xs text-muted-foreground">AI buyruq bajarilgach ovoz chiqarib javob berishi</p>
                </div>
                <button
                  id="tts-toggle"
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`relative flex h-7 w-12 items-center rounded-full p-1 transition ${
                    ttsEnabled ? 'bg-amber-400 justify-end' : 'bg-surface-2 justify-start'
                  }`}
                >
                  <span className="size-5 rounded-full bg-black shadow" />
                </button>
              </div>

              {/* Language selection */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Ovoz tili</p>
                  <p className="text-xs text-muted-foreground">Ovozni tanib olish tili</p>
                </div>
                <select
                  value={voiceLanguage}
                  onChange={e => setVoiceLanguage(e.target.value)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold outline-none"
                  style={{ background: '#202024', border: '1px solid #2a2a30' }}
                >
                  <option value="uz-UZ">O&apos;zbekcha (uz-UZ)</option>
                  <option value="ru-RU">Русский (ru-RU)</option>
                  <option value="en-US">English (en-US)</option>
                </select>
              </div>

              {/* Voice Speed */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Ovoz tezligi</p>
                  <p className="text-xs text-muted-foreground">TTS nutq tezligi</p>
                </div>
                <select
                  value={voiceRate}
                  onChange={e => setVoiceRate(e.target.value)}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold outline-none"
                  style={{ background: '#202024', border: '1px solid #2a2a30' }}
                >
                  <option value="0.8">Sekin (0.8x)</option>
                  <option value="1">Odatdagi (1.0x)</option>
                  <option value="1.2">Tez (1.2x)</option>
                </select>
              </div>
            </div>
          </section>

          {/* BILDIRISHNOMALAR */}
          <section className="rounded-2xl p-6" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
              <Bell size={20} style={{ color: '#f5a623' }} />
              Bildirishnomalar
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Yangi epizod bildirishnomalari</p>
                <p className="text-xs text-muted-foreground">Sevimli seriallarga yangi qism qo&apos;shilganda xabar berish</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative flex h-7 w-12 items-center rounded-full p-1 transition ${
                  notifications ? 'bg-amber-400 justify-end' : 'bg-surface-2 justify-start'
                }`}
              >
                <span className="size-5 rounded-full bg-black shadow" />
              </button>
            </div>
          </section>

          {/* AKKAUNT & XAVFSIZLIK */}
          <section className="rounded-2xl p-6" style={{ background: '#16161a', border: '1px solid #2a2a30' }}>
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
              <Shield size={20} style={{ color: '#f5a623' }} />
              Akkaunt va Xavfsizlik
            </h2>

            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-semibold">{user?.email ?? 'Mehmon'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Maqom:</span>
                <span className="font-semibold" style={{ color: '#f5a623' }}>
                  {user?.is_staff || user?.is_superuser ? 'Admin' : 'Foydalanuvchi'}
                </span>
              </div>
            </div>
          </section>

          {/* SAVE BUTTON */}
          <div className="flex items-center justify-between pt-2">
            {savedNotice ? (
              <span className="text-sm font-semibold text-emerald-400">Sozlamalar saqlandi ✓</span>
            ) : <span />}
            <button
              id="save-settings-btn"
              onClick={saveSettings}
              className="rounded-xl px-6 py-3 text-sm font-bold text-black transition hover:brightness-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
            >
              Sozlamalarni saqlash
            </button>
          </div>
        </div>
      </div>
    </AppChrome>
  )
}
