import { useEffect, useState } from 'react'

interface UserDetails {
  email: string
  firstname: string
  lastname: string
  is_admin: boolean
}

interface Account {
  name: string
  valid_until: string | null
}

interface SessionContext {
  user_details: UserDetails
  accounts: Account[]
}

function AdminPage() {
  const [context, setContext] = useState<SessionContext | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/session-context')
      .then((res) => {
        if (!res.ok) throw new Error(`Not authenticated (${res.status})`)
        return res.json()
      })
      .then(setContext)
      .catch((err) => setError(err.message))
  }, [])

  if (error) return <div className="error">{error}</div>
  if (!context) return <div className="loading">Loading...</div>

  const { user_details, accounts } = context

  return (
    <div className="app">
      <h1>R2lab Admin</h1>
      <section>
        <h2>User</h2>
        <p><strong>Email:</strong> {user_details.email}</p>
        <p><strong>Name:</strong> {user_details.firstname} {user_details.lastname}</p>
        <p><strong>Admin:</strong> {user_details.is_admin ? 'Yes' : 'No'}</p>
      </section>
      <section>
        <h2>Slices</h2>
        {accounts.length === 0 ? (
          <p>No slices</p>
        ) : (
          <ul>
            {accounts.map((a) => (
              <li key={a.name}>
                {a.name}
                {a.valid_until && <span> (until {a.valid_until})</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default AdminPage
