import ResourcePage from '../components/ResourcePage'

const stockColumns = [
  {
    key: 'id',
    label: 'ID',
    sortable: true,
    render: (row) => row.id ?? '',
  },
  {
    key: 'producto',
    label: 'Producto',
    sortable: true,
    render: (row) =>
      row.producto?.nombre ??
      row.producto_nombre ??
      row.producto ??
      row.productoId ??
      row.producto_id ??
      '—',
  },
  {
    key: 'almacen',
    label: 'Almacén',
    sortable: true,
    render: (row) =>
      row.almacen?.nombre ??
      row.almacen_nombre ??
      row.almacen ??
      row.almacenId ??
      row.almacen_id ??
      '—',
  },
  {
    key: 'cantidad',
    label: 'Cantidad',
    sortable: true,
    render: (row) => row.cantidad ?? row.quantity ?? '—',
    sortValue: (row) => Number(row.cantidad ?? row.quantity ?? 0),
  },
  {
    key: 'actualizado',
    label: 'Última actualización',
    sortable: true,
    render: (row) => {
      const value = row.actualizado ?? row.updated_at ?? row.updatedAt
      if (!value) return '—'
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-GT')
    },
    sortValue: (row) => {
      const value = row.actualizado ?? row.updated_at ?? row.updatedAt
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? 0 : date.getTime()
    },
  },
]

const createConfig = {
  title: 'Registrar existencias',
  subtitle: 'Relaciona el producto con el almacén y la cantidad disponible.',
  submitLabel: 'Guardar existencias',
  fields: [
    {
      name: 'producto_id',
      label: 'ID del producto',
      type: 'number',
      min: 1,
      required: true,
      helperText: 'Ingresa el identificador del producto.',
    },
    {
      name: 'almacen_id',
      label: 'ID del almacén',
      type: 'number',
      min: 1,
      required: true,
      helperText: 'Ingresa el identificador del almacén.',
    },
    {
      name: 'cantidad',
      label: 'Cantidad disponible',
      type: 'number',
      min: 0,
      step: 1,
      required: true,
    },
    {
      name: 'descripcion',
      label: 'Notas adicionales',
      type: 'textarea',
      rows: 3,
      placeholder: 'Observaciones del inventario',
    },
  ],
}

const StockPage = () => (
  <ResourcePage
    title="Existencias"
    endpoint="/stock"
    description="Consulta y registra el stock de productos por almacén."
    columns={stockColumns}
    createConfig={createConfig}
  />
)

export default StockPage
