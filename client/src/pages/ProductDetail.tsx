import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProduct, resolveImageUrl } from '../services/api'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState<any | null>(null)

  useEffect(() => {
    if (!id) return
    getProduct(id).then(setProduct).catch(() => setProduct(null))
  }, [id])

  if (!product) return <div>Loading...</div>

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex gap-6">
  <img src={resolveImageUrl(product.image) || 'https://via.placeholder.com/400x300'} alt={product.name} className="w-96 h-64 object-cover rounded" />
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <div className="text-sm text-gray-500 mb-4">{product.number}</div>
          <p className="mb-4">{product.description}</p>
          <div className="flex gap-2">
            <Link to={`/products/${product.id}/edit`} className="px-3 py-2 bg-yellow-600 text-white rounded">Edit</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
