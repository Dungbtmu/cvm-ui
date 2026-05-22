export type CampaignStatus = 'Active' | 'Draft' | 'Pending' | 'Paused' | 'Ended'
export type TriggerType = 'Realtime' | 'Near Realtime' | 'Offline'
export type ChannelType = 'Push' | 'Zalo OA' | 'SMS' | 'Banner' | 'Email' | 'USSD'
export type TriggerLogic = 'OR' | 'AND'
export type BlackoutAction = 'discard' | 'delay'

export interface Campaign {
  id: string
  name: string
  code: string
  status: CampaignStatus
  triggers: string[]
  templateIds?: string[]
  startDate: string
  endDate: string
  priority: number
  owner: string
  createdAt: string
  submittedAt?: string
  goal?: string
}

export interface Trigger {
  id: string
  code: string
  name: string
  source: 'BSS' | 'OCS'
  type: TriggerType
  status: 'Active' | 'Inactive'
  description?: string
  params: TriggerParam[]
}

export interface TriggerParam {
  name: string
  description: string
  format: 'text' | 'date' | 'number' | 'boolean' | 'currency'
  source: string
}

export interface Template {
  id: string
  name: string
  description?: string
  channels: ChannelType[]
  usageCount: number
  status: 'Active' | 'Inactive'
}

export interface BlacklistEntry {
  phone: string
  campaign: string
  channel: ChannelType
  source: 'manual' | 'upload' | 'campaign'
}

export interface Customer {
  phone: string
  simType: 'eSIM' | 'SIM vật lý'
  status: 'Active' | 'Inactive' | 'Suspended'
  hasApp: boolean
  hasDnc: boolean
}

export interface Segment {
  id: string
  name: string
  reach: number
  source: string
}
