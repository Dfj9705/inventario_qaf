import { useCallback, useEffect, useState } from 'react'
import apiClient from '../api/client'

const prettyPrint = (value) => JSON.stringify(value, null, 2)

const parseJson = (payload) => {
  try {
    return [JSON.parse(payload), null]
  } catch (error) {
    return [null, 'El cuerpo debe ser un JSON válido.']
  }
}

const DEFAULT_PAYLOAD = '{\n  "campo": "valor"\n}'

const ResourcePage = ({
  title,
  endpoint,
  description,
  supportsUpdate = true,
  supportsDelete = true,
  supportsShow = false,
}) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createPayload, setCreatePayload] = useState(DEFAULT_PAYLOAD)
  const [updateId, setUpdateId] = useState('')
  const [updatePayload, setUpdatePayload] = useState(DEFAULT_PAYLOAD)
  const [deleteId, setDeleteId] = useState('')
  const [showId, setShowId] = useState('')
  const [singleItem, setSingleItem] = useState(null)
  const [singleError, setSingleError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await apiClient.get(endpoint)
      setItems(Array.isArray(data) ? data : data?.data ?? [])
    } catch (err) {
      const message = err.response?.data?.message ?? 'No fue posible obtener la información.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleCreate = async (event) => {
    event.preventDefault()
    const [body, jsonError] = parseJson(createPayload)
    if (jsonError) {
      setActionMessage(jsonError)
      return
    }

    setActionMessage('')
    try {
      await apiClient.post(endpoint, body)
      setCreatePayload(prettyPrint(body))
      setActionMessage('Registro creado correctamente.')
      await loadItems()
    } catch (err) {
      const message = err.response?.data?.message ?? 'No fue posible crear el registro.'
      setActionMessage(message)
    }
  }

  const handleUpdate = async (event) => {
    event.preventDefault()
    if (!updateId) {
      setActionMessage('Indica el identificador del registro a actualizar.')
      return
    }

    const [body, jsonError] = parseJson(updatePayload)
    if (jsonError) {
      setActionMessage(jsonError)
      return
    }

    setActionMessage('')
    try {
      await apiClient.put(`${endpoint}/${updateId}`, body)
      setActionMessage('Registro actualizado correctamente.')
      await loadItems()
    } catch (err) {
      const message = err.response?.data?.message ?? 'No fue posible actualizar el registro.'
      setActionMessage(message)
    }
  }

  const handleDelete = async (event) => {
    event.preventDefault()
    if (!deleteId) {
      setActionMessage('Indica el identificador del registro a eliminar.')
      return
    }

    setActionMessage('')
    try {
      await apiClient.delete(`${endpoint}/${deleteId}`)
      setActionMessage('Registro eliminado correctamente.')
      setDeleteId('')
      await loadItems()
    } catch (err) {
      const message = err.response?.data?.message ?? 'No fue posible eliminar el registro.'
      setActionMessage(message)
    }
  }

  const handleShow = async (event) => {
    event.preventDefault()
    if (!showId) {
      setSingleError('Indica el identificador a consultar.')
      setSingleItem(null)
      return
    }

    setSingleError('')
    try {
      const { data } = await apiClient.get(`${endpoint}/${showId}`)
      setSingleItem(data)
    } catch (err) {
      const message = err.response?.data?.message ?? 'No fue posible obtener la información solicitada.'
      setSingleError(message)
      setSingleItem(null)
    }
  }

  return (
    <section className="page">
      <h1>{title}</h1>
      {description && <p className="page-description">{description}</p>}
      {error ? (
        <p className="error">{error}</p>
      ) : (
        <div className="card">
          {loading ? (
            <p>Cargando…</p>
          ) : items.length ? (
            <ul className="resource-list">
              {items.map((item) => (
                <li key={item.id ?? JSON.stringify(item)}>
                  <pre>{prettyPrint(item)}</pre>
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay registros disponibles.</p>
          )}
        </div>
      )}

      <div className="forms-grid">
        <form className="card" onSubmit={handleCreate}>
          <h2>Crear</h2>
          <p>Envía el cuerpo de la solicitud en formato JSON tal como lo espera la API.</p>
          <textarea
            rows={10}
            value={createPayload}
            onChange={(event) => setCreatePayload(event.target.value)}
          />
          <button type="submit">Crear</button>
        </form>

        {supportsUpdate && (
          <form className="card" onSubmit={handleUpdate}>
            <h2>Actualizar</h2>
            <label>
              ID a actualizar
              <input
                type="text"
                value={updateId}
                onChange={(event) => setUpdateId(event.target.value)}
                placeholder="1"
              />
            </label>
            <textarea
              rows={10}
              value={updatePayload}
              onChange={(event) => setUpdatePayload(event.target.value)}
            />
            <button type="submit">Actualizar</button>
          </form>
        )}

        {supportsDelete && (
          <form className="card" onSubmit={handleDelete}>
            <h2>Eliminar</h2>
            <label>
              ID a eliminar
              <input
                type="text"
                value={deleteId}
                onChange={(event) => setDeleteId(event.target.value)}
                placeholder="1"
              />
            </label>
            <button type="submit">Eliminar</button>
          </form>
        )}
      </div>

      {supportsShow && (
        <div className="card">
          <h2>Consultar un registro</h2>
          <form className="inline-form" onSubmit={handleShow}>
            <label>
              ID
              <input
                type="text"
                value={showId}
                onChange={(event) => setShowId(event.target.value)}
                placeholder="1"
              />
            </label>
            <button type="submit">Consultar</button>
          </form>
          {singleError && <p className="error">{singleError}</p>}
          {singleItem && <pre>{prettyPrint(singleItem)}</pre>}
        </div>
      )}

      {actionMessage && <p className="status-message">{actionMessage}</p>}
    </section>
  )
}

export default ResourcePage
