'use client'

import React, { Suspense, useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, Edit3, Layers, Search, X, Loader2, Play } from 'lucide-react'
import { api, unwrapList, type Episode, type MediaItem } from '@/lib/api'

function EpisodesContent() {
  const searchParams = useSearchParams()
  const initialSeriesId = searchParams.get('series') || ''

  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [seriesList, setSeriesList] = useState<MediaItem[]>([])
  const [selectedSeries, setSelectedSeries] = useState<string>(initialSeriesId)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // Form states
  const [episodeNumber, setEpisodeNumber] = useState('')
  const [title, setTitle] = useState('')
  const [durationSeconds, setDurationSeconds] = useState('')
  const [telegramChannel, setTelegramChannel] = useState('')
  const [telegramFileId, setTelegramFileId] = useState('')

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
    void loadData(selectedSeries)
  }, [selectedSeries])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedSeries || !episodeNumber) return
    setSaving(true)
    try {
      const payload: Partial<Episode> = {
        series: Number(selectedSeries),
        episode_number: Number(episodeNumber),
        title: title.trim(),
        duration_seconds: durationSeconds ? Number(durationSeconds) : undefined,
      }
      await api.createEpisode(payload)
      showToast("Epizod muvaffaqiyatli qo'shildi ✓")
      setShowModal(false)
      setTitle('')
      setEpisodeNumber('')
      setDurationSeconds('')
      void loadData(selectedSeries)
    } catch {
      showToast("Epizod qo'shishda xatolik yuz berdi")
    } finally {
      setSaving(false)
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
            value={selectedSeries}
            onChange={(e) => setSelectedSeries(e.target.value)}
            className="rounded-2xl border border-[rgba(0,255,163,0.2)] bg-[#0F171A] px-4 py-2 text-xs font-bold text-[#F8FAFC] outline-none focus:border-[#00FFA3]"
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
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-2xl bg-[#00FFA3] px-5 py-2.5 text-xs font-bold text-[#070A0C] shadow-[0_0_15px_rgba(0,255,163,0.3)] transition hover:bg-[#1AFFA8]"
        >
          <Plus size={16} /> Yangi qism qo&apos;shish
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-[rgba(0,255,163,0.3)] bg-[#0F171A] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(0,255,163,0.1)] pb-4 mb-5">
              <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
                Yangi epizod qo&apos;shish
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#F8FAFC]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#F8FAFC]">Serial</label>
                <select
                  value={selectedSeries}
                  onChange={(e) => setSelectedSeries(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] px-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none"
                >
                  <option value="">Serialni tanlang...</option>
                  {seriesList.map((s) => (
                    <option key={s.id} value={s.id}>{s.title || `Serial #${s.id}`}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#F8FAFC]">Qism raqami</label>
                  <input
                    type="number"
                    value={episodeNumber}
                    onChange={(e) => setEpisodeNumber(e.target.value)}
                    required
                    placeholder="1"
                    className="w-full rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] px-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none focus:border-[#00FFA3]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#F8FAFC]">Davomiyligi (s)</label>
                  <input
                    type="number"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(e.target.value)}
                    placeholder="2400"
                    className="w-full rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] px-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none focus:border-[#00FFA3]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#F8FAFC]">Qism sarlavhasi</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Chapter One: The Vanishing"
                  className="w-full rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] px-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none focus:border-[#00FFA3]"
                />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] px-5 py-2.5 text-xs font-bold text-[#F8FAFC]"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#00FFA3] px-6 py-2.5 text-xs font-bold text-[#070A0C] shadow-[0_0_15px_rgba(0,255,163,0.4)] hover:bg-[#1AFFA8]"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : 'Qo\'shish'}
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
