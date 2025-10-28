const HomePage = () => (
  <section className="page">
    <h1>API de gestión de inventarios</h1>
    <p className="page-description">
      Selecciona una opción del menú para interactuar con los recursos expuestos por la API de Laravel.
    </p>
    <p>
      Todas las operaciones requieren estar autenticado mediante Sanctum. Inicia sesión para obtener un
      token y luego navega por los módulos disponibles.
    </p>
  </section>
)

export default HomePage
