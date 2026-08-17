'use client'

import React, { useEffect, useState, type FormEvent } from 'react'
import { Plus, Trash2, Clapperboard, Loader2 } from 'lucide-react'
import { api, unwrapList, type Genre } from '@/lib/api'

export default function AdminGenresPage() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 3000)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await api.genres()
      setGenres(unwrapList(data))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const created = await api.createGenre({ name: name.trim() })
      setGenres(prev => [...prev, created ?? { id: Date.now(), name: name.trim() }])
      setName('')
      showToast("Janr muvaffaqiyatli qo'shildi ✓")
    } catch {
      showToast("Janr qo'shishda xatolik")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Haqiqatan ham ushbu janrni o'chirmoqchimisiz?")) return
    try {
      await api.deleteGenre(id)
      setGenres(prev => prev.filter(g => g.id !== id))
      showToast("Janr o'chirildi")
    } catch {
      showToast("O'chirishda xatolik yuz berdi")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Create genre inline form */}
      <form onSubmit={handleAdd} className="flex gap-3 max-w-md">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Yangi janr nomi (masalan: Fantastika)..."
          className="flex-1 rounded-2xl border border-[rgba(0,255,163,0.2)] bg-[#0F171A] px-4 py-2.5 text-xs text-[#F8FAFC] outline-none focus:border-[#00FFA3]"
          required
        />
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="flex items-center gap-2 rounded-2xl bg-[#00FFA3] px-5 py-2.5 text-xs font-bold text-[#070A0C] shadow-[0_0_12px_rgba(0,255,163,0.3)] hover:bg-[#1AFFA8] disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <><Plus size={15} /> Qo&apos;shish</>}
        </button>
      </form>

      {notice && (
        <div className="rounded-2xl border border-[rgba(0,255,163,0.3)] bg-[rgba(0,255,163,0.12)] p-3 text-xs font-bold text-[#00FFA3]">
          {notice}
        </div>
      )}

      {/* Genres Grid */}
      <div className="overflow-hidden rounded-3xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[rgba(0,255,163,0.1)] bg-[#0B1013] text-[#64748B] font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Janr Nomi</th>
              <th className="p-4 text-right">O&apos;chirish</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,255,163,0.06)] text-[#F8FAFC]">
            {loading ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-[#64748B]">
                  <Loader2 size={24} className="mx-auto animate-spin text-[#00FFA3]" />
                  <span className="mt-2 block">Yuklanmoqda...</span>
                </td>
              </tr>
            ) : genres.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-[#64748B]">
                  Janrlar topilmadi
                </td>
              </tr>
            ) : (
              genres.map((g) => (
                <tr key={g.id} className="hover:bg-[#0B1013]/60 transition">
                  <td className="p-4 font-mono font-bold text-[#00FFA3]">#{g.id}</td>
                  <td className="p-4 font-bold text-sm">{g.name}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="inline-flex size-8 items-center justify-center rounded-xl border border-[#ff4d6d]/30 bg-[#ff4d6d]/10 text-[#ff4d6d] hover:bg-[#ff4d6d] hover:text-white"
                      title="O'chirish"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
