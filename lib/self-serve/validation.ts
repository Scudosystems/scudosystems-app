import type { OperatorConfig, OperatorValidationCheck, LaunchReadiness } from './types'
import { getIndustryBlueprint } from './blueprints'

export function validateOperatorConfig(config: OperatorConfig): OperatorValidationCheck[] {
  const blueprint = getIndustryBlueprint(config.industry)
  const checks: OperatorValidationCheck[] = []

  const hasBusinessName = !!config.businessProfile.tradingName?.trim()
  checks.push({
    key: 'business-profile',
    label: 'Business profile',
    status: hasBusinessName ? 'pass' : 'fail',
    message: hasBusinessName ? 'Operator branding is set.' : 'Add a trading name before going live.',
  })

  const hasSupportEmail = !!config.businessProfile.supportEmail?.trim()
  checks.push({
    key: 'support-contact',
    label: 'Support contact',
    status: hasSupportEmail ? 'pass' : 'fail',
    message: hasSupportEmail ? 'Support contact is configured.' : 'Add a support email for customer queries.',
  })

  const stripeReady = config.providerConfig.stripeConnected && config.providerConfig.stripeWebhookConfigured
  checks.push({
    key: 'payment-provider',
    label: 'Payment provider',
    status: stripeReady ? 'pass' : 'fail',
    message: stripeReady ? 'Stripe connection and webhook are confirmed.' : 'Connect Stripe and verify the webhook before launch.',
  })

  const machineReady = !blueprint.requiresMachineProvider || config.providerConfig.machineAuthConfigured
  checks.push({
    key: 'machine-provider',
    label: 'Machine/provider connection',
    status: machineReady ? 'pass' : blueprint.requiresMachineProvider ? 'fail' : 'warn',
    message: machineReady
      ? 'Machine provider connection is configured.'
      : 'Complete provider credentials and validate a safe activation test.',
  })

  const mappedPoints = config.servicePoints.filter(point => point.name.trim() && point.externalId.trim())
  checks.push({
    key: 'service-points',
    label: blueprint.servicePointPlural,
    status: mappedPoints.length > 0 ? 'pass' : 'fail',
    message: mappedPoints.length > 0
      ? `${mappedPoints.length} ${blueprint.servicePointPlural.toLowerCase()} configured.`
      : `Add at least one ${blueprint.servicePointLabel.toLowerCase()} before launch.`,
  })

  const liveReadyPoints = config.servicePoints.filter(point => point.active && point.liveModeEnabled)
  checks.push({
    key: 'live-points',
    label: 'Live service-point readiness',
    status: liveReadyPoints.length > 0 ? 'pass' : 'warn',
    message: liveReadyPoints.length > 0
      ? `${liveReadyPoints.length} live ${blueprint.servicePointPlural.toLowerCase()} ready.`
      : `No live ${blueprint.servicePointPlural.toLowerCase()} enabled yet. Keep testing before launch.`,
  })

  return checks
}

export function deriveLaunchReadiness(checks: OperatorValidationCheck[]): LaunchReadiness {
  if (checks.some(check => check.status === 'fail')) return 'needs_attention'
  if (checks.some(check => check.status === 'warn')) return 'ready_for_test'
  return 'ready_to_launch'
}
