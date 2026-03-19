import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!token) {
    return (
      <div className="app">
        <h1>Reset password</h1>
        <p className="error">No reset token provided.</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/public/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.detail ?? `Request failed (${res.status})`)
      }
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="app">
        <h1>Password updated</h1>
        <p>
          Your password has been reset. You can now{' '}
          <a href="/">sign in</a> with your new password.
        </p>
      </div>
    )
  }

  const fieldStyle = { width: '300px', marginBottom: '10px', display: 'block' }

  return (
    <div className="app">
      <h1>Set a new password</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          required
          style={fieldStyle}
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password"
          required
          style={fieldStyle}
        />
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Set password'}
        </button>
      </form>
    </div>
  )
}

export default ResetPasswordPage
