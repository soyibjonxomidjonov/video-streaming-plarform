import RequireAuth from '@/components/require-auth'
import ProfileClient from '@/components/profile-client'

export const metadata = { title: 'Profil — S-M' }

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileClient />
    </RequireAuth>
  )
}
