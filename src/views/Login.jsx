import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const DOMINIOS_PERMITIDOS = ['@veterinaria.cl', '@gmail.com', '@duocuc.cl'];
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const correoLimpio = correo.trim().toLowerCase();

    if (!correoLimpio || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    if (!REGEX_CORREO.test(correoLimpio)) {
      setError('Ingrese un formato de correo electrónico válido.');
      return;
    }

    const esDominioValido = DOMINIOS_PERMITIDOS.some((dominio) =>
      correoLimpio.endsWith(dominio)
    );

    if (!esDominioValido) {
      setError(
        'El correo debe pertenecer a uno de los dominios permitidos (@veterinaria.cl, @gmail.com, @duocuc.cl).'
      );
      return;
    }

    setCargando(true);
    try {
      const resAuth = await api.post('/auth/login', {
        correo: correoLimpio,
        password
      });

      const data = resAuth?.data || {};
      const rolFinal = String(data.rol || 'cliente').toLowerCase();

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      const usuarioSesion = {
        id: data.id ?? data.clienteId ?? data.usuarioId ?? null,
        nombre: data.nombre || correoLimpio,
        correo: data.correo || correoLimpio,
        rol: rolFinal
      };

      localStorage.setItem('usuario_sesion', JSON.stringify(usuarioSesion));

      if (rolFinal === 'admin') {
        navigate('/admin');
      } else {
        navigate('/perfil');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      const status = err?.response?.status;
      if (status === 401 || status === 400) {
        setError('Credenciales incorrectas. Si no tienes cuenta, debes registrarte.');
      } else {
        setError(
          'No se pudo conectar con el servidor. Verifica que el backend esté encendido.'
        );
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <main>
      <section className="form-container">
        <h2>Iniciar Sesión</h2>

        <div
          style={{
            backgroundColor: '#e6f4f1',
            borderLeft: '4px solid #0d828a',
            padding: '0.8rem 1rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            color: '#1e293b'
          }}
        >
          <strong
            style={{
              color: '#0f4c5c',
              display: 'block',
              marginBottom: '0.3rem',
              fontSize: '0.9rem'
            }}
          >
            Credenciales de Prueba (Admin):
          </strong>
          <span>
            <strong style={{ color: '#334155' }}>Correo:</strong> admin@veterinaria.cl
          </span>
          <br />
          <span>
            <strong style={{ color: '#334155' }}>Contraseña:</strong> admin123
          </span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="campo">
            <label htmlFor="correo">Correo Electrónico:</label>
            <input
              type="email"
              id="correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@veterinaria.cl"
            />
          </div>

          <div className="campo">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div role="alert" className="alerta-form alerta-error">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn"
            disabled={cargando}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          ¿No tienes una cuenta?{' '}
          <Link to="/registro" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
            Regístrate aquí
          </Link>
        </p>
      </section>
    </main>
  );
}