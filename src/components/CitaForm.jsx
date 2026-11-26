import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CitaService from '../services/CitaService';

const sanitizarFechaHora4Digitos = (valor) => {
  if (!valor) return '';
  const [fechaParte, horaParte] = String(valor).split('T');
  const partesFecha = (fechaParte || '').split('-');
  if (partesFecha[0] && partesFecha[0].length > 4) {
    partesFecha[0] = partesFecha[0].slice(0, 4);
  }
  const fechaLimpia = partesFecha.join('-');
  return horaParte !== undefined ? `${fechaLimpia}T${horaParte}` : fechaLimpia;
};

const obtenerMinDatetimeLocal = () => {
  const ahora = new Date();
  const y = ahora.getFullYear();
  const m = String(ahora.getMonth() + 1).padStart(2, '0');
  const d = String(ahora.getDate()).padStart(2, '0');
  const hh = String(ahora.getHours()).padStart(2, '0');
  const mm = String(ahora.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
};

export default function CitaForm() {
  const [fechaHora, setFechaHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [estado, setEstado] = useState('PENDIENTE');
  const [mascotaId, setMascotaId] = useState('');
  const [alerta, setAlerta] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      CitaService.obtenerPorId(id)
        .then((c) => {
          setFechaHora(sanitizarFechaHora4Digitos(c.fechaHora || ''));
          setMotivo(c.motivo || '');
          setEstado(c.estado || 'PENDIENTE');
          if (c.mascota?.id != null) setMascotaId(String(c.mascota.id));
        })
        .catch(() => {
          setAlerta({ tipo: 'error', texto: 'No se pudo cargar la cita solicitada.' });
        });
    }
  }, [id]);

  const guardar = (e) => {
    e.preventDefault();
    setAlerta(null);

    if (!fechaHora) {
      setAlerta({ tipo: 'error', texto: 'Debes seleccionar fecha y hora para la cita.' });
      return;
    }

    const [fechaParte] = fechaHora.split('T');
    const anio = (fechaParte || '').split('-')[0];
    if (!anio || anio.length !== 4) {
      setAlerta({ tipo: 'error', texto: 'El año debe tener exactamente 4 dígitos.' });
      return;
    }

    const fechaObj = new Date(fechaHora);
    if (Number.isNaN(fechaObj.getTime()) || fechaObj.getTime() < Date.now()) {
      setAlerta({ tipo: 'error', texto: 'No puedes agendar una cita en una fecha u hora pasada.' });
      return;
    }

    if (!motivo.trim() || motivo.trim().length < 3) {
      setAlerta({ tipo: 'error', texto: 'Ingresa un motivo de consulta válido (mínimo 3 caracteres).' });
      return;
    }

    if (!mascotaId || Number(mascotaId) < 1) {
      setAlerta({ tipo: 'error', texto: 'Ingresa un ID de mascota válido mayor a 0.' });
      return;
    }

    const payload = {
      fechaHora,
      motivo: motivo.trim(),
      estado,
      mascota: { id: Number(mascotaId) }
    };

    const peticion = id
      ? CitaService.actualizar(id, payload)
      : CitaService.crear(payload);

    peticion
      .then(() => navigate('/citas'))
      .catch(() => setAlerta({ tipo: 'error', texto: 'Error al guardar la cita en el servidor.' }));
  };

  return (
    <main style={{ maxWidth: '640px', margin: '2rem auto' }}>
      <section className="tarjeta-panel">
        <h2>{id ? 'Editar Cita' : 'Nueva Cita'}</h2>

        {alerta && (
          <div
            role="alert"
            className={`alerta-form ${alerta.tipo === 'error' ? 'alerta-error' : 'alerta-exito'}`}
          >
            {alerta.tipo === 'error' ? '⚠️ ' : '✓ '}
            {alerta.texto}
          </div>
        )}

        <form onSubmit={guardar} noValidate style={{ display: 'grid', gap: '0.85rem' }}>
          <input
            type="datetime-local"
            min={obtenerMinDatetimeLocal()}
            max="9999-12-31T23:59"
            value={fechaHora}
            onChange={(e) => setFechaHora(sanitizarFechaHora4Digitos(e.target.value))}
          />
          <input
            type="text"
            placeholder="Motivo de consulta"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="ATENDIDO">ATENDIDO</option>
            <option value="CANCELADO">CANCELADO</option>
          </select>
          <input
            type="number"
            min="1"
            placeholder="ID Mascota (ej: 1)"
            value={mascotaId}
            onChange={(e) => setMascotaId(e.target.value)}
          />
          <button type="submit" className="btn">Guardar</button>
        </form>
      </section>
    </main>
  );
}