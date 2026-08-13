import RequireAuth from '@/components/require-auth'
import AdminClient from '@/components/admin-client'

export const metadata = { title: 'Admin Filmlar — S-M' }

export default function AdminMoviesPage() {
  return (
    <RequireAuth adminOnly>
      <AdminClient />
    </RequireAuth>
  )
}
