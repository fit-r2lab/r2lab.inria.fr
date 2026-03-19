import { useEffect, useState } from 'react'
import COUNTRIES from '../countries'

interface Registration {
  id: number
  email: string
  first_name: string
  last_name: string
  affiliation: string
  slice_name: string | null
  purpose: string
  status: 'pending_email' | 'pending_admin' | 'approved' | 'rejected'
  created_at: string
  verified_at: string | null
  decided_at: string | null
  admin_comment: string | null
}

const STATUS_LABELS: Record<string, string> = {
  pending_email: 'pending email',
  pending_admin: 'pending admin',
  approved: 'approved',
  rejected: 'rejected',
}

const SLICE_FAMILIES = [
  'unknown',
  'admin',
  'academia/diana',
  'academia/slices',
  'academia/others',
  'industry',
] as const

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`/r2labapi/${path}`, init)
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.detail ?? `Request failed (${res.status})`)
  }
  if (res.status === 204) return null
  return res.json()
}

function RegistrationsTab() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [selected, setSelected] = useState<Registration | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // editable fields for the review form
  const [email, setEmail] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [purpose, setPurpose] = useState('')
  const [sliceName, setSliceName] = useState('')
  const [country, setCountry] = useState('')
  const [family, setFamily] = useState<string>('unknown')
  const [acting, setActing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [activeSlices, setActiveSlices] = useState<string[]>([])

  const fetchRegistrations = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch('registrations')
      setRegistrations(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
    apiFetch('slices')
      .then((data: { name: string }[]) =>
        setActiveSlices(data.map((s) => s.name).sort()),
      )
      .catch(() => {})
  }, [])

  const selectRegistration = (reg: Registration) => {
    setSelected(reg)
    setEmail(reg.email)
    setAffiliation(reg.affiliation)
    setPurpose(reg.purpose)
    setSliceName(
      reg.slice_name ||
        `${reg.first_name}_${reg.last_name}`.toLowerCase().replace(/[^a-z0-9_]/g, ''),
    )
    setCountry('')
    setFamily('unknown')
    setActionError(null)
  }

  const handleDecision = async (action: 'approve' | 'reject') => {
    if (!selected) return
    if (sliceName && /\s/.test(sliceName)) {
      setActionError('Slice name must not contain whitespace')
      return
    }
    if (sliceName && !/[-_]/.test(sliceName)) {
      setActionError('Slice name must contain at least one "-" or "_"')
      return
    }
    if (action === 'approve') {
      if (!sliceName) {
        setActionError('Slice name is required for approval')
        return
      }
      if (!country) {
        setActionError('Country is required for approval')
        return
      }
      if (!family || family === 'unknown') {
        setActionError('Family must be set for approval')
        return
      }
    }
    setActing(true)
    setActionError(null)
    try {
      await apiFetch(`registrations/${selected.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slice_name: sliceName || null,
          comment: null,
        }),
      })
      // after approval, update the newly created slice with family/country
      if (action === 'approve' && sliceName) {
        const sliceUpdate: Record<string, string | null> = {}
        if (family && family !== 'unknown') sliceUpdate.family = family
        if (country) sliceUpdate.country = country
        if (Object.keys(sliceUpdate).length > 0) {
          await apiFetch(`slices/by-name/${encodeURIComponent(sliceName)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sliceUpdate),
          })
        }
      }
      setSelected(null)
      await fetchRegistrations()
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActing(false)
    }
  }

  if (loading) return <p>Loading registrations...</p>
  if (error) return <div className="error">{error}</div>

  const pending = registrations.filter(
    (r) => r.status === 'pending_email' || r.status === 'pending_admin',
  )
  const decided = registrations.filter(
    (r) => r.status === 'approved' || r.status === 'rejected',
  )

  const isPending =
    selected?.status === 'pending_admin' || selected?.status === 'pending_email'
  const canEdit = selected?.status === 'pending_admin'
  const canDecide = selected?.status === 'pending_admin'

  return (
    <div>
      <h2>Pending registrations ({pending.length})</h2>
      {pending.length === 0 ? (
        <p>No pending registrations.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {pending.map((reg) => (
            <button
              key={reg.id}
              onClick={() => selectRegistration(reg)}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                border: selected?.id === reg.id ? '2px solid #333' : '1px solid #aaa',
                background: reg.status === 'pending_admin' ? '#ffeeba' : '#ccc',
                cursor: 'pointer',
              }}
            >
              {reg.first_name} {reg.last_name}
              <small style={{ marginLeft: 6, opacity: 0.7 }}>
                ({STATUS_LABELS[reg.status]})
              </small>
            </button>
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <>
          <h2 style={{ marginTop: '1.5em' }}>Decided ({decided.length})</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {decided.map((reg) => (
              <button
                key={reg.id}
                onClick={() => selectRegistration(reg)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: selected?.id === reg.id ? '2px solid #333' : '1px solid #aaa',
                  background: reg.status === 'approved' ? '#c3e6cb' : '#f5c6cb',
                  cursor: 'pointer',
                  opacity: 0.7,
                }}
              >
                {reg.first_name} {reg.last_name}
                <small style={{ marginLeft: 6 }}>
                  ({STATUS_LABELS[reg.status]})
                </small>
              </button>
            ))}
          </div>
        </>
      )}

      {selected && (
        <div style={{ marginTop: '1.5em', border: '1px solid #ccc', padding: '1em' }}>
          <h3>
            {selected.first_name} {selected.last_name}
            <small style={{ marginLeft: 8, fontWeight: 'normal' }}>
              #{selected.id} — {STATUS_LABELS[selected.status]}
            </small>
          </h3>

          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <tbody>
              <EditableRow label="Email" value={email} onChange={setEmail}
                editable={canEdit} />
              <EditableRow label="Affiliation" value={affiliation} onChange={setAffiliation}
                editable={canEdit} />
              <EditableRow label="Purpose" value={purpose} onChange={setPurpose}
                editable={canEdit} textarea />
              <tr>
                <td style={{ padding: '4px 12px 4px 0', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Slice name
                </td>
                <td style={{ padding: '4px 0' }}>
                  {canEdit ? (
                    <>
                      <input
                        type="text"
                        list="slice-list"
                        value={sliceName}
                        onChange={(e) => setSliceName(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        placeholder="type or pick from existing slices"
                      />
                      <datalist id="slice-list">
                        {activeSlices.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </>
                  ) : (
                    <span>{sliceName}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '4px 12px 4px 0', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Country
                </td>
                <td style={{ padding: '4px 0' }}>
                  {canEdit ? (
                    <>
                      <input
                        type="text"
                        list="country-list"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box' }}
                        placeholder="type or pick from list"
                      />
                      <datalist id="country-list">
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c} />
                        ))}
                      </datalist>
                    </>
                  ) : (
                    <span>{country}</span>
                  )}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '4px 12px 4px 0', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Family
                </td>
                <td style={{ padding: '4px 0' }}>
                  {canEdit ? (
                    <select value={family} onChange={(e) => setFamily(e.target.value)}>
                      {SLICE_FAMILIES.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  ) : (
                    <span>{family}</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '0.8em', fontSize: '0.85em', color: '#666' }}>
            Submitted {formatDate(selected.created_at)}
            {selected.verified_at && <> · Verified {formatDate(selected.verified_at)}</>}
            {selected.decided_at && <> · Decided {formatDate(selected.decided_at)}</>}
          </div>

          {isPending && (
            <div style={{ marginTop: '1em' }}>
              {actionError && <div className="error" style={{ marginBottom: 8 }}>{actionError}</div>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleDecision('approve')}
                  disabled={acting || !canDecide}
                  style={{ background: '#28a745', color: 'white', padding: '6px 16px', border: 'none', cursor: canDecide ? 'pointer' : 'default', opacity: canDecide ? 1 : 0.4 }}
                >
                  {acting ? '...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleDecision('reject')}
                  disabled={acting || !canDecide}
                  style={{ background: '#dc3545', color: 'white', padding: '6px 16px', border: 'none', cursor: canDecide ? 'pointer' : 'default', opacity: canDecide ? 1 : 0.4 }}
                >
                  {acting ? '...' : 'Reject'}
                </button>
              </div>
              {!canDecide && (
                <div style={{ marginTop: 6, fontSize: '0.85em', color: '#888' }}>
                  Waiting for email verification
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EditableRow({
  label, value, onChange, editable, textarea, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  editable?: boolean
  textarea?: boolean
  placeholder?: string
}) {
  return (
    <tr>
      <td style={{ padding: '4px 12px 4px 0', fontWeight: 'bold', verticalAlign: 'top' }}>
        {label}
      </td>
      <td style={{ padding: '4px 0' }}>
        {editable ? (
          textarea ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder={placeholder}
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder={placeholder}
            />
          )
        ) : (
          <span>{value}</span>
        )}
      </td>
    </tr>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString()
}

export default RegistrationsTab
