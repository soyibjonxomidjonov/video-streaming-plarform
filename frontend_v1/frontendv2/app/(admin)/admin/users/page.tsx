'use client'

import React, { useEffect, useState } from 'react'
import { Users, ShieldCheck, User, Search, Loader2 } from 'lucide-react'
import { api, unwrapList, type UserProfile, API_BASE, getImageUrl } from '@/lib/api'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadUsers() {
      setLoading(true)
      try {
        const data = await api.users()
        setUsers(unwrapList(data))
      } finally {
        setLoading(false)
      }
    }
    void loadUsers()
  }, [])

  const filteredUsers = users.filter(u =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.first_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.last_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 rounded-2xl border border-[rgba(0,255,163,0.18)] bg-[#0F171A] px-4 py-2.5 max-w-md">
        <Search size={16} className="text-[#64748B]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Foydalanuvchi qidirish..."
          className="w-full bg-transparent text-xs text-[#F8FAFC] outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-3xl border border-[rgba(0,255,163,0.15)] bg-[#0F171A] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[rgba(0,255,163,0.1)] bg-[#0B1013] text-[#64748B] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Foydalanuvchi</th>
                <th className="p-4">Email</th>
                <th className="p-4">Yosh</th>
                <th className="p-4 text-right">Maqom</th>
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#64748B]">
                    Foydalanuvchilar topilmadi
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = Boolean(u.is_staff || u.is_superuser)
                  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Foydalanuvchi'
                  return (
                    <tr key={u.id} className="hover:bg-[#0B1013]/60 transition">
                      <td className="p-4 font-mono font-bold text-[#00FFA3]">#{u.id}</td>
                      <td className="p-4 font-bold flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-[rgba(0,255,163,0.1)] text-[#00FFA3] overflow-hidden">
                          {u.picture ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={getImageUrl(u.picture)} alt="Profil" className="size-full object-cover" />
                          ) : (
                            <User size={13} />
                          )}
                        </div>
                        <span>{name}</span>
                      </td>
                      <td className="p-4 text-[#64748B]">{u.email}</td>
                      <td className="p-4 text-[#64748B]">{u.age ?? '—'}</td>
                      <td className="p-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isAdmin
                              ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[rgba(0,255,163,0.3)]'
                              : 'bg-[#0B1013] text-[#64748B]'
                          }`}
                        >
                          {isAdmin && <ShieldCheck size={11} />}
                          {isAdmin ? 'Staff / Admin' : 'Foydalanuvchi'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
