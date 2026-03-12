import { useEffect, useState } from 'react'
import RegistrationsTab from '../components/RegistrationsTab'
import SlicesTab from '../components/SlicesTab'
import UsersTab from '../components/UsersTab'

type Tab = 'slices' | 'users' | 'registrations'

function AdminPage() {
  const [tab, setTab] = useState<Tab>('slices')
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/r2labapi/registrations')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { status: string }[]) =>
        setPendingCount(
          data.filter(
            (r) => r.status === 'pending_admin' || r.status === 'pending_email',
          ).length,
        ),
      )
      .catch(() => {})
  }, [tab])

  return (
    <div className="app-wide">
      <nav className="admin-tabs">
        <button
          className={`admin-tab${tab === 'slices' ? ' active' : ''}`}
          onClick={() => setTab('slices')}
        >
          Slices
        </button>
        <button
          className={`admin-tab${tab === 'users' ? ' active' : ''}`}
          onClick={() => setTab('users')}
        >
          Users
        </button>
        <button
          className={`admin-tab${tab === 'registrations' ? ' active' : ''}`}
          onClick={() => setTab('registrations')}
        >
          Registrations
          {pendingCount != null && pendingCount > 0 && (
            <span className="badge">{pendingCount}</span>
          )}
        </button>
      </nav>

      {tab === 'slices' && <SlicesTab />}
      {tab === 'users' && <UsersTab />}
      {tab === 'registrations' && <RegistrationsTab />}
    </div>
  )
}

export default AdminPage
