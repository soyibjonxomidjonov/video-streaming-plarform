'use client'

import React, { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Edit3, Tv, Search, X, Loader2 } from 'lucide-react'
import { api, mediaTitle, unwrapList, type MediaItem, type Genre } from '@/lib/api'

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
  const [posterFile, setPosterFile] = useState<File | null>(null)
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
    setPosterFile(null)
    setSelectedGenres([])
    setShowModal(true)
  }

  const openEditModal = (item: MediaItem) => {
    setEditingItem(item)
    setTitle(item.title || '')
    setDescription(item.description || '')
    setPosterUrl(item.poster_image || item.poster_url || item.poster || item.image || '')
    setPosterFile(null)
    if (item.genres) {
      setSelectedGenres(item.genres.map((g: any) => typeof g === 'object' ? g.id : g))
    } else {
      setSelectedGenres([])
    }
    setShowModal(true)
  }

  const resetForm = () => {
    setEditingItem(null)
    setTitle('')
    setDescription('')
    setPosterUrl('')
    setBackdropUrl('')
    setPosterFile(null)
    setBackdropFile(null)
    setSelectedGenres([])
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      if (description.trim()) formData.append('description', description.trim())
      if (posterFile) formData.append('poster_image', posterFile)
      else if (posterUrl) formData.append('poster_url', posterUrl)

      selectedGenres.forEach(gId => formData.append('genres', gId.toString()))

      if (editingItem?.id) {
        await api.updateSeries(editingItem.id, formData)
        showToast("Serial muvaffaqiyatli tahrirlandi ✓")
      } else {
        await api.createSeries(formData)
        showToast("Yangi serial qo'shildi ✓")
      }
      setShowModal(false)
      setTitle('')
      setDescription('')
      setPosterUrl('')
      setPosterFile(null)
      setSelectedGenres([])
      void loadData()
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
        showToast("Poster rasmi hajmi 20 MB dan oshmasligi kerak!")
        e.target.value = ''
        return
      }
      setPosterFile(file)
    } else {
      setPosterFile(null)
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl rounded-3xl border border-[rgba(0,255,163,0.3)] bg-[#0F171A] p-6 shadow-xl animate-in fade-in duration-300 sm:p-8">
            <div className="flex items-center justify-between border-b border-[rgba(0,255,163,0.1)] pb-4 mb-6">
              <h2 className="font-display text-xl font-bold text-[#F8FAFC]">
                {editingItem ? 'Serialni tahrirlash' : 'Yangi serial qo\'shish'}
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
                    <label className="mb-2 block text-sm font-bold text-[#64748B]">Serial nomi</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="Masalan: Stranger Things"
                      className="w-full rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-3 text-sm text-[#F8FAFC] outline-none transition focus:border-[rgba(0,255,163,0.5)]"
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
                            onChange={handlePosterChange}
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
                          <Tv className="text-[#00FFA3]/20" size={32} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-[rgba(0,255,163,0.1)] pt-6">
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
                  {saving ? <Loader2 size={18} className="animate-spin" /> : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
