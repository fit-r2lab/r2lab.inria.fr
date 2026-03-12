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
  const [selectedSliceId, setSelectedSliceId] = useState<number | null>(null)

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
    const notExpired = !s.deleted_at || new Date(s.deleted_at) > new Date()
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
      const apiField = editingCell.field === 'expires' ? 'deleted_at' : editingCell.field
      const apiValue = editingCell.field === 'expires'
        ? (editValue ? new Date(editValue).toISOString() : null)
        : (editValue || null)
      await apiFetch(`slices/by-name/${encodeURIComponent(slice.name)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [apiField]: apiValue }),
      })
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

  // detail view
  if (selectedSliceId !== null) {
    const slice = slices.find((s) => s.id === selectedSliceId)
    if (!slice) {
      setSelectedSliceId(null)
      return null
    }
    return (
      <SliceDetail
        slice={slice}
        allUsers={users}
        userHasKeys={userHasKeys}
        onBack={() => {
          setSelectedSliceId(null)
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
              cursor: 'pointer',
              ...(healthy ? {} : { background: '#fff3f3', color: '#a00' }),
            }
            return (
              <tr key={s.id} style={rowStyle} onClick={() => setSelectedSliceId(s.id)}>
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

// ─── Slice detail view ───────────────────────────────────────────────

function SliceDetail({
  slice: initialSlice,
  allUsers,
  userHasKeys,
  onBack,
}: {
  slice: Slice
  allUsers: Map<number, User>
  userHasKeys: Map<number, boolean>
  onBack: () => void
}) {
  const [slice, setSlice] = useState<Slice>(initialSlice)
  const [users] = useState(allUsers)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [acting, setActing] = useState(false)

  // editable fields
  const [family, setFamily] = useState(slice.family)
  const [country, setCountry] = useState(slice.country ?? '')
  const [expires, setExpires] = useState(slice.deleted_at ? slice.deleted_at.slice(0, 10) : '')
  const [editingFields, setEditingFields] = useState(false)
  const [savingFields, setSavingFields] = useState(false)

  // add member
  const [addUserSearch, setAddUserSearch] = useState('')

  const refreshSlice = async () => {
    try {
      const data = await apiFetch(`slices/by-name/${encodeURIComponent(slice.name)}`)
      setSlice(data)
      setFamily(data.family)
      setCountry(data.country ?? '')
      setExpires(data.deleted_at ? data.deleted_at.slice(0, 10) : '')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Refresh failed')
    }
  }

  const displayName = (uid: number) => {
    const u = users.get(uid)
    if (!u) return `#${uid}`
    const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
    return name || u.email
  }

  const memberUsers = slice.member_ids.map((id) => ({
    id,
    user: users.get(id),
    hasKey: userHasKeys.get(id) === true,
  }))

  // users not in this slice
  const nonMembers = Array.from(users.values())
    .filter((u) => !slice.member_ids.includes(u.id))
    .sort((a, b) => {
      const na = `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() || a.email
      const nb = `${b.first_name ?? ''} ${b.last_name ?? ''}`.trim() || b.email
      return na.localeCompare(nb)
    })

  const handleRemoveMember = async (uid: number) => {
    setActing(true)
    setError(null)
    setMessage(null)
    try {
      await apiFetch(`slices/${slice.id}/members/${uid}`, { method: 'DELETE' })
      setMessage(`Removed ${displayName(uid)}`)
      await refreshSlice()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Remove failed')
    } finally {
      setActing(false)
    }
  }

  const handleAddMember = async () => {
    const match = nonMembers.find((u) => {
      const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
      return (
        u.email === addUserSearch ||
        name === addUserSearch ||
        `${name} <${u.email}>` === addUserSearch
      )
    })
    if (!match) {
      setError('Pick a user from the list')
      return
    }
    setActing(true)
    setError(null)
    setMessage(null)
    try {
      await apiFetch(`slices/${slice.id}/members/${match.id}`, { method: 'PUT' })
      setAddUserSearch('')
      setMessage(`Added ${displayName(match.id)}`)
      await refreshSlice()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Add failed')
    } finally {
      setActing(false)
    }
  }

  const handleSaveFields = async () => {
    setSavingFields(true)
    setError(null)
    setMessage(null)
    try {
      const body: Record<string, string | null> = {
        family,
        country: country || null,
        deleted_at: expires ? new Date(expires).toISOString() : null,
      }
      await apiFetch(`slices/by-name/${encodeURIComponent(slice.name)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setMessage('Slice updated')
      setEditingFields(false)
      await refreshSlice()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSavingFields(false)
    }
  }

  const isExpired = slice.deleted_at && new Date(slice.deleted_at) <= new Date()

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '1em' }}>
        &larr; Back to slices
      </button>

      <h2 style={{ marginTop: 0 }}>
        {slice.name}
        {isExpired && (
          <span
            style={{
              marginLeft: 8,
              fontSize: '0.7em',
              background: '#dc3545',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '8px',
              verticalAlign: 'middle',
            }}
          >
            expired
          </span>
        )}
      </h2>

      {error && <div className="error" style={{ marginBottom: 8 }}>{error}</div>}
      {message && (
        <div style={{ marginBottom: 8, padding: '6px 10px', background: '#d4edda', borderRadius: 4 }}>
          {message}
        </div>
      )}

      {/* ── Slice info ── */}
      <table style={{ borderCollapse: 'collapse', marginBottom: '1em' }}>
        <tbody>
          <tr>
            <td style={infoLabel}>Family</td>
            <td style={infoValue}>
              {editingFields ? (
                <select value={family} onChange={(e) => setFamily(e.target.value)}>
                  {SLICE_FAMILIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              ) : (
                family
              )}
            </td>
          </tr>
          <tr>
            <td style={infoLabel}>Country</td>
            <td style={infoValue}>
              {editingFields ? (
                <>
                  <input
                    type="text"
                    list="detail-country-list"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="type or pick"
                    style={{ width: '200px' }}
                  />
                  <datalist id="detail-country-list">
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </>
              ) : (
                country || <span style={{ opacity: 0.4 }}>—</span>
              )}
            </td>
          </tr>
          <tr>
            <td style={infoLabel}>Expires</td>
            <td style={infoValue}>
              {editingFields ? (
                <input
                  type="date"
                  value={expires}
                  onChange={(e) => setExpires(e.target.value)}
                />
              ) : (
                slice.deleted_at
                  ? new Date(slice.deleted_at).toLocaleDateString()
                  : <span style={{ opacity: 0.4 }}>—</span>
              )}
            </td>
          </tr>
          <tr>
            <td style={infoLabel}>Created</td>
            <td style={infoValue}>{new Date(slice.created_at).toLocaleDateString()}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ marginBottom: '1.5em' }}>
        {editingFields ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSaveFields}
              disabled={savingFields}
              style={{ background: '#28a745', color: 'white', border: 'none', padding: '4px 14px', cursor: 'pointer' }}
            >
              {savingFields ? '...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setFamily(slice.family)
                setCountry(slice.country ?? '')
                setExpires(slice.deleted_at ? slice.deleted_at.slice(0, 10) : '')
                setEditingFields(false)
              }}
              disabled={savingFields}
              style={{ border: '1px solid #aaa', padding: '4px 14px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingFields(true)}
            style={{ border: '1px solid #aaa', padding: '4px 14px', cursor: 'pointer' }}
          >
            Edit slice details
          </button>
        )}
      </div>

      {/* ── Members section ── */}
      <h3>Members ({slice.member_ids.length})</h3>
      {memberUsers.length === 0 ? (
        <p style={{ color: '#888' }}>No members.</p>
      ) : (
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9em', marginBottom: '1em' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #333', textAlign: 'left' }}>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>SSH Key</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {memberUsers.map(({ id, user, hasKey }) => (
              <tr
                key={id}
                style={{
                  borderBottom: '1px solid #ddd',
                  ...(!hasKey ? { background: '#fff3f3', color: '#a00' } : {}),
                }}
              >
                <td style={tdStyle}>
                  {user
                    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || '—'
                    : `#${id}`}
                </td>
                <td style={tdStyle}>{user?.email ?? '—'}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>
                  {hasKey ? 'yes' : 'no'}
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveMember(id) }}
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

      {nonMembers.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '1.5em' }}>
          <input
            type="text"
            list="add-member-list"
            value={addUserSearch}
            onChange={(e) => setAddUserSearch(e.target.value)}
            placeholder="Add member..."
            style={{ padding: '4px 8px', width: '300px' }}
          />
          <datalist id="add-member-list">
            {nonMembers.map((u) => {
              const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()
              const label = name ? `${name} <${u.email}>` : u.email
              return <option key={u.id} value={label} />
            })}
          </datalist>
          <button
            onClick={handleAddMember}
            disabled={acting || !addUserSearch}
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
    </div>
  )
}

