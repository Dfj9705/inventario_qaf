import { useEffect, useState } from 'react'
import apiClient from '../api/client'

const ProfilePage = () => {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await apiClient.get('/auth/me')
        setProfile(data)
      } catch (err) {
        const message = err.response?.data?.message ?? 'No fue posible obtener el perfil.'
        setError(message)
      }
    }

    loadProfile()
  }, [])

  return (
    <section className="page">
      <h1>Perfil</h1>
      {error && <p className="error">{error}</p>}
      {profile ? (
        <div className="card">
          <p>
            <strong>Nombre:</strong> {profile.name ?? '—'}
          </p>
          <p>
            <strong>Correo:</strong> {profile.email ?? '—'}
          </p>
        </div>
      ) : (
        !error && <p>Cargando información del perfil…</p>
      )}
    </section>
  )
}

export default ProfilePage
