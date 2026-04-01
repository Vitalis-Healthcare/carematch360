import PageHeader from '@/components/PageHeader'
import ProviderForm from '@/components/ProviderForm'
export default function NewProviderPage() {
  return (<><PageHeader title="Add Provider" subtitle="Register a new credentialed care provider" breadcrumbs={[{label:'Providers',href:'/providers'},{label:'New Provider'}]}/><ProviderForm mode="new"/></>)
}
