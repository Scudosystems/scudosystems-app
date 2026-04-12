export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          user_id: string
          business_name: string
          vertical: VerticalEnum
          slug: string
          logo_url: string | null
          brand_colour: string
          address: string | null
          phone: string | null
          email: string | null
          website: string | null
          description: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_connect_account_id: string | null
          stripe_connect_onboarded: boolean
          plan: PlanEnum
          plan_status: PlanStatusEnum
          trial_ends_at: string | null
          onboarding_completed: boolean
          created_at: string
          owner_email: string | null
          booking_page_enabled: boolean
          booking_page_headline: string | null
          booking_page_subtext: string | null
          booking_page_theme: string | null
          booking_page_cta_label: string | null
          booking_page_font: string | null
          booking_page_button_style: string | null
          booking_page_ab_enabled: boolean
          booking_page_ab_split: number
          booking_page_ab_auto_apply: boolean
          booking_page_variant_b_headline: string | null
          booking_page_variant_b_subtext: string | null
          booking_page_variant_b_cta_label: string | null
          booking_page_variant_b_theme: string | null
          booking_page_variant_b_font: string | null
          booking_page_variant_b_button_style: string | null
          booking_page_variant_b_brand_colour: string | null
          wait_page_enabled: boolean
          wait_qr_headline: string | null
          wait_qr_subtext: string | null
          wait_qr_cta: string | null
          queue_delay_minutes: number
          booking_poster_offer: string | null
          booking_poster_headline: string | null
          booking_poster_subtext: string | null
          booking_poster_cta: string | null
          booking_poster_image_url: string | null
          booking_page_show_live_availability: boolean
          booking_page_live_window_minutes: number
          booking_page_live_buffer_minutes: number
          rental_min_days: number
          rental_requirements: string | null
          job_offers_enabled: boolean
          stripe_last_event_at: string | null
          stripe_last_event_type: string | null
          allow_same_day: boolean
          minimum_advance_hours: number
          auto_confirm: boolean
          require_deposit: boolean
          sms_reminders_enabled: boolean
          email_reminders_enabled: boolean
          daily_summary_email: boolean
          new_booking_sms: boolean
          cancellation_policy: string | null
          staff_guidelines: string[] | null
        }
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'created_at'> & { created_at?: string }
        Update: Partial<Database['public']['Tables']['tenants']['Row']>
      }
      services: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description: string | null
          duration_minutes: number
          price_pence: number
          deposit_pence: number
          requires_deposit: boolean
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['services']['Row']>
      }
      staff: {
        Row: {
          id: string
          tenant_id: string
          name: string
          role: string | null
          avatar_url: string | null
          bio: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['staff']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['staff']['Row']>
      }
      availability: {
        Row: {
          id: string
          tenant_id: string
          staff_id: string | null
          day_of_week: number
          start_time: string
          end_time: string
          is_active: boolean
        }
        Insert: Omit<Database['public']['Tables']['availability']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['availability']['Row']>
      }
      bookings: {
        Row: {
          id: string
          tenant_id: string
          service_id: string
          staff_id: string | null
          customer_name: string
          customer_email: string
          customer_phone: string
          booking_date: string
          booking_time: string
          status: BookingStatusEnum
          deposit_paid: boolean
          deposit_amount_pence: number
          total_amount_pence: number
          stripe_payment_intent_id: string | null
          queue_status: string | null
          queue_updated_at: string | null
          metadata: Json | null
          notes: string | null
          customer_concerns: string | null
          booking_ref: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['bookings']['Row']>
      }
      booking_page_ab_stats: {
        Row: {
          id: string
          tenant_id: string
          variant: string
          views: number
          bookings: number
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['booking_page_ab_stats']['Row'], 'id' | 'updated_at'> & { id?: string; updated_at?: string }
        Update: Partial<Database['public']['Tables']['booking_page_ab_stats']['Row']>
      }
      blocked_times: {
        Row: {
          id: string
          tenant_id: string
          staff_id: string | null
          blocked_date: string
          start_time: string
          end_time: string
          reason: string | null
          is_recurring: boolean
          recurring_day_of_week: number | null
        }
        Insert: Omit<Database['public']['Tables']['blocked_times']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['blocked_times']['Row']>
      }
      reminders: {
        Row: {
          id: string
          booking_id: string
          type: ReminderTypeEnum
          scheduled_at: string
          sent_at: string | null
          status: ReminderStatusEnum
        }
        Insert: Omit<Database['public']['Tables']['reminders']['Row'], 'id'> & { id?: string }
        Update: Partial<Database['public']['Tables']['reminders']['Row']>
      }
      reviews: {
        Row: {
          id: string
          tenant_id: string
          booking_id: string | null
          staff_id: string | null
          booking_ref: string | null
          display_name: string | null
          rating: number
          timing_rating: number | null
          service_rating: number | null
          cleanliness_rating: number | null
          comment: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['reviews']['Row']>
      }
    }
    Enums: {
      vertical_enum: VerticalEnum
      plan_enum: PlanEnum
      plan_status_enum: PlanStatusEnum
      booking_status_enum: BookingStatusEnum
      reminder_type_enum: ReminderTypeEnum
      reminder_status_enum: ReminderStatusEnum
    }
  }
}

export type VerticalEnum =
  | 'dental' | 'beauty' | 'nightclub' | 'spa' | 'gym' | 'optician' | 'vet' | 'auto' | 'tutoring'
  | 'restaurant' | 'barber' | 'tattoo' | 'carwash' | 'driving' | 'takeaway' | 'supercar'
  | 'photography' | 'grooming' | 'physio' | 'nails' | 'aesthetics' | 'lash' | 'escape'
  | 'solicitor' | 'accountant'
export type PlanEnum = 'starter' | 'professional' | 'enterprise'
export type PlanStatusEnum = 'trialing' | 'active' | 'past_due' | 'cancelled'
export type BookingStatusEnum = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type ReminderTypeEnum = 'email' | 'sms'
export type ReminderStatusEnum = 'pending' | 'sent' | 'failed'

// ─── Convenience Types ────────────────────────────────────────────────────────
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Staff = Database['public']['Tables']['staff']['Row']
export type Availability = Database['public']['Tables']['availability']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type BlockedTime = Database['public']['Tables']['blocked_times']['Row']
export type Reminder = Database['public']['Tables']['reminders']['Row']
