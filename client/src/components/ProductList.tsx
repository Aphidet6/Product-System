import React from 'react'
import { Link } from 'react-router-dom'
import { resolveImageUrl } from '../services/api'

type Product = any

export default function ProductList({ products }: { products: Product[] }) {
  if (!products || products.length === 0) return <div className="text-gray-500">No results</div>

  return (
    <ul className="space-y-2">
      {products.map((p: Product) => (
        <li key={p.id} className="p-3 bg-white rounded shadow">
          <div className="flex items-center gap-4">
            <Link to={`/products/${p.id}`} className="flex-1 flex items-center gap-4">
              <img src={resolveImageUrl(p.image) || 'https://via.placeholder.com/80'} alt={p.name || 'product'} className="w-20 h-14 object-cover rounded" />
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-gray-500">{p.number}</div>
                {p.price != null && <div className="text-sm text-green-700">฿{Number(p.price).toLocaleString()}</div>}
              </div>
            </Link>
            <span className={`px-2 py-1 text-xs rounded ${((p.status || 'Available').toLowerCase() === 'available') ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>
              {p.status || 'Available'}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
