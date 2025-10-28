import { useCallback, useEffect, useMemo, useState } from 'react'
import apiClient from '../api/client'
import DataTable from './DataTable'

const buildInitialValues = (fields = []) => {
  const entries = fields.map((field) => [field.name, field.defaultValue ?? ''])
  return Object.fromEntries(entries)
}

const buildPayload = (fields = [], values = {}) => {
  const payload = {}

  fields.forEach((field) => {
    const rawValue = values[field.name]

    if (field.type === 'number' && rawValue !== '' && rawValue !== null && rawValue !== undefined) {
      const numericValue = Number(rawValue)
      payload[field.name] = Number.isNaN(numericValue) ? rawValue : numericValue
    } else {
      payload[field.name] = rawValue
    }
  })

  return payload
}

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message ?? error.message ?? fallback

const ResourcePage = ({
  title,
  endpoint,
  description,
  columns,
  createConfig,
  updateConfig,
  deleteConfig,
  showConfig,
}) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)

  const createFields = useMemo(() => createConfig?.fields ?? [], [createConfig])
  const updateFields = useMemo(() => updateConfig?.fields ?? [], [updateConfig])

  const initialCreateValues = useMemo(
    () => buildInitialValues(createFields),
    [createFields],
  )
  const initialUpdateValues = useMemo(
    () => buildInitialValues(updateFields),
    [updateFields],
  )

  const [createValues, setCreateValues] = useState(initialCreateValues)
  const [updateId, setUpdateId] = useState('')
  const [updateValues, setUpdateValues] = useState(initialUpdateValues)
  const [deleteId, setDeleteId] = useState('')
  const [showId, setShowId] = useState('')
  const [singleItem, setSingleItem] = useState(null)
  const [singleError, setSingleError] = useState('')
  const [singleLoading, setSingleLoading] = useState(false)

  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setCreateValues(initialCreateValues)
  }, [initialCreateValues])

  useEffect(() => {
    setUpdateValues(initialUpdateValues)
  }, [initialUpdateValues])

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await apiClient.get(endpoint)
      const collection = Array.isArray(data) ? data : data?.data ?? []
      setItems(collection)
    } catch (err) {
      const message = getErrorMessage(err, 'No fue posible obtener la información.')
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleCreateFieldChange = (name, value) => {
    setCreateValues((current) => ({ ...current, [name]: value }))
  }

  const handleUpdateFieldChange = (name, value) => {
    setUpdateValues((current) => ({ ...current, [name]: value }))
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!createConfig) return

    setIsCreating(true)
    setFeedback(null)
    try {
      const payload = buildPayload(createFields, createValues)
      await apiClient.post(endpoint, payload)
      setFeedback({ type: 'success', message: createConfig.successMessage ?? 'Registro creado correctamente.' })
      setCreateValues(initialCreateValues)
      await loadItems()
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err, 'No fue posible crear el registro.') })
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdate = async (event) => {
    event.preventDefault()
    if (!updateConfig) return

    if (!updateId) {
      setFeedback({ type: 'error', message: 'Indica el identificador del registro a actualizar.' })
      return
    }

    setIsUpdating(true)
    setFeedback(null)
    try {
      const payload = buildPayload(updateFields, updateValues)
      await apiClient.put(`${endpoint}/${updateId}`, payload)
      setFeedback({ type: 'success', message: updateConfig.successMessage ?? 'Registro actualizado correctamente.' })
      await loadItems()
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err, 'No fue posible actualizar el registro.') })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (event) => {
    event.preventDefault()
    if (!deleteConfig) return

    if (!deleteId) {
      setFeedback({ type: 'error', message: 'Indica el identificador del registro a eliminar.' })
      return
    }

    setIsDeleting(true)
    setFeedback(null)
    try {
      await apiClient.delete(`${endpoint}/${deleteId}`)
      setFeedback({ type: 'success', message: deleteConfig.successMessage ?? 'Registro eliminado correctamente.' })
      setDeleteId('')
      await loadItems()
    } catch (err) {
      setFeedback({ type: 'error', message: getErrorMessage(err, 'No fue posible eliminar el registro.') })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleShow = async (event) => {
    event.preventDefault()
    if (!showConfig) return

    if (!showId) {
      setSingleError('Indica el identificador a consultar.')
      setSingleItem(null)
      return
    }

    setSingleLoading(true)
    setSingleError('')
    setSingleItem(null)
    try {
      const { data } = await apiClient.get(`${endpoint}/${showId}`)
      setSingleItem(data)
    } catch (err) {
      setSingleError(getErrorMessage(err, 'No fue posible obtener la información solicitada.'))
    } finally {
      setSingleLoading(false)
    }
  }

  const renderField = (field, values, onChange) => {
    const { name, label, type = 'text', placeholder, required, options, step, min, max, helperText } = field
    const value = values[name] ?? ''

    if (type === 'textarea') {
      return (
        <label key={name} className="form-field">
          {label}
          <textarea
            value={value}
            placeholder={placeholder}
            required={required}
            onChange={(event) => onChange(name, event.target.value)}
            rows={field.rows ?? 4}
          />
          {helperText && <span className="field-helper">{helperText}</span>}
        </label>
      )
    }

    if (type === 'select') {
      return (
        <label key={name} className="form-field">
          {label}
          <select
            value={value}
            required={required}
            onChange={(event) => onChange(name, event.target.value)}
          >
            <option value="">Selecciona una opción</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {helperText && <span className="field-helper">{helperText}</span>}
        </label>
      )
    }

    return (
      <label key={name} className="form-field">
        {label}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          required={required}
          step={step}
          min={min}
          max={max}
          onChange={(event) => onChange(name, event.target.value)}
        />
        {helperText && <span className="field-helper">{helperText}</span>}
      </label>
    )
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        <button type="button" onClick={loadItems} disabled={loading}>
          {loading ? 'Actualizando…' : 'Actualizar'}
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="card">
        <h2>Registros disponibles</h2>
        <DataTable columns={columns} data={items} loading={loading} />
      </div>

      <div className="forms-grid">
        {createConfig && (
          <form className="card form-card" onSubmit={handleCreate}>
            <h2>{createConfig.title ?? 'Crear registro'}</h2>
            {createConfig.subtitle && <p>{createConfig.subtitle}</p>}
            <div className="form-fields">
              {createFields.map((field) => renderField(field, createValues, handleCreateFieldChange))}
            </div>
            <div className="form-actions">
              <button type="submit" disabled={isCreating}>
                {isCreating ? 'Guardando…' : createConfig.submitLabel ?? 'Crear'}
              </button>
            </div>
          </form>
        )}

        {updateConfig && (
          <form className="card form-card" onSubmit={handleUpdate}>
            <h2>{updateConfig.title ?? 'Actualizar registro'}</h2>
            {updateConfig.subtitle && <p>{updateConfig.subtitle}</p>}
            <label className="form-field">
              {updateConfig.idLabel ?? 'ID del registro'}
              <input
                type="text"
                value={updateId}
                onChange={(event) => setUpdateId(event.target.value)}
                placeholder={updateConfig.idPlaceholder ?? '1'}
                required
              />
            </label>
            <div className="form-fields">
              {updateFields.map((field) => renderField(field, updateValues, handleUpdateFieldChange))}
            </div>
            <div className="form-actions">
              <button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Actualizando…' : updateConfig.submitLabel ?? 'Actualizar'}
              </button>
            </div>
          </form>
        )}

        {deleteConfig && (
          <form className="card form-card" onSubmit={handleDelete}>
            <h2>{deleteConfig.title ?? 'Eliminar registro'}</h2>
            {deleteConfig.subtitle && <p>{deleteConfig.subtitle}</p>}
            <label className="form-field">
              {deleteConfig.idLabel ?? 'ID del registro'}
              <input
                type="text"
                value={deleteId}
                onChange={(event) => setDeleteId(event.target.value)}
                placeholder={deleteConfig.idPlaceholder ?? '1'}
                required
              />
            </label>
            <div className="form-actions">
              <button type="submit" disabled={isDeleting}>
                {isDeleting ? 'Eliminando…' : deleteConfig.submitLabel ?? 'Eliminar'}
              </button>
            </div>
          </form>
        )}
      </div>

      {showConfig && (
        <div className="card">
          <h2>{showConfig.title ?? 'Consultar un registro'}</h2>
          {showConfig.subtitle && <p>{showConfig.subtitle}</p>}
          <form className="inline-form" onSubmit={handleShow}>
            <label>
              {showConfig.idLabel ?? 'ID'}
              <input
                type="text"
                value={showId}
                onChange={(event) => setShowId(event.target.value)}
                placeholder={showConfig.idPlaceholder ?? '1'}
              />
            </label>
            <button type="submit" disabled={singleLoading}>
              {singleLoading ? 'Buscando…' : showConfig.submitLabel ?? 'Consultar'}
            </button>
          </form>
          {singleError && <p className="error">{singleError}</p>}
          {singleItem && <pre className="json-preview">{JSON.stringify(singleItem, null, 2)}</pre>}
        </div>
      )}

      {feedback && (
        <p className={`feedback ${feedback.type === 'error' ? 'feedback-error' : 'feedback-success'}`}>
          {feedback.message}
        </p>
      )}
    </section>
  )
}

export default ResourcePage
