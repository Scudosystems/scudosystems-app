export interface UnipayEnvStatus {
  baseUrlSet: boolean
  authMode: string
  configured: boolean
  missing: string[]
}

export function getUnipayEnvStatus(): UnipayEnvStatus {
  const baseUrl = (process.env.UNIPAY_BASE_URL || '').trim()
  const authMode = (process.env.UNIPAY_AUTH_MODE || 'oauth2').toLowerCase()
  const missing: string[] = []

  if (!baseUrl) missing.push('UNIPAY_BASE_URL')

  if (authMode === 'oauth2') {
    if (!process.env.UNIPAY_CLIENT_ID) missing.push('UNIPAY_CLIENT_ID')
    if (!process.env.UNIPAY_CLIENT_SECRET) missing.push('UNIPAY_CLIENT_SECRET')
    if (!process.env.UNIPAY_TOKEN_URL) missing.push('UNIPAY_TOKEN_URL')
  } else if (authMode === 'bearer') {
    if (!process.env.UNIPAY_STATIC_TOKEN) missing.push('UNIPAY_STATIC_TOKEN')
  } else if (authMode === 'basic') {
    if (!process.env.UNIPAY_CLIENT_ID) missing.push('UNIPAY_CLIENT_ID')
    if (!process.env.UNIPAY_CLIENT_SECRET) missing.push('UNIPAY_CLIENT_SECRET')
  }

  return {
    baseUrlSet: !!baseUrl,
    authMode,
    configured: missing.length === 0,
    missing,
  }
}
