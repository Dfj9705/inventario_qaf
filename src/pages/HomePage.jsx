import { useEffect, useMemo, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import apiClient from '../api/client'

const COLOR_PALETTE = [
  '#2563eb',
  '#7c3aed',
  '#22c55e',
  '#f97316',
  '#ec4899',
  '#14b8a6',
  '#f59e0b',
  '#0ea5e9',
  '#6366f1',
  '#fb7185',
]

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload?.data && Array.isArray(payload.data)) {
    return payload.data
  }

  return []
}

const toNumber = (value) => {
  const numeric = Number(value)
  return Number.isNaN(numeric) ? 0 : numeric
}

const resolveProductLabel = (record) =>
  record?.producto?.nombre ??
  record?.producto_nombre ??
  record?.producto ??
  record?.productoId ??
  record?.producto_id ??
  `Producto #${record?.id ?? record?.producto_id ?? ''}`

const resolveMovementType = (movement) => {
  const value = (movement?.tipo ?? movement?.type ?? 'otros').toString().toLowerCase()
  if (value === 'entrada' || value === 'salida') {
    return value
  }

  return value || 'otros'
}

const getMovementDateInfo = (movement) => {
  const rawValue =
    movement?.fecha ??
    movement?.created_at ??
    movement?.createdAt ??
    movement?.updated_at ??
    movement?.updatedAt ??
    null

  if (!rawValue) {
    return { label: 'Sin fecha', timestamp: 0 }
  }

  const date = new Date(rawValue)
  if (Number.isNaN(date.getTime())) {
    return { label: String(rawValue), timestamp: 0 }
  }

  return {
    label: date.toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }),
    timestamp: date.getTime(),
  }
}

