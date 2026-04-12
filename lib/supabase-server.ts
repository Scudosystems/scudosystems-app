import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// ─── Server Client (Server Components / API routes) ───────────────────────────
// Only import this file in server-side code (API routes, Server Components, middleware).
// Never import in 'use client' components.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Ignore in Server Components (read-only cookie store)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete(name)
          } catch {
            // Ignore in Server Components (read-only cookie store)
          }
        },
      },
    }
  )
}

// ─── Admin Client (service role — API routes only) ────────────────────────────
// Bypasses RLS. Use only in trusted server-side API routes.
export function createSupabaseAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
