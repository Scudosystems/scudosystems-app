import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// ─── Browser Client (client components only) ─────────────────────────────────
// This file is safe to import in 'use client' components.
// For server-side code, import from '@/lib/supabase-server' instead.
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
