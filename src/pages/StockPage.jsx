import ResourcePage from '../components/ResourcePage'

const StockPage = () => (
  <ResourcePage
    title="Existencias"
    endpoint="/stock"
    description="Consulta y registra el stock de productos por almacén."
    supportsUpdate={false}
    supportsDelete={false}
  />
)

export default StockPage
