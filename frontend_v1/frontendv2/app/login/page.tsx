import LoginForm from '@/components/login-form'

export default function LoginPage() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? ''
  return <LoginForm googleClientId={googleClientId} />
}