const HomePage = () => {
  const [dashboardData, setDashboardData] = useState({
    products: [],
    warehouses: [],
    stock: [],
    movements: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [isChartReady, setIsChartReady] = useState(false)

  const stockChartRef = useRef(null)
  const movementChartRef = useRef(null)
  const chartsRef = useRef({ stock: null, movements: null })

  useEffect(() => {
    if (isChartReady) {
      return undefined
    }

    if (typeof window === 'undefined') {
      return undefined
    }

    setIsChartReady(true)

    return undefined
  }, [isChartReady])

  useEffect(() => {
    let isCancelled = false

    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      const endpoints = [
        { key: 'products', url: '/productos' },
        { key: 'warehouses', url: '/almacenes' },
        { key: 'stock', url: '/stock' },
        { key: 'movements', url: '/movimientos' },
      ]

      const nextData = {
        products: [],
        warehouses: [],
        stock: [],
        movements: [],
      }

      const failureMessages = []

      await Promise.allSettled(
        endpoints.map(async ({ key, url }) => {
          try {
            const { data } = await apiClient.get(url)
            nextData[key] = normalizeCollection(data)
          } catch (requestError) {
            nextData[key] = []
            const message =
              requestError.response?.data?.message ??
              requestError.message ??
              `No fue posible consultar ${url}`
            failureMessages.push(message)
          }
        }),
      )

      if (isCancelled) {
        return
      }

      setDashboardData(nextData)

      if (failureMessages.length) {
        const uniqueMessages = [...new Set(failureMessages)].slice(0, 1)
        setError(
          `No fue posible cargar toda la información del tablero. Verifica tu sesión e inténtalo de nuevo. ${uniqueMessages.join(
            ' ',
          )}`,
        )
      } else {
        setError('')
      }

      setLoading(false)
    }

    loadDashboard()

    return () => {
      isCancelled = true
    }
  }, [refreshKey])

  const stockSummary = useMemo(() => {
    const productTotals = new Map()

    dashboardData.stock.forEach((record) => {
      const label = resolveProductLabel(record)
      const amount = toNumber(
        record?.cantidad ?? record?.quantity ?? record?.stock ?? record?.total ?? 0,
      )

      productTotals.set(label, (productTotals.get(label) ?? 0) + amount)
    })

    const sortedEntries = Array.from(productTotals.entries()).sort((a, b) => b[1] - a[1])
    const MAX_SEGMENTS = 8

    let entriesToShow = sortedEntries
    if (sortedEntries.length > MAX_SEGMENTS) {
      const topEntries = sortedEntries.slice(0, MAX_SEGMENTS - 1)
      const remainingTotal = sortedEntries
        .slice(MAX_SEGMENTS - 1)
        .reduce((sum, [, value]) => sum + value, 0)
      entriesToShow = [...topEntries, ['Otros', remainingTotal]]
    }

    const labels = entriesToShow.map(([label]) => label)
    const values = entriesToShow.map(([, value]) => value)
    const colors = labels.map((_, index) => COLOR_PALETTE[index % COLOR_PALETTE.length])
    const total = values.reduce((sum, value) => sum + value, 0)

    return { labels, values, colors, total }
  }, [dashboardData.stock])

  const movementSummary = useMemo(() => {
    const counts = new Map()

    dashboardData.movements.forEach((movement) => {
      const type = resolveMovementType(movement)
      counts.set(type, (counts.get(type) ?? 0) + 1)
    })

    const preferredOrder = ['entrada', 'salida', 'otros']
    const orderedKeys = [
      ...preferredOrder.filter((key) => counts.has(key)),
      ...Array.from(counts.keys()).filter((key) => !preferredOrder.includes(key)),
    ]

    const labels = orderedKeys
    const values = labels.map((label) => counts.get(label) ?? 0)
    const displayLabels = labels.map((label) => label.charAt(0).toUpperCase() + label.slice(1))
    const colors = labels.map((label) => {
      if (label === 'entrada') return '#22c55e'
      if (label === 'salida') return '#ef4444'
      return '#64748b'
    })
    const total = values.reduce((sum, value) => sum + value, 0)

    return { labels, displayLabels, values, colors, total }
  }, [dashboardData.movements])

  const recentMovements = useMemo(() => {
    if (!dashboardData.movements.length) {
      return []
    }

    return dashboardData.movements
      .map((movement, index) => {
        const dateInfo = getMovementDateInfo(movement)
        const productLabel =
          movement?.producto?.nombre ??
          movement?.producto_nombre ??
          movement?.producto ??
          movement?.productoId ??
          movement?.producto_id ??
          ''
        const warehouseLabel =
          movement?.almacen?.nombre ??
          movement?.almacen_nombre ??
          movement?.almacen ??
          movement?.almacenId ??
          movement?.almacen_id ??
          ''

        const details = [productLabel, warehouseLabel].filter(Boolean).join(' · ')

        return {
          key: movement?.id ?? movement?.uuid ?? `movement-${index}`,
          type: resolveMovementType(movement),
          quantity: toNumber(movement?.cantidad ?? movement?.quantity ?? movement?.total ?? 0),
          details,
          description: movement?.descripcion ?? movement?.description ?? '',
          dateInfo,
        }
      })
      .sort((a, b) => b.dateInfo.timestamp - a.dateInfo.timestamp)
      .slice(0, 5)
  }, [dashboardData.movements])

  useEffect(
    () => () => {
      Object.values(chartsRef.current).forEach((chartInstance) => {
        if (chartInstance && typeof chartInstance.destroy === 'function') {
          chartInstance.destroy()
        }
      })
    },
    [],
  )

  useEffect(() => {
    if (!isChartReady || !stockChartRef.current) {
      return undefined
    }

    const chartStore = chartsRef.current

    if (!stockSummary.labels.length || !stockSummary.values.some((value) => value > 0)) {
      if (chartStore.stock) {
        chartStore.stock.destroy()
        chartStore.stock = null
      }
      return undefined
    }

    const chartInstance = new Chart(stockChartRef.current, {
      type: 'doughnut',
      data: {
        labels: stockSummary.labels,
        datasets: [
          {
            data: stockSummary.values,
            backgroundColor: stockSummary.colors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label ?? 'Sin nombre'}: ${context.parsed ?? 0} unidades`,
            },
          },
        },
      },
    })

    chartStore.stock = chartInstance

    return () => {
      chartInstance.destroy()
      if (chartStore.stock === chartInstance) {
        chartStore.stock = null
      }
    }
  }, [isChartReady, stockSummary])

  useEffect(() => {
    if (!isChartReady || !movementChartRef.current) {
      return undefined
    }

    const chartStore = chartsRef.current

    if (!movementSummary.labels.length || !movementSummary.values.some((value) => value > 0)) {
      if (chartStore.movements) {
        chartStore.movements.destroy()
        chartStore.movements = null
      }
      return undefined
    }

    const chartInstance = new Chart(movementChartRef.current, {
      type: 'bar',
      data: {
        labels: movementSummary.displayLabels,
        datasets: [
          {
            label: 'Movimientos',
            data: movementSummary.values,
            backgroundColor: movementSummary.colors,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y ?? 0} movimientos`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    })

    chartStore.movements = chartInstance

    return () => {
      chartInstance.destroy()
      if (chartStore.movements === chartInstance) {
        chartStore.movements = null
      }
    }
  }, [isChartReady, movementSummary])

  const totalProducts = dashboardData.products.length
  const totalWarehouses = dashboardData.warehouses.length
  const totalStockUnits = stockSummary.total
  const totalMovements = dashboardData.movements.length

  const stockChartAvailable =
    isChartReady && stockSummary.labels.length > 0 && stockSummary.values.some((value) => value > 0)
  const movementChartAvailable =
    isChartReady &&
    movementSummary.labels.length > 0 &&
    movementSummary.values.some((value) => value > 0)

  return (
    <section className="page home-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Panel general de inventario</h1>
          <p className="page-description">
            Consulta un resumen de productos, almacenes, existencias y movimientos registrados en la
            API.
          </p>
        </div>
        <button
          type="button"
          className="refresh-button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading}
        >
          {loading ? 'Actualizando…' : 'Actualizar tablero'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="dashboard-grid">
        <article className="stat-card">
          <h2>Productos</h2>
          <span className="stat-value">{totalProducts}</span>
          <span className="stat-subtitle">Registros disponibles</span>
        </article>
        <article className="stat-card">
          <h2>Almacenes</h2>
          <span className="stat-value">{totalWarehouses}</span>
          <span className="stat-subtitle">Centros de almacenamiento</span>
        </article>
        <article className="stat-card">
          <h2>Existencias</h2>
          <span className="stat-value">{totalStockUnits}</span>
          <span className="stat-subtitle">Unidades totales registradas</span>
        </article>
        <article className="stat-card">
          <h2>Movimientos</h2>
          <span className="stat-value">{totalMovements}</span>
          <span className="stat-subtitle">Eventos registrados</span>
        </article>
      </div>

      <div className="charts-grid">
        <article className="chart-card">
          <header>
            <h2>Distribución de existencias</h2>
          </header>
          <div className="chart-container">
            {stockChartAvailable ? (
              <canvas
                ref={stockChartRef}
                role="img"
                aria-label="Gráfica de pastel con la distribución de existencias por producto"
              />
            ) : (
              <p className="chart-placeholder">
                {!isChartReady
                  ? 'Cargando librería de gráficas…'
                  : 'No hay información de existencias para mostrar.'}
              </p>
            )}
          </div>
        </article>
        <article className="chart-card">
          <header>
            <h2>Movimientos por tipo</h2>
          </header>
          <div className="chart-container">
            {movementChartAvailable ? (
              <canvas
                ref={movementChartRef}
                role="img"
                aria-label="Gráfica de barras con el total de movimientos por tipo"
              />
            ) : (
              <p className="chart-placeholder">
                {!isChartReady
                  ? 'Cargando librería de gráficas…'
                  : 'No hay movimientos suficientes para graficar.'}
              </p>
            )}
          </div>
        </article>
      </div>

      <section className="recent-activity">
        <header>
          <h2>Movimientos recientes</h2>
        </header>
        {recentMovements.length ? (
          <ul>
            {recentMovements.map((movement) => (
              <li key={movement.key}>
                <div className="movement-meta">
                  <span className="movement-type">{movement.type}</span>
                  <span>{movement.dateInfo.label}</span>
                </div>
                <span className="movement-quantity">{movement.quantity} unidades</span>
                {movement.details && <span className="movement-description">{movement.details}</span>}
                {movement.description && (
                  <span className="movement-description">{movement.description}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="chart-placeholder">No se han registrado movimientos recientes.</p>
        )}
      </section>
    </section>
  )
}

export default HomePage
