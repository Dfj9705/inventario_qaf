import ResourcePage from '../components/ResourcePage'

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === '') {
    return '—'
  }

  const numeric = Number(value)
  if (Number.isNaN(numeric)) {
    return value
  }

  return `Q${numeric.toFixed(2)}`
}

const productColumns = [
  {
    key: 'id',
    label: 'ID',
    sortable: true,
    render: (row) => row.id ?? '',
  },
  {
    key: 'sku',
    label: 'SKU',
    sortable: true,
    render: (row) => row.sku ?? '—',
  },
  {
    key: 'nombre',
    label: 'Nombre',
    sortable: true,
    render: (row) => row.nombre ?? row.name ?? '—',
  },
  {
    key: 'precio',
    label: 'Precio',
    sortable: true,
    render: (row) => formatCurrency(row.precio ?? row.price),
    sortValue: (row) => Number(row.precio ?? row.price ?? 0),
  },
]

const createConfig = {
  title: 'Registrar producto',
  subtitle: 'Captura los datos principales del nuevo producto.',
  submitLabel: 'Guardar producto',
  fields: [
    {
      name: 'sku',
      label: 'SKU',
      placeholder: 'SKU-001',
      required: true,
    },
    {
      name: 'nombre',
      label: 'Nombre',
      placeholder: 'Producto de ejemplo',
      required: true,
    },
    {
      name: 'precio',
      label: 'Precio',
      type: 'number',
      step: '0.01',
      min: 0,
      required: true,
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      rows: 3,
      placeholder: 'Descripción corta del producto',
    },
  ],
}

const updateConfig = {
  title: 'Actualizar producto',
  idLabel: 'ID del producto',
  submitLabel: 'Actualizar producto',
  fields: createConfig.fields,
}

const deleteConfig = {
  title: 'Eliminar producto',
  subtitle: 'Indica el ID del producto que deseas remover del catálogo.',
  idLabel: 'ID del producto',
  submitLabel: 'Eliminar producto',
}

const ProductsPage = () => (
  <ResourcePage
    title="Productos"
    endpoint="/productos"
    description="Administra el catálogo de productos disponible en la API."
    columns={productColumns}
    createConfig={createConfig}
    updateConfig={updateConfig}
    deleteConfig={deleteConfig}
  />
)

export default ProductsPage
