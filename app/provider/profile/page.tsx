export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import ProviderProfileClient from './client'

export default async function ProviderProfilePage() {
  const session = await getSession()
  if (!session) redirect('/provider/login')
  if (session.role !== 'provider') redirect('/dashboard')

  const db = createServiceClient()
  const { data: provider } = await db.from('providers')
    .select('*')
    .eq('id', session.userId).single()

  return <ProviderProfileClient provider={provider} />
}
