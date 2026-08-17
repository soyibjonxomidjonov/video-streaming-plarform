'use client'

import React from 'react'

export function Logo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className} group cursor-pointer`}>
      {/* Orqa neon nuri */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#00e599] to-[#00b4d8] rounded-2xl blur-md opacity-40 group-hover:opacity-80 transition-opacity duration-300" />

      {/* Asosiy korpus */}
      <div className="relative w-full h-full bg-[#101514] border border-[#00e599]/40 rounded-2xl flex items-center justify-center shadow-[inset_0_0_14px_rgba(0,229,153,0.25)] transition-transform group-hover:scale-105">
        <svg viewBox="0 0 100 100" className="w-4/5 h-4/5">
          <defs>
            <linearGradient id="smGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00e599" />
              <stop offset="50%" stopColor="#2dd4bf" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* S Harfi - Aniq va go'zal kiber chiziqlar */}
          <path
            d="M 44 32 L 26 32 C 22 32 20 35 20 39 L 20 45 C 20 49 23 52 28 53 L 38 55 C 43 56 46 59 46 63 L 46 69 C 46 73 43 76 38 76 L 20 76"
            fill="none"
            stroke="url(#smGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neonGlow)"
          />

          {/* M Harfi - Futuristik o'tkir burchakli */}
          <path
            d="M 54 76 L 54 32 L 67 55 L 80 32 L 80 76"
            fill="none"
            stroke="url(#smGrad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neonGlow)"
          />
        </svg>
      </div>
    </div>
  )
}

export default Logo
