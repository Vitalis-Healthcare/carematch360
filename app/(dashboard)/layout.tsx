import Sidebar from '@/components/Sidebar'
import { getSession } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  let userName = ''
  if (session?.userId) {
    const db = createServiceClient()
    const { data } = await db.from('staff_users').select('full_name').eq('id', session.userId).single()
    userName = data?.full_name ?? ''
  }
  return (
    <div className="app-layout">
      <Sidebar role={session?.role ?? 'coordinator'} userName={userName} />
      <main className="main-content">{children}</main>
    </div>
  )
}
