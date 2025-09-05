import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listProducts, resolveImageUrl, setAuth, getAuth } from '../services/api'

export default function Home() {
  const auth = getAuth()
  const isAdmin = auth?.role === 'Admin'
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    listProducts(q, statusFilter)
      .then(r => { if (active) setResults(r || []) })
      .catch(() => { if (active) setResults([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [q, statusFilter])

  return (
    <div>
      <div className="mb-4 flex gap-2 items-center">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by name or number"
          className="flex-1 p-2 border rounded"
        />

        <div className="ml-2">
          {isAdmin ? (
            <Link to="/products/new" className="px-4 py-2 bg-green-600 text-white rounded">Add product</Link>
          ) : (
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded" disabled>No permission</button>
          )}
        </div>

        <div className="ml-4">
          {auth?.token ? (
            <button onClick={() => { setAuth(null, null); window.location.reload() }} className="px-3 py-1 border rounded">Logout</button>
          ) : (
            <Link to="/login" className="px-3 py-1 border rounded">Login</Link>
          )}
        </div>
      </div>

      <div>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : results.length === 0 ? (
          <div className="text-gray-500">No results</div>
        ) : (
          <ul className="space-y-2">
            {results.map(p => {
              const statusText = (p.status || 'Available').toString().trim()
              const isAvailable = statusText.toLowerCase() === 'available'
              return (
                <li key={p.id} className="p-3 bg-white rounded shadow-sm">
                  <div className="flex items-center gap-4">
                    <Link to={`/products/${p.id}`} className="flex items-center gap-4 flex-1">
                      <img src={resolveImageUrl(p.image) || 'https://via.placeholder.com/80'} alt={p.name || 'product'} className="w-20 h-14 object-cover rounded" />
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-sm text-gray-500">{p.number}</div>
                        {p.price != null && (
                          <div className="text-sm text-gray-700">${Number(p.price).toFixed(2)}</div>
                        )}
                      </div>
                    </Link>
                    <div className="ml-4">
                      <span className={`px-2 py-1 text-xs rounded ${isAvailable ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
