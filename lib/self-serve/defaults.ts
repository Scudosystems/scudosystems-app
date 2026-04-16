import type { OperatorConfig, SelfServeIndustry } from './types'
import { getIndustryBlueprint } from './blueprints'

export function createDefaultOperatorConfig(industry: SelfServeIndustry, tradingName: string): OperatorConfig {
  const blueprint = getIndustryBlueprint(industry)
  return {
    version: 1,
    industry,
    launchReadiness: 'draft',
    businessProfile: {
      legalName: tradingName,
      tradingName,
      supportEmail: '',
      supportPhone: '',
      website: '',
      country: 'United Kingdom',
      timezone: 'Europe/London',
    },
    providerConfig: {
      paymentProvider: 'stripe',
      machineProvider: blueprint.requiresMachineProvider ? blueprint.machineProviderOptions[0] : 'none',
      mode: 'test',
      stripeConnected: false,
      stripePublishableKeySet: false,
      stripeSecretKeySet: false,
      stripeWebhookConfigured: false,
      machineAuthConfigured: false,
      machineHealthStatus: 'unknown',
      paymentHealthStatus: 'unknown',
    },
    servicePoints: blueprint.servicePointExamples.map((name, index) => ({
      name,
      publicLabel: name,
      externalId: `${industry}-${index + 1}`,
      testModeEnabled: true,
      liveModeEnabled: false,
      active: index === 0,
      providerBoxId: '',
      providerMachineId: '',
      providerSiteId: '',
      locationLabel: '',
    })),
    notes: '',
    validationChecks: [],
  }
}
