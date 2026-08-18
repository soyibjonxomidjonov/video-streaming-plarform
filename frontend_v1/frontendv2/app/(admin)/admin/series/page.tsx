'use client'

import React, { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Edit3, Tv, Search, X, Loader2 } from 'lucide-react'
import { api, mediaTitle, unwrapList, type MediaItem } from '@/lib/api'

export default function AdminSeriesPage() {
  const [series, setSeries] = useState<MediaItem[]>([])
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
  const [posterFile, setPosterFile] = useState<File | null>(null)
  const [backdropFile, setBackdropFile] = useState<File | null>(null)
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])

  const showToast = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [sRes, gRes] = await Promise.allSettled([api.series(), api.genres()])
      if (sRes.status === 'fulfilled') setSeries(unwrapList(sRes.value))
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
    setPosterFile(null)
    setBackdropFile(null)
    setSelectedGenres([])
    setShowModal(true)
  }

  const openEditModal = (item: MediaItem) => {
    setEditingItem(item)
    setTitle(item.title || '')
    setDescription(item.description || '')
    setPosterUrl(item.poster_url || item.poster || '')
    setBackdropUrl(item.backdrop_url || item.backdrop || '')
    setPosterFile(null)
    setBackdropFile(null)
    if (item.genres) {
      setSelectedGenres(item.genres.map((g: any) => typeof g === 'object' ? g.id : g))
    } else {
      setSelectedGenres([])
    }
    setShowModal(true)
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      let payload: Partial<MediaItem> | FormData

      if (posterFile || backdropFile || true) {
        const formData = new FormData()
        formData.append('title', title.trim())
        if (description.trim()) formData.append('description', description.trim())
        if (posterFile) formData.append('poster_image', posterFile)
        else if (posterUrl) formData.append('poster_url', posterUrl)

        if (backdropFile) formData.append('backdrop_image', backdropFile)
        else if (backdropUrl) formData.append('backdrop_url', backdropUrl)

        selectedGenres.forEach(gId => formData.append('genres', gId.toString()))

        if (editingItem) {
          payload = formData
        } else {
          payload = formData
        }
      } else {
        payload = {
          title: title.trim(),
          description: description.trim(),
          poster_url: posterUrl.trim(),
          backdrop_url: backdropUrl.trim(),
        }
      }

      if (editingItem?.id) {
        await api.updateSeries(editingItem.id, payload)
        showToast("Serial muvaffaqiyatli tahrirlandi ✓")
      } else {
        await api.createSeries(payload)
        showToast("Yangi serial qo'shildi ✓")
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
    if (!confirm("Haqiqatan ham ushbu serialni o'chirmoqchimisiz?")) return
    try {
      await api.deleteSeries(id)
      setSeries(prev => prev.filter(s => s.id !== id))
      showToast("Serial o'chirildi")
    } catch {
      showToast("O'chirishda xatolik yuz berdi")
    }
  }

  const filteredSeries = series.filter(s =>
    (s.title || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-2.5 flex-1 max-w-md">
          <Search size={16} className="text-[#64748B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Seriallar orasidan qidirish..."
            className="w-full bg-transparent text-xs text-[#F8FAFC] outline-none"
          />
        </div>

        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[#00FFA3] px-6 py-2.5 text-sm font-bold text-[#070A0C] shadow-[0_0_15px_rgba(0,255,163,0.3)] transition hover:bg-[#1AFFA8]"
        >
          <Plus size={18} /> Yangi serial qo&apos;shish
        </button>
      </div>

      {notice && (
        <div className="rounded-2xl border border-[rgba(0,255,163,0.3)] bg-[rgba(0,255,163,0.12)] p-3 text-xs font-bold text-[#00FFA3]">
          {notice}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[rgba(0,255,163,0.1)] bg-[#0B1013] text-[#64748B] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Serial nomi</th>
                <th className="p-4">Tavsif</th>
                <th className="p-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(0,255,163,0.06)] text-[#F8FAFC]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#64748B]">
                    <Loader2 size={24} className="mx-auto animate-spin text-[#00FFA3]" />
                    <span className="mt-2 block">Yuklanmoqda...</span>
                  </td>
                </tr>
              ) : filteredSeries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#64748B]">
                    Seriallar topilmadi
                  </td>
                </tr>
              ) : (
                filteredSeries.map((s) => (
                  <tr key={s.id} className="hover:bg-[#0B1013]/60 transition">
                    <td className="p-4 font-mono font-bold text-[#00FFA3]">#{s.id}</td>
                    <td className="p-4 font-bold">
                      <Link href={`/series/${s.id}`} className="hover:text-[#00FFA3] transition">
                        {mediaTitle(s)}
                      </Link>
                    </td>
                    <td className="p-4 text-[#64748B] line-clamp-1 max-w-xs">{s.description || '—'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/episodes?series=${s.id}`}
                          className="flex items-center gap-1 rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] px-3 py-1.5 text-xs font-bold text-[#00FFA3] hover:bg-[#00FFA3] hover:text-[#070A0C]"
                        >
                          Qismlar
                        </Link>
                        <button
                          onClick={() => openEditModal(s)}
                          className="flex size-8 items-center justify-center rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] text-[#00FFA3] transition hover:bg-[#00FFA3] hover:text-[#070A0C]"
                          title="Tahrirlash"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl border border-[rgba(0,255,163,0.3)] bg-[#0F171A] p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[rgba(0,255,163,0.1)] pb-4 mb-5">
              <h2 className="font-display text-lg font-bold text-[#F8FAFC]">
                {editingItem ? 'Serialni tahrirlash' : 'Yangi serial qo\'shish'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[#64748B] hover:text-[#F8FAFC]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#F8FAFC]">Serial nomi</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Masalan: Stranger Things"
                  className="w-full rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] px-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none focus:border-[#00FFA3]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-[#64748B]">Tavsif</label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Serial haqida to'liq ma'lumot..."
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

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#F8FAFC]">Poster (Fayl yoki URL)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-[#64748B] file:mr-2 file:rounded-xl file:border-0 file:bg-[#0B1013] file:px-3 file:py-1.5 file:text-[#00FFA3] hover:file:bg-[#141F24]"
                  />
                  <input
                    type="url"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="yoki URL: https://..."
                    className="w-full rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] px-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none focus:border-[#00FFA3]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-[#F8FAFC]">Backdrop (Fayl yoki URL)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBackdropFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-[#64748B] file:mr-2 file:rounded-xl file:border-0 file:bg-[#0B1013] file:px-3 file:py-1.5 file:text-[#00FFA3] hover:file:bg-[#141F24]"
                  />
                  <input
                    type="url"
                    value={backdropUrl}
                    onChange={(e) => setBackdropUrl(e.target.value)}
                    placeholder="yoki URL: https://..."
                    className="w-full rounded-xl border border-[rgba(0,255,163,0.2)] bg-[#0B1013] px-3.5 py-2.5 text-xs text-[#F8FAFC] outline-none focus:border-[#00FFA3]"
                  />
                </div>
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
