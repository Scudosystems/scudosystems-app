import type { VerticalEnum, Json } from '@/types/database'

export type SelfServeIndustry = 'carwash' | 'ev' | 'laundry' | 'dogwash' | 'parking'
export type PaymentProvider = 'stripe'
export type MachineProvider = 'unipay' | 'none' | 'custom'
export type SetupMode = 'test' | 'live'
export type LaunchReadiness = 'draft' | 'needs_attention' | 'ready_for_test' | 'ready_to_launch' | 'live'

export interface IndustryBlueprint {
  id: SelfServeIndustry
  label: string
  vertical: VerticalEnum
  operatorLabel: string
  servicePointLabel: string
  servicePointPlural: string
  servicePointExamples: string[]
  machineProviderOptions: MachineProvider[]
  paymentProviderOptions: PaymentProvider[]
  requiresMachineProvider: boolean
  requiresQrCodes: boolean
  setupChecklist: string[]
}

export interface OperatorBusinessProfile {
  legalName: string
  tradingName: string
  supportEmail: string
  supportPhone?: string
  website?: string
  country?: string
  timezone?: string
}

export interface OperatorServicePoint {
  id?: string
  name: string
  publicLabel: string
  externalId: string
  locationLabel?: string
  providerSiteId?: string
  providerBoxId?: string
  providerMachineId?: string
  testModeEnabled: boolean
  liveModeEnabled: boolean
  active: boolean
}

export interface OperatorProviderConfig {
  paymentProvider: PaymentProvider
  machineProvider: MachineProvider
  mode: SetupMode
  stripeConnected: boolean
  stripePublishableKeySet: boolean
  stripeSecretKeySet: boolean
  stripeWebhookConfigured: boolean
  machineAuthConfigured: boolean
  machineHealthStatus: 'unknown' | 'healthy' | 'warning' | 'error'
  paymentHealthStatus: 'unknown' | 'healthy' | 'warning' | 'error'
}

export interface OperatorValidationCheck {
  key: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  message: string
}

export interface OperatorConfig {
  version: 1
  industry: SelfServeIndustry
  launchReadiness: LaunchReadiness
  businessProfile: OperatorBusinessProfile
  providerConfig: OperatorProviderConfig
  servicePoints: OperatorServicePoint[]
  notes?: string
  validationChecks: OperatorValidationCheck[]
}

export function isOperatorConfig(value: unknown): value is OperatorConfig {
  return !!value && typeof value === 'object' && !Array.isArray(value) && (value as any).version === 1
}
