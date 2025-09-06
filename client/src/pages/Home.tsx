import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listProducts, setAuth, getAuth, logoutUser } from '../services/api'
import ProductList from '../components/ProductList'

export default function Home() {
  const auth = getAuth()
  const isAdmin = auth?.role === 'Admin'
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    listProducts(q, statusFilter)
      .then(r => { if (mounted) setResults(r || []) })
      .catch(() => { if (mounted) setResults([]) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [q, statusFilter])

  return (
    <div className="p-1 md:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by name or number"
          className="flex-1 p-2 border rounded"
        />

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
            {isAdmin && !auth?.token ? (
              <Link to="/products/new" className="px-3 py-2 bg-green-600 text-white rounded">Add</Link>
            ) : null}

          {/* Status filter: cycles All -> Available -> Sold out */}
          <div>
            <button
              title="Filter by status"
              onClick={() => {
                if (statusFilter === '') setStatusFilter('Available')
                else if (statusFilter === 'Available') setStatusFilter('Sold out')
                else setStatusFilter('')
              }}
              className="px-2 py-2 border rounded flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M3 5a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-.293.707L11 13.414V17a1 1 0 01-1.447.894l-2-1A1 1 0 017 16v-2.586L3.293 7.707A1 1 0 013 7V5z" />
              </svg>
              <span className="text-sm">{statusFilter === '' ? 'All' : statusFilter}</span>
            </button>
          </div>

          {auth?.token ? (
            <button onClick={async () => { try { await logoutUser() } catch (e) {} finally { setAuth(null, null); window.location.reload() } }} className="px-3 py-2 border rounded flex items-center justify-center">
              {/* icon visible on small screens, text on sm+ */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline sm:hidden" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h6a1 1 0 110 2H5v10h5a1 1 0 110 2H4a1 1 0 01-1-1V4z" clipRule="evenodd"/><path d="M13.293 7.293a1 1 0 011.414 0L17 9.586a1 1 0 010 1.414l-2.293 2.293a1 1 0 01-1.414-1.414L14.586 11H9a1 1 0 110-2h5.586l-1.293-1.293a1 1 0 010-1.414z"/></svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <Link to="/login" className="px-3 py-2 border rounded">Login</Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <ProductList products={results} />
      )}
      
    </div>
  )
}
