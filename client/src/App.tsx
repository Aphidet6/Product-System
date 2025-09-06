import React from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import ProductDetail from './pages/ProductDetail'
import ProductEdit from './pages/ProductEdit'
import Login from './pages/Login'
import UsersManage from './pages/UsersManage'
import { getAuth } from './services/api'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-4 px-6 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold">TSM Product System</Link>
          {getAuth().role === 'MasterAdmin' && (
            <Link to="/users" className="px-3 py-2 border rounded">Manage Users</Link>
          )}
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={getAuth().token ? <Home /> : <Navigate to="/login" replace />} />
          <Route path="/products/:id" element={getAuth().token ? <ProductDetail /> : <Navigate to="/login" replace />} />
          <Route path="/products/:id/edit" element={getAuth().token ? <ProductEdit /> : <Navigate to="/login" replace />} />
          <Route path="/products/new" element={getAuth().token ? <ProductEdit /> : <Navigate to="/login" replace />} />
          <Route path="/users" element={getAuth().role === 'MasterAdmin' ? <UsersManage /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
