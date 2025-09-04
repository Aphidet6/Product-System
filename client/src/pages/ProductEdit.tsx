import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProduct, createProduct, updateProduct, deleteProduct } from '../services/api'

export default function ProductEdit() {
  const { id } = useParams()
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', number: '', description: '', image: '' })
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!id) return
    getProduct(id).then(p => setForm({ name: p.name, number: p.number, description: p.description || '', image: p.image || '' })).catch(() => {})
  }, [id])

  const onSave = async () => {
    setLoading(true)
    try {
      if (file) {
        const fd = new FormData()
        fd.append('name', form.name)
        fd.append('number', form.number)
        fd.append('description', form.description)
        fd.append('image', file)
        if (id) {
          await updateProduct(id, fd)
          nav(`/products/${id}`)
        } else {
          const created = await createProduct(fd)
          nav(`/products/${created.id}`)
        }
      } else {
        if (id) {
          await updateProduct(id, form)
          nav(`/products/${id}`)
        } else {
          const created = await createProduct(form)
          nav(`/products/${created.id}`)
        }
      }
    } catch (err: any) {
      console.error('Save failed', err)
      alert(err?.message || 'Save failed')
    } finally { setLoading(false) }
  }

  const onDelete = async () => {
    if (!id) return
    if (!confirm('Delete this product?')) return
    await deleteProduct(id)
    nav('/')
  }

  return (
    <div className="bg-white p-6 rounded shadow max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">{id ? 'Edit Product' : 'Create Product'}</h2>
      <div className="space-y-3">
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full p-2 border rounded" />
        <input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="Number" className="w-full p-2 border rounded" />
  <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="Image URL" className="w-full p-2 border rounded" />
  <input type="file" accept="image/*" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="w-full" />
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full p-2 border rounded" />
        <div className="flex gap-2">
          <button onClick={onSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
          {id && <button onClick={onDelete} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>}
          <button onClick={() => nav(-1)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
        </div>
      </div>
    </div>
  )
}
