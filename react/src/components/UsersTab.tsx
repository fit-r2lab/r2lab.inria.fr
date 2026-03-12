import { useEffect, useState, useMemo } from 'react'

interface User {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
}

interface Slice {
  id: number
  name: string
  member_ids: number[]
  deleted_at: string | null
}

async function apiFetch(path: string) {
  const res = await fetch(`/r2labapi/${path}`)
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.detail ?? `Request failed (${res.status})`)
  }
  return res.json()
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([])
  const [slices, setSlices] = useState<Slice[]>([])
  const [keyCount, setKeyCount] = useState<Map<number, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

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

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [usersData, slicesData]: [User[], Slice[]] = await Promise.all([
          apiFetch('users'),
          apiFetch('slices'),
        ])
        setUsers(usersData)
        setSlices(slicesData)

        // fetch key counts in parallel
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
    load()
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
  }, [users, filter, sortCol, sortAsc, userSlices, keyCount])

  if (loading) return <p>Loading users...</p>
  if (error) return <div className="error">{error}</div>

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
                style={{
                  borderBottom: '1px solid #ddd',
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
