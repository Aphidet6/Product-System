import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listProducts, createProduct, resolveImageUrl } from '../services/api'

export default function Home() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    let active = true
    listProducts(q).then(r => { if (active) setResults(r) })
    return () => { active = false }
  }, [q])

  const onAddSample = async () => {
    await createProduct({ name: 'New Item', number: 'NEW-123', description: 'Sample item', image: '' })
    const r = await listProducts(q)
    setResults(r)
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or number" className="flex-1 p-2 border rounded" />
  <button onClick={onAddSample} className="px-4 py-2 bg-blue-600 text-white rounded">Add sample</button>
  <Link to="/products/new" className="px-4 py-2 bg-green-600 text-white rounded">Add product</Link>
      </div>

      <div>
        {results.length === 0 ? (
          <div className="text-gray-500">No results</div>
        ) : (
          <ul className="space-y-2">
            {results.map(p => (
              <li key={p.id} className="p-3 bg-white rounded shadow-sm">
                <Link to={`/products/${p.id}`} className="flex items-center gap-4">
                  <img src={resolveImageUrl(p.image) || 'https://via.placeholder.com/80'} alt="" className="w-20 h-14 object-cover rounded" />
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-sm text-gray-500">{p.number}</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
