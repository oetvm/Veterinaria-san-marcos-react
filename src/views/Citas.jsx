import { useState, useEffect } from 'react';
import CitaService from '../services/CitaService';
import MascotaService from '../services/MascotaService';

const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

const sanitizarFecha4Digitos = (valor) => {
  if (!valor) return '';
  const partes = String(valor).split('-');
  if (partes[0] && partes[0].length > 4) {
    partes[0] = partes[0].slice(0, 4);
    return partes.join('-');
  }
  return valor;
};

const obtenerFechaHoyLocal = () => {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const esFechaHoraPasada = (fechaStr, horaStr) => {
  if (!fechaStr || !horaStr) return false;
  const partesFecha = fechaStr.split('-');
  if (partesFecha.length !== 3 || partesFecha[0].length !== 4) return true;

  const horaCorta = horaStr.slice(0, 5);
  const objetivo = new Date(`${fechaStr}T${horaCorta}:00`);
  if (Number.isNaN(objetivo.getTime())) return true;

  return objetivo.getTime() < Date.now();
};

export default function Citas() {
  const sesion = JSON.parse(localStorage.getItem('usuario_sesion') || 'null');
  const esAdmin = sesion?.rol === 'admin';

  const [citas, setCitas] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [editCitaId, setEditCitaId] = useState(null);
  const [fechaHoraOriginalEdit, setFechaHoraOriginalEdit] = useState('');
  const [mascotaCitaNombre, setMascotaCitaNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [estadoCita, setEstadoCita] = useState('Pendiente');
  const [alerta, setAlerta] = useState(null);

  const fechaHoy = obtenerFechaHoyLocal();

  const formatearEstado = (estado) => {
    if (!estado) return 'Pendiente';
    const limpio = String(estado).trim().toLowerCase();
    const mapa = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      atendida: 'Atendida',
      atendido: 'Atendida',
      completada: 'Completada',
      cancelada: 'Cancelada'
    };
    if (mapa[limpio]) return mapa[limpio];
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  };

  const perteneceAlUsuario = (c, listaMascotas = mascotas) => {
    if (!sesion) return false;
    if (esAdmin) return true;

    const idItem = c.clienteId ?? c.cliente?.id ?? c.usuarioId ?? null;
    const correoItem = String(
      c.correoCliente ?? c.cliente?.correo ?? c.correo ?? ''
    )
      .toLowerCase()
      .trim();
    const correoSesion = String(sesion.correo || '').toLowerCase().trim();

    if (sesion.id != null && idItem != null && String(idItem) === String(sesion.id)) {
      return true;
    }
    if (correoSesion && correoItem && correoItem === correoSesion) {
      return true;
    }

    const nombreMascotaCita = String(c.nombreMascota || c.mascota?.nombre || '')
      .toLowerCase()
      .trim();
    const mascotasDelCliente = listaMascotas.map((m) =>
      String(m.nombre || '').toLowerCase().trim()
    );
    if (nombreMascotaCita && mascotasDelCliente.includes(nombreMascotaCita)) {
      return true;
    }

    return false;
  };

  const cargarMascotas = async () => {
    try {
      const data = await MascotaService.listar();
      const lista = Array.isArray(data) ? data : [];
      const propias = esAdmin
        ? lista
        : lista.filter((m) => {
            const idItem = m.clienteId ?? m.cliente?.id ?? m.usuarioId ?? null;
            const correoItem = String(m.correoDueno ?? m.correo ?? '')
              .toLowerCase()
              .trim();
            const correoSesion = String(sesion?.correo || '')
              .toLowerCase()
              .trim();

            if (sesion?.id != null && idItem != null && String(idItem) === String(sesion.id)) {
              return true;
            }
            if (correoSesion && correoItem && correoItem === correoSesion) {
              return true;
            }
            return false;
          });
      setMascotas(propias);
      return propias;
    } catch (err) {
      console.error('Error al cargar mascotas para vincular cita:', err);
      return [];
    }
  };

  const cargarCitas = async (listaMascotas = mascotas) => {
    try {
      const data = await CitaService.listar();
      const lista = Array.isArray(data) ? data : [];
      const filtradas = esAdmin
        ? lista
        : lista.filter((c) => perteneceAlUsuario(c, listaMascotas));
      setCitas(filtradas);
    } catch (err) {
      console.error('Error al cargar citas:', err);
    }
  };

  useEffect(() => {
    const iniciar = async () => {
      if (!sesion) return;
      const propias = await cargarMascotas();
      await cargarCitas(propias);
    };
    iniciar();
  }, []);

  const extraerFechaHora = (cita) => {
    if (cita.fechaHora) {
      const [f, h] = String(cita.fechaHora).split('T');
      return {
        fechaTexto: sanitizarFecha4Digitos(cita.fecha || f || ''),
        horaTexto: cita.hora ? String(cita.hora).slice(0, 5) : (h ? h.slice(0, 5) : '')
      };
    }
    return {
      fechaTexto: sanitizarFecha4Digitos(cita.fecha || ''),
      horaTexto: cita.hora ? String(cita.hora).slice(0, 5) : ''
    };
  };

  const validarCita = () => {
    const nombreLimpio = mascotaCitaNombre.trim();
    const motivoLimpio = motivo.trim();

    if (!nombreLimpio) {
      return 'Debes ingresar el nombre de la mascota.';
    }
    if (!regexSoloLetras.test(nombreLimpio)) {
      return 'El nombre de la mascota solo puede contener letras y espacios.';
    }
    if (!fecha) {
      return 'Debes seleccionar una fecha para la cita.';
    }
    const partesAnio = fecha.split('-');
    if (!partesAnio[0] || partesAnio[0].length !== 4) {
      return 'El año de la fecha debe tener exactamente 4 dígitos.';
    }
    if (!hora) {
      return 'Debes seleccionar una hora para la cita.';
    }

    const combinadaActual = `${fecha}T${hora.slice(0, 5)}`;
    const cambioFechaHora = !editCitaId || combinadaActual !== fechaHoraOriginalEdit;

    if (cambioFechaHora && esFechaHoraPasada(fecha, hora)) {
      return 'No puedes agendar ni reprogramar una cita hacia una fecha u hora pasada.';
    }
    if (!motivoLimpio) {
      return 'Debes indicar el motivo de la consulta.';
    }
    if (motivoLimpio.length < 3) {
      return 'El motivo de la consulta debe tener al menos 3 caracteres.';
    }
    return null;
  };

  const handleGuardarCita = async (e) => {
    e.preventDefault();
    setAlerta(null);

    const errorValidacion = validarCita();
    if (errorValidacion) {
      setAlerta({ tipo: 'error', texto: errorValidacion });
      return;
    }

    const horaNormalizada = hora.length === 5 ? `${hora}:00` : hora;
    const fechaHoraIso = `${fecha}T${horaNormalizada}`;

    const mascotaRelacionada = mascotas.find(
      (m) => (m.nombre || '').toLowerCase().trim() === mascotaCitaNombre.trim().toLowerCase()
    );

    const estadoNormalizado = esAdmin
      ? formatearEstado(estadoCita)
      : (editCitaId ? formatearEstado(estadoCita) : 'Pendiente');

    const payload = {
      nombreMascota: mascotaCitaNombre.trim(),
      fecha,
      hora: horaNormalizada,
      fechaHora: fechaHoraIso,
      motivo: motivo.trim(),
      correoCliente: sesion?.correo || '',
      nombreCliente: sesion?.nombre || 'Cliente',
      clienteId: sesion?.id || null,
      cliente: sesion?.id ? { id: sesion.id } : null,
      mascotaId: mascotaRelacionada?.id || null,
      mascota: mascotaRelacionada?.id ? { id: mascotaRelacionada.id } : null,
      estado: estadoNormalizado
    };

    try {
      if (editCitaId) {
        await CitaService.actualizar(editCitaId, payload);
        setAlerta({ tipo: 'exito', texto: 'Cita actualizada correctamente.' });
      } else {
        await CitaService.crear(payload);
        setAlerta({ tipo: 'exito', texto: 'Cita agendada correctamente.' });
      }
      limpiarFormulario();
      const propiasActualizadas = await cargarMascotas();
      await cargarCitas(propiasActualizadas);
    } catch (err) {
      console.error('Error al guardar cita:', err);
      setAlerta({ tipo: 'error', texto: 'Error al guardar la cita en el servidor.' });
    }
  };

  const prepararEditarCita = (c) => {
    if (!esAdmin && !perteneceAlUsuario(c)) return;
    const { fechaTexto, horaTexto } = extraerFechaHora(c);
    setEditCitaId(c.id);
    setFechaHoraOriginalEdit(`${fechaTexto}T${horaTexto}`);
    setMascotaCitaNombre(c.nombreMascota || c.mascota?.nombre || '');
    setFecha(fechaTexto);
    setHora(horaTexto);
    setMotivo(c.motivo || '');
    setEstadoCita(formatearEstado(c.estado));
    setAlerta(null);
  };

  const handleEliminarCita = async (c) => {
    if (!esAdmin && !perteneceAlUsuario(c)) return;
    setAlerta(null);
    try {
      await CitaService.eliminar(c.id);
      setAlerta({ tipo: 'exito', texto: 'Cita eliminada/cancelada.' });
      const propiasActualizadas = await cargarMascotas();
      await cargarCitas(propiasActualizadas);
    } catch (err) {
      console.error('Error al eliminar cita:', err);
      setAlerta({ tipo: 'error', texto: 'Error al eliminar la cita.' });
    }
  };

  const limpiarFormulario = () => {
    setEditCitaId(null);
    setFechaHoraOriginalEdit('');
    setMascotaCitaNombre('');
    setFecha('');
    setHora('');
    setMotivo('');
    setEstadoCita('Pendiente');
  };

  if (!sesion) {
    return (
      <main style={{ maxWidth: '720px', margin: '2rem auto', textAlign: 'center' }}>
        <section className="tarjeta-panel">
          <h2>Sesión no iniciada</h2>
          <p>Inicia sesión para agendar o gestionar citas.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '920px', margin: '2rem auto' }}>
      <section className="tarjeta-panel">
        <h3>{editCitaId ? 'Modificar Cita' : 'Agendar Nueva Cita'}</h3>

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
          onSubmit={handleGuardarCita}
          noValidate
          style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}
        >
          <input
            type="text"
            placeholder="Nombre de la mascota"
            value={mascotaCitaNombre}
            onChange={(e) => setMascotaCitaNombre(e.target.value)}
          />
          <input
            type="date"
            min={fechaHoy}
            max="9999-12-31"
            value={fecha}
            onChange={(e) => setFecha(sanitizarFecha4Digitos(e.target.value))}
          />
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          />
          <input
            type="text"
            placeholder="Motivo de consulta (ej: Control, Vacuna)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />

          {esAdmin && (
            <select value={estadoCita} onChange={(e) => setEstadoCita(e.target.value)}>
              <option value="Pendiente">Pendiente</option>
              <option value="Confirmada">Confirmada</option>
              <option value="Atendida">Atendida</option>
              <option value="Completada">Completada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn">
              {editCitaId ? 'Guardar Cambios' : 'Agendar Cita'}
            </button>
            {editCitaId && (
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

        <h4>{esAdmin ? 'Citas Agendadas' : 'Mis Citas'}</h4>
        <table className="tabla-adaptable">
          <thead>
            <tr>
              <th>Mascota</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {citas.map((c) => {
              const { fechaTexto, horaTexto } = extraerFechaHora(c);
              return (
                <tr key={c.id}>
                  <td>{c.nombreMascota || c.mascota?.nombre || '-'}</td>
                  <td>{fechaTexto || '-'}</td>
                  <td>{horaTexto || '-'}</td>
                  <td>{c.motivo}</td>
                  <td>{formatearEstado(c.estado)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {(esAdmin || perteneceAlUsuario(c)) && (
                      <div className="acciones-tabla">
                        <button
                          type="button"
                          className="btn-accion btn-accion-editar"
                          onClick={() => prepararEditarCita(c)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn-accion btn-accion-eliminar"
                          onClick={() => handleEliminarCita(c)}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}