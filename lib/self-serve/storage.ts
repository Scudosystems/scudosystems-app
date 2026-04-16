import type { Database } from '@/types/database'
import type { OperatorConfig, SelfServeIndustry } from './types'
import { createDefaultOperatorConfig } from './defaults'
import { isOperatorConfig } from './types'
import { deriveLaunchReadiness, validateOperatorConfig } from './validation'
import { getIndustryBlueprint } from './blueprints'
import { getStripeEnvStatus, getUnipayEnvStatus, isStripeReady } from './providers'

export type TenantRow = Database['public']['Tables']['tenants']['Row']

export function getTenantOperatorConfig(tenant: TenantRow): OperatorConfig {
  const raw = (tenant as any).operator_config
  if (isOperatorConfig(raw)) {
    const hydrated = hydrateProviderConfig(raw)
    const checks = validateOperatorConfig(hydrated)
    return {
      ...hydrated,
      validationChecks: checks,
      launchReadiness: hydrated.launchReadiness === 'live' ? 'live' : deriveLaunchReadiness(checks),
    }
  }

  const inferredIndustry = mapVerticalToSelfServeIndustry(tenant.vertical)
  const config = createDefaultOperatorConfig(inferredIndustry, tenant.business_name)
  const hydrated = hydrateProviderConfig(config)
  const checks = validateOperatorConfig(hydrated)
  return {
    ...hydrated,
    validationChecks: checks,
    launchReadiness: deriveLaunchReadiness(checks),
    businessProfile: {
      ...hydrated.businessProfile,
      tradingName: tenant.business_name,
      legalName: tenant.business_name,
      supportEmail: tenant.email || tenant.owner_email || '',
      supportPhone: tenant.phone || '',
      website: tenant.website || '',
    },
  }
}

export function normalizeOperatorConfig(input: OperatorConfig): OperatorConfig {
  const hydrated = hydrateProviderConfig(input)
  const checks = validateOperatorConfig(hydrated)
  return {
    ...hydrated,
    validationChecks: checks,
    launchReadiness: input.launchReadiness === 'live' ? 'live' : deriveLaunchReadiness(checks),
  }
}

export function mapVerticalToSelfServeIndustry(vertical: TenantRow['vertical']): SelfServeIndustry {
  switch (vertical) {
    case 'carwash':
      return 'carwash'
    case 'grooming':
      return 'dogwash'
    case 'takeaway':
      return 'laundry'
    case 'restaurant':
      return 'parking'
    case 'auto':
    default:
      return 'ev'
  }
}

export function operatorConfigToTenantPatch(config: OperatorConfig) {
  const blueprint = getIndustryBlueprint(config.industry)
  return {
    vertical: blueprint.vertical,
    operator_config: normalizeOperatorConfig(config) as any,
  }
}

export function hydrateProviderConfig(config: OperatorConfig): OperatorConfig {
  const stripeEnv = getStripeEnvStatus()
  const stripeReady = isStripeReady(stripeEnv)
  const machineProvider = config.providerConfig.machineProvider
  const unipayEnv = machineProvider === 'unipay' ? getUnipayEnvStatus() : null

  return {
    ...config,
    providerConfig: {
      ...config.providerConfig,
      stripePublishableKeySet: stripeEnv.publishableKeySet,
      stripeSecretKeySet: stripeEnv.secretKeySet,
      stripeWebhookConfigured: stripeEnv.webhookSecretSet,
      stripeConnected: stripeReady,
      machineAuthConfigured: machineProvider === 'unipay'
        ? !!unipayEnv?.configured
        : machineProvider === 'none'
          ? true
          : config.providerConfig.machineAuthConfigured,
      paymentHealthStatus: stripeReady ? 'healthy' : (stripeEnv.secretKeySet || stripeEnv.publishableKeySet ? 'warning' : 'error'),
      machineHealthStatus: machineProvider === 'unipay'
        ? (unipayEnv?.configured ? 'healthy' : 'error')
        : 'healthy',
    },
  }
}
