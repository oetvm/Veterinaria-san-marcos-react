import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MascotaService from '../services/MascotaService';

const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

const obtenerEdadMaximaPorEspecie = (especieSeleccionada) => {
  const normalizada = String(especieSeleccionada || '').toLowerCase().trim();
  if (normalizada.includes('exót') || normalizada.includes('exot')) {
    return 80;
  }
  return 25;
};

export default function MascotaForm() {
  const [nombre, setNombre] = useState('');
  const [especie, setEspecie] = useState('');
  const [raza, setRaza] = useState('');
  const [edad, setEdad] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [alerta, setAlerta] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();

  const edadMaxima = obtenerEdadMaximaPorEspecie(especie);

  useEffect(() => {
    if (id) {
      MascotaService.obtenerPorId(id)
        .then((m) => {
          setNombre(m.nombre || '');
          setEspecie(m.especie || '');
          setRaza(m.raza || '');
          setEdad(m.edad ?? '');
          if (m.cliente?.id != null) setClienteId(String(m.cliente.id));
        })
        .catch(() => {
          setAlerta({ tipo: 'error', texto: 'No se pudo cargar la mascota solicitada.' });
        });
    }
  }, [id]);

  const guardar = (e) => {
    e.preventDefault();
    setAlerta(null);

    const maxPermitida = obtenerEdadMaximaPorEspecie(especie);

    if (!nombre.trim() || !regexSoloLetras.test(nombre.trim())) {
      setAlerta({ tipo: 'error', texto: 'El nombre es obligatorio y solo puede contener letras y espacios.' });
      return;
    }
    if (!especie.trim() || !regexSoloLetras.test(especie.trim())) {
      setAlerta({ tipo: 'error', texto: 'La especie es obligatoria y solo puede contener letras.' });
      return;
    }
    if (!raza.trim() || !regexSoloLetras.test(raza.trim())) {
      setAlerta({ tipo: 'error', texto: 'La raza es obligatoria y solo puede contener letras.' });
      return;
    }
    const edadNum = Number(edad);
    if (edad === '' || Number.isNaN(edadNum) || edadNum < 0 || edadNum > maxPermitida) {
      setAlerta({ tipo: 'error', texto: `Ingresa una edad válida entre 0 y ${maxPermitida} años.` });
      return;
    }
    if (!clienteId || Number(clienteId) < 1) {
      setAlerta({ tipo: 'error', texto: 'Ingresa un ID de dueño válido mayor a 0.' });
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      especie: especie.trim(),
      raza: raza.trim(),
      edad: edadNum,
      cliente: { id: Number(clienteId) }
    };

    const peticion = id
      ? MascotaService.actualizar(id, payload)
      : MascotaService.crear(payload);

    peticion
      .then(() => navigate('/mascotas'))
      .catch(() => setAlerta({ tipo: 'error', texto: 'Error al guardar la mascota en el servidor.' }));
  };

  return (
    <main style={{ maxWidth: '640px', margin: '2rem auto' }}>
      <section className="tarjeta-panel">
        <h2>{id ? 'Editar Mascota' : 'Nueva Mascota'}</h2>

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
            type="text"
            placeholder="Nombre (solo letras)"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            type="text"
            placeholder="Especie (Perro/Gato)"
            value={especie}
            onChange={(e) => setEspecie(e.target.value)}
          />
          <input
            type="text"
            placeholder="Raza (solo letras)"
            value={raza}
            onChange={(e) => setRaza(e.target.value)}
          />
          <input
            type="number"
            min="0"
            max={edadMaxima}
            placeholder={`Edad (máx. ${edadMaxima})`}
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
          />
          <input
            type="number"
            min="1"
            placeholder="ID Dueño (ej: 1)"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
          />
          <button type="submit" className="btn">Guardar</button>
        </form>
      </section>
    </main>
  );
}