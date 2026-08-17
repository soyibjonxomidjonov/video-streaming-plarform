import RegisterForm from '@/components/register-form'

export default function RegisterPage() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? ''
  return <RegisterForm googleClientId={googleClientId} />
}
