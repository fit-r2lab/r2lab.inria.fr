import { useState } from 'react'

interface FormData {
  email: string
  first_name: string
  last_name: string
  affiliation: string
  purpose: string
  slice_name: string
}

function SignupPage() {
  const [form, setForm] = useState<FormData>({
    email: '',
    first_name: '',
    last_name: '',
    affiliation: '',
    purpose: '',
    slice_name: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.slice_name && /\s/.test(form.slice_name)) {
      setError('Slice name must not contain whitespace')
      return
    }
    setSubmitting(true)
    setError(null)

    const body = {
      email: form.email,
      first_name: form.first_name,
      last_name: form.last_name,
      affiliation: form.affiliation,
      purpose: form.purpose,
      slice_name: form.slice_name || null,
    }

    try {
      const res = await fetch('/api/public/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(
          data?.detail ?? `Registration failed (${res.status})`,
        )
      }
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="app">
        <h1>Check your email</h1>
        <p>
          We sent a verification link to <strong>{form.email}</strong>.
          <br />
          Please click it to complete your registration.
        </p>
      </div>
    )
  }

  const formStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '10px 12px',
    alignItems: 'start',
  }
  const labelStyle: React.CSSProperties = {
    fontWeight: 'bold',
    textAlign: 'right',
    paddingTop: '4px',
  }

  return (
    <div className="app">
      <h1>Sign Up for R2lab</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit} style={formStyle}>
        <label htmlFor="email" style={labelStyle}>Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <label htmlFor="first_name" style={labelStyle}>First Name</label>
        <input
          id="first_name"
          name="first_name"
          type="text"
          value={form.first_name}
          onChange={handleChange}
          required
        />
        <label htmlFor="last_name" style={labelStyle}>Last Name</label>
        <input
          id="last_name"
          name="last_name"
          type="text"
          value={form.last_name}
          onChange={handleChange}
          required
        />
        <label htmlFor="affiliation" style={labelStyle}>Affiliation</label>
        <input
          id="affiliation"
          name="affiliation"
          type="text"
          value={form.affiliation}
          onChange={handleChange}
          required
          placeholder="University, company, or lab"
        />
        <label htmlFor="purpose" style={labelStyle}>Purpose</label>
        <textarea
          id="purpose"
          name="purpose"
          value={form.purpose}
          onChange={handleChange}
          required
          placeholder="Briefly describe your intended use of R2lab"
          rows={5}
          cols={30}
        />
        <label htmlFor="slice_name" style={labelStyle}>Slice Name</label>
        <input
          id="slice_name"
          name="slice_name"
          type="text"
          value={form.slice_name}
          onChange={handleChange}
          placeholder="Optional — existing or desired slice name"
        />
        <div style={{ gridColumn: 2 }}>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Register'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default SignupPage
