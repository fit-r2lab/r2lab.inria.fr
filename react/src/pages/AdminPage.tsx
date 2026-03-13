import { useEffect, useState } from 'react'
import RegistrationsTab from '../components/RegistrationsTab'
import SlicesTab from '../components/SlicesTab'
import UsersTab from '../components/UsersTab'

type Tab = 'slices' | 'users' | 'registrations'

function AdminPage() {
  const [tab, setTab] = useState<Tab>('slices')
  const [resetKey, setResetKey] = useState(0)
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  const handleTab = (t: Tab) => {
    if (t === tab) {
      // clicking the active tab resets it to list view
      setResetKey((k) => k + 1)
    } else {
      setTab(t)
    }
  }

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
          onClick={() => handleTab('slices')}
        >
          Slices
        </button>
        <button
          className={`admin-tab${tab === 'users' ? ' active' : ''}`}
          onClick={() => handleTab('users')}
        >
          Users
        </button>
        <button
          className={`admin-tab${tab === 'registrations' ? ' active' : ''}`}
          onClick={() => handleTab('registrations')}
        >
          Registrations
          {pendingCount != null && pendingCount > 0 && (
            <span className="badge">{pendingCount}</span>
          )}
        </button>
      </nav>

      {tab === 'slices' && <SlicesTab key={resetKey} />}
      {tab === 'users' && <UsersTab key={resetKey} />}
      {tab === 'registrations' && <RegistrationsTab key={resetKey} />}
    </div>
  )
}

export default AdminPage
