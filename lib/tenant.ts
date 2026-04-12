import type { Database } from '@/types/database'

type TenantRow = Database['public']['Tables']['tenants']['Row']
type TenantQueryClient = {
  from: (table: 'tenants') => any
}

export async function fetchLatestTenant(
  supabase: TenantQueryClient,
  columns: string = '*'
): Promise<TenantRow | null> {
  const { data, error } = await supabase
    .from('tenants')
    .select(columns)
    .order('onboarding_completed', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error
  return (data && data.length > 0 ? (data[0] as TenantRow) : null)
}
