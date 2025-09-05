// Prefer an explicit VITE_API_BASE at build time. Otherwise default to the current page origin
// so mobile devices loading the site from http://<host-ip>:4000 will call the host API (not localhost).
const API = import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:4000/api')

// Simple token storage using localStorage
export function setAuth(token: string | null, role: string | null) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
  if (role) localStorage.setItem('role', role)
  else localStorage.removeItem('role')
}
export function getAuth() {
  return { token: localStorage.getItem('token'), role: localStorage.getItem('role') }
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const t = localStorage.getItem('token')
  if (t) headers['Authorization'] = `Bearer ${t}`
  return headers
}

export async function listProducts(q = '', status = '') {
  const url = new URL(`${API}/products`)
  if (q) url.searchParams.set('q', q)
  if (status) url.searchParams.set('status', status)
  const res = await fetch(url.toString(), { headers: authHeaders() })
  return res.json()
}

async function handleResponse(res: Response) {
  const contentType = res.headers.get('content-type') || ''
  let data: any = null
  if (contentType.includes('application/json')) data = await res.json()
  if (!res.ok) {
    const msg = data && data.error ? data.error : res.statusText || 'Request failed'
    const err: any = new Error(msg)
    err.status = res.status
    err.body = data
    throw err
  }
  return data
}

export async function getProduct(id: string) {
  const res = await fetch(`${API}/products/${id}`, { headers: authHeaders() })
  return handleResponse(res)
}

export async function createProduct(body: any) {
  let opts: any
  if (body instanceof FormData) {
    opts = { method: 'POST', body, headers: authHeaders() }
  } else {
    opts = { method: 'POST', headers: { ...authHeaders(), 'content-type': 'application/json' }, body: JSON.stringify(body) }
  }
  const res = await fetch(`${API}/products`, opts)
  return handleResponse(res)
}

export async function updateProduct(id: string, body: any) {
  let opts: any
  if (body instanceof FormData) {
    opts = { method: 'PUT', body, headers: authHeaders() }
  } else {
    opts = { method: 'PUT', headers: { ...authHeaders(), 'content-type': 'application/json' }, body: JSON.stringify(body) }
  }
  const res = await fetch(`${API}/products/${id}`, opts)
  return handleResponse(res)
}

export async function deleteProduct(id: string) {
  const res = await fetch(`${API}/products/${id}`, { method: 'DELETE', headers: authHeaders() })
  return handleResponse(res)
}

export async function loginUser(username: string, password: string) {
  const res = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password }) })
  return handleResponse(res)
}

export async function logoutUser() {
  const res = await fetch(`${API}/auth/logout`, { method: 'POST', headers: authHeaders() })
  // ignore response body; return true if ok
  return res.ok
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
