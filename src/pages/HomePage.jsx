import { useEffect, useMemo, useRef, useState } from 'react'
import Chart from 'chart.js/auto'
import apiClient from '../api/client'

const COLOR_PALETTE = ['#2563eb','#7c3aed','#22c55e','#f97316','#ec4899','#14b8a6','#f59e0b','#0ea5e9','#6366f1','#fb7185']

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload?.data && Array.isArray(payload.data)) return payload.data
  return []
}

const toNumber = (value) => {
  const n = Number(value)
  return Number.isNaN(n) ? 0 : n
}

const resolveProductLabel = (record) =>
  record?.producto?.nombre ??
  record?.producto_nombre ??
  record?.producto ??
  record?.productoId ??
  record?.producto_id ??
  `Producto #${record?.id ?? record?.producto_id ?? ''}`

// Normaliza SIEMPRE a claves internas 'in' | 'out' | 'others'
const resolveMovementType = (movement) => {
  const raw = (movement?.tipo ?? movement?.type ?? 'others').toString().trim().toUpperCase()
  if (raw === 'IN') return 'in'
  if (raw === 'OUT') return 'out'
  if (raw === 'ENTRADA') return 'in'
  if (raw === 'SALIDA') return 'out'
  return 'others'
}

// Etiqueta bonita para UI
const labelForType = (type) => (type === 'in' ? 'Entrada' : type === 'out' ? 'Salida' : 'Otros')

const getMovementDateInfo = (movement) => {
  const raw =
    movement?.fecha ??
    movement?.created_at ??
    movement?.createdAt ??
    movement?.updated_at ??
    movement?.updatedAt ??
    null

  if (!raw) return { label: 'Sin fecha', timestamp: 0 }

  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return { label: String(raw), timestamp: 0 }

  return {
    label: d.toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }),
    timestamp: d.getTime(),
  }
}

