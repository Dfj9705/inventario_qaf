import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import apiClient, { setAuthToken } from './api/client'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import MovementsPage from './pages/MovementsPage'
import ProductsPage from './pages/ProductsPage'
import ProfilePage from './pages/ProfilePage'
import StockPage from './pages/StockPage'
import WarehousesPage from './pages/WarehousesPage'

const App = () => {
  const [token, setToken] = useState(() => localStorage.getItem('token') ?? '')
  const [logoutError, setLogoutError] = useState('')

  useEffect(() => {
    setAuthToken(token)
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  const navigationItems = useMemo(
    () => [
      { path: '/productos', label: 'Productos', protected: true },
      { path: '/almacenes', label: 'Almacenes', protected: true },
      { path: '/stock', label: 'Stock', protected: true },
      { path: '/movimientos', label: 'Movimientos', protected: true },
      { path: '/perfil', label: 'Perfil', protected: true },
    ],
    [],
  )

  const handleLogin = (newToken) => {
    setToken(newToken)
    setLogoutError('')
  }

  const handleLogout = async () => {
    if (!token) {
      return
    }

    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      const message = error.response?.data?.message ?? 'No fue posible cerrar la sesión en el servidor.'
      setLogoutError(message)
    } finally {
      setToken('')
    }
  }

  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <Link to="/" className="brand">
            Inventario
          </Link>
          <nav className="main-nav">
            <Link to="/">Inicio</Link>
            {navigationItems.map((item) => (
              <Link key={item.path} to={item.path} className={item.protected && !token ? 'disabled' : ''}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="auth-actions">
            {token ? (
              <button type="button" onClick={handleLogout}>
                Cerrar sesión
              </button>
            ) : (
              <Link to="/login" className="button-link">
                Iniciar sesión
              </Link>
            )}
          </div>
        </header>

        <main className="app-content">
          {logoutError && <p className="error">{logoutError}</p>}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route
              path="/login"
              element={token ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />}
            />
            <Route
              path="/productos"
              element={
                <ProtectedRoute token={token}>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/almacenes"
              element={
                <ProtectedRoute token={token}>
                  <WarehousesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock"
              element={
                <ProtectedRoute token={token}>
                  <StockPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/movimientos"
              element={
                <ProtectedRoute token={token}>
                  <MovementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute token={token}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
