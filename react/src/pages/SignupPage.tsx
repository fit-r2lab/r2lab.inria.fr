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

  return (
    <div className="app">
      <h1>Sign Up for R2lab</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="first_name">First Name</label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            value={form.first_name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="last_name">Last Name</label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            value={form.last_name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="affiliation">Affiliation</label>
          <input
            id="affiliation"
            name="affiliation"
            type="text"
            value={form.affiliation}
            onChange={handleChange}
            required
            placeholder="University, company, or lab"
          />
        </div>
        <div>
          <label htmlFor="purpose">Purpose</label>
          <textarea
            id="purpose"
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            required
            placeholder="Briefly describe your intended use of R2lab"
            rows={3}
          />
        </div>
        <div>
          <label htmlFor="slice_name">Slice Name (optional)</label>
          <input
            id="slice_name"
            name="slice_name"
            type="text"
            value={form.slice_name}
            onChange={handleChange}
            placeholder="Existing or desired slice name"
          />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Register'}
        </button>
      </form>
    </div>
  )
}

export default SignupPage
