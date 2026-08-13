import RequireAuth from '@/components/require-auth'
import AdminClient from '@/components/admin-client'

export const metadata = { title: 'Admin' }

export default function AdminPage() {
  return (
    <RequireAuth adminOnly>
      <AdminClient />
    </RequireAuth>
  )
}
