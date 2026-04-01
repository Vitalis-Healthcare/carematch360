import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export default async function Home() {
  const headersList = await headers()
  const host = headersList.get('host') ?? ''

  if (host.startsWith('getcare.')) return redirect('/getcare')
  if (host.startsWith('apply.')) return redirect('/apply')

  return redirect('/dashboard')
}
