'use client'

import React from 'react'

/**
 * SM Stream Logo — premium SVG lettermark.
 * Har qanday o'lchamda aniq ko'rinadi: 11px (sidebar label) dan 64px gacha.
 * Ikkita variant:
 *   - <Logo />         → faqat icon (sidebar, header)
 *   - <LogoFull />     → icon + "SM STREAM" text (login, register sahifalar)
 */

export function Logo({ className = 'size-11' }: { className?: string }) {
  return (
    <div className={`relative shrink-0 ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Primary emerald gradient */}
          <linearGradient id="lg-primary" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#80FFCB" />
            <stop offset="55%" stopColor="#00FFA3" />
            <stop offset="100%" stopColor="#00CC82" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="glow-sm" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Background clip */}
          <clipPath id="rounded-clip">
            <rect x="0" y="0" width="48" height="48" rx="12" ry="12" />
          </clipPath>
        </defs>

        {/* Background panel */}
        <rect x="0" y="0" width="48" height="48" rx="12" fill="#0B1216" />

        {/* Subtle inner border */}
        <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="11.25"
          fill="none" stroke="rgba(0,255,163,0.2)" strokeWidth="1.5" />

        {/* Top-left corner accent */}
        <path d="M 0 14 L 0 4 Q 0 0 4 0 L 14 0"
          stroke="rgba(0,255,163,0.5)" strokeWidth="1.5" fill="none"
          strokeLinecap="round" />

        {/* Bottom-right corner accent */}
        <path d="M 48 34 L 48 44 Q 48 48 44 48 L 34 48"
          stroke="rgba(0,255,163,0.5)" strokeWidth="1.5" fill="none"
          strokeLinecap="round" />

        {/* Subtle background glow spot */}
        <ellipse cx="24" cy="24" rx="18" ry="14"
          fill="rgba(0,255,163,0.04)" />

        {/* ── S letterform ── */}
        {/* Top bar */}
        <rect x="8" y="9" width="12" height="3" rx="1.5"
          fill="url(#lg-primary)" filter="url(#glow-sm)" />
        {/* Middle bar */}
        <rect x="8" y="22.5" width="12" height="3" rx="1.5"
          fill="url(#lg-primary)" filter="url(#glow-sm)" />
        {/* Bottom bar */}
        <rect x="8" y="36" width="12" height="3" rx="1.5"
          fill="url(#lg-primary)" filter="url(#glow-sm)" />
        {/* Top-left vertical */}
        <rect x="8" y="9" width="3" height="7.5" rx="1.5"
          fill="url(#lg-primary)" filter="url(#glow-sm)" />
        {/* Bottom-right vertical */}
        <rect x="17" y="25.5" width="3" height="13.5" rx="1.5"
          fill="url(#lg-primary)" filter="url(#glow-sm)" />

        {/* ── M letterform ── */}
        {/* Left vertical */}
        <rect x="27" y="9" width="3" height="30" rx="1.5"
          fill="url(#lg-primary)" filter="url(#glow-sm)" />
        {/* Right vertical */}
        <rect x="37" y="9" width="3" height="30" rx="1.5"
          fill="url(#lg-primary)" filter="url(#glow-sm)" />
        {/* Left diagonal (top-left to center-bottom) */}
        <line x1="27.5" y1="10" x2="33.5" y2="26"
          stroke="url(#lg-primary)" strokeWidth="3" strokeLinecap="round"
          filter="url(#glow-sm)" />
        {/* Right diagonal (top-right to center-bottom) */}
        <line x1="39.5" y1="10" x2="33.5" y2="26"
          stroke="url(#lg-primary)" strokeWidth="3" strokeLinecap="round"
          filter="url(#glow-sm)" />
      </svg>
    </div>
  )
}

/**
 * LogoFull — icon + wordmark, login / register sahifalar uchun
 */
export function LogoFull({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo className="size-12" />
      <div className="flex flex-col leading-none select-none">
        <span className="font-display text-xl font-black tracking-[-0.02em] text-zinc-100">
          SM
          <span className="text-[#00FFA3]"> STREAM</span>
        </span>
        <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#4B5563] mt-0.5">
          Video Platform
        </span>
      </div>
    </div>
  )
}

export default Logo
