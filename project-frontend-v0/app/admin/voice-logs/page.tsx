import RequireAuth from '@/components/require-auth'
import AdminClient from '@/components/admin-client'

export const metadata = { title: 'Admin Ovoz Loglari — S-M' }

export default function AdminVoiceLogsPage() {
  return (
    <RequireAuth adminOnly>
      <AdminClient />
    </RequireAuth>
  )
}
