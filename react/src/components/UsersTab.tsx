import { useEffect, useState, useMemo } from 'react'

interface User {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
  is_admin?: boolean
  status?: string
  created_at?: string
}

interface Slice {
  id: number
  name: string
  member_ids: number[]
  deleted_at: string | null
}

interface SshKey {
  id: number
  comment: string | null
  fingerprint?: string
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`/r2labapi/${path}`, init)
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.detail ?? `Request failed (${res.status})`)
  }
  if (res.status === 204) return null
  return res.json()
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [slices, setSlices] = useState<Slice[]>([])
  const [keyCount, setKeyCount] = useState<Map<number, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [adminFilter, setAdminFilter] = useState<'all' | 'admin' | 'non-admin'>('all')
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  type SortCol = 'name' | 'email' | 'slices' | 'keys'
  const [sortCol, setSortCol] = useState<SortCol>('name')
  const [sortAsc, setSortAsc] = useState(true)

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc)
    } else {
      setSortCol(col)
      setSortAsc(true)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersData, slicesData]: [User[], Slice[]] = await Promise.all([
        apiFetch('users'),
        apiFetch('slices'),
      ])
      setUsers(usersData)
      setSlices(slicesData)

      const keysMap = new Map<number, number>()
      await Promise.all(
        usersData.map(async (u) => {
          try {
            const keys = await apiFetch(`users/${u.id}/keys`)
            keysMap.set(u.id, Array.isArray(keys) ? keys.length : 0)
          } catch {
            keysMap.set(u.id, 0)
          }
        }),
      )
      setKeyCount(keysMap)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // precompute slice count & names per user
  const userSlices = useMemo(() => {
    const map = new Map<number, string[]>()
    for (const s of slices) {
      const active = !s.deleted_at || new Date(s.deleted_at) > new Date()
      if (!active) continue
      for (const uid of s.member_ids) {
        const list = map.get(uid) ?? []
        list.push(s.name)
        map.set(uid, list)
      }
    }
    return map
  }, [slices])

  const displayName = (u: User) =>
    `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || '—'

  const filtered = useMemo(() => {
    const lc = filter.toLowerCase()
    const result = users.filter((u) => {
      if (adminFilter === 'admin' && !u.is_admin) return false
      if (adminFilter === 'non-admin' && u.is_admin) return false
      if (!lc) return true
      return (
        displayName(u).toLowerCase().includes(lc) ||
        u.email.toLowerCase().includes(lc)
      )
    })

    const dir = sortAsc ? 1 : -1
    result.sort((a, b) => {
      let cmp = 0
      switch (sortCol) {
        case 'name':
          cmp = displayName(a).localeCompare(displayName(b))
          break
        case 'email':
          cmp = a.email.localeCompare(b.email)
          break
        case 'slices':
          cmp = (userSlices.get(a.id)?.length ?? 0) - (userSlices.get(b.id)?.length ?? 0)
          break
        case 'keys':
          cmp = (keyCount.get(a.id) ?? 0) - (keyCount.get(b.id) ?? 0)
          break
      }
      return cmp * dir
    })
    return result
  }, [users, filter, adminFilter, sortCol, sortAsc, userSlices, keyCount])

  if (loading) return <p>Loading users...</p>
  if (error) return <div className="error">{error}</div>

  // detail view
  if (selectedUserId !== null) {
    const user = users.find((u) => u.id === selectedUserId)
    if (!user) {
      setSelectedUserId(null)
      return null
    }
    return (
      <UserDetail
        user={user}
        allSlices={slices}
        onBack={() => {
          setSelectedUserId(null)
          fetchData()
        }}
      />
    )
  }

  // list view
  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1em' }}>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name or email..."
          style={{ padding: '4px 8px', width: '300px' }}
        />
        <select
          value={adminFilter}
          onChange={(e) => setAdminFilter(e.target.value as 'all' | 'admin' | 'non-admin')}
        >
          <option value="all">All</option>
          <option value="admin">Admins</option>
          <option value="non-admin">Non-admins</option>
        </select>
        <span style={{ fontSize: '0.85em', color: '#666' }}>
          Showing {filtered.length} of {users.length}
        </span>
      </div>

      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9em' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
            <SortTh col="name" current={sortCol} asc={sortAsc} onClick={toggleSort}>Name</SortTh>
            <SortTh col="email" current={sortCol} asc={sortAsc} onClick={toggleSort}>Email</SortTh>
            <SortTh col="slices" current={sortCol} asc={sortAsc} onClick={toggleSort} style={{ textAlign: 'right' }}>Slices</SortTh>
            <SortTh col="keys" current={sortCol} asc={sortAsc} onClick={toggleSort} style={{ textAlign: 'right' }}>Keys</SortTh>
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => {
            const sNames = userSlices.get(u.id) ?? []
            const keys = keyCount.get(u.id) ?? 0
            const noKey = keys === 0
            return (
              <tr
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                style={{
                  borderBottom: '1px solid #ddd',
                  cursor: 'pointer',
                  ...(noKey ? { background: '#fff3f3', color: '#a00' } : {}),
                }}
              >
                <td style={tdStyle}>{displayName(u)}</td>
                <td style={tdStyle}>{u.email}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  {sNames.length}
                  {sNames.length > 0 && (
                    <span
                      title={sNames.join('\n')}
                      style={{ marginLeft: 4, cursor: 'help', opacity: 0.5 }}
                    >
                      ?
                    </span>
                  )}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{keys}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── User detail view ────────────────────────────────────────────────

function UserDetail({
  user: initialUser,
  allSlices,
  onBack,
}: {
  user: User
  allSlices: Slice[]
  onBack: () => void
}) {
  const [user, setUser] = useState<User>(initialUser)
  const [keys, setKeys] = useState<SshKey[]>([])
  const [slices, setSlices] = useState<Slice[]>(allSlices)
  const [loadingDetail, setLoadingDetail] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // add-to-slice state
  const [addSliceName, setAddSliceName] = useState('')
  const [acting, setActing] = useState(false)

  const fetchDetail = async () => {
    setLoadingDetail(true)
    setError(null)
    try {
      const [userDetail, userKeys, slicesData]: [User, SshKey[], Slice[]] =
        await Promise.all([
          apiFetch(`users/${user.id}`),
          apiFetch(`users/${user.id}/keys`),
          apiFetch('slices'),
        ])
      setUser(userDetail)
      setKeys(userKeys ?? [])
      setSlices(slicesData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load details')
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => {
    fetchDetail()
  }, [])

  const displayName =
    `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || '—'

  // slices this user belongs to (active only)
  const memberSlices = slices.filter(
    (s) =>
      s.member_ids.includes(user.id) &&
      (!s.deleted_at || new Date(s.deleted_at) > new Date()),
  )

  // slices this user is NOT in (for the "add" picker)
  const availableSlices = slices.filter(
    (s) =>
      !s.member_ids.includes(user.id) &&
      (!s.deleted_at || new Date(s.deleted_at) > new Date()),
  )

  const handleRemoveFromSlice = async (slice: Slice) => {
    setActing(true)
    setError(null)
    setMessage(null)
    try {
      await apiFetch(`slices/${slice.id}/members/${user.id}`, {
        method: 'DELETE',
      })
      setMessage(`Removed from ${slice.name}`)
      await fetchDetail()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Remove failed')
    } finally {
      setActing(false)
    }
  }

  const handleAddToSlice = async () => {
    const slice = availableSlices.find((s) => s.name === addSliceName)
    if (!slice) {
      setError('Pick a slice from the list')
      return
    }
    setActing(true)
    setError(null)
    setMessage(null)
    try {
      await apiFetch(`slices/${slice.id}/members/${user.id}`, {
        method: 'PUT',
      })
      setAddSliceName('')
      setMessage(`Added to ${slice.name}`)
      await fetchDetail()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Add failed')
    } finally {
      setActing(false)
    }
  }

  const handlePasswordReset = async () => {
    setActing(true)
    setError(null)
    setMessage(null)
    try {
      await apiFetch('auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      })
      setMessage(`Password reset link sent to ${user.email}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed')
    } finally {
      setActing(false)
    }
  }

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '1em' }}>
        &larr; Back to users
      </button>

      <h2 style={{ marginTop: 0 }}>
        {displayName}
        {user.is_admin && (
          <span
            style={{
              marginLeft: 8,
              fontSize: '0.7em',
              background: '#007bff',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '8px',
              verticalAlign: 'middle',
            }}
          >
            admin
          </span>
        )}
      </h2>

      {error && <div className="error" style={{ marginBottom: 8 }}>{error}</div>}
      {message && (
        <div style={{ marginBottom: 8, padding: '6px 10px', background: '#d4edda', borderRadius: 4 }}>
          {message}
        </div>
      )}

      {loadingDetail ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* ── Info section ── */}
          <table style={{ borderCollapse: 'collapse', marginBottom: '1.5em' }}>
            <tbody>
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="First name" value={user.first_name ?? '—'} />
              <InfoRow label="Last name" value={user.last_name ?? '—'} />
              {user.status && <InfoRow label="Status" value={user.status} />}
              {user.created_at && (
                <InfoRow
                  label="Created"
                  value={new Date(user.created_at).toLocaleDateString()}
                />
              )}
            </tbody>
          </table>

          {/* ── Password reset ── */}
          <div style={{ marginBottom: '1.5em' }}>
            <button
              onClick={handlePasswordReset}
              disabled={acting}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '6px 14px',
                cursor: 'pointer',
              }}
            >
              {acting ? '...' : 'Send password reset email'}
            </button>
          </div>

          {/* ── Slices section ── */}
          <h3>Slices ({memberSlices.length})</h3>
          {memberSlices.length === 0 ? (
            <p style={{ color: '#888' }}>Not a member of any slice.</p>
          ) : (
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9em', marginBottom: '1em' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
                  <th style={thStyle}>Slice</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Members</th>
                  <th style={thStyle}>Expires</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {memberSlices.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={tdStyle}>{s.name}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{s.member_ids.length}</td>
                    <td style={tdStyle}>
                      {s.deleted_at
                        ? new Date(s.deleted_at).toLocaleDateString()
                        : <span style={{ opacity: 0.4 }}>—</span>}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => handleRemoveFromSlice(s)}
                        disabled={acting}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '2px 10px',
                          cursor: 'pointer',
                          fontSize: '0.85em',
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {availableSlices.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1.5em' }}>
              <input
                type="text"
                list="available-slices"
                value={addSliceName}
                onChange={(e) => setAddSliceName(e.target.value)}
                placeholder="Add to slice..."
                style={{ padding: '4px 8px', width: '250px' }}
              />
              <datalist id="available-slices">
                {availableSlices.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
              <button
                onClick={handleAddToSlice}
                disabled={acting || !addSliceName}
                style={{
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  padding: '4px 14px',
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>
          )}

          {/* ── SSH keys section ── */}
          <h3>SSH Keys ({keys.length})</h3>
          {keys.length === 0 ? (
            <p style={{ color: '#a00' }}>No SSH keys uploaded.</p>
          ) : (
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9em' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
                  <th style={thStyle}>Comment</th>
                  <th style={thStyle}>Fingerprint</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k, i) => (
                  <tr key={k.id ?? i} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={tdStyle}>{k.comment || <span style={{ opacity: 0.4 }}>—</span>}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '0.85em' }}>
                      {k.fingerprint || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ padding: '3px 12px 3px 0', fontWeight: 'bold' }}>{label}</td>
      <td style={{ padding: '3px 0' }}>{value}</td>
    </tr>
  )
}

// ─── Shared styles & helpers ─────────────────────────────────────────

const thStyle: React.CSSProperties = { padding: '6px 8px' }
const tdStyle: React.CSSProperties = { padding: '4px 8px' }

function SortTh({ col, current, asc, onClick, style, children }: {
  col: string
  current: string
  asc: boolean
  onClick: (col: never) => void
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const arrow = current === col ? (asc ? ' \u25b2' : ' \u25bc') : ''
  return (
    <th
      style={{ ...thStyle, cursor: 'pointer', userSelect: 'none', ...style }}
      onClick={() => onClick(col as never)}
    >
      {children}{arrow}
    </th>
  )
}

export default UsersTab
