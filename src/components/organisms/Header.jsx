import { Link, useNavigate } from 'react-router-dom';

function obtenerUsuarioSesion() {
  try {
    const sesionGuardada = localStorage.getItem('usuario_sesion');
    return sesionGuardada ? JSON.parse(sesionGuardada) : null;
  } catch {
    return null;
  }
}

export default function Header({ modoOscuro, toggleModoOscuro }) {
  const navigate = useNavigate();
  const usuario = obtenerUsuarioSesion();

  const handleCerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario_sesion');
    localStorage.removeItem('usuarios_registrados');
    localStorage.removeItem('usuarios_bd');
    navigate('/login');
  };

  return (
    <header>
      <div className="logo-contenedor">
        <img
          src="/src/assets/img/logo.png"
          alt="Logo Veterinaria San Marcos"
          className="logo-img"
        />
        <div className="logo-texto">
          <h1>Veterinaria San Marcos</h1>
          <p>Cuidado integral para tus mascotas en Rancagua</p>
        </div>
      </div>

      <nav>
        <ul>
          <li><Link to="/">Inicio</Link></li>
          <li><Link to="/productos">Productos</Link></li>
          <li><Link to="/carrito">Carrito</Link></li>

          {usuario ? (
            <>
              {usuario.rol === 'admin' && (
                <>
                  <li><Link to="/admin">Admin / Panel</Link></li>
                  <li><Link to="/citas">Citas</Link></li>
                </>
              )}
              <li><Link to="/mascotas">Mascotas</Link></li>
              <li><Link to="/perfil">Mi Perfil</Link></li>
              <li>
                <button
                  onClick={handleCerrarSesion}
                  className="btn"
                  style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem', backgroundColor: '#ef4444' }}
                >
                  Salir
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login">Iniciar Sesión</Link></li>
              <li><Link to="/registro">Registrarse</Link></li>
            </>
          )}

          <li>
            <button onClick={toggleModoOscuro} className="btn-theme" title="Cambiar tema">
              {modoOscuro ? '☀️ Claro' : '🌙 Oscuro'}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}