import React from 'react'
import { Link } from 'react-router-dom'
import { resolveImageUrl } from '../services/api'

type Product = any

export default function ProductGrid({ products }: { products: Product[] }) {
  if (!products || products.length === 0) return <div className="text-gray-500">No results</div>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((p: Product) => (
        <div key={p.id} className="bg-white rounded shadow p-3 flex flex-col">
          <Link to={`/products/${p.id}`} className="grow">
            <div className="w-full h-40 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
              <img src={resolveImageUrl(p.image) || 'https://via.placeholder.com/300x200'} alt={p.name || 'product'} className="w-full h-full object-cover" />
            </div>
            <div className="mt-3">
              <div className="font-semibold text-lg truncate">{p.name}</div>
              <div className="text-sm text-gray-500">{p.number}</div>
              {p.price != null && <div className="text-sm text-green-700 mt-1">฿{Number(p.price).toLocaleString()}</div>}
            </div>
          </Link>
          <div className="mt-3 flex items-center justify-between">
            <span className={`px-2 py-1 text-xs rounded ${((p.status || 'Available').toLowerCase() === 'available') ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>
              {p.status || 'Available'}
            </span>
            <Link to={`/products/${p.id}`} className="text-sm text-blue-600">View</Link>
          </div>
        </div>
      ))}
    </div>
  )
}
