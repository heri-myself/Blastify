export type SenderStatus = 'active' | 'soft_banned' | 'recovering' | 'warmup' | 'disabled'
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'done' | 'failed'
export type ContactStatus = 'pending' | 'sending' | 'sent' | 'delivered' | 'failed' | 'skipped'
export type FileType = 'image' | 'document' | 'video'
export type MessageType = 'text' | 'image' | 'document' | 'button'
export type DeliveryEvent = 'sent' | 'delivered' | 'failed' | 'blocked' | 'retry'

export interface SenderPhone {
  id: string
  user_id: string
  phone_number: string
  display_name: string | null
  status: SenderStatus
  consecutive_failures: number
  banned_at: string | null
  recover_at: string | null
  warmup_day: number
  daily_sent: number
  last_sent_at: string | null
  session_data: Record<string, unknown> | null
  created_at: string
}

export interface Contact {
  id: string
  user_id: string
  phone: string
  name: string | null
  tags: string[]
  extra_data: Record<string, unknown> | null
  opt_in_at: string | null
  opt_out_at: string | null
  last_received_at: string | null
  is_blocked: boolean
  created_at: string
}

export interface MediaFile {
  id: string
  user_id: string
  filename: string
  storage_path: string
  public_url: string
  file_type: FileType
  file_size: number
  created_at: string
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  status: CampaignStatus
  scheduled_at: string | null
  started_at: string | null
  finished_at: string | null
  target_filter: Record<string, unknown> | null
  sender_rotation: string[] | null
  created_at: string
}

export interface CampaignMessage {
  id: string
  campaign_id: string
  order_index: number
  type: MessageType
  content: string | null
  media_url: string | null
  buttons: Array<{ text: string; url: string }> | null
}

export interface CampaignContact {
  id: string
  campaign_id: string
  contact_id: string
  sender_phone_id: string | null
  status: ContactStatus
  scheduled_at: string | null
  sent_at: string | null
  delivered_at: string | null
  error_code: string | null
  retry_count: number
}

export interface DeliveryLog {
  id: string
  campaign_contact_id: string
  event: DeliveryEvent
  details: Record<string, unknown> | null
  created_at: string
}
