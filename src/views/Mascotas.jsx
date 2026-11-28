import { useState, useEffect } from 'react';
import MascotaService from '../services/MascotaService';

const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

const obtenerEdadMaximaPorEspecie = (especieSeleccionada) => {
  const normalizada = String(especieSeleccionada || '').toLowerCase().trim();
  if (normalizada.includes('exót') || normalizada.includes('exot')) {
    return 80;
  }
  return 25;
};

export default function Mascotas() {
  const sesion = JSON.parse(localStorage.getItem('usuario_sesion') || 'null');
  const esAdmin = sesion?.rol === 'admin';

  const [mascotas, setMascotas] = useState([]);
  const [editMascotaId, setEditMascotaId] = useState(null);
  const [nombreMascota, setNombreMascota] = useState('');
  const [especie, setEspecie] = useState('Canino');
  const [raza, setRaza] = useState('');
  const [edad, setEdad] = useState('');
  const [alerta, setAlerta] = useState(null);

  const edadMaxima = obtenerEdadMaximaPorEspecie(especie);
  const opcionesEspecie = ['Canino', 'Felino', 'Exótico'];
  const tieneEspecieExtra =
    especie && !opcionesEspecie.some((op) => op.toLowerCase() === especie.toLowerCase());

  useEffect(() => {
    if (sesion) {
      cargarMascotas();
    }
  }, []);

  const perteneceAlUsuario = (m) => {
    if (!sesion) return false;
    if (esAdmin) return true;

    const idItem = m.clienteId ?? m.cliente?.id ?? m.usuarioId ?? null;
    const correoItem = (m.correoDueno || m.cliente?.correo || m.correo || '')
      .toLowerCase()
      .trim();
    const correoSesion = (sesion.correo || '').toLowerCase().trim();

    if (sesion.id != null && idItem != null && String(idItem) === String(sesion.id)) {
      return true;
    }
    if (correoSesion && correoItem && correoItem === correoSesion) {
      return true;
    }
    return false;
  };

  const cargarMascotas = async () => {
    try {
      const data = await MascotaService.listar();
      const lista = Array.isArray(data) ? data : [];
      const filtradas = esAdmin ? lista : lista.filter((m) => perteneceAlUsuario(m));
      setMascotas(filtradas);
    } catch (err) {
      console.error('Error al cargar mascotas:', err);
    }
  };

  const validarMascota = () => {
    const nombreLimpio = nombreMascota.trim();
    const razaLimpia = raza.trim();
    const edadNum = Number(edad);
    const maxPermitida = obtenerEdadMaximaPorEspecie(especie);

    if (!nombreLimpio) {
      return 'Debes ingresar el nombre de la mascota.';
    }
    if (!regexSoloLetras.test(nombreLimpio)) {
      return 'El nombre de la mascota solo debe contener letras y espacios (no números).';
    }
    if (!razaLimpia) {
      return 'Debes ingresar la raza de la mascota.';
    }
    if (!regexSoloLetras.test(razaLimpia)) {
      return 'La raza solo debe contener letras y espacios.';
    }
    if (edad === '' || Number.isNaN(edadNum) || edadNum < 0 || edadNum > maxPermitida) {
      return `Para ${especie}, ingresa una edad válida entre 0 y ${maxPermitida} años.`;
    }
    return null;
  };

  const handleGuardarMascota = async (e) => {
    e.preventDefault();
    setAlerta(null);

    const errorValidacion = validarMascota();
    if (errorValidacion) {
      setAlerta({ tipo: 'error', texto: errorValidacion });
      return;
    }

    const payload = {
      nombre: nombreMascota.trim(),
      especie,
      raza: raza.trim(),
      edad: Number(edad),
      correoDueno: sesion?.correo || ''
    };

    try {
      if (editMascotaId) {
        await MascotaService.actualizar(editMascotaId, payload);
        setAlerta({ tipo: 'exito', texto: 'Mascota actualizada correctamente.' });
      } else {
        await MascotaService.crear(payload);
        setAlerta({ tipo: 'exito', texto: 'Mascota registrada correctamente.' });
      }
      limpiarFormulario();
      await cargarMascotas();
    } catch (err) {
      console.error('Error al guardar mascota:', err);
      setAlerta({
        tipo: 'error',
        texto: err?.response?.data?.message || 'Error al guardar la mascota en el servidor.'
      });
    }
  };

  const prepararEditarMascota = (m) => {
    if (!esAdmin && !perteneceAlUsuario(m)) return;
    setEditMascotaId(m.id);
    setNombreMascota(m.nombre || '');
    setEspecie(m.especie || 'Canino');
    setRaza(m.raza || '');
    setEdad(m.edad ?? '');
    setAlerta(null);
  };

  const handleEliminarMascota = async (m) => {
    if (!esAdmin && !perteneceAlUsuario(m)) return;
    setAlerta(null);
    try {
      await MascotaService.eliminar(m.id);
      setAlerta({ tipo: 'exito', texto: 'Mascota eliminada.' });
      await cargarMascotas();
    } catch (err) {
      console.error('Error al eliminar mascota:', err);
      setAlerta({ tipo: 'error', texto: 'Error al eliminar la mascota.' });
    }
  };

  const limpiarFormulario = () => {
    setEditMascotaId(null);
    setNombreMascota('');
    setEspecie('Canino');
    setRaza('');
    setEdad('');
  };

  if (!sesion) {
    return (
      <main style={{ maxWidth: '720px', margin: '2rem auto', textAlign: 'center' }}>
        <section className="tarjeta-panel">
          <h2>Sesión no iniciada</h2>
          <p>Inicia sesión para gestionar mascotas.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '920px', margin: '2rem auto' }}>
      <section className="tarjeta-panel">
        <h3>{editMascotaId ? 'Editar Mascota' : 'Registrar Mascota'}</h3>

        {alerta && (
          <div
            role="alert"
            className={`alerta-form ${alerta.tipo === 'error' ? 'alerta-error' : 'alerta-exito'}`}
          >
            {alerta.tipo === 'error' ? '⚠️ ' : '✓ '}
            {alerta.texto}
          </div>
        )}

        <form
          onSubmit={handleGuardarMascota}
          noValidate
          style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}
        >
          <input
            type="text"
            placeholder="Nombre de la mascota (solo letras)"
            value={nombreMascota}
            onChange={(e) => setNombreMascota(e.target.value)}
          />
          <select value={especie} onChange={(e) => setEspecie(e.target.value)}>
            {tieneEspecieExtra && <option value={especie}>{especie}</option>}
            <option value="Canino">Canino (Perros)</option>
            <option value="Felino">Felino (Gatos)</option>
            <option value="Exótico">Exótico</option>
          </select>
          <input
            type="text"
            placeholder="Raza (solo letras)"
            value={raza}
            onChange={(e) => setRaza(e.target.value)}
          />
          <input
            type="number"
            placeholder={`Edad (años, máx. ${edadMaxima})`}
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            min="0"
            max={edadMaxima}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn">
              {editMascotaId ? 'Guardar Cambios' : 'Guardar Mascota'}
            </button>
            {editMascotaId && (
              <button
                type="button"
                className="btn"
                style={{ backgroundColor: '#64748b' }}
                onClick={() => {
                  limpiarFormulario();
                  setAlerta(null);
                }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <h4>{esAdmin ? 'Listado de Mascotas' : 'Mis Mascotas'}</h4>
        <table className="tabla-adaptable">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Especie</th>
              <th>Raza</th>
              <th>Edad</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mascotas.map((m) => (
              <tr key={m.id}>
                <td>{m.nombre}</td>
                <td>{m.especie}</td>
                <td>{m.raza}</td>
                <td>{m.edad}</td>
                <td style={{ textAlign: 'center' }}>
                  {(esAdmin || perteneceAlUsuario(m)) && (
                    <div className="acciones-tabla">
                      <button
                        type="button"
                        className="btn-accion btn-accion-editar"
                        onClick={() => prepararEditarMascota(m)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn-accion btn-accion-eliminar"
                        onClick={() => handleEliminarMascota(m)}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}