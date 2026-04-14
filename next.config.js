/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Image optimisation ───────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'img.clerk.com' },
      { protocol: 'https', hostname: 'images.clerk.dev' },
    ],
    // Serve modern WebP/AVIF where the browser supports it
    formats: ['image/avif', 'image/webp'],
  },

  // ─── Compression ─────────────────────────────────────────────────────────
  // Enables gzip/brotli for all text responses (HTML, JS, CSS, JSON)
  compress: true,

  // ─── Bundle optimisation ─────────────────────────────────────────────────
  experimental: {
    // Stripe is a CommonJS module — keep it server-side only so it isn't
    // bundled into the client and inflates the JS payload.
    serverComponentsExternalPackages: ['stripe'],
    // Tree-shake unused exports from packages that support it.
    optimizePackageImports: [
      'lucide-react',
      '@supabase/ssr',
      '@supabase/supabase-js',
    ],
  },

  // ─── Production source maps ───────────────────────────────────────────────
  // Disable source maps in production builds to reduce build output size and
  // avoid leaking source code to end users.
  productionBrowserSourceMaps: false,

  // ─── HTTP caching headers ─────────────────────────────────────────────────
  async headers() {
    return [
      {
        // Static assets (JS/CSS chunks, fonts, images) are content-hashed by
        // Next.js and can be cached indefinitely by the browser.
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Public booking pages: allow CDN edge caching for 60 s, allow stale
        // content for up to 10 minutes while revalidating in the background.
        source: '/book/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=60, stale-while-revalidate=600',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
