export const dynamic = 'force-dynamic'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import UserManagementClient from './client'

export default async function UsersPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'admin') redirect('/dashboard')

  const db = createServiceClient()
  const { data: staffUsers } = await db
    .from('staff_users')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: providerUsers } = await db
    .from('providers')
    .select('id, name, email, phone, credential_type, city, status')
    .order('name')

  return <UserManagementClient staffUsers={staffUsers ?? []} providerUsers={providerUsers ?? []} />
}
