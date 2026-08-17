'use client'

import React, { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Edit3, Film, Search, X, Loader2, Play } from 'lucide-react'
import { api, mediaTitle, unwrapList, type MediaItem, type Genre } from '@/lib/api'

export default function AdminMoviesPage() {
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
  const [posterUrl, setPosterUrl] = useState('')
  const [backdropUrl, setBackdropUrl] = useState('')
  const [telegramChannel, setTelegramChannel] = useState('')
  const [telegramFileId, setTelegramFileId] = useState('')
  const [durationSeconds, setDurationSeconds] = useState('')

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

  const openAddModal = () => {
    setEditingItem(null)
    setTitle('')
    setDescription('')
    setPosterUrl('')
    setBackdropUrl('')
    setTelegramChannel('')
    setTelegramFileId('')
    setDurationSeconds('')
    setShowModal(true)
  }

  const openEditModal = (item: MediaItem) => {
    setEditingItem(item)
    setTitle(item.title || '')
    setDescription(item.description || '')
    setPosterUrl(item.poster_url || item.poster || '')
    setBackdropUrl(item.backdrop_url || item.backdrop || '')
    setTelegramChannel(item.telegram_channel || '')
    setTelegramFileId((item as any).telegram_file_id || '')
    setDurationSeconds(item.duration_seconds ? String(item.duration_seconds) : '')
    setShowModal(true)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const payload: Partial<MediaItem> = {
        title: title.trim(),
        description: description.trim(),
        poster_url: posterUrl.trim(),
        backdrop_url: backdropUrl.trim(),
        telegram_channel: telegramChannel.trim(),
        ...(durationSeconds ? { duration_seconds: Number(durationSeconds) } : {}),
      }

      if (editingItem?.id) {
        await api.updateMovie(editingItem.id, payload)
        showToast("Film muvaffaqiyatli tahrirlandi ✓")
      } else {
        await api.createMovie(payload)
        showToast("Yangi film qo'shildi ✓")
      }
      setShowModal(false)
      void loadData()
    } catch {
      showToast("Saqlashda xatolik yuz berdi")
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
      {/* Header Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-2xl border border-[rgba(0,229,153,0.18)] bg-[#101514] px-4 py-2.5 flex-1 max-w-md">
          <Search size={16} className="text-[#8c9994]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filmlar orasidan qidirish..."
            className="w-full bg-transparent text-xs text-[#f5f7f6] outline-none"
          />
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-2xl bg-[#00e599] px-5 py-2.5 text-xs font-bold text-[#080a0a] shadow-[0_0_15px_rgba(0,229,153,0.3)] transition hover:bg-[#1df2ad]"
        >
          <Plus size={16} /> Yangi film qo&apos;shish
        </button>
      </div>

      {notice && (
        <div className="rounded-2xl border border-[rgba(0,229,153,0.3)] bg-[rgba(0,229,153,0.12)] p-3 text-xs font-bold text-[#00e599]">
          {notice}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-[rgba(0,229,153,0.15)] bg-[#101514] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[rgba(0,229,153,0.1)] bg-[#161f1c] text-[#8c9994] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Film nomi</th>
                <th className="p-4">Davomiyligi</th>
                <th className="p-4">Kanal</th>
                <th className="p-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,229,153,0.06)] text-[#f5f7f6]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#8c9994]">
                    <Loader2 size={24} className="mx-auto animate-spin text-[#00e599]" />
                    <span className="mt-2 block">Yuklanmoqda...</span>
                  </td>
                </tr>
              ) : filteredMovies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#8c9994]">
                    Filmlar topilmadi
                  </td>
                </tr>
              ) : (
                filteredMovies.map((m) => (
                  <tr key={m.id} className="hover:bg-[#161f1c]/60 transition">
                    <td className="p-4 font-mono font-bold text-[#00e599]">#{m.id}</td>
                    <td className="p-4 font-bold">
                      <Link href={`/movie/${m.id}`} className="hover:text-[#00e599] transition">
                        {mediaTitle(m)}
                      </Link>
                    </td>
                    <td className="p-4 text-[#8c9994]">{m.duration_seconds ? `${Math.round(m.duration_seconds / 60)} daq` : '—'}</td>
                    <td className="p-4 text-[#8c9994]">{m.telegram_channel || '—'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(m)}
                          className="flex size-8 items-center justify-center rounded-xl border border-[rgba(0,229,153,0.2)] bg-[#161f1c] text-[#00e599] transition hover:bg-[#00e599] hover:text-[#080a0a]"
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-[rgba(0,229,153,0.3)] bg-[#101514] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(0,229,153,0.1)] pb-4 mb-5">
              <h2 className="font-display text-lg font-bold text-[#f5f7f6]">
                {editingItem ? 'Filmni tahrirlash' : 'Yangi film qo\'shish'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#8c9994] hover:text-[#f5f7f6]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#f5f7f6]">Film nomi</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Masalan: Cyberpunk Elites"
                  className="w-full rounded-xl border border-[rgba(0,229,153,0.2)] bg-[#161f1c] px-3.5 py-2.5 text-xs text-[#f5f7f6] outline-none focus:border-[#00e599]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-[#f5f7f6]">Tavsif</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Film haqida qisqacha..."
                  className="w-full rounded-xl border border-[rgba(0,229,153,0.2)] bg-[#161f1c] px-3.5 py-2.5 text-xs text-[#f5f7f6] outline-none focus:border-[#00e599]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#f5f7f6]">Poster URL</label>
                  <input
                    type="url"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-[rgba(0,229,153,0.2)] bg-[#161f1c] px-3.5 py-2.5 text-xs text-[#f5f7f6] outline-none focus:border-[#00e599]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#f5f7f6]">Backdrop URL</label>
                  <input
                    type="url"
                    value={backdropUrl}
                    onChange={(e) => setBackdropUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-[rgba(0,229,153,0.2)] bg-[#161f1c] px-3.5 py-2.5 text-xs text-[#f5f7f6] outline-none focus:border-[#00e599]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#f5f7f6]">Telegram Kanal</label>
                  <input
                    type="text"
                    value={telegramChannel}
                    onChange={(e) => setTelegramChannel(e.target.value)}
                    placeholder="@mychannel"
                    className="w-full rounded-xl border border-[rgba(0,229,153,0.2)] bg-[#161f1c] px-3.5 py-2.5 text-xs text-[#f5f7f6] outline-none focus:border-[#00e599]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#f5f7f6]">Davomiyligi (soniya)</label>
                  <input
                    type="number"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(e.target.value)}
                    placeholder="7200"
                    className="w-full rounded-xl border border-[rgba(0,229,153,0.2)] bg-[#161f1c] px-3.5 py-2.5 text-xs text-[#f5f7f6] outline-none focus:border-[#00e599]"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-[rgba(0,229,153,0.2)] bg-[#161f1c] px-5 py-2.5 text-xs font-bold text-[#f5f7f6]"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#00e599] px-6 py-2.5 text-xs font-bold text-[#080a0a] shadow-[0_0_15px_rgba(0,229,153,0.4)] hover:bg-[#1df2ad]"
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
