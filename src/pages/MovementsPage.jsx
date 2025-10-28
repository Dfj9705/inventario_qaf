import ResourcePage from '../components/ResourcePage'

const movementColumns = [
  {
    key: 'id',
    label: 'ID',
    sortable: true,
    render: (row) => row.id ?? '',
  },
  {
    key: 'tipo',
    label: 'Tipo',
    sortable: true,
    render: (row) => row.tipo ?? row.type ?? '—',
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
    key: 'fecha',
    label: 'Fecha',
    sortable: true,
    render: (row) => {
      const value = row.fecha ?? row.created_at ?? row.createdAt
      if (!value) return '—'
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? value : date.toLocaleString('es-GT')
    },
    sortValue: (row) => {
      const value = row.fecha ?? row.created_at ?? row.createdAt
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? 0 : date.getTime()
    },
  },
]

const createConfig = {
  title: 'Registrar movimiento',
  subtitle: 'Controla entradas y salidas de inventario desde este formulario.',
  submitLabel: 'Guardar movimiento',
  fields: [
    {
      name: 'tipo',
      label: 'Tipo de movimiento',
      type: 'select',
      required: true,
      options: [
        { label: 'Entrada', value: 'entrada' },
        { label: 'Salida', value: 'salida' },
      ],
    },
    {
      name: 'producto_id',
      label: 'Producto',
      type: 'select',
      required: true,
      optionsEndpoint: '/productos',
      optionValueKey: 'id',
      getOptionLabel: (item) => item?.nombre ?? item?.name ?? `#${item?.id ?? ''}`,
      helperText: 'Selecciona el producto relacionado con el movimiento.',
    },
    {
      name: 'almacen_id',
      label: 'Almacén',
      type: 'select',
      required: true,
      optionsEndpoint: '/almacenes',
      optionValueKey: 'id',
      getOptionLabel: (item) => item?.nombre ?? item?.name ?? `#${item?.id ?? ''}`,
      helperText: 'Indica el almacén donde se registrará el movimiento.',
    },
    {
      name: 'cantidad',
      label: 'Cantidad',
      type: 'number',
      min: 1,
      step: 1,
      required: true,
    },
    {
      name: 'descripcion',
      label: 'Notas del movimiento',
      type: 'textarea',
      rows: 3,
      placeholder: 'Ej. ajuste por auditoría',
    },
  ],
}

const showConfig = {
  title: 'Consultar movimiento',
  subtitle: 'Ingresa el ID para ver el detalle del movimiento registrado.',
  idLabel: 'ID del movimiento',
  submitLabel: 'Buscar movimiento',
}

const MovementsPage = () => (
  <ResourcePage
    title="Movimientos"
    endpoint="/movimientos"
    description="Registra entradas y salidas de inventario y consulta un movimiento específico."
    columns={movementColumns}
    createConfig={createConfig}
    showConfig={showConfig}
  />
)

export default MovementsPage
