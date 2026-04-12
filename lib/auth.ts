import { headers } from 'next/headers'
import { createSupabaseServerClient } from './supabase-server'

/**
 * Get the authenticated Supabase user from a server context (API routes / Server Components).
 * Returns null if not authenticated.
 */
export async function getUser() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return user

  const authHeader = headers().get('authorization') || ''
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user: tokenUser } } = await supabase.auth.getUser(token)
    return tokenUser ?? null
  }

  return null
}
