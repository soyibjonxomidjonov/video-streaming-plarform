'use client'

import React, { Suspense, useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, Edit3, Layers, Search, X, Loader2, Play } from 'lucide-react'
import { api, unwrapList, type Episode, type MediaItem } from '@/lib/api'

function formatDuration(seconds?: number): string {
  if (!seconds) return '—'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  const parts = []
  if (h > 0) parts.push(`${h} soat`)
  if (m > 0) parts.push(`${m} daq`)
  if (s > 0) parts.push(`${s} sek`)
  
  return parts.length > 0 ? parts.join(' ') : '0 sek'
}

function EpisodesContent() {
  const searchParams = useSearchParams()
  const initialSeriesId = searchParams.get('series') || ''

  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [seriesList, setSeriesList] = useState<MediaItem[]>([])
  const [filterSeries, setFilterSeries] = useState<string>(initialSeriesId)
  const [formSeries, setFormSeries] = useState<string>(initialSeriesId)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Episode | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // Form states
  const [episodeNumber, setEpisodeNumber] = useState('')
  const [title, setTitle] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [durationSeconds, setDurationSeconds] = useState('')
  const [telegramChannel, setTelegramChannel] = useState('')
  const [telegramMessageId, setTelegramMessageId] = useState('')
  const [telegramFileId, setTelegramFileId] = useState('')
  const [posterUrl, setPosterUrl] = useState('')
  const [posterFile, setPosterFile] = useState<File | null>(null)

  const showToast = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3000)
  }

  const loadData = async (seriesId?: string) => {
    setLoading(true)
    try {
      const [epRes, sRes] = await Promise.allSettled([
        seriesId ? api.seriesEpisodes(seriesId) : api.episodes(),
        api.series(),
      ])
      if (epRes.status === 'fulfilled') setEpisodes(unwrapList(epRes.value))
      if (sRes.status === 'fulfilled') setSeriesList(unwrapList(sRes.value))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData(filterSeries)
  }, [filterSeries])

  const openAddModal = () => {
    setEditingItem(null)
    setTitle('')
    setEpisodeNumber('')
    setDurationHours('')
    setDurationMinutes('')
    setDurationSeconds('')
    setTelegramChannel('')
    setTelegramMessageId('')
    setTelegramFileId('')
    setPosterUrl('')
    setPosterFile(null)
    setShowModal(true)
  }

  const openEditModal = (ep: Episode) => {
    setEditingItem(ep)
    setTitle(ep.title || '')
    setEpisodeNumber(String(ep.episode_number))
    if (ep.duration_seconds) {
      const h = Math.floor(ep.duration_seconds / 3600)
      const mins = Math.floor((ep.duration_seconds % 3600) / 60)
      const secs = ep.duration_seconds % 60
      setDurationHours(h > 0 ? String(h) : '')
      setDurationMinutes(mins > 0 ? String(mins) : '')
      setDurationSeconds(secs > 0 ? String(secs) : '')
    } else {
      setDurationHours('')
      setDurationMinutes('')
      setDurationSeconds('')
    }
    setTelegramChannel(ep.telegram_channel || '')
    setTelegramMessageId(ep.telegram_message_id ? String(ep.telegram_message_id) : '')
    setTelegramFileId(ep.telegram_file_id || '')
    setPosterUrl(ep.poster_url || ep.poster || '')
    setPosterFile(null)
    setFormSeries(String(typeof ep.series === 'object' ? ep.series.id : ep.series))
    setShowModal(true)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!formSeries || !episodeNumber) return
    setSaving(true)
    try {
      const h = Number(durationHours) || 0
      const m = Number(durationMinutes) || 0
      const s = Number(durationSeconds) || 0
      const totalSeconds = (h * 3600) + (m * 60) + s

      const formData = new FormData()
      formData.append('series', formSeries)
      formData.append('episode_number', episodeNumber)
      if (title.trim()) formData.append('title', title.trim())
      if (telegramChannel.trim()) formData.append('telegram_channel', telegramChannel.trim())
      if (telegramMessageId) formData.append('telegram_message_id', telegramMessageId)
      if (telegramFileId.trim()) formData.append('telegram_file_id', telegramFileId.trim())
      if (totalSeconds > 0) formData.append('duration_seconds', totalSeconds.toString())

      if (posterFile) formData.append('poster_image', posterFile)
      else if (posterUrl) formData.append('poster_url', posterUrl)
      
      if (editingItem) {
        await api.updateEpisode(editingItem.id, formData)
        showToast("Epizod muvaffaqiyatli yangilandi ✓")
      } else {
        await api.createEpisode(formData)
        showToast("Epizod muvaffaqiyatli qo'shildi ✓")
      }
      
      setShowModal(false)
      setTitle('')
      setEpisodeNumber('')
      setDurationHours('')
      setDurationMinutes('')
      setDurationSeconds('')
      setTelegramChannel('')
      setTelegramMessageId('')
      setTelegramFileId('')
      setPosterUrl('')
      setPosterFile(null)
      void loadData(filterSeries)
    } catch {
      showToast("Saqlashda xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        showToast("Rasm hajmi 20 MB dan oshmasligi kerak!")
        e.target.value = ''
        return
      }
      setPosterFile(file)
    } else {
      setPosterFile(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Haqiqatan ham ushbu qismni o'chirmoqchimisiz?")) return
    try {
      await api.deleteEpisode(id)
      setEpisodes(prev => prev.filter(e => e.id !== id))
      showToast("Epizod o'chirildi")
    } catch {
      showToast("O'chirishda xatolik yuz berdi")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Filter by Series */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-[#64748B]">Serialni tanlang:</label>
          <select
            value={filterSeries}
            onChange={(e) => setFilterSeries(e.target.value)}
            className="rounded-2xl border border-[rgba(0,255,163,0.2)] bg-[#0F171A] px-4 py-2 text-xs font-bold text-[#F8FAFC] outline-none focus:border-[rgba(0,255,163,0.5)]"
          >
            <option value="">Barcha seriallar</option>
            {seriesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title || `Serial #${s.id}`}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={openAddModal}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[#00FFA3] px-6 py-2.5 text-sm font-bold text-[#070A0C] shadow-[0_0_15px_rgba(0,255,163,0.3)] transition hover:bg-[#1AFFA8]"
        >
          <Plus size={18} /> Yangi epizod qo&apos;shish
        </button>
      </div>

      {notice && (
        <div className="rounded-2xl border border-[rgba(0,255,163,0.3)] bg-[rgba(0,255,163,0.12)] p-3 text-xs font-bold text-[#00FFA3]">
          {notice}
        </div>
      )}

      {/* Episodes Table */}
      <div className="overflow-hidden rounded-3xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[rgba(0,255,163,0.1)] bg-[#0B1013] text-[#64748B] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Qism raqami</th>
                <th className="p-4">Qism sarlavhasi</th>
                <th className="p-4">Serial ID</th>
                <th className="p-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,255,163,0.06)] text-[#F8FAFC]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#64748B]">
                    <Loader2 size={24} className="mx-auto animate-spin text-[#00FFA3]" />
                    <span className="mt-2 block">Yuklanmoqda...</span>
                  </td>
                </tr>
              ) : episodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#64748B]">
                    Epizodlar topilmadi
                  </td>
                </tr>
              ) : (
                episodes.map((ep) => (
                  <tr key={ep.id} className="hover:bg-[#0B1013]/60 transition">
                    <td className="p-4 font-mono font-bold text-[#00FFA3]">#{ep.id}</td>
                    <td className="p-4 font-bold">{ep.episode_number || ep.id}-qism</td>
                    <td className="p-4 text-[#64748B]">{ep.title || 'Nomsiz epizod'}</td>
                    <td className="p-4 font-mono text-[#64748B]">
                      {typeof ep.series === 'object' ? ep.series.id : ep.series}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/watch/series/${typeof ep.series === 'object' ? ep.series.id : ep.series}/${ep.id}`}
                          className="flex size-8 items-center justify-center rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] text-[#00FFA3] hover:bg-[#00FFA3] hover:text-[#070A0C]"
                          title="Pleyerda ko'rish"
                        >
                          <Play size={13} fill="currentColor" />
                        </Link>
                        <button
                          onClick={() => handleDelete(ep.id)}
                          className="flex size-8 items-center justify-center rounded-xl border border-[#ff4d6d]/30 bg-[#ff4d6d]/10 text-[#ff4d6d] hover:bg-[#ff4d6d] hover:text-white"
                          title="O'chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Episode Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 p-0 backdrop-blur-sm transition-all">
          <div className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-[rgba(0,255,163,0.2)] bg-[#0F171A] p-6 shadow-2xl animate-in slide-in-from-right duration-300 sm:p-8">
            <div className="flex items-center justify-between border-b border-[rgba(0,255,163,0.1)] pb-4 mb-6">
              <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
                {editingItem ? 'Epizodni tahrirlash' : 'Yangi qism qo\'shish'}
              </h2>
              <button onClick={() => setShowModal(false)} className="rounded-full p-2 text-[#64748B] transition hover:bg-[rgba(0,255,163,0.1)] hover:text-[#00FFA3]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-1 flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold text-[#64748B]">Serial</label>
                  <select
                    value={formSeries}
                    onChange={(e) => setFormSeries(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[rgba(0,255,163,0.5)]"
                  >
                    <option value="">Serialni tanlang...</option>
                    {seriesList.map((s) => (
                      <option key={s.id} value={s.id}>{s.title || `Serial #${s.id}`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-[#64748B]">Qism raqami</label>
                  <input
                    type="number"
                    min="1"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(e.target.value)}
                    required
                    placeholder="1"
                    className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[rgba(0,255,163,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#64748B]">Davomiyligi</label>
                <div className="flex items-center gap-3">
                  <div className="relative w-full">
                    <input
                      type="number"
                      min="0"
                      value={durationHours}
                      onChange={(e) => setDurationHours(e.target.value)}
                      placeholder="1"
                      className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 pr-10 text-sm text-[#F8FAFC] outline-none focus:border-[rgba(0,255,163,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#00FFA3]">soat</span>
                  </div>
                  <div className="relative w-full">
                    <input
                      type="number"
                      min="0"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      placeholder="45"
                      className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 pr-10 text-sm text-[#F8FAFC] outline-none focus:border-[rgba(0,255,163,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#00FFA3]">daq</span>
                  </div>
                  <div className="relative w-full">
                    <input
                      type="number"
                      min="0"
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(e.target.value)}
                      placeholder="30"
                      className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 pr-10 text-sm text-[#F8FAFC] outline-none focus:border-[rgba(0,255,163,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#00FFA3]">sek</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#64748B]">Qism nomi (ixtiyoriy)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Chapter One: The Vanishing"
                  className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[rgba(0,255,163,0.5)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#64748B]">Poster rasmi (Fayl yoki URL)</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterChange}
                    className="w-full text-xs text-[#64748B] file:mr-2 file:rounded-xl file:border-0 file:bg-[#0B1013] file:px-3 file:py-1.5 file:text-[#00FFA3] hover:file:bg-[#141F24]"
                  />
                  <input
                    type="url"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="yoki URL kiriting: https://..."
                    className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[rgba(0,255,163,0.5)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold text-[#64748B]">Telegram Kanal</label>
                  <input
                    type="text"
                    value={telegramChannel}
                    onChange={(e) => setTelegramChannel(e.target.value)}
                    placeholder="@mychannel"
                    className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[rgba(0,255,163,0.5)]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold text-[#64748B]">Telegram Message ID</label>
                  <input
                    type="number"
                    min="0"
                    value={telegramMessageId}
                    onChange={(e) => setTelegramMessageId(e.target.value)}
                    required
                    placeholder="12345"
                    className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[rgba(0,255,163,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#64748B]">Telegram File ID</label>
                <input
                  type="text"
                  value={telegramFileId}
                  onChange={(e) => setTelegramFileId(e.target.value)}
                  placeholder="BQACAgIAAxkBAA..."
                  className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] outline-none focus:border-[rgba(0,255,163,0.5)]"
                />
              </div>

              <div className="mt-auto pt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] px-6 py-3 text-xs font-bold text-[#F8FAFC] transition hover:bg-[#141F24]"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#00FFA3] px-6 py-3 text-xs font-bold text-[#070A0C] shadow-[0_0_15px_rgba(0,255,163,0.4)] transition hover:bg-[#1AFFA8]"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminEpisodesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#64748B]"><Loader2 className="animate-spin mx-auto text-[#00FFA3]" size={32} /></div>}>
      <EpisodesContent />
    </Suspense>
  )
}
