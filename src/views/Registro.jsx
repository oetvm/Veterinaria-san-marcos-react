import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const DOMINIOS_PERMITIDOS = ['@veterinaria.cl', '@gmail.com', '@duocuc.cl'];
const REGEX_SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');

    const nombreLimpio = nombre.trim();
    const correoLimpio = correo.trim().toLowerCase();

    if (!nombreLimpio || !correoLimpio || !password) {
      setError('Por favor complete todos los campos obligatorios.');
      return;
    }

    if (nombreLimpio.length < 2 || !REGEX_SOLO_LETRAS.test(nombreLimpio)) {
      setError(
        'El nombre completo debe tener al menos 2 caracteres y solo contener letras y espacios, sin números ni símbolos.'
      );
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

    if (password.trim().length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    let usuariosExistentes = [];
    try {
      const raw = JSON.parse(localStorage.getItem('usuarios_registrados') || '[]');
      usuariosExistentes = Array.isArray(raw) ? raw : [];
    } catch {
      usuariosExistentes = [];
    }

    const existe = usuariosExistentes.some(
      (u) => String(u?.correo || '').toLowerCase().trim() === correoLimpio
    );
    if (existe || correoLimpio === 'admin@veterinaria.cl') {
      setError('Este correo electrónico ya se encuentra registrado.');
      return;
    }

    setCargando(true);

    try {
      const esAdmin =
        correoLimpio.includes('admin') || correoLimpio.endsWith('@veterinaria.cl');

      const clientePayload = {
        nombre: nombreLimpio,
        correo: correoLimpio,
        password,
        rol: esAdmin ? 'admin' : 'cliente'
      };

      const resCliente = await api.post('/clientes', clientePayload);
      const clienteGuardado = resCliente?.data || {};
      const clienteIdReal = clienteGuardado.id || Date.now();

      const nuevoUsuario = {
        id: clienteIdReal,
        nombre: nombreLimpio,
        correo: correoLimpio,
        password,
        rol: esAdmin ? 'admin' : 'cliente'
      };

      usuariosExistentes.push(nuevoUsuario);
      localStorage.setItem('usuarios_registrados', JSON.stringify(usuariosExistentes));
      localStorage.setItem('usuario_sesion', JSON.stringify(nuevoUsuario));

      navigate(nuevoUsuario.rol === 'admin' ? '/admin' : '/perfil');
    } catch (err) {
      console.error('Error al guardar en backend:', err);
      setError(
        'No se pudo registrar el cliente en la base de datos. Verifica que el backend esté encendido.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <main>
      <section className="form-container">
        <h2>Crear Cuenta</h2>

        <p
          style={{
            fontSize: '0.825rem',
            color: 'var(--text-muted)',
            marginBottom: '1rem',
            textAlign: 'center'
          }}
        >
          Dominios admitidos: <strong>@veterinaria.cl</strong>,{' '}
          <strong>@gmail.com</strong>, <strong>@duocuc.cl</strong>
        </p>

        <form onSubmit={handleRegistro} noValidate>
          <div className="campo">
            <label htmlFor="nombre">Nombre Completo:</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div className="campo">
            <label htmlFor="correo">Correo Electrónico:</label>
            <input
              type="email"
              id="correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="ejemplo@duocuc.cl"
            />
          </div>

          <div className="campo">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
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
            {cargando ? 'Registrando en BD...' : 'Registrarse'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
            Inicia sesión aquí
          </Link>
        </p>
      </section>
    </main>
  );
}