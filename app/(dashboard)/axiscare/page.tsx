export const dynamic = 'force-dynamic'

import PageHeader from '@/components/PageHeader'
import AxisCareImport from '@/components/AxisCareImport'

export default function ImportPage() {
  const siteFromEnv = process.env.AXISCARE_SITE_NUMBER || ''
  const hasToken = !!process.env.AXISCARE_API_TOKEN
  return (
    <>
      <PageHeader
        title="AxisCare Import"
        subtitle="Pull caregivers and clients directly from your AxisCare account"
        breadcrumbs={[{ label: 'AxisCare Import' }]}
      />
      <div className="page-body">
        <AxisCareImport siteFromEnv={siteFromEnv} hasToken={hasToken} />
      </div>
    </>
  )
}
