const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://16.170.242.253:8000').replace(/\/+$/, '')

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  // Proxies browser API calls through the Next.js server so the browser
  // only ever talks to its own origin (localhost:3000). This sidesteps
  // backend CORS errors entirely, since the actual cross-origin request
  // happens server-to-server where CORS does not apply.
  async rewrites() {
    return [
      {
        source: '/api-proxy/v1/auth/login',
        destination: `${BACKEND_ORIGIN}/v1/auth/login/`,
      },
      {
        source: '/api-proxy/v1/auth/register',
        destination: `${BACKEND_ORIGIN}/v1/auth/register/`,
      },
      {
        source: '/api-proxy/v1/auth/code/verify',
        destination: `${BACKEND_ORIGIN}/v1/auth/code/verify/`,
      },
      {
        source: '/api-proxy/:path*',
        destination: `${BACKEND_ORIGIN}/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self)' },
        ],
      },
    ]
  },
}

export default nextConfig
