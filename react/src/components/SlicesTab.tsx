import { useEffect, useState, useMemo } from 'react'
import COUNTRIES from '../countries'

const SLICE_FAMILIES = [
  'unknown',
  'admin',
  'academia/diana',
  'academia/slices',
  'academia/others',
  'industry',
] as const

interface Slice {
  id: number
  name: string
  family: string
  country: string | null
  created_at: string
  member_ids: number[]
  deleted_at: string | null
}

interface User {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
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

function SlicesTab() {
  const [slices, setSlices] = useState<Slice[]>([])
  const [users, setUsers] = useState<Map<number, User>>(new Map())
  const [userHasKeys, setUserHasKeys] = useState<Map<number, boolean>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [healthFilter, setHealthFilter] = useState<'all' | 'healthy' | 'unhealthy'>('all')
  const [includeExpired, setIncludeExpired] = useState(false)

  // sorting
  type SortCol = 'name' | 'family' | 'country' | 'members' | 'expires'
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

  // inline editing state
  const [editingCell, setEditingCell] = useState<{ sliceId: number; field: 'family' | 'country' | 'expires' } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [slicesData, usersData]: [Slice[], User[]] = await Promise.all([
        apiFetch(`slices${includeExpired ? '?include_deleted=true' : ''}`),
        apiFetch('users'),
      ])
      setSlices(slicesData)

      const userMap = new Map<number, User>()
      for (const u of usersData) userMap.set(u.id, u)
      setUsers(userMap)

      // collect all unique member ids and fetch keys for each
      const memberIds = new Set<number>()
      for (const s of slicesData) {
        for (const id of s.member_ids) memberIds.add(id)
      }
      const keysMap = new Map<number, boolean>()
      await Promise.all(
        Array.from(memberIds).map(async (uid) => {
          try {
            const keys = await apiFetch(`users/${uid}/keys`)
            keysMap.set(uid, Array.isArray(keys) && keys.length > 0)
          } catch {
            keysMap.set(uid, false)
          }
        }),
      )
      setUserHasKeys(keysMap)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [includeExpired])

  const isHealthy = (s: Slice): boolean => {
    // expiration in the future (or no expiration)
    const notExpired = !s.deleted_at || new Date(s.deleted_at) > new Date()
    // at least one member with an SSH key
    const hasMemberWithKey = s.member_ids.some((id) => userHasKeys.get(id) === true)
    return notExpired && hasMemberWithKey
  }

