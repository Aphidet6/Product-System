import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser, setAuth } from '../services/api'

export default function Login() {
  const nav = useNavigate()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onLogin()
  }

  const onLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const username = (u || '').toString().trim()
      const password = (p || '').toString()
      console.log('login attempt', { username })
      const r: any = await loginUser(username, password)
      console.log('login response', r)
      if (r && r.token) {
        setAuth(r.token, r.role || null)
  setSuccess(`Logged in as ${r.role || 'unknown'}`)
  // force a full reload to ensure app picks up the token and shows Home
  window.location.href = '/'
        return
      }
      setError('Login failed: no token returned')
    } catch (e: any) {
      // attempt to show detailed server error if present
      if (e && e.body && e.body.error) setError(e.body.error)
      else setError(e?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <form onSubmit={handleSubmit}>
        <input value={u} onChange={e => setU(e.target.value)} placeholder="Username" className="w-full p-2 border rounded mb-2" />
        <input value={p} onChange={e => setP(e.target.value)} placeholder="Password" type="password" className="w-full p-2 border rounded mb-4" />
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        <div className="flex gap-2">
          <button type="submit" disabled={loading || !(u || '').toString().trim() || !p} className="px-4 py-2 bg-blue-600 text-white rounded">{loading ? 'Logging in…' : 'Login'}</button>
        </div>
      </form>
    </div>
  )
}
