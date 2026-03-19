import { useState } from 'react'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/public/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail ?? `Request failed (${res.status})`)
      }
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="app">
        <h1>Check your email</h1>
        <p>
          If an account exists for <strong>{email}</strong>, we sent a
          password reset link. Please check your inbox.
        </p>
      </div>
    )
  }

  return (
    <div className="app">
      <h1>Forgot your password?</h1>
      <p>Enter your email address and we will send you a reset link.</p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            style={{ width: '300px' }}
          />
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </div>
  )
}

export default ForgotPasswordPage
