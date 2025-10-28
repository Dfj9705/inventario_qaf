import { useCallback, useEffect, useMemo, useState } from 'react'
import apiClient from '../api/client'
import DataTable from './DataTable'

const Modal = ({ title, onClose, closeDisabled = false, children }) => (
  <div className="modal-backdrop" role="presentation">
    <div className="modal" role="dialog" aria-modal="true">
      <header className="modal-header">
        <h2>{title}</h2>
        <button
          type="button"
          className="modal-close"
          onClick={closeDisabled ? undefined : onClose}
          disabled={closeDisabled}
          aria-label="Cerrar"
        >
          ×
        </button>
      </header>
      <div className="modal-content">{children}</div>
    </div>
  </div>
)

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
  const [activeModal, setActiveModal] = useState(null)
  const [selectState, setSelectState] = useState({})

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

  const fetchOptionsForField = useCallback(async (field) => {
    setSelectState((current) => ({
      ...current,
      [field.name]: {
        options: current[field.name]?.options ?? [],
        loading: true,
        error: '',
      },
    }))

    const getValue = field.getOptionValue
      ? field.getOptionValue
      : (item) => item?.[field.optionValueKey ?? 'id'] ?? item?.id
    const getLabel = field.getOptionLabel
      ? field.getOptionLabel
      : (item) =>
          item?.[field.optionLabelKey ?? 'nombre'] ??
          item?.name ??
          item?.title ??
          getValue(item)

    try {
      const { data } = await apiClient.get(field.optionsEndpoint)
      const collection = Array.isArray(data) ? data : data?.data ?? []
      const options = collection
        .map((item) => {
          const value = getValue(item)
          if (value === undefined || value === null) {
            return null
          }

          const label = getLabel(item)
          return {
            value,
            label: label ?? String(value),
          }
        })
        .filter(Boolean)

      setSelectState((current) => ({
        ...current,
        [field.name]: {
          options,
          loading: false,
          error: '',
        },
      }))
    } catch (err) {
      setSelectState((current) => ({
        ...current,
        [field.name]: {
          options: current[field.name]?.options ?? [],
          loading: false,
          error: getErrorMessage(err, 'No fue posible cargar las opciones.'),
        },
      }))
    }
  }, [])

  const refreshSelectOptions = useCallback(() => {
    const fieldsWithEndpoint = [...createFields, ...updateFields].filter(
      (field) => field.type === 'select' && field.optionsEndpoint,
    )

    if (!fieldsWithEndpoint.length) {
      return
    }

    const seen = new Set()
    fieldsWithEndpoint.forEach((field) => {
      const key = `${field.name}::${field.optionsEndpoint}`
      if (seen.has(key)) {
        return
      }
      seen.add(key)
      fetchOptionsForField(field)
    })
  }, [createFields, updateFields, fetchOptionsForField])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useEffect(() => {
    refreshSelectOptions()
  }, [refreshSelectOptions])

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
      closeModal()
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
      closeModal()
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
      closeModal()
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

  const openModal = (type) => {
    if (type === 'create') {
      setCreateValues(initialCreateValues)
      refreshSelectOptions()
    }

    if (type === 'update') {
      setUpdateId('')
      setUpdateValues(initialUpdateValues)
      refreshSelectOptions()
    }

    if (type === 'delete') {
      setDeleteId('')
    }

    if (type === 'show') {
      setShowId('')
      setSingleItem(null)
      setSingleError('')
      setSingleLoading(false)
    }

    setActiveModal(type)
  }

  const closeModal = () => {
    setActiveModal(null)
  }

  const resolveRowId = useCallback(
    (row) => {
      if (!row || typeof row !== 'object') {
        return ''
      }

      if (typeof updateConfig?.resolveId === 'function') {
        const value = updateConfig.resolveId(row)
        if (value !== undefined && value !== null && value !== '') {
          return value
        }
      }

      if (typeof deleteConfig?.resolveId === 'function') {
        const value = deleteConfig.resolveId(row)
        if (value !== undefined && value !== null && value !== '') {
          return value
        }
      }

      const candidateKeys = [updateConfig?.idField, deleteConfig?.idField, 'id', 'ID', 'uuid']
        .filter(Boolean)
        .map((key) => String(key))

      for (const key of candidateKeys) {
        const value = row[key]
        if (value !== undefined && value !== null && value !== '') {
          return value
        }
      }

      return row.id ?? row.ID ?? ''
    },
    [updateConfig, deleteConfig],
  )

  const buildUpdateValuesFromRow = useCallback(
    (row) => {
      const values = { ...initialUpdateValues }
      if (!row || typeof row !== 'object') {
        return values
      }

      updateFields.forEach((field) => {
        const { name, rowKey, getValueFromRow } = field
        if (!name) {
          return
        }

        if (typeof getValueFromRow === 'function') {
          const resolved = getValueFromRow(row)
          if (resolved !== undefined) {
            values[name] = resolved
          }
          return
        }

        const key = rowKey ?? name
        if (row[key] !== undefined) {
          values[name] = row[key]
        }
      })

      return values
    },
    [initialUpdateValues, updateFields],
  )

  const openUpdateFromRow = useCallback(
    (row) => {
      if (!updateConfig) {
        return
      }

      const idValue = resolveRowId(row)
      if (idValue === undefined || idValue === null || idValue === '') {
        setFeedback({
          type: 'error',
          message:
            updateConfig.missingIdMessage ?? 'No se pudo determinar el ID del registro seleccionado.',
        })
        return
      }

      refreshSelectOptions()
      setUpdateId(String(idValue))
      setUpdateValues(buildUpdateValuesFromRow(row))
      setFeedback(null)
      setActiveModal('update')
    },
    [updateConfig, resolveRowId, refreshSelectOptions, buildUpdateValuesFromRow],
  )

  const openDeleteFromRow = useCallback(
    (row) => {
      if (!deleteConfig) {
        return
      }

      const idValue = resolveRowId(row)
      if (idValue === undefined || idValue === null || idValue === '') {
        setFeedback({
          type: 'error',
          message:
            deleteConfig.missingIdMessage ?? 'No se pudo determinar el ID del registro seleccionado.',
        })
        return
      }

      setDeleteId(String(idValue))
      setFeedback(null)
      setActiveModal('delete')
    },
    [deleteConfig, resolveRowId],
  )

  const renderField = (field, values, onChange) => {
    const {
      name,
      label,
      type = 'text',
      placeholder,
      required,
      options,
      step,
      min,
      max,
      helperText,
      disabled,
    } = field
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
      const dynamicOptions = selectState[name]?.options ?? []
      const resolvedOptions = options ?? dynamicOptions
      const loading = selectState[name]?.loading ?? false
      const errorMessage = selectState[name]?.error ?? ''

      return (
        <label key={name} className="form-field">
          {label}
          <select
            value={value}
            required={required}
            disabled={disabled || (loading && resolvedOptions.length === 0)}
            onChange={(event) => onChange(name, event.target.value)}
          >
            <option value="">Selecciona una opción</option>
            {resolvedOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {loading && <span className="field-helper">Cargando opciones…</span>}
          {errorMessage && <span className="field-error">{errorMessage}</span>}
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
          disabled={disabled}
          onChange={(event) => onChange(name, event.target.value)}
        />
        {helperText && <span className="field-helper">{helperText}</span>}
      </label>
    )
  }

  const tableRowActions = useMemo(() => {
    const actions = []

    if (updateConfig) {
      actions.push({
        key: 'update',
        label: updateConfig.rowActionLabel ?? 'Editar',
        title: updateConfig.rowActionTitle ?? 'Editar registro',
        onClick: openUpdateFromRow,
        disabled: isUpdating,
      })
    }

    if (deleteConfig) {
      actions.push({
        key: 'delete',
        label: deleteConfig.rowActionLabel ?? 'Eliminar',
        title: deleteConfig.rowActionTitle ?? 'Eliminar registro',
        onClick: openDeleteFromRow,
        disabled: isDeleting,
        variant: 'danger',
      })
    }

    return actions
  }, [updateConfig, deleteConfig, openUpdateFromRow, openDeleteFromRow, isUpdating, isDeleting])

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        <div className="page-actions">
          {createConfig && (
            <button type="button" onClick={() => openModal('create')}>
              {createConfig.triggerLabel ?? 'Nuevo registro'}
            </button>
          )}
          {updateConfig && (
            <button type="button" onClick={() => openModal('update')}>
              {updateConfig.triggerLabel ?? 'Editar registro'}
            </button>
          )}
          {deleteConfig && (
            <button type="button" onClick={() => openModal('delete')}>
              {deleteConfig.triggerLabel ?? 'Eliminar registro'}
            </button>
          )}
          {showConfig && (
            <button type="button" onClick={() => openModal('show')}>
              {showConfig.triggerLabel ?? 'Consultar registro'}
            </button>
          )}
          <button type="button" onClick={loadItems} disabled={loading}>
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="card">
        <h2>Registros disponibles</h2>
        <DataTable columns={columns} data={items} loading={loading} rowActions={tableRowActions} />
      </div>

      {feedback && (
        <p className={`feedback ${feedback.type === 'error' ? 'feedback-error' : 'feedback-success'}`}>
          {feedback.message}
        </p>
      )}

      {activeModal === 'create' && createConfig && (
        <Modal
          title={createConfig.title ?? 'Crear registro'}
          onClose={closeModal}
          closeDisabled={isCreating}
        >
          <form className="modal-form" onSubmit={handleCreate}>
            {createConfig.subtitle && <p>{createConfig.subtitle}</p>}
            <div className="form-fields">
              {createFields.map((field) => renderField(field, createValues, handleCreateFieldChange))}
            </div>
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={closeModal} disabled={isCreating}>
                Cancelar
              </button>
              <button type="submit" disabled={isCreating}>
                {isCreating ? 'Guardando…' : createConfig.submitLabel ?? 'Crear'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {activeModal === 'update' && updateConfig && (
        <Modal
          title={updateConfig.title ?? 'Actualizar registro'}
          onClose={closeModal}
          closeDisabled={isUpdating}
        >
          <form className="modal-form" onSubmit={handleUpdate}>
            {updateConfig.subtitle && <p>{updateConfig.subtitle}</p>}
            <div className="form-fields">
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
              {updateFields.map((field) => renderField(field, updateValues, handleUpdateFieldChange))}
            </div>
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={closeModal} disabled={isUpdating}>
                Cancelar
              </button>
              <button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Actualizando…' : updateConfig.submitLabel ?? 'Actualizar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {activeModal === 'delete' && deleteConfig && (
        <Modal
          title={deleteConfig.title ?? 'Eliminar registro'}
          onClose={closeModal}
          closeDisabled={isDeleting}
        >
          <form className="modal-form" onSubmit={handleDelete}>
            {deleteConfig.subtitle && <p>{deleteConfig.subtitle}</p>}
            <div className="form-fields">
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
            </div>
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={closeModal} disabled={isDeleting}>
                Cancelar
              </button>
              <button type="submit" disabled={isDeleting}>
                {isDeleting ? 'Eliminando…' : deleteConfig.submitLabel ?? 'Eliminar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {activeModal === 'show' && showConfig && (
        <Modal
          title={showConfig.title ?? 'Consultar registro'}
          onClose={closeModal}
          closeDisabled={singleLoading}
        >
          <form className="modal-form" onSubmit={handleShow}>
            {showConfig.subtitle && <p>{showConfig.subtitle}</p>}
            <div className="form-fields">
              <label className="form-field">
                {showConfig.idLabel ?? 'ID'}
                <input
                  type="text"
                  value={showId}
                  onChange={(event) => setShowId(event.target.value)}
                  placeholder={showConfig.idPlaceholder ?? '1'}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="button-secondary" onClick={closeModal} disabled={singleLoading}>
                Cerrar
              </button>
              <button type="submit" disabled={singleLoading}>
                {singleLoading ? 'Buscando…' : showConfig.submitLabel ?? 'Consultar'}
              </button>
            </div>
            {singleError && <p className="error">{singleError}</p>}
            {singleItem && <pre className="json-preview">{JSON.stringify(singleItem, null, 2)}</pre>}
          </form>
        </Modal>
      )}
    </section>
  )
}

export default ResourcePage
