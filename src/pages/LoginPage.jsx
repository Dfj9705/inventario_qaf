import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../api/client'

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data } = await apiClient.post('/auth/login', { email, password })
      if (data?.token) {
        onLogin(data.token)
        navigate('/')
      } else {
        setError('La respuesta del servidor no contiene un token válido.')
      }
    } catch (err) {
      const message = err.response?.data?.message ?? 'No fue posible iniciar sesión.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page">
      <h1>Iniciar sesión</h1>
      <form className="card" onSubmit={handleSubmit}>
        <label>
          Correo electrónico
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="usuario@empresa.com"
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
    </section>
  )
}

export default LoginPage
