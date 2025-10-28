import ResourcePage from '../components/ResourcePage'

const warehouseColumns = [
  {
    key: 'id',
    label: 'ID',
    sortable: true,
    render: (row) => row.id ?? '',
  },
  {
    key: 'nombre',
    label: 'Nombre',
    sortable: true,
    render: (row) => row.nombre ?? row.name ?? '',
  },
  {
    key: 'codigo',
    label: 'Código',
    sortable: true,
    render: (row) => row.codigo ?? row.code ?? '—',
  },
  {
    key: 'ubicacion',
    label: 'Ubicación',
    sortable: true,
    render: (row) => row.ubicacion ?? row.location ?? '—',
  },
  {
    key: 'capacidad',
    label: 'Capacidad',
    sortable: true,
    render: (row) => row.capacidad ?? row.capacity ?? '—',
    sortValue: (row) => Number(row.capacidad ?? row.capacity ?? 0),
  },
]

const createConfig = {
  title: 'Registrar almacén',
  subtitle: 'Completa los datos básicos del nuevo almacén.',
  submitLabel: 'Guardar almacén',
  fields: [
    {
      name: 'nombre',
      label: 'Nombre',
      placeholder: 'Almacén central',
      required: true,
    },
    {
      name: 'codigo',
      label: 'Código interno',
      placeholder: 'ALM-001',
    },
    {
      name: 'ubicacion',
      label: 'Ubicación',
      placeholder: 'Ciudad de Guatemala',
    },
    {
      name: 'capacidad',
      label: 'Capacidad (unidades)',
      type: 'number',
      min: 0,
      step: 1,
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'textarea',
      rows: 3,
      placeholder: 'Notas adicionales del almacén',
    },
  ],
}

const updateConfig = {
  title: 'Actualizar almacén',
  idLabel: 'ID del almacén',
  submitLabel: 'Actualizar almacén',
  fields: createConfig.fields,
}

const deleteConfig = {
  title: 'Eliminar almacén',
  subtitle: 'Indica el ID del almacén que deseas eliminar.',
  idLabel: 'ID del almacén',
  submitLabel: 'Eliminar almacén',
}

const WarehousesPage = () => (
  <ResourcePage
    title="Almacenes"
    endpoint="/almacenes"
    description="Crea y actualiza los almacenes donde se resguarda el inventario."
    columns={warehouseColumns}
    createConfig={createConfig}
    updateConfig={updateConfig}
    deleteConfig={deleteConfig}
  />
)

export default WarehousesPage