const HomePage = () => {
  const [dashboardData, setDashboardData] = useState({ products: [], warehouses: [], stock: [], movements: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [isChartReady, setIsChartReady] = useState(false)

  const stockChartRef = useRef(null)
  const movementChartRef = useRef(null)
  const chartsRef = useRef({ stock: null, movements: null })

  useEffect(() => {
    if (!isChartReady && typeof window !== 'undefined') setIsChartReady(true)
  }, [isChartReady])

  useEffect(() => {
    let isCancelled = false
    const loadDashboard = async () => {
      setLoading(true); setError('')
      const endpoints = [
        { key: 'products', url: '/productos' },
        { key: 'warehouses', url: '/almacenes' },
        { key: 'stock', url: '/stock' },
        { key: 'movements', url: '/movimientos' },
      ]
      const nextData = { products: [], warehouses: [], stock: [], movements: [] }
      const failures = []

      await Promise.allSettled(endpoints.map(async ({ key, url }) => {
        try { const { data } = await apiClient.get(url); nextData[key] = normalizeCollection(data) }
        catch (e) {
          nextData[key] = []
          failures.push(e?.response?.data?.message ?? e?.message ?? `No fue posible consultar ${url}`)
        }
      }))

      if (isCancelled) return
      setDashboardData(nextData)
      setError(failures.length ? `No fue posible cargar toda la información del tablero. ${[...new Set(failures)][0]}` : '')
      setLoading(false)
    }
    loadDashboard()
    return () => { isCancelled = true }
  }, [refreshKey])

  // Pie de existencias
  const stockSummary = useMemo(() => {
    const totals = new Map()
    dashboardData.stock.forEach((record) => {
      const label = resolveProductLabel(record)
      const amount = toNumber(record?.cantidad ?? record?.quantity ?? record?.stock ?? record?.total ?? 0)
      totals.set(label, (totals.get(label) ?? 0) + amount)
    })
    const sorted = Array.from(totals.entries()).sort((a,b)=>b[1]-a[1])
    const MAX = 8
    let entries = sorted
    if (sorted.length > MAX) {
      const top = sorted.slice(0, MAX - 1)
      const rest = sorted.slice(MAX - 1).reduce((s,[,v])=>s+v,0)
      entries = [...top, ['Otros', rest]]
    }
    const labels = entries.map(([l])=>l)
    const values = entries.map(([,v])=>v)
    const colors = labels.map((_,i)=>COLOR_PALETTE[i % COLOR_PALETTE.length])
    const total = values.reduce((s,v)=>s+v,0)
    return { labels, values, colors, total }
  }, [dashboardData.stock])

  // Barras apiladas de movimientos
  const movementSummary = useMemo(() => {
    if (!dashboardData.movements.length) return { productLabels: [], datasets: [] }

    const perProduct = new Map()
    dashboardData.movements.forEach((m) => {
      const label = resolveProductLabel(m)
      const type = resolveMovementType(m) // 'in' | 'out' | 'others'
      const qty = Math.abs(toNumber(m?.cantidad ?? m?.quantity ?? m?.total ?? 0))

      if (!perProduct.has(label)) perProduct.set(label, { in: 0, out: 0, others: 0, total: 0 })
      const bucket = type === 'in' ? 'in' : type === 'out' ? 'out' : 'others'
      const s = perProduct.get(label)
      s[bucket] += qty; s.total += qty
    })

    const sorted = Array.from(perProduct.entries()).sort((a,b)=>b[1].total - a[1].total)
    const MAX = 6
    let entries = sorted
    if (sorted.length > MAX) {
      const top = sorted.slice(0, MAX - 1)
      const remainder = sorted.slice(MAX - 1).reduce((acc,[,v]) => {
        acc.in += v.in; acc.out += v.out; acc.others += v.others; acc.total += v.total; return acc
      }, { in: 0, out: 0, others: 0, total: 0 })
      entries = [...top, ['Otros productos', remainder]]
    }

    const productLabels = entries.map(([l])=>l)
    const datasetConfig = [
      { key: 'in', label: 'Entradas', backgroundColor: '#22c55e' },
      { key: 'out', label: 'Salidas', backgroundColor: '#ef4444' },
      { key: 'others', label: 'Otros movimientos', backgroundColor: '#64748b' },
    ]
    const datasets = datasetConfig
      .map(cfg => ({ label: cfg.label, backgroundColor: cfg.backgroundColor, data: entries.map(([,v])=>v[cfg.key] ?? 0) }))
      .filter(ds => ds.data.some(v => v > 0))

    return { productLabels, datasets }
  }, [dashboardData.movements])

  const recentMovements = useMemo(() => {
    if (!dashboardData.movements.length) return []
    return dashboardData.movements
      .map((m, i) => {
        const dateInfo = getMovementDateInfo(m)
        const product =
          m?.producto?.nombre ?? m?.producto_nombre ?? m?.producto ?? m?.productoId ?? m?.producto_id ?? ''
        const warehouse =
          m?.almacen?.nombre ?? m?.almacen_nombre ?? m?.almacen ?? m?.almacenId ?? m?.almacen_id ?? ''
        const details = [product, warehouse].filter(Boolean).join(' · ')
        const t = resolveMovementType(m) // 'in'|'out'|'others'

        return {
          key: m?.id ?? m?.uuid ?? `movement-${i}`,
          type: labelForType(t), // etiqueta bonita
          quantity: toNumber(m?.cantidad ?? m?.quantity ?? m?.total ?? 0),
          details,
          description: m?.descripcion ?? m?.description ?? '',
          dateInfo,
        }
      })
      .sort((a,b)=>b.dateInfo.timestamp - a.dateInfo.timestamp)
      .slice(0, 5)
  }, [dashboardData.movements])

  useEffect(() => () => {
    Object.values(chartsRef.current).forEach(c => c?.destroy?.())
  }, [])

  useEffect(() => {
    if (!isChartReady || !stockChartRef.current) return
    const store = chartsRef.current

    if (!stockSummary.labels.length || !stockSummary.values.some(v=>v>0)) {
      store.stock?.destroy?.(); store.stock = null; return
    }

    const chart = new Chart(stockChartRef.current, {
      type: 'doughnut',
      data: { labels: stockSummary.labels, datasets: [{ data: stockSummary.values, backgroundColor: stockSummary.colors, borderWidth: 1 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { callbacks: { label: (ctx) => `${ctx.label ?? 'Sin nombre'}: ${ctx.parsed ?? 0} unidades` } },
        },
      },
    })
    store.stock = chart
    return () => { chart.destroy(); if (store.stock === chart) store.stock = null }
  }, [isChartReady, stockSummary])

  useEffect(() => {
    if (!isChartReady || !movementChartRef.current) return
    const store = chartsRef.current

    if (!movementSummary.productLabels.length || !movementSummary.datasets.length || !movementSummary.datasets.some(d=>d.data.some(v=>v>0))) {
      store.movements?.destroy?.(); store.movements = null; return
    }

    const chart = new Chart(movementChartRef.current, {
      type: 'bar',
      data: {
        labels: movementSummary.productLabels,
        datasets: movementSummary.datasets.map(ds => ({ ...ds, borderRadius: 6, stack: 'movements' })),
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          tooltip: { callbacks: { label: (ctx) => `${ctx.dataset?.label ?? 'Movimientos'}: ${ctx.parsed.y ?? 0} unidades` } },
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 }, stacked: true },
          x: { stacked: true },
        },
      },
    })
    store.movements = chart
    return () => { chart.destroy(); if (store.movements === chart) store.movements = null }
  }, [isChartReady, movementSummary])

  const totalProducts = dashboardData.products.length
  const totalWarehouses = dashboardData.warehouses.length
  const totalStockUnits = stockSummary.total
  const totalMovements = dashboardData.movements.length

  const stockChartAvailable = isChartReady && stockSummary.labels.length > 0 && stockSummary.values.some(v=>v>0)
  const movementChartAvailable = isChartReady && movementSummary.productLabels.length > 0 && movementSummary.datasets.length > 0

  return (
    <section className="page home-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Panel general de inventario</h1>
          <p className="page-description">Consulta un resumen de productos, almacenes, existencias y movimientos registrados en la API.</p>
        </div>
        <button type="button" className="refresh-button" onClick={() => setRefreshKey(k => k + 1)} disabled={loading}>
          {loading ? 'Actualizando…' : 'Actualizar tablero'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="dashboard-grid">
        <article className="stat-card"><h2>Productos</h2><span className="stat-value">{totalProducts}</span><span className="stat-subtitle">Registros disponibles</span></article>
        <article className="stat-card"><h2>Almacenes</h2><span className="stat-value">{totalWarehouses}</span><span className="stat-subtitle">Centros de almacenamiento</span></article>
        <article className="stat-card"><h2>Existencias</h2><span className="stat-value">{totalStockUnits}</span><span className="stat-subtitle">Unidades totales registradas</span></article>
        <article className="stat-card"><h2>Movimientos</h2><span className="stat-value">{totalMovements}</span><span className="stat-subtitle">Eventos registrados</span></article>
      </div>

      <div className="charts-grid">
        <article className="chart-card">
          <header><h2>Distribución de existencias</h2></header>
          <div className="chart-container">
            {stockChartAvailable ? (
              <canvas ref={stockChartRef} role="img" aria-label="Gráfica de pastel con la distribución de existencias por producto" />
            ) : (
              <p className="chart-placeholder">{!isChartReady ? 'Cargando librería de gráficas…' : 'No hay información de existencias para mostrar.'}</p>
            )}
          </div>
        </article>
        <article className="chart-card">
          <header><h2>Entradas y salidas por producto</h2></header>
          <div className="chart-container">
            {movementChartAvailable ? (
              <canvas ref={movementChartRef} role="img" aria-label="Gráfica de barras apiladas con las unidades de entradas y salidas por producto" />
            ) : (
              <p className="chart-placeholder">{!isChartReady ? 'Cargando librería de gráficas…' : 'No hay movimientos suficientes para mostrar por producto.'}</p>
            )}
          </div>
        </article>
      </div>

      <section className="recent-activity">
        <header><h2>Movimientos recientes</h2></header>
        {recentMovements.length ? (
          <ul>
            {recentMovements.map((m) => (
              <li key={m.key}>
                <div className="movement-meta">
                  <span className="movement-type">{m.type}</span>
                  <span>{m.dateInfo.label}</span>
                </div>
                <span className="movement-quantity">{m.quantity} unidades</span>
                {m.details && <span className="movement-description">{m.details}</span>}
                {m.description && <span className="movement-description">{m.description}</span>}
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
