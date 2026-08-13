'use client'

import { type FormEvent, useState } from 'react'
import { api, ApiError, getGoogleAuthUrl, setToken } from '@/lib/api'
import { useAuth } from '@/components/auth-provider'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (step === 'form') {
        if (mode === 'register') await api.register({ email, first_name: firstName, last_name: lastName, age: age ? Number(age) : undefined })
        else await api.login(email)
        setStep('code')
        setMessage(`We sent a verification code to ${email}.`)
      } else {
        const result = await api.verifyCode(email, code)
        const token = result?.token ?? result?.access ?? result?.key
        if (token) setToken(token)
        await refresh()
        router.replace('/')
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) setError('Invalid details. Please check and try again.')
      else if (err instanceof ApiError && err.status === 404) setError('No account found for this email.')
      else setError('Could not complete authentication. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function resend() {
    setBusy(true)
    setError('')
    try {
      await api.login(email)
      setMessage('A new code has been sent.')
    } catch {
      setError('Could not resend the code.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        <Link href="/" className="flex w-fit items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft size={16} /> Home
        </Link>
        <div className="mt-10 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          {step === 'form' ? <Mail size={21} /> : <ShieldCheck size={21} />}
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-balance">
          {step === 'code' ? 'Verify your email' : mode === 'register' ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {step === 'code'
            ? `Enter the 6-digit code we sent to ${email}.`
            : mode === 'register'
              ? 'Join Streamora to sync your watchlist across devices.'
              : 'Sign in to continue watching across all your devices.'}
        </p>

        {step === 'form' && mode === 'login' && (
          <button
            type="button"
            onClick={() => { window.location.href = getGoogleAuthUrl() }}
            className="mt-8 flex min-h-12 items-center justify-center gap-3 rounded-xl border border-border bg-secondary px-4 text-sm font-semibold transition hover:bg-muted"
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-card text-xs font-bold">G</span>
            Continue with Google
          </button>
        )}

        <form onSubmit={submit} className={step === 'form' && mode === 'login' ? 'mt-3 flex flex-col gap-4' : 'mt-8 flex flex-col gap-4'}>
          {step === 'form' ? (
            <>
              {mode === 'register' && (
                <>
                  <input
                    required
                    value={firstName}
                    onChange={event => setFirstName(event.target.value)}
                    placeholder="First name"
                    className="min-h-12 rounded-xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    required
                    value={lastName}
                    onChange={event => setLastName(event.target.value)}
                    placeholder="Last name"
                    className="min-h-12 rounded-xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    required
                    type="number"
                    value={age}
                    onChange={event => setAge(event.target.value)}
                    placeholder="Age"
                    className="min-h-12 rounded-xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </>
              )}
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="min-h-12 rounded-xl bg-secondary px-4 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </>
          ) : (
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              className="min-h-12 rounded-xl bg-secondary px-4 text-center text-lg tracking-[.4em] outline-none focus:ring-2 focus:ring-primary"
            />
          )}

          <button
            disabled={busy}
            className="min-h-12 rounded-xl bg-primary font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? 'Please wait...' : step === 'code' ? 'Verify and sign in' : mode === 'register' ? 'Create account' : 'Continue'}
          </button>

          {message && <p className="text-center text-sm text-muted-foreground">{message}</p>}
          {error && (
            <p role="alert" className="text-center text-sm text-accent">
              {error}
            </p>
          )}
        </form>

        {step === 'code' ? (
          <button onClick={resend} disabled={busy} className="mt-5 w-full text-center text-sm text-primary hover:underline disabled:opacity-60">
            Resend code
          </button>
        ) : (
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
              setMessage('')
            }}
            className="mt-5 w-full text-center text-sm text-muted-foreground"
          >
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span className="font-semibold text-primary">{mode === 'login' ? 'Register' : 'Sign in'}</span>
          </button>
        )}
      </div>
    </main>
  )
}
