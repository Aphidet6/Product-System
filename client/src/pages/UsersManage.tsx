import React, { useEffect, useState } from 'react'
import { getAuth } from '../services/api'

type Role = 'User' | 'Admin' | 'MasterAdmin'
type User = { username: string; role: Role }

export default function UsersManage() {
  const auth = getAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [role, setRole] = useState<Role>('User')

  useEffect(() => {
    if (!auth?.token) return
    setLoading(true)
    fetch('/api/users', { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(r => r.json())
      .then(j => setUsers(j || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreateUser(e?: React.MouseEvent) {
    e?.preventDefault()
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${auth.token}` }, body: JSON.stringify({ username, password, role }) })
      if (!res.ok) throw new Error('create failed')
      setUsername(''); setPassword(''); setRole('User')
      const data = await res.json();
      setUsers(prev => [...prev, data])
    } catch (err) { alert('Create failed') }
  }

  async function handleDeleteUser(u: User) {
    if (!confirm(`Delete ${u.username}?`)) return
    try {
      const res = await fetch(`/api/users/${u.username}`, { method: 'DELETE', headers: { Authorization: `Bearer ${auth.token}` } })
      if (!res.ok) throw new Error('delete failed')
      setUsers(prev => prev.filter(x => x.username !== u.username))
    } catch (err) { alert('Delete failed') }
  }

  async function handleChangeRole(u: User, newRole: Role) {
    try {
      const res = await fetch(`/api/users/${u.username}`, { method: 'PUT', headers: { 'content-type': 'application/json', Authorization: `Bearer ${auth.token}` }, body: JSON.stringify({ role: newRole }) })
      if (!res.ok) throw new Error('update failed')
      const updated = await res.json()
      setUsers(prev => prev.map(x => x.username === updated.username ? updated : x))
    } catch (err) { alert('Update failed') }
  }

  async function handleResetPassword(u: User) {
    const p = prompt(`Enter new password for ${u.username}`)
    if (!p) return
    try {
      const res = await fetch(`/api/users/${u.username}`, { method: 'PUT', headers: { 'content-type': 'application/json', Authorization: `Bearer ${auth.token}` }, body: JSON.stringify({ password: p }) })
      if (!res.ok) throw new Error('reset failed')
      alert('Password updated')
    } catch (err) { alert('Reset failed') }
  }

  // removed prompt-based rename; editing happens in the user card text field
  // child card component for each user
  function UserCard({ user, onUpdated, onDeleted }: { user: User, onUpdated: (orig: string, updated: User) => void, onDeleted: (username: string) => void }) {
    const [form, setForm] = useState({ username: user.username, role: user.role, password: '' })
    const [saving, setSaving] = useState(false)

    // keep local form in sync if parent user prop changes (e.g., rename)
    useEffect(() => {
      setForm({ username: user.username, role: user.role, password: '' })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.username, user.role])

      const save = async () => {
        // prepare body and validate before toggling saving state
        const body: any = {}
        const newName = (form.username || '').toString().trim()
        if (!newName) { alert('Username cannot be empty'); return }
        if (newName !== user.username) body.newUsername = newName
        if (form.role !== user.role) body.role = form.role
        if (form.password) body.password = form.password
        if (Object.keys(body).length === 0) { alert('No changes to save'); return }

        setSaving(true)
        try {
          const res = await fetch(`/api/users/${user.username}`, { method: 'PUT', headers: { 'content-type': 'application/json', Authorization: `Bearer ${auth.token}` }, body: JSON.stringify(body) })
          if (!res.ok) {
            const j = await res.json().catch(() => ({}))
            throw new Error(j.error || 'update failed')
          }
          const updated = await res.json()
          onUpdated(user.username, { username: updated.username, role: updated.role })
          // update local form to reflect canonical username returned by server
          setForm(prev => ({ ...prev, username: updated.username, password: '' }))
          alert('Saved')
        } catch (err: any) {
          alert('Save failed: ' + (err?.message || String(err)))
        } finally { setSaving(false) }
    }

    const del = async () => {
      if (!confirm(`Delete ${user.username}?`)) return
      try {
        const res = await fetch(`/api/users/${user.username}`, { method: 'DELETE', headers: { Authorization: `Bearer ${auth.token}` } })
        if (!res.ok) throw new Error('delete failed')
        onDeleted(user.username)
      } catch (err) { alert('Delete failed') }
    }

    return (
      <div className="p-3 bg-white rounded shadow">
        <div className="flex items-center flex-col gap-4">
          <div className="flex-1 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl text-gray-600">{(user.username || 'U').slice(0,1).toUpperCase()}</div>
            <div>
              <input
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
                className="font-semibold w-full border-b p-0 pb-1"
              />
              <div className="text-sm text-gray-500">{form.role}</div>
          </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })} className="p-1 border rounded">
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="MasterAdmin">MasterAdmin</option>
              </select>
            </div>
            <div className='flex gap-1'>
                <button onClick={save} disabled={saving} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                <button onClick={del} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                <button onClick={() => { setForm({ username: user.username, role: user.role, password: '' }) }} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
            </div>
            
          </div>
        </div>
        {/** password input below the row for clarity */}
        <div className="mt-3">
          <input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="New password (leave empty to keep)" className="w-full p-2 border rounded" />
        </div>
      </div>
    )
  }

  // parent handlers for updated/deleted
  function onUserUpdated(orig: string, updated: User) {
    setUsers(prev => prev.map(u => u.username === orig ? updated : u))
  }
  function onUserDeleted(username: string) {
    setUsers(prev => prev.filter(u => u.username !== username))
  }

  return (
    <div className="p-0 md:p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Users management</h2>

      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-medium mb-3">Create user</h3>
        <div className="space-y-3">
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="w-full p-2 border rounded" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full p-2 border rounded" />
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value as Role)} className="p-2 border rounded">
              <option value="User">User</option>
              <option value="Admin">Admin</option>
              <option value="MasterAdmin">MasterAdmin</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateUser} className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? <div>Loading...</div> : users.map(u => (
          <UserCard key={u.username} user={u} onUpdated={onUserUpdated} onDeleted={onUserDeleted} />
        ))}
      </div>
    </div>
  )
}
