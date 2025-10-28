import ResourcePage from '../components/ResourcePage'

const MovementsPage = () => (
  <ResourcePage
    title="Movimientos"
    endpoint="/movimientos"
    description="Registra entradas y salidas de inventario y consulta un movimiento específico."
    supportsUpdate={false}
    supportsDelete={false}
    supportsShow
  />
)

export default MovementsPage
