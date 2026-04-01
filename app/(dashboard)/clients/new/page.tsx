import PageHeader from '@/components/PageHeader'
import ClientForm from '@/components/ClientForm'
export default function NewClientPage() {
  return (<><PageHeader title="Add Client" subtitle="Register a new client and their care requirements" breadcrumbs={[{label:'Clients',href:'/clients'},{label:'New Client'}]}/><ClientForm mode="new"/></>)
}
