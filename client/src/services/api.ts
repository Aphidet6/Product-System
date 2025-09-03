const API = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api'

export async function listProducts(q = '') {
  const url = new URL(`${API}/products`)
  if (q) url.searchParams.set('q', q)
  const res = await fetch(url.toString())
  return res.json()
}

export async function getProduct(id: string) {
  const res = await fetch(`${API}/products/${id}`)
  if (!res.ok) throw new Error('Not found')
  return res.json()
}

export async function createProduct(body: any) {
  let opts: any
  if (body instanceof FormData) {
    opts = { method: 'POST', body }
  } else {
    opts = { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
  }
  const res = await fetch(`${API}/products`, opts)
  return res.json()
}

export async function updateProduct(id: string, body: any) {
  let opts: any
  if (body instanceof FormData) {
    opts = { method: 'PUT', body }
  } else {
    opts = { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
  }
  const res = await fetch(`${API}/products/${id}`, opts)
  return res.json()
}

export async function deleteProduct(id: string) {
  await fetch(`${API}/products/${id}`, { method: 'DELETE' })
}

// Resolve an image path returned by the API to a full URL the browser can fetch.
export function resolveImageUrl(img?: string) {
  if (!img) return ''
  if (img.startsWith('http://') || img.startsWith('https://')) return img
  // Strip trailing /api from API base to get backend origin
  const origin = API.replace(/\/api$/, '')
  if (img.startsWith('/')) return `${origin}${img}`
  return `${origin}/${img}`
}
