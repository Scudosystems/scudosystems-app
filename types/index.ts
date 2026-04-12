export type { Tenant, Service, Staff, Availability, Booking, BlockedTime, Reminder } from './database'
export type { VerticalEnum, PlanEnum, PlanStatusEnum, BookingStatusEnum } from './database'

export interface OnboardingData {
  step: number
  businessName?: string
  address?: string
  phone?: string
  website?: string
  description?: string
  logoUrl?: string
  openingHours?: OpeningHours[]
  services?: ServiceInput[]
  brandColour?: string
  preferences?: TenantPreferences
}

export interface OpeningHours {
  dayOfWeek: number
  isOpen: boolean
  startTime: string
  endTime: string
  lunchBreak: boolean
  lunchStart?: string
  lunchEnd?: string
}

export interface ServiceInput {
  id?: string
  name: string
  description: string
  price_pence: number
  duration_minutes: number
  deposit_pence: number
  requires_deposit: boolean
}

export interface TenantPreferences {
  smsReminders: boolean
  emailReminders: boolean
  requireDeposit: boolean
  autoConfirm: boolean
  dailySummaryEmail: boolean
  newBookingSms: boolean
  cancellationPolicy: string
  allowSameDay: boolean
  minimumAdvanceHours: number
}

export interface BookingSlot {
  time: string
  available: boolean
}

export interface DashboardStats {
  todayBookings: number
  monthRevenue: number
  activeCustomers: number
  upcomingThisWeek: number
}

export interface RevenueData {
  date: string
  revenue: number
  bookings: number
}
