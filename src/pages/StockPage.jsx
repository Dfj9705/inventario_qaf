import ResourcePage from '../components/ResourcePage'
const stockColumns = [
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
    render: (row) => row.stock ?? row.stock ?? '—',
    sortValue: (row) => Number(row.stock ?? row.stock ?? 0),
  },
]

const createConfig = {
  title: 'Registrar existencias',
  subtitle: 'Relaciona el producto con el almacén y la cantidad disponible.',
  submitLabel: 'Guardar existencias',
  fields: [
    {
      name: 'producto_id',
      label: 'Producto',
      type: 'select',
      required: true,
      optionsEndpoint: '/productos',
      optionValueKey: 'id',
      getOptionLabel: (item) => item?.nombre ?? item?.name ?? `#${item?.id ?? ''}`,
      helperText: 'Selecciona el producto correspondiente.',
    },
    {
      name: 'almacen_id',
      label: 'Almacén',
      type: 'select',
      required: true,
      optionsEndpoint: '/almacenes',
      optionValueKey: 'id',
      getOptionLabel: (item) => item?.nombre ?? item?.name ?? `#${item?.id ?? ''}`,
      helperText: 'Selecciona el almacén donde se almacena el producto.',
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
