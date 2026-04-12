import { Resend } from 'resend'

// Resend is optional — emails only fire when RESEND_API_KEY is set
const resendClient = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

async function sendEmail(payload: Parameters<Resend['emails']['send']>[0]) {
  if (!resendClient) {
    console.log('[Resend] Key not set — skipping email to', payload.to)
    return { id: 'skipped' }
  }
  return resendClient.emails.send(payload)
}

export const resend = resendClient

const FROM_EMAIL = 'ScudoSystems <hello@scudosystems.com>'

export interface BookingEmailData {
  customerName: string
  customerEmail: string
  businessName: string
  serviceName: string
  bookingDate: string
  bookingTime: string
  staffName?: string
  totalAmount: string
  depositAmount?: string
  bookingRef: string
  cancellationPolicy?: string
}

// ─── Welcome Email ────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, businessName: string, dashboardUrl: string) {
  return sendEmail({
    from: FROM_EMAIL,
    to,
    subject: `Welcome to ScudoSystems — ${businessName} is live! 🎉`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#f8f6f1;font-family:'Outfit',Arial,sans-serif">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <div style="background:#0d6e6e;padding:40px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700">ScudoSystems</h1>
            <p style="color:#a0d4d4;margin:8px 0 0">Booking & Business Management</p>
          </div>
          <div style="padding:40px">
            <h2 style="color:#1a1814;font-size:24px;margin:0 0 16px">You're live! 🎉</h2>
            <p style="color:#4a4540;line-height:1.6;margin:0 0 24px">
              <strong>${businessName}</strong> is now live on ScudoSystems. Your customers can start booking online right now.
            </p>
            <div style="background:#f0fafa;border-radius:12px;padding:24px;margin:0 0 24px">
              <h3 style="color:#0d6e6e;margin:0 0 12px;font-size:16px">What happens next?</h3>
              <ul style="color:#4a4540;margin:0;padding-left:20px;line-height:2">
                <li>Share your booking link with customers</li>
                <li>Set up your availability schedule</li>
                <li>Customise your services and pricing</li>
                <li>Add your team members</li>
              </ul>
            </div>
            <a href="${dashboardUrl}" style="display:inline-block;background:#0d6e6e;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">
              Go to Dashboard →
            </a>
          </div>
          <div style="padding:24px 40px;background:#f8f6f1;text-align:center">
            <p style="color:#9a9490;font-size:14px;margin:0">
              ScudoSystems · hello@scudosystems.com · <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#0d6e6e">scudosystems.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

// ─── Booking Confirmation to Customer ────────────────────────────────────────
export async function sendBookingConfirmation(data: BookingEmailData) {
  return sendEmail({
    from: FROM_EMAIL,
    to: data.customerEmail,
    subject: `Booking Confirmed — ${data.businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f8f6f1;font-family:'Outfit',Arial,sans-serif">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <div style="background:#0d6e6e;padding:40px;text-align:center">
            <div style="font-size:48px">✅</div>
            <h1 style="color:#fff;margin:8px 0 0;font-size:24px">Booking Confirmed</h1>
          </div>
          <div style="padding:40px">
            <p style="color:#4a4540;font-size:16px;margin:0 0 24px">Hi ${data.customerName}, your booking at <strong>${data.businessName}</strong> is confirmed.</p>
            <div style="background:#f0fafa;border-radius:12px;padding:24px;margin:0 0 24px">
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#9a9490;font-size:14px">Service</td><td style="padding:8px 0;color:#1a1814;font-weight:600;text-align:right">${data.serviceName}</td></tr>
                <tr><td style="padding:8px 0;color:#9a9490;font-size:14px">Date</td><td style="padding:8px 0;color:#1a1814;font-weight:600;text-align:right">${data.bookingDate}</td></tr>
                <tr><td style="padding:8px 0;color:#9a9490;font-size:14px">Time</td><td style="padding:8px 0;color:#1a1814;font-weight:600;text-align:right">${data.bookingTime}</td></tr>
                ${data.staffName ? `<tr><td style="padding:8px 0;color:#9a9490;font-size:14px">With</td><td style="padding:8px 0;color:#1a1814;font-weight:600;text-align:right">${data.staffName}</td></tr>` : ''}
                ${data.depositAmount ? `<tr><td style="padding:8px 0;color:#9a9490;font-size:14px">Deposit Paid</td><td style="padding:8px 0;color:#0d6e6e;font-weight:600;text-align:right">${data.depositAmount}</td></tr>` : ''}
                <tr><td style="padding:8px 0;color:#9a9490;font-size:14px">Total</td><td style="padding:8px 0;color:#1a1814;font-weight:700;text-align:right;font-size:18px">${data.totalAmount}</td></tr>
              </table>
            </div>
            <p style="color:#9a9490;font-size:13px;margin:0 0 8px">Booking Reference: <strong style="color:#1a1814">${data.bookingRef}</strong></p>
            ${data.cancellationPolicy ? `<p style="color:#9a9490;font-size:13px;margin:24px 0 0;padding:16px;background:#fef9f0;border-radius:8px;border-left:3px solid #c4893a">${data.cancellationPolicy}</p>` : ''}
          </div>
          <div style="padding:24px 40px;background:#f8f6f1;text-align:center">
            <p style="color:#9a9490;font-size:14px;margin:0">Powered by ScudoSystems.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

// ─── Booking Reminder ─────────────────────────────────────────────────────────
export async function sendBookingReminder(data: BookingEmailData, hoursUntil: number) {
  return sendEmail({
    from: FROM_EMAIL,
    to: data.customerEmail,
    subject: `Reminder: Your appointment at ${data.businessName} is ${hoursUntil === 24 ? 'tomorrow' : 'in 2 days'}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f8f6f1;font-family:'Outfit',Arial,sans-serif">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <div style="background:#c4893a;padding:40px;text-align:center">
            <div style="font-size:48px">🔔</div>
            <h1 style="color:#fff;margin:8px 0 0;font-size:24px">Appointment Reminder</h1>
          </div>
          <div style="padding:40px">
            <p style="color:#4a4540;font-size:16px;margin:0 0 24px">
              Hi ${data.customerName}, just a reminder that you have an appointment at <strong>${data.businessName}</strong> ${hoursUntil <= 24 ? 'tomorrow' : 'in 2 days'}.
            </p>
            <div style="background:#f0fafa;border-radius:12px;padding:24px;margin:0 0 24px">
              <p style="margin:0 0 8px;color:#1a1814;font-weight:700;font-size:18px">${data.serviceName}</p>
              <p style="margin:0;color:#4a4540">${data.bookingDate} at ${data.bookingTime}</p>
              ${data.staffName ? `<p style="margin:8px 0 0;color:#9a9490">with ${data.staffName}</p>` : ''}
            </div>
          </div>
          <div style="padding:24px 40px;background:#f8f6f1;text-align:center">
            <p style="color:#9a9490;font-size:14px;margin:0">Powered by ScudoSystems.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

// ─── Booking Cancellation ─────────────────────────────────────────────────────
export async function sendCancellationEmail(data: BookingEmailData) {
  return sendEmail({
    from: FROM_EMAIL,
    to: data.customerEmail,
    subject: `Booking Cancelled — ${data.businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f8f6f1;font-family:'Outfit',Arial,sans-serif">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:#dc2626;padding:40px;text-align:center">
            <div style="font-size:48px">❌</div>
            <h1 style="color:#fff;margin:8px 0 0;font-size:24px">Booking Cancelled</h1>
          </div>
          <div style="padding:40px">
            <p style="color:#4a4540;font-size:16px">Hi ${data.customerName}, your booking at <strong>${data.businessName}</strong> has been cancelled.</p>
            <p style="color:#4a4540"><strong>${data.serviceName}</strong> on ${data.bookingDate} at ${data.bookingTime}</p>
            <p style="color:#9a9490;font-size:14px">If you'd like to rebook, please visit our booking page.</p>
          </div>
          <div style="padding:24px 40px;background:#f8f6f1;text-align:center">
            <p style="color:#9a9490;font-size:14px;margin:0">Powered by ScudoSystems.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

// ─── New Booking Alert to Owner ────────────────────────────────────────────────
export async function sendNewBookingAlert(
  ownerEmail: string,
  businessName: string,
  data: BookingEmailData
) {
  return sendEmail({
    from: FROM_EMAIL,
    to: ownerEmail,
    subject: `New Booking: ${data.customerName} — ${data.serviceName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f8f6f1;font-family:'Outfit',Arial,sans-serif">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:#1a1814;padding:32px 40px;display:flex;align-items:center">
            <div>
              <p style="color:#c4893a;margin:0;font-size:12px;text-transform:uppercase;letter-spacing:0.1em">New Booking</p>
              <h1 style="color:#fff;margin:4px 0 0;font-size:22px">${businessName}</h1>
            </div>
          </div>
          <div style="padding:40px">
            <div style="background:#f0fafa;border-radius:12px;padding:24px">
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#9a9490;font-size:14px">Customer</td><td style="padding:8px 0;color:#1a1814;font-weight:600;text-align:right">${data.customerName}</td></tr>
                <tr><td style="padding:8px 0;color:#9a9490;font-size:14px">Service</td><td style="padding:8px 0;color:#1a1814;font-weight:600;text-align:right">${data.serviceName}</td></tr>
                <tr><td style="padding:8px 0;color:#9a9490;font-size:14px">Date</td><td style="padding:8px 0;color:#1a1814;font-weight:600;text-align:right">${data.bookingDate}</td></tr>
                <tr><td style="padding:8px 0;color:#9a9490;font-size:14px">Time</td><td style="padding:8px 0;color:#1a1814;font-weight:600;text-align:right">${data.bookingTime}</td></tr>
                <tr><td style="padding:8px 0;color:#9a9490;font-size:14px">Amount</td><td style="padding:8px 0;color:#0d6e6e;font-weight:700;text-align:right;font-size:18px">${data.totalAmount}</td></tr>
              </table>
            </div>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings" style="display:inline-block;margin-top:24px;background:#0d6e6e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              View in Dashboard →
            </a>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

// ─── Trial Ending Soon ────────────────────────────────────────────────────────
export async function sendTrialEndingEmail(to: string, businessName: string, daysLeft: number) {
  return sendEmail({
    from: FROM_EMAIL,
    to,
    subject: `Your ScudoSystems trial ends in ${daysLeft} days`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f8f6f1;font-family:'Outfit',Arial,sans-serif">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:#c4893a;padding:40px;text-align:center">
            <div style="font-size:48px">⏰</div>
            <h1 style="color:#fff;margin:8px 0 0;font-size:24px">Your trial ends in ${daysLeft} days</h1>
          </div>
          <div style="padding:40px">
            <p style="color:#4a4540;font-size:16px">Hi there — just a heads up that your ScudoSystems trial for <strong>${businessName}</strong> ends in ${daysLeft} days.</p>
            <p style="color:#4a4540">To keep your booking page live and continue receiving bookings, add a payment method before your trial expires.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing" style="display:inline-block;margin-top:16px;background:#0d6e6e;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">
              Upgrade Now →
            </a>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}

// ─── Payment Failed ────────────────────────────────────────────────────────────
export async function sendPaymentFailedEmail(to: string, businessName: string) {
  return sendEmail({
    from: FROM_EMAIL,
    to,
    subject: `Action required: Payment failed for ${businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f8f6f1;font-family:'Outfit',Arial,sans-serif">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:#dc2626;padding:40px;text-align:center">
            <div style="font-size:48px">⚠️</div>
            <h1 style="color:#fff;margin:8px 0 0;font-size:24px">Payment Failed</h1>
          </div>
          <div style="padding:40px">
            <p style="color:#4a4540;font-size:16px">We couldn't process your payment for <strong>${businessName}</strong>'s ScudoSystems subscription.</p>
            <p style="color:#4a4540">Your booking page is still active, but please update your payment method within 7 days to avoid service interruption.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=billing" style="display:inline-block;margin-top:16px;background:#dc2626;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">
              Update Payment Method →
            </a>
          </div>
        </div>
      </body>
      </html>
    `,
  })
}
