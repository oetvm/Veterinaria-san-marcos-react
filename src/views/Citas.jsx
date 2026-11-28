import { useState, useEffect } from 'react';
import CitaService from '../services/CitaService';
import MascotaService from '../services/MascotaService';

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
  const esAdmin = String(sesion?.rol || '').toLowerCase() === 'admin';

  const [citas, setCitas] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [editCitaId, setEditCitaId] = useState(null);
  const [fechaHoraOriginalEdit, setFechaHoraOriginalEdit] = useState('');
  const [mascotaIdSeleccionada, setMascotaIdSeleccionada] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [estadoCita, setEstadoCita] = useState('Confirmada');
  const [alerta, setAlerta] = useState(null);

  const fechaHoy = obtenerFechaHoyLocal();

  const formatearEstado = (estado) => {
    if (!estado) return 'Confirmada';
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

  const cargarMascotas = async () => {
    try {
      const data = await MascotaService.listar();
      const lista = Array.isArray(data) ? data : [];
      setMascotas(lista);
      if (!mascotaIdSeleccionada && lista.length > 0) {
        setMascotaIdSeleccionada(String(lista[0].id));
      }
      return lista;
    } catch (err) {
      console.error('Error al cargar mascotas para vincular cita:', err);
      return [];
    }
  };

  const cargarCitas = async () => {
    try {
      const data = await CitaService.listar();
      const lista = Array.isArray(data) ? data : [];
      setCitas(lista);
    } catch (err) {
      console.error('Error al cargar citas:', err);
    }
  };

  useEffect(() => {
    const iniciar = async () => {
      if (!sesion || !esAdmin) return;
      await cargarMascotas();
      await cargarCitas();
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
    const motivoLimpio = motivo.trim();

    if (!mascotaIdSeleccionada) {
      return 'Debes seleccionar una mascota registrada para agendar la cita.';
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
      (m) => String(m.id) === String(mascotaIdSeleccionada)
    );

    const payload = {
      nombreMascota: mascotaRelacionada?.nombre || '',
      fecha,
      hora: horaNormalizada,
      fechaHora: fechaHoraIso,
      motivo: motivo.trim(),
      correoCliente: mascotaRelacionada?.correoDueno || mascotaRelacionada?.cliente?.correo || '',
      nombreCliente: mascotaRelacionada?.cliente?.nombre || '',
      mascotaId: Number(mascotaIdSeleccionada),
      mascota: { id: Number(mascotaIdSeleccionada) },
      estado: formatearEstado(estadoCita)
    };

    try {
      if (editCitaId) {
        await CitaService.actualizar(editCitaId, payload);
        setAlerta({ tipo: 'exito', texto: 'Cita actualizada correctamente.' });
      } else {
        await CitaService.crear(payload);
        setAlerta({ tipo: 'exito', texto: 'Cita agendada correctamente según disponibilidad.' });
      }
      limpiarFormulario();
      await cargarMascotas();
      await cargarCitas();
    } catch (err) {
      console.error('Error al guardar cita:', err);
      setAlerta({
        tipo: 'error',
        texto: err?.response?.data?.message || 'Error al guardar la cita en el servidor.'
      });
    }
  };

  const prepararEditarCita = (c) => {
    const { fechaTexto, horaTexto } = extraerFechaHora(c);
    setEditCitaId(c.id);
    setFechaHoraOriginalEdit(`${fechaTexto}T${horaTexto}`);
    setMascotaIdSeleccionada(String(c.mascotaId ?? c.mascota?.id ?? ''));
    setFecha(fechaTexto);
    setHora(horaTexto);
    setMotivo(c.motivo || '');
    setEstadoCita(formatearEstado(c.estado));
    setAlerta(null);
  };

  const handleEliminarCita = async (c) => {
    setAlerta(null);
    try {
      await CitaService.eliminar(c.id);
      setAlerta({ tipo: 'exito', texto: 'Cita eliminada/cancelada.' });
      await cargarMascotas();
      await cargarCitas();
    } catch (err) {
      console.error('Error al eliminar cita:', err);
      setAlerta({ tipo: 'error', texto: 'Error al eliminar la cita.' });
    }
  };

  const limpiarFormulario = () => {
    setEditCitaId(null);
    setFechaHoraOriginalEdit('');
    setMascotaIdSeleccionada(mascotas[0] ? String(mascotas[0].id) : '');
    setFecha('');
    setHora('');
    setMotivo('');
    setEstadoCita('Confirmada');
  };

  if (!sesion || !esAdmin) {
    return (
      <main style={{ maxWidth: '720px', margin: '2rem auto', textAlign: 'center' }}>
        <section className="tarjeta-panel">
          <h2>Acceso restringido a recepción / administración</h2>
          <p>
            El agendamiento de citas se coordina directamente con recepción según la disponibilidad
            de los profesionales de Veterinaria San Marcos.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '920px', margin: '2rem auto' }}>
      <section className="tarjeta-panel">
        <h3>{editCitaId ? 'Modificar Cita (Recepción)' : 'Agendar Cita según Disponibilidad'}</h3>

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
          <select
            value={mascotaIdSeleccionada}
            onChange={(e) => setMascotaIdSeleccionada(e.target.value)}
          >
            <option value="">
              {mascotas.length > 0
                ? 'Selecciona una mascota'
                : 'No hay mascotas registradas'}
            </option>
            {mascotas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} ({m.especie})
              </option>
            ))}
          </select>

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

          <select value={estadoCita} onChange={(e) => setEstadoCita(e.target.value)}>
            <option value="Pendiente">Pendiente</option>
            <option value="Confirmada">Confirmada</option>
            <option value="Atendida">Atendida</option>
            <option value="Completada">Completada</option>
            <option value="Cancelada">Cancelada</option>
          </select>

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

        <h4>Citas Agendadas</h4>
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