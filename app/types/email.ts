export interface EmailVariable {
  key: string
  label: string
  sample: string
}

export interface EmailTemplate {
  key: string
  name: string
  description: string
  subject: string
  html: string
  isActive: boolean
  updatedAt: string
  variables: EmailVariable[]
}

export type CampaignStatus = 'DRAFT' | 'SENDING' | 'SENT' | 'FAILED'

export interface EmailCampaign {
  id: string
  name: string
  subject: string
  html: string
  status: CampaignStatus
  recipientCount: number
  sentCount: number
  failedCount: number
  sentAt: string | null
  createdAt: string
  updatedAt: string
  variables: EmailVariable[]
}

export interface RecipientsPreview {
  total: number
  sample: Array<{ name: string, email: string }>
  emailConfigured: boolean
}

// Client-side preview render: same `{{TAG}}` syntax the backend resolves on send.
export function renderPreview(template: string, variables: EmailVariable[]): string {
  const samples = new Map(variables.map(v => [v.key, v.sample]))
  return template.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (_, key: string) => samples.get(key) ?? '')
}
