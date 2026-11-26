import { useState, useEffect } from 'react';
import MascotaService from '../services/MascotaService';

export default function Perfil() {
  const sesion = JSON.parse(localStorage.getItem('usuario_sesion') || 'null');
  const esAdmin = sesion?.rol === 'admin';
  const [cantidadMascotas, setCantidadMascotas] = useState(0);

  useEffect(() => {
    const cargarCantidadMascotas = async () => {
      if (!sesion || esAdmin) return;
      try {
        const data = await MascotaService.listar();
        const propias = data.filter((m) => {
          const idItem = m.clienteId ?? m.cliente?.id ?? m.usuarioId ?? null;
          const correoItem = (m.correoDueno || m.correo || '').toLowerCase().trim();
          const correoSesion = (sesion.correo || '').toLowerCase().trim();
          if (sesion.id != null && idItem != null && String(idItem) === String(sesion.id)) {
            return true;
          }
          if (correoSesion && correoItem && correoItem === correoSesion) {
            return true;
          }
          return false;
        });
        setCantidadMascotas(propias.length);
      } catch (err) {
        console.error('Error al obtener cantidad de mascotas:', err);
      }
    };

    cargarCantidadMascotas();
  }, []);

  if (!sesion) {
    return (
      <main style={{ maxWidth: '720px', margin: '2rem auto', textAlign: 'center' }}>
        <section className="tarjeta-panel">
          <h2>Sesión no iniciada</h2>
          <p>Inicia sesión para ver tu perfil.</p>
        </section>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '820px', margin: '2rem auto' }}>
      <section className="tarjeta-panel">
        <h2>Perfil de {sesion.nombre}</h2>
        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem' }}>
          <p><strong>Nombre:</strong> {sesion.nombre}</p>
          <p><strong>Correo:</strong> {sesion.correo}</p>
          {!esAdmin && (
            <p><strong>Cantidad de mascotas:</strong> {cantidadMascotas}</p>
          )}
          <p><strong>Rol:</strong> {sesion.rol}</p>
        </div>
      </section>
    </main>
  );
}