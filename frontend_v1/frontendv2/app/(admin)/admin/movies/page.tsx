'use client'

import React, { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Edit3, Film, Search, X, Loader2, Play } from 'lucide-react'
import { api, mediaTitle, unwrapList, type MediaItem, type Genre } from '@/lib/api'

export default function AdminMoviesPage() {
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

  const [movies, setMovies] = useState<MediaItem[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [durationSeconds, setDurationSeconds] = useState('')
  const [posterUrl, setPosterUrl] = useState('')
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [telegramChannel, setTelegramChannel] = useState('')
  const [telegramMessageId, setTelegramMessageId] = useState('')
  const [telegramFileId, setTelegramFileId] = useState('')
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])

  const showToast = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [mRes, gRes] = await Promise.allSettled([api.movies(), api.genres()])
      if (mRes.status === 'fulfilled') setMovies(unwrapList(mRes.value))
      if (gRes.status === 'fulfilled') setGenres(unwrapList(gRes.value))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const resetForm = () => {
    setEditingItem(null)
    setTitle('')
    setDescription('')
    setDurationHours('')
    setDurationMinutes('')
    setDurationSeconds('')
    setPosterFile(null)
    setPosterUrl('')
    setTelegramChannel('')
    setTelegramMessageId('')
    setTelegramFileId('')
    setSelectedGenres([])
  }

  const openEditModal = (m: MediaItem) => {
    setEditingItem(m)
    setTitle(m.title || '')
    setDescription(m.description || '')
    
    if (m.duration_seconds) {
      const h = Math.floor(m.duration_seconds / 3600)
      const mins = Math.floor((m.duration_seconds % 3600) / 60)
      const secs = m.duration_seconds % 60
      setDurationHours(h > 0 ? h.toString() : '')
      setDurationMinutes(mins > 0 ? mins.toString() : '')
      setDurationSeconds(secs > 0 ? secs.toString() : '')
    } else {
      setDurationHours('')
      setDurationMinutes('')
      setDurationSeconds('')
    }
    
    setPosterFile(null)
    setPosterUrl(m.poster_image || m.poster_url || m.poster || m.image || '')
    setTelegramChannel(m.telegram_channel || '')
    setTelegramMessageId(m.telegram_message_id?.toString() || '')
    setTelegramFileId(m.telegram_file_id || '')
    if (m.genres) {
      setSelectedGenres(m.genres.map((g: any) => typeof g === 'object' ? g.id : g))
    } else {
      setSelectedGenres([])
    }
    setShowModal(true)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())

      const h = Number(durationHours) || 0
      const m = Number(durationMinutes) || 0
      const s = Number(durationSeconds) || 0
      const totalSeconds = (h * 3600) + (m * 60) + s
      if (totalSeconds > 0) {
        formData.append('duration_seconds', totalSeconds.toString())
      }

      if (posterFile) formData.append('poster_image', posterFile)
      else if (posterUrl) formData.append('poster_url', posterUrl)

      if (telegramChannel.trim()) formData.append('telegram_channel', telegramChannel.trim())
      if (telegramMessageId.trim()) formData.append('telegram_message_id', telegramMessageId.trim())
      if (telegramFileId.trim()) formData.append('telegram_file_id', telegramFileId.trim())

      selectedGenres.forEach(gId => formData.append('genres', gId.toString()))

      if (editingItem) {
        await api.updateMovie(editingItem.id, formData)
        showToast("Film muvaffaqiyatli yangilandi ✓")
      } else {
        await api.createMovie(formData)
        showToast("Yangi film qo'shildi ✓")
      }

      setShowModal(false)
      resetForm()
      void loadData()
    } catch {
      showToast("Xatolik yuz berdi")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Haqiqatan ham ushbu filmni o'chirmoqchimisiz?")) return
    try {
      await api.deleteMovie(id)
      setMovies(prev => prev.filter(m => m.id !== id))
      showToast("Film o'chirildi")
    } catch {
      showToast("O'chirishda xatolik yuz berdi")
    }
  }

  const filteredMovies = movies.filter(m => 
    (m.title || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Filmlarni qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] py-2.5 pl-11 pr-4 text-sm font-bold text-[#F8FAFC] outline-none transition focus:border-[rgba(0,255,163,0.5)]"
          />
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[#00FFA3] px-6 py-2.5 text-sm font-bold text-[#070A0C] shadow-[0_0_15px_rgba(0,255,163,0.3)] transition hover:bg-[#1AFFA8]"
        >
          <Plus size={18} /> Yangi film qo&apos;shish
        </button>
      </div>

      {notice && (
        <div className="rounded-2xl border border-[rgba(0,255,163,0.3)] bg-[rgba(0,255,163,0.12)] p-4 text-sm font-bold text-[#00FFA3] text-center">
          {notice}
        </div>
      )}

      {/* Main Content Area */}
      {!showModal ? (
        <div className="overflow-hidden rounded-3xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[rgba(0,255,163,0.1)] bg-[#0B1013] text-[#64748B] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Film nomi</th>
                  <th className="p-4">Davomiyligi</th>
                  <th className="p-4">Kanal</th>
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
                ) : filteredMovies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#64748B]">
                      Filmlar topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredMovies.map((m) => (
                    <tr key={m.id} className="hover:bg-[#0B1013]/60 transition">
                      <td className="p-4 font-mono font-bold text-[#00FFA3]">#{m.id}</td>
                      <td className="p-4 font-bold">
                        <Link href={`/movie/${m.id}`} className="hover:text-[#00FFA3] transition">
                          {mediaTitle(m)}
                        </Link>
                      </td>
                      <td className="p-4 text-[#64748B]">{formatDuration(m.duration_seconds)}</td>
                      <td className="p-4 text-[#64748B]">{m.telegram_channel || '—'}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(m)}
                            className="flex size-8 items-center justify-center rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] text-[#00FFA3] transition hover:bg-[#00FFA3] hover:text-[#070A0C]"
                            title="Tahrirlash"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="flex size-8 items-center justify-center rounded-xl border border-[#ff4d6d]/30 bg-[#ff4d6d]/10 text-[#ff4d6d] transition hover:bg-[#ff4d6d] hover:text-white"
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
      ) : (
        /* Add / Edit Inline Form */
        <div className="w-full rounded-3xl border border-[rgba(0,255,163,0.2)] bg-[#0F171A] p-6 shadow-xl animate-in fade-in duration-300 sm:p-8">
          <div className="flex items-center justify-between border-b border-[rgba(0,255,163,0.1)] pb-4 mb-6">
            <h2 className="font-display text-xl font-bold text-[#F8FAFC]">
              {editingItem ? 'Filmni tahrirlash' : 'Yangi film qo\'shish'}
            </h2>
            <button onClick={() => setShowModal(false)} className="rounded-full p-2 text-[#64748B] transition hover:bg-[rgba(0,255,163,0.1)] hover:text-[#ff4d6d]">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="flex flex-col gap-5">
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#64748B]">Film nomi</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Masalan: Cyberpunk Elites"
                    className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[rgba(0,255,163,0.5)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#64748B]">Tavsif</label>
                  <textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Film haqida to'liq ma'lumot..."
                    className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[rgba(0,255,163,0.5)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-[#64748B]">Janrlar</label>
                  <div className="flex flex-wrap gap-2 rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] p-4">
                    {genres.length === 0 ? (
                      <span className="text-xs text-[#64748B]">Janrlar topilmadi. Avval janr qo'shing.</span>
                    ) : (
                      genres.map((g) => {
                        const isSelected = selectedGenres.includes(g.id)
                        return (
                          <button
                            type="button"
                            key={g.id}
                            onClick={() => {
                              setSelectedGenres(prev => 
                                isSelected ? prev.filter(id => id !== g.id) : [...prev, g.id]
                              )
                            }}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              isSelected 
                                ? 'bg-[#00FFA3] text-[#070A0C]' 
                                : 'bg-[#0B1013] text-[#64748B] hover:bg-[#141F24]'
                            }`}
                          >
                            {g.name}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-3 rounded-2xl border border-[rgba(0,255,163,0.1)] bg-[#0B1013]/50 p-5">
                  <label className="text-sm font-bold text-[#00FFA3]" title="Asosiy vertikal rasm (kino muqovasi)">Poster (Asosiy rasm)</label>
                  <div className="flex gap-4">
                    <div className="flex flex-1 flex-col gap-3">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          id="poster-upload"
                          className="peer sr-only"
                          onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                        />
                        <label
                          htmlFor="poster-upload"
                          className="flex cursor-pointer items-center justify-between rounded-xl border border-[rgba(0,255,163,0.3)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] transition hover:border-[#00FFA3]"
                        >
                          <span className="truncate max-w-[150px] text-[#64748B]">{posterFile ? posterFile.name : "Kompyuterdan tanlash"}</span>
                          <span className="ml-2 shrink-0 rounded-lg bg-[rgba(0,255,163,0.15)] px-4 py-1.5 text-xs font-bold text-[#00FFA3]">Fayl yuklash</span>
                        </label>
                      </div>
                      <input
                        type="url"
                        value={posterUrl}
                        onChange={(e) => setPosterUrl(e.target.value)}
                        placeholder="yoki internetdan URL link..."
                        className="w-full rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[rgba(0,255,163,0.5)]"
                      />
                    </div>
                    <div className="flex h-[104px] w-[104px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0F171A]">
                      {posterFile ? (
                        <img src={URL.createObjectURL(posterFile)} alt="Preview" className="h-full w-full object-cover" />
                      ) : posterUrl ? (
                        <img src={posterUrl} alt="Preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.src = '')} />
                      ) : (
                        <Film className="text-[#00FFA3]/20" size={32} />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#64748B]">Davomiyligi</label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-full">
                        <input
                          type="number"
                          min="0"
                          value={durationHours}
                          onChange={(e) => setDurationHours(e.target.value)}
                          placeholder="2"
                          className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 pr-12 text-sm text-[#F8FAFC] outline-none transition focus:border-[rgba(0,255,163,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#00FFA3]">soat</span>
                      </div>
                      <div className="relative w-full">
                        <input
                          type="number"
                          min="0"
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(e.target.value)}
                          placeholder="30"
                          className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 pr-12 text-sm text-[#F8FAFC] outline-none transition focus:border-[rgba(0,255,163,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#00FFA3]">daq</span>
                      </div>
                      <div className="relative w-full">
                        <input
                          type="number"
                          min="0"
                          value={durationSeconds}
                          onChange={(e) => setDurationSeconds(e.target.value)}
                          placeholder="0"
                          className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 pr-12 text-sm text-[#F8FAFC] outline-none transition focus:border-[rgba(0,255,163,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-[#00FFA3]">sek</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-[#64748B]">Telegram Kanal</label>
                      <input
                        type="text"
                        value={telegramChannel}
                        onChange={(e) => setTelegramChannel(e.target.value)}
                        placeholder="@mychannel"
                        className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[rgba(0,255,163,0.5)]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-bold text-[#64748B]">Telegram Message ID</label>
                      <input
                        type="number"
                        min="0"
                        value={telegramMessageId}
                        onChange={(e) => setTelegramMessageId(e.target.value)}
                        required
                        placeholder="12345"
                        className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[rgba(0,255,163,0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#64748B]">Telegram File ID</label>
                    <input
                      type="text"
                      value={telegramFileId}
                      onChange={(e) => setTelegramFileId(e.target.value)}
                      placeholder="BQACAgIA..."
                      className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[rgba(0,255,163,0.5)]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-4 pt-6 border-t border-[rgba(0,255,163,0.1)]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] px-6 py-3 text-sm font-bold text-[#F8FAFC] transition hover:bg-[#141F24]"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#00FFA3] px-8 py-3 text-sm font-bold text-[#070A0C] shadow-[0_0_15px_rgba(0,255,163,0.4)] transition hover:bg-[#1AFFA8]"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Saqlash'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
