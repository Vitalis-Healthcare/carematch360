import { redirect } from 'next/navigation'
export default function RespondPage({ searchParams }: { searchParams: any }) {
  // Actual logic is in /api/respond — this page handles the redirect
  redirect('/respond/invalid')
}
