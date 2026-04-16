import Sidebar from '@/components/Sidebar'
import { getSession } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  let userName = ''
  let emailFailureCount = 0

  if (session?.userId) {
    const db = createServiceClient()
    const { data } = await db.from('staff_users').select('full_name').eq('id', session.userId).single()
    userName = data?.full_name ?? ''

    // Admin-only: count unresolved email failures. Uses the partial
    // index email_send_failures_unresolved_idx; head-only count, no
    // data returned.
    if (session.role === 'admin') {
      const { count } = await db
        .from('email_send_failures')
        .select('id', { count: 'exact', head: true })
        .is('resolved_at', null)
      emailFailureCount = count ?? 0
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        role={session?.role ?? 'coordinator'}
        userName={userName}
        emailFailureCount={emailFailureCount}
      />
      <main className="main-content">{children}</main>
    </div>
  )
}
