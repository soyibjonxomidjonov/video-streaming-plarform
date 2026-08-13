import RequireAuth from '@/components/require-auth'
import AdminClient from '@/components/admin-client'

export const metadata = { title: 'Admin Seriallar — S-M' }

export default function AdminSeriesPage() {
  return (
    <RequireAuth adminOnly>
      <AdminClient />
    </RequireAuth>
  )
}
