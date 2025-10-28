import { useEffect, useMemo, useState } from 'react'

const toTitleCase = (value) =>
  value
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\w/, (char) => char.toUpperCase())

const buildColumnsFromData = (data) => {
  if (!data.length) {
    return []
  }

  return Object.keys(data[0]).map((key) => ({
    key,
    label: toTitleCase(key),
    sortable: true,
  }))
}

const normalizeColumns = (columns, data) => {
  const source = columns?.length ? columns : buildColumnsFromData(data)
  if (!source.length) {
    return [
      {
        key: '__json',
        label: 'Registro',
        sortable: false,
        render: (row) => JSON.stringify(row, null, 2),
        sortValue: (row) => JSON.stringify(row),
      },
    ]
  }

  return source.map((column) => {
    const renderFn = column.render ?? ((row) => row?.[column.key])
    const sortValueFn = column.sortValue ?? ((row) => row?.[column.key])

    return {
      sortable: true,
      ...column,
      render: renderFn,
      sortValue: sortValueFn,
    }
  })
}

const compareValues = (a, b) => {
  if (a === b) return 0
  if (a === undefined || a === null) return -1
  if (b === undefined || b === null) return 1

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }

  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

const DEFAULT_ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50]

const DataTable = ({
  columns,
  data = [],
  loading = false,
  emptyMessage = 'No hay registros disponibles.',
  rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
}) => {
  const computedColumns = useMemo(
    () => normalizeColumns(columns, data),
    [columns, data],
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[1] ?? rowsPerPageOptions[0] ?? 10)

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) {
      return data
    }

    const needle = searchTerm.trim().toLowerCase()

    return data.filter((row) =>
      computedColumns.some((column) => {
        const value = column.sortValue(row)
        return String(value ?? '').toLowerCase().includes(needle)
      }),
    )
  }, [data, searchTerm, computedColumns])

  const sortedData = useMemo(() => {
    if (!sortConfig.key) {
      return filteredData
    }

    const column = computedColumns.find((col) => col.key === sortConfig.key)
    if (!column) {
      return filteredData
    }

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = column.sortValue(a)
      const bValue = column.sortValue(b)
      return compareValues(aValue, bValue)
    })

    return sortConfig.direction === 'asc' ? sorted : sorted.reverse()
  }, [filteredData, sortConfig, computedColumns])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage))
  const startIndex = (page - 1) * rowsPerPage
  const paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage)

  useEffect(() => {
    setPage(1)
  }, [searchTerm, rowsPerPage, sortConfig.key])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [totalPages, page])

  const handleSort = (column) => {
    if (!column.sortable) {
      return
    }

    setSortConfig((current) => {
      if (current.key === column.key) {
        const nextDirection = current.direction === 'asc' ? 'desc' : 'asc'
        return { key: column.key, direction: nextDirection }
      }

      return { key: column.key, direction: 'asc' }
    })
  }

  return (
    <div className="table-wrapper">
      <div className="table-controls">
        <input
          className="table-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar en la tabla"
          aria-label="Buscar"
        />
        <label className="table-rows-selector">
          Filas
          <select
            value={rowsPerPage}
            onChange={(event) => {
              setRowsPerPage(Number(event.target.value))
            }}
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-scroller">
        <table>
          <thead>
            <tr>
              {computedColumns.map((column) => {
                const isSorted = sortConfig.key === column.key
                const direction = isSorted ? sortConfig.direction : null

                return (
                  <th
                    key={column.key}
                    onClick={() => handleSort(column)}
                    className={column.sortable ? 'sortable' : undefined}
                    scope="col"
                  >
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="sort-indicator" aria-hidden>
                        {isSorted ? (direction === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={computedColumns.length} className="table-empty">
                  Cargando información…
                </td>
              </tr>
            ) : paginatedData.length ? (
              paginatedData.map((row, index) => (
                <tr key={row.id ?? index}>
                  {computedColumns.map((column) => (
                    <td key={column.key}>
                      {column.render(row) ?? ''}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={computedColumns.length} className="table-empty">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-pagination">
        <span>
          Página {page} de {totalPages}
        </span>
        <div className="table-pagination-buttons">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}

export default DataTable
