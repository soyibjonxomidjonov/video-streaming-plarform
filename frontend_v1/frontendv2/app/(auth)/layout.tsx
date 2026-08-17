/**
 * Auth layout — clean, centered auth pages.
 * Used by: (auth)/callback
 * NOTE: /login and /register are at app/login and app/register (root level)
 * and also get this clean treatment via root layout (providers only).
 *
 * This layout provides a full-screen centered wrapper for auth flows.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#070A0C] flex items-center justify-center p-4">
      {children}
    </div>
  )
}
