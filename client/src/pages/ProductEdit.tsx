import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProduct, createProduct, updateProduct, deleteProduct, listProducts, getAuth } from '../services/api'

export default function ProductEdit() {
  const { id } = useParams()
  const nav = useNavigate()
  const [loading, setLoading] = useState(false)
  const auth = getAuth()
  const isAdmin = auth?.role === 'Admin'
  const [form, setForm] = useState({ name: '', number: '', description: '', image: '', status: 'Available', price: '' })
  const [file, setFile] = useState<File | null>(null)
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [numberError, setNumberError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getProduct(id).then(p => setForm({ name: p.name, number: p.number, description: p.description || '', image: p.image || '', status: p.status || 'Available', price: p.price != null ? String(p.price) : '' })).catch(() => {})
  }, [id])

  // Load all products once to validate duplicate numbers in the form
  useEffect(() => {
    let active = true
    listProducts().then(list => { if (active) setAllProducts(list || []) }).catch(() => {})
    return () => { active = false }
  }, [])

  // validate number whenever it or the products list changes
  useEffect(() => {
    const numberTrim = (form.number || '').toString().trim().toLowerCase()
    if (!numberTrim) {
      setNumberError(null)
      return
    }
    const conflict = allProducts.find(p => (p.number || '').toString().trim().toLowerCase() === numberTrim && p.id !== id)
    if (conflict) {
      setNumberError('This product number is already used by another product')
    } else {
      setNumberError(null)
    }
  }, [form.number, allProducts, id])

  const onSave = async () => {
    setLoading(true)
    try {
      // client-side duplicate check to prevent accidental duplicate numbers
      const numberTrim = (form.number || '').toString().trim().toLowerCase()
      if (numberTrim) {
        const conflict = allProducts.find(p => (p.number || '').toString().trim().toLowerCase() === numberTrim && p.id !== id)
        if (conflict) {
          alert('Product number must be unique. Another product already uses this number.')
          return
        }
      }
      // If user is not Admin, only allow status update
      if (!isAdmin) {
        if (!id) {
          alert('Only admins can create products')
          return
        }
        await updateProduct(id, { status: form.status })
        nav(`/products/${id}`)
        return
      }

      // Admin behavior: full create/update
      if (file) {
        const fd = new FormData()
        fd.append('name', form.name)
        fd.append('number', form.number)
        fd.append('description', form.description)
        fd.append('image', file)
        fd.append('status', form.status)
        if (form.price != null) fd.append('price', String(form.price))
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
  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full p-2 border rounded" disabled={!isAdmin} />
        <div>
          <input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="Number" className="w-full p-2 border rounded" disabled={!isAdmin} />
          {numberError && <div className="text-sm text-red-600 mt-1">{numberError}</div>}
        </div>
    <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="Image URL" className="w-full p-2 border rounded" disabled={!isAdmin} />
  <input type="file" accept="image/*" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} className="w-full" disabled={!isAdmin} />
    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full p-2 border rounded" disabled={!isAdmin} />
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="p-2 border rounded">
            <option value="Available">Available</option>
            <option value="Sold out">Sold out</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Price (number)" className="w-full p-2 border rounded" disabled={!isAdmin} />
        </div>
        <div className="flex gap-2">
          <button onClick={onSave} disabled={loading || Boolean(numberError)} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Save</button>
          {id && <button onClick={onDelete} disabled={loading || !isAdmin} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>}
          <button onClick={() => nav(-1)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
        </div>
      </div>
    </div>
  )
}
