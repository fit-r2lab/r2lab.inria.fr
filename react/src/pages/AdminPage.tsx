import { useState } from 'react'
import RegistrationsTab from '../components/RegistrationsTab'
import SlicesTab from '../components/SlicesTab'
import UsersTab from '../components/UsersTab'

type Tab = 'registrations' | 'slices' | 'users'

function AdminPage() {
  const [tab, setTab] = useState<Tab>('registrations')

  return (
    <div className="app-wide">
      {/* <h1>R2lab Admin</h1> */}
      <nav style={{ display: 'flex', gap: '4px', marginBottom: '1em' }}>
        <button
          onClick={() => setTab('registrations')}
          style={{ fontWeight: tab === 'registrations' ? 'bold' : 'normal' }}
        >
          Registrations
        </button>
        <button
          onClick={() => setTab('slices')}
          style={{ fontWeight: tab === 'slices' ? 'bold' : 'normal' }}
        >
          Slices
        </button>
        <button
          onClick={() => setTab('users')}
          style={{ fontWeight: tab === 'users' ? 'bold' : 'normal' }}
        >
          Users
        </button>
      </nav>

      {tab === 'registrations' && <RegistrationsTab />}
      {tab === 'slices' && <SlicesTab />}
      {tab === 'users' && <UsersTab />}
    </div>
  )
}

export default AdminPage
