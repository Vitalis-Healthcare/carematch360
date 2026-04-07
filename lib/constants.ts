// ── Case hold reasons ────────────────────────────────────────
// Admin-editable in future; hardcoded list for now
export const HOLD_REASONS = [
  { value: 'awaiting_authorization',  label: 'Awaiting Insurance Authorization' },
  { value: 'awaiting_doctors_order',  label: "Awaiting Doctor's Order" },
  { value: 'client_not_ready',        label: 'Client Not Ready to Start' },
  { value: 'client_hospitalized',     label: 'Client Hospitalized' },
  { value: 'no_providers_available',  label: 'No Providers Available' },
  { value: 'schedule_conflict',       label: 'Schedule Conflict' },
  { value: 'family_request',          label: 'Family Request / Delay' },
  { value: 'billing_issue',           label: 'Billing / Payer Issue' },
  { value: 'assessment_pending',      label: 'Assessment Pending' },
  { value: 'other',                   label: 'Other (see note)' },
]

// ── Case status config ────────────────────────────────────────
export const CASE_STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; tab: 'leads'|'active'|'assigned'|'on_hold'|'closed'
}> = {
  lead:      { label: 'Lead',       color: '#A855F7', bg: '#FAF5FF',  tab: 'leads'    },
  open:      { label: 'Open',       color: '#0EA5E9', bg: '#EFF6FF',  tab: 'active'   },
  matching:  { label: 'Matching',   color: '#8B5CF6', bg: '#F5F3FF',  tab: 'active'   },
  matched:   { label: 'Matched',    color: '#F59E0B', bg: '#FFFBEB',  tab: 'active'   },
  assigned:  { label: 'Assigned',   color: '#10B981', bg: '#ECFDF5',  tab: 'assigned' },
  on_hold:   { label: 'On Hold',    color: '#F59E0B', bg: '#FEF9C3',  tab: 'on_hold'  },
  completed: { label: 'Completed',  color: '#6B7280', bg: '#F9FAFB',  tab: 'closed'   },
  cancelled: { label: 'Cancelled',  color: '#EF4444', bg: '#FEF2F2',  tab: 'closed'   },
}
