import React from 'react'

/**
 * PageContainer ensures consistent, premium spacing across all main pages.
 * It strictly constrains the maximum width for ultra-wide monitors while
 * providing generous fluid padding on smaller screens.
 */
export default function PageContainer({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 ${className}`}>
      {children}
    </div>
  )
}
