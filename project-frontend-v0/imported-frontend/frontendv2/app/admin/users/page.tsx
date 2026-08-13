import RequireAuth from '@/components/require-auth'
import AdminClient from '@/components/admin-client'

export const metadata = { title: 'Admin Foydalanuvchilar — S-M' }

export default function AdminUsersPage() {
  return (
    <RequireAuth adminOnly>
      <AdminClient />
    </RequireAuth>
  )
}
