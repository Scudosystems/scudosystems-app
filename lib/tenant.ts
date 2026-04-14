import type { Database } from '@/types/database'

type TenantRow = Database['public']['Tables']['tenants']['Row']

/**
 * Fetches the current authenticated user's tenant.
 *
 * IMPORTANT: We always filter by user_id explicitly. The tenants table has a
 * public-read RLS policy (so booking pages can load tenant details without auth),
 * which means a simple .select() would return *all* booking-enabled tenants.
 * Filtering by user_id ensures each dashboard user only ever sees their own tenant.
 *
 * A 30-second in-memory cache is used so multiple components on the same page
 * (layout + page + etc.) don't each hit Supabase independently on mount.
 * The cache is keyed by userId so multi-account scenarios remain correct.
 * Pass `bustCache: true` to force a fresh fetch (e.g. after saving settings).
 */

interface CacheEntry {
  data: TenantRow | null
  expiresAt: number
  // Track which columns were selected so a broader fetch busts a narrow cache
  columns: string
}

const _tenantCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 30_000

export function bustTenantCache() {
  _tenantCache.clear()
}

export async function fetchLatestTenant(
  supabase: any,
  columns: string = '*',
  { bustCache = false }: { bustCache?: boolean } = {}
): Promise<TenantRow | null> {
  // Get the authenticated user's ID so we can scope the query explicitly.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cacheKey = user.id
  const now = Date.now()

  if (!bustCache) {
    const cached = _tenantCache.get(cacheKey)
    // Hit the cache only when it covers at least the requested columns
    if (
      cached &&
      cached.expiresAt > now &&
      (cached.columns === '*' || cached.columns === columns)
    ) {
      return cached.data
    }
  }

  const { data, error } = await supabase
    .from('tenants')
    .select(columns)
    .eq('user_id', user.id)
    .order('onboarding_completed', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error

  const result = (data && data.length > 0 ? (data[0] as TenantRow) : null)

  _tenantCache.set(cacheKey, {
    data: result,
    expiresAt: now + CACHE_TTL_MS,
    columns,
  })

  return result
}