  const filtered = useMemo(() => {
    const lc = filter.toLowerCase()
    const result = slices.filter((s) => {
      if (lc) {
        const match =
          s.name.toLowerCase().includes(lc) ||
          (s.country ?? '').toLowerCase().includes(lc) ||
          s.family.toLowerCase().includes(lc)
        if (!match) return false
      }
      if (healthFilter === 'healthy' && !isHealthy(s)) return false
      if (healthFilter === 'unhealthy' && isHealthy(s)) return false
      return true
    })

    const dir = sortAsc ? 1 : -1
    result.sort((a, b) => {
      let cmp = 0
      switch (sortCol) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'family':
          cmp = a.family.localeCompare(b.family)
          break
        case 'country':
          cmp = (a.country ?? '').localeCompare(b.country ?? '')
          break
        case 'members':
          cmp = a.member_ids.length - b.member_ids.length
          break
        case 'expires': {
          const ta = a.deleted_at ? new Date(a.deleted_at).getTime() : Infinity
          const tb = b.deleted_at ? new Date(b.deleted_at).getTime() : Infinity
          cmp = ta - tb
          break
        }
      }
      return cmp * dir
    })
    return result
  }, [slices, filter, healthFilter, userHasKeys, sortCol, sortAsc])

  const startEdit = (sliceId: number, field: 'family' | 'country' | 'expires', currentValue: string) => {
    setEditingCell({ sliceId, field })
    setEditValue(currentValue)
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const saveEdit = async (slice: Slice) => {
    if (!editingCell) return
    setSaving(true)
    try {
      // 'expires' maps to 'deleted_at' in the API
      const apiField = editingCell.field === 'expires' ? 'deleted_at' : editingCell.field
      const apiValue = editingCell.field === 'expires'
        ? (editValue ? new Date(editValue).toISOString() : null)
        : (editValue || null)
      await apiFetch(`slices/by-name/${encodeURIComponent(slice.name)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [apiField]: apiValue }),
      })
      // update local state
      const localField = editingCell.field === 'expires' ? 'deleted_at' : editingCell.field
      const localValue = editingCell.field === 'expires'
        ? (editValue ? new Date(editValue).toISOString() : null)
        : (editValue || null)
      setSlices((prev) =>
        prev.map((s) =>
          s.id === slice.id ? { ...s, [localField]: localValue } : s,
        ),
      )
      setEditingCell(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading slices...</p>
  if (error) return <div className="error">{error}</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '1em' }}>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name, country, family..."
          style={{ padding: '4px 8px', width: '300px' }}
        />
        <select
          value={healthFilter}
          onChange={(e) => setHealthFilter(e.target.value as 'all' | 'healthy' | 'unhealthy')}
        >
          <option value="all">All ({slices.length})</option>
          <option value="healthy">Healthy</option>
          <option value="unhealthy">Unhealthy</option>
        </select>
        <label style={{ fontSize: '0.85em' }}>
          <input
            type="checkbox"
            checked={includeExpired}
            onChange={(e) => setIncludeExpired(e.target.checked)}
          />{' '}
          Include expired
        </label>
        <span style={{ fontSize: '0.85em', color: '#666' }}>
          Showing {filtered.length} of {slices.length}
        </span>
      </div>

      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9em' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
            <SortTh col="name" current={sortCol} asc={sortAsc} onClick={toggleSort}>Name</SortTh>
            <SortTh col="family" current={sortCol} asc={sortAsc} onClick={toggleSort}>Family</SortTh>
            <SortTh col="country" current={sortCol} asc={sortAsc} onClick={toggleSort}>Country</SortTh>
            <SortTh col="members" current={sortCol} asc={sortAsc} onClick={toggleSort} style={{ textAlign: 'right' }}>Members</SortTh>
            <SortTh col="expires" current={sortCol} asc={sortAsc} onClick={toggleSort}>Expires</SortTh>
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => {
            const healthy = isHealthy(s)
            const rowStyle: React.CSSProperties = {
              borderBottom: '1px solid #ddd',
              ...(healthy ? {} : { background: '#fff3f3', color: '#a00' }),
            }
            return (
              <tr key={s.id} style={rowStyle}>
                <td style={tdStyle}>{s.name}</td>
                <FamilyCell
                  slice={s}
                  editing={editingCell?.sliceId === s.id && editingCell.field === 'family'}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  onStartEdit={() => startEdit(s.id, 'family', s.family)}
                  onSave={() => saveEdit(s)}
                  onCancel={cancelEdit}
                  saving={saving}
                />
                <CountryCell
                  slice={s}
                  editing={editingCell?.sliceId === s.id && editingCell.field === 'country'}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  onStartEdit={() => startEdit(s.id, 'country', s.country ?? '')}
                  onSave={() => saveEdit(s)}
                  onCancel={cancelEdit}
                  saving={saving}
                />
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  {s.member_ids.length}
                  {s.member_ids.length > 0 && (
                    <MemberTooltip memberIds={s.member_ids} users={users} userHasKeys={userHasKeys} />
                  )}
                </td>
                <ExpiresCell
                  slice={s}
                  editing={editingCell?.sliceId === s.id && editingCell.field === 'expires'}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  onStartEdit={() => startEdit(s.id, 'expires', s.deleted_at ? s.deleted_at.slice(0, 10) : '')}
                  onSave={() => saveEdit(s)}
                  onCancel={cancelEdit}
                  saving={saving}
                />
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

interface EditableCellProps {
  slice: Slice
  editing: boolean
  editValue: string
  setEditValue: (v: string) => void
  onStartEdit: () => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}

function FamilyCell({ slice, editing, editValue, setEditValue, onStartEdit, onSave, onCancel, saving }: EditableCellProps) {
  if (editing) {
    return (
      <td style={tdStyle}>
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          autoFocus
          disabled={saving}
        >
          {SLICE_FAMILIES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <button onClick={onSave} disabled={saving} style={{ marginLeft: 4 }}>ok</button>
        <button onClick={onCancel} disabled={saving} style={{ marginLeft: 2 }}>x</button>
      </td>
    )
  }
  return (
    <td style={{ ...tdStyle, cursor: 'pointer' }} onClick={onStartEdit} title="Click to edit">
      {slice.family}
    </td>
  )
}

function CountryCell({ slice, editing, editValue, setEditValue, onStartEdit, onSave, onCancel, saving }: EditableCellProps) {
  if (editing) {
    return (
      <td style={tdStyle}>
        <input
          type="text"
          list="country-list-slices"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          autoFocus
          disabled={saving}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave()
            if (e.key === 'Escape') onCancel()
          }}
          style={{ width: '140px' }}
        />
        <datalist id="country-list-slices">
          {COUNTRIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <button onClick={onSave} disabled={saving} style={{ marginLeft: 4 }}>ok</button>
        <button onClick={onCancel} disabled={saving} style={{ marginLeft: 2 }}>x</button>
      </td>
    )
  }
  return (
    <td style={{ ...tdStyle, cursor: 'pointer' }} onClick={onStartEdit} title="Click to edit">
      {slice.country ?? <span style={{ opacity: 0.4 }}>—</span>}
    </td>
  )
}

function ExpiresCell({ slice, editing, editValue, setEditValue, onStartEdit, onSave, onCancel, saving }: EditableCellProps) {
  if (editing) {
    return (
      <td style={tdStyle}>
        <input
          type="date"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          autoFocus
          disabled={saving}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave()
            if (e.key === 'Escape') onCancel()
          }}
        />
        <button onClick={onSave} disabled={saving} style={{ marginLeft: 4 }}>ok</button>
        <button onClick={onCancel} disabled={saving} style={{ marginLeft: 2 }}>x</button>
      </td>
    )
  }
  return (
    <td style={{ ...tdStyle, cursor: 'pointer' }} onClick={onStartEdit} title="Click to edit">
      {slice.deleted_at ? formatDate(slice.deleted_at) : <span style={{ opacity: 0.4 }}>—</span>}
    </td>
  )
}

function MemberTooltip({
  memberIds, users, userHasKeys,
}: {
  memberIds: number[]
  users: Map<number, User>
  userHasKeys: Map<number, boolean>
}) {
  const lines = memberIds.map((id) => {
    const u = users.get(id)
    const name = u ? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email : `#${id}`
    const hasKey = userHasKeys.get(id)
    return `${name}${hasKey ? '' : ' (no key)'}`
  })
  return (
    <span title={lines.join('\n')} style={{ marginLeft: 4, cursor: 'help', opacity: 0.5 }}>
      ?
    </span>
  )
}

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

export default SlicesTab
