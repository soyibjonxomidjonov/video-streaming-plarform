/**
 * Watch layout — full-screen immersive experience.
 * No sidebar, no header, no bottom nav.
 * VoiceOrb is rendered from root layout (still works here).
 * Safe-area padding handled by WatchClient itself.
 */
export default function WatchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[#000] overflow-x-hidden">
      {children}
    </div>
  )
}
