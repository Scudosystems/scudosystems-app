import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// ─── Browser Client (client components only) ─────────────────────────────────
// This file is safe to import in 'use client' components.
// For server-side code, import from '@/lib/supabase-server' instead.
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    // During build-time prerendering, env vars may not be available.
    // Components using this client should guard their logic inside useEffect.
    return createBrowserClient<Database>(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
  }
  return createBrowserClient<Database>(url, key)
}
