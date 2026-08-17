'use client'

import React, { useEffect, useState } from 'react'
import { Users, ShieldCheck, User, Search, Loader2 } from 'lucide-react'
import { api, unwrapList, type UserProfile } from '@/lib/api'

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
      <div className="flex items-center gap-2 rounded-2xl border border-[rgba(0,229,153,0.18)] bg-[#101514] px-4 py-2.5 max-w-md">
        <Search size={16} className="text-[#8c9994]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Foydalanuvchi qidirish..."
          className="w-full bg-transparent text-xs text-[#f5f7f6] outline-none"
        />
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-3xl border border-[rgba(0,229,153,0.15)] bg-[#101514] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[rgba(0,229,153,0.1)] bg-[#161f1c] text-[#8c9994] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Foydalanuvchi</th>
                <th className="p-4">Email</th>
                <th className="p-4">Yosh</th>
                <th className="p-4 text-right">Maqom</th>
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#8c9994]">
                    Foydalanuvchilar topilmadi
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = Boolean(u.is_staff || u.is_superuser)
                  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Foydalanuvchi'
                  return (
                    <tr key={u.id} className="hover:bg-[#161f1c]/60 transition">
                      <td className="p-4 font-mono font-bold text-[#00e599]">#{u.id}</td>
                      <td className="p-4 font-bold flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-[rgba(0,229,153,0.1)] text-[#00e599]">
                          <User size={13} />
                        </div>
                        <span>{name}</span>
                      </td>
                      <td className="p-4 text-[#8c9994]">{u.email}</td>
                      <td className="p-4 text-[#8c9994]">{u.age ?? '—'}</td>
                      <td className="p-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isAdmin
                              ? 'bg-[#00e599]/15 text-[#00e599] border border-[rgba(0,229,153,0.3)]'
                              : 'bg-[#161f1c] text-[#8c9994]'
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
