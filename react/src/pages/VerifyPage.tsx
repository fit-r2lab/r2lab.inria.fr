import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

function VerifyPage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    token ? 'verifying' : 'error',
  )
  const [message, setMessage] = useState(
    token ? 'Verifying your email...' : 'No verification token provided.',
  )

  useEffect(() => {
    if (!token) return

    fetch('/api/public/registrations/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(
            data?.detail ?? `Verification failed (${res.status})`,
          )
        }
        setStatus('success')
        setMessage(
          'Your email has been verified. An administrator will review your registration shortly.',
        )
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'Verification failed')
      })
  }, [token])

  return (
    <div className="app">
      <h1>Email Verification</h1>
      <p className={status === 'error' ? 'error' : ''}>
        {message}
      </p>
    </div>
  )
}

export default VerifyPage
