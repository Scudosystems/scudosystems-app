export interface StripeEnvStatus {
  publishableKeySet: boolean
  secretKeySet: boolean
  webhookSecretSet: boolean
}

export function getStripeEnvStatus(): StripeEnvStatus {
  return {
    publishableKeySet: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    secretKeySet: !!process.env.STRIPE_SECRET_KEY,
    webhookSecretSet: !!process.env.STRIPE_WEBHOOK_SECRET,
  }
}

export function isStripeReady(status: StripeEnvStatus) {
  return status.publishableKeySet && status.secretKeySet && status.webhookSecretSet
}
