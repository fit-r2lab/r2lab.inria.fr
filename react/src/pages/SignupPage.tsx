import { useState } from 'react'

function SignupPage() {
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: wire up API call to register
    alert('Registration not yet connected to backend')
  }

  return (
    <div className="app">
      <h1>Sign Up for R2lab</h1>
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
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="password_confirm">Confirm Password</label>
          <input
            id="password_confirm"
            name="password_confirm"
            type="password"
            value={form.password_confirm}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  )
}

export default SignupPage
