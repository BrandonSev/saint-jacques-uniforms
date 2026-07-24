import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as welcome } from './welcome'
import { template as orderConfirmation } from './order-confirmation'
import { template as adminOrder } from './admin-order'
import { template as orderStatus } from './order-status'
import { template as incidentFamily } from './incident-family'
import { template as incidentAdmin } from './incident-admin'
import { template as incidentResolution } from './incident-resolution'
import { template as orderCorrectionResolution } from './order-correction-resolution'
import { template as passwordReset } from './password-reset'
import { template as apelReminder } from './apel-reminder'
import { template as signup } from './signup'
import { template as technicalFix } from './technical-fix'
import { template as customBulk } from './custom-bulk'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'welcome': welcome,
  'signup': signup,
  'order-confirmation': orderConfirmation,
  'admin-order': adminOrder,
  'order-status': orderStatus,
  'incident-family': incidentFamily,
  'incident-admin': incidentAdmin,
  'incident-resolution': incidentResolution,
  'order-correction-resolution': orderCorrectionResolution,
  'password-reset': passwordReset,
  'apel-reminder': apelReminder,
  'technical-fix': technicalFix,
  'custom-bulk': customBulk,
}
