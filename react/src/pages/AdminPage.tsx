import { useState } from 'react'
import RegistrationsTab from '../components/RegistrationsTab'

type Tab = 'registrations' | 'slices'

function AdminPage() {
  const [tab, setTab] = useState<Tab>('registrations')

  return (
    <div className="app">
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
      </nav>

      {tab === 'registrations' && <RegistrationsTab />}
      {tab === 'slices' && <p>Slices — coming soon</p>}
    </div>
  )
}

export default AdminPage
