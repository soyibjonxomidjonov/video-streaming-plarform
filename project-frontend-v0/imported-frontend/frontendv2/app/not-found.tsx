import Link from 'next/link'
import { Film, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center" style={{ background: '#0a0a0c' }}>
      <div
        className="flex size-20 items-center justify-center rounded-3xl mb-4"
        style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)' }}
      >
        <Film size={36} style={{ color: '#f5a623' }} />
      </div>
      <h1 className="font-display text-4xl font-black sm:text-6xl" style={{ color: '#f5a623' }}>404</h1>
      <h2 className="mt-2 font-display text-xl font-bold">Sahifa topilmadi</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Siz qidirayotgan sahifa o&apos;chirilgan, nomi o&apos;zgartirilgan yoki vaqtincha mavjud emas.
      </p>

      <Link
        href="/"
        className="mt-6 flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-black transition hover:brightness-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #f5a623, #b3720f)' }}
      >
        <Home size={16} /> Bosh sahifaga qaytish
      </Link>
    </div>
  )
}