// ─── Shared styles & helpers ─────────────────────────────────────────

const thStyle: React.CSSProperties = { padding: '6px 8px' }
const tdStyle: React.CSSProperties = { padding: '4px 8px' }
const infoLabel: React.CSSProperties = { padding: '3px 12px 3px 0', fontWeight: 'bold' }
const infoValue: React.CSSProperties = { padding: '3px 0' }

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
      <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
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
    <td
      style={{ ...tdStyle, cursor: 'pointer' }}
      onClick={(e) => { e.stopPropagation(); onStartEdit() }}
      title="Click to edit"
    >
      {slice.family}
    </td>
  )
}

function CountryCell({ slice, editing, editValue, setEditValue, onStartEdit, onSave, onCancel, saving }: EditableCellProps) {
  if (editing) {
    return (
      <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
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
    <td
      style={{ ...tdStyle, cursor: 'pointer' }}
      onClick={(e) => { e.stopPropagation(); onStartEdit() }}
      title="Click to edit"
    >
      {slice.country ?? <span style={{ opacity: 0.4 }}>—</span>}
    </td>
  )
}

function ExpiresCell({ slice, editing, editValue, setEditValue, onStartEdit, onSave, onCancel, saving }: EditableCellProps) {
  if (editing) {
    return (
      <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
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
    <td
      style={{ ...tdStyle, cursor: 'pointer' }}
      onClick={(e) => { e.stopPropagation(); onStartEdit() }}
      title="Click to edit"
    >
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
