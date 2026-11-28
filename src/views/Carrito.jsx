import { useState } from 'react';
import { Link } from 'react-router-dom';
import PedidoService from '../services/PedidoService';

const CLAVE_ULTIMA_COMPRA = 'ultima_compra_veterinaria';

const normalizarCantidad = (valor) => {
  const parsed = parseInt(valor, 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return Math.min(99, parsed);
};

export default function Carrito({
  carrito = [],
  actualizarCantidadCarrito,
  eliminarDelCarrito,
  vaciarCarrito,
}) {
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [compraExitosa, setCompraExitosa] = useState(() => {
    try {
      const guardada = localStorage.getItem(CLAVE_ULTIMA_COMPRA);
      return guardada ? JSON.parse(guardada) : null;
    } catch {
      return null;
    }
  });

  let usuario = null;
  try {
    const sesionGuardada = localStorage.getItem('usuario_sesion');
    usuario = sesionGuardada ? JSON.parse(sesionGuardada) : null;
  } catch {
    usuario = null;
  }

  const token = localStorage.getItem('token');

  const totalPagar = carrito.reduce(
    (acc, item) => acc + Number(item.precio || 0) * normalizarCantidad(item.cantidad),
    0
  );

  const totalUnidades = carrito.reduce(
    (acc, item) => acc + normalizarCantidad(item.cantidad),
    0
  );

  const limpiarAgradecimiento = () => {
    localStorage.removeItem(CLAVE_ULTIMA_COMPRA);
    setCompraExitosa(null);
    setMensaje('');
  };

  const handleCambioCantidad = (itemId, rawValor) => {
    setError('');
    const limpia = normalizarCantidad(rawValor);
    actualizarCantidadCarrito(itemId, limpia);
  };

  const handleConfirmarPedido = async () => {
    setMensaje('');
    setError('');

    if (!token || !usuario || !usuario.correo) {
      setError('Debes iniciar sesión con una cuenta válida para confirmar tu pedido.');
      return;
    }

    if (carrito.length === 0) {
      setError('Tu carrito está vacío.');
      return;
    }

    const tieneCantidadInvalida = carrito.some(
      (item) => !item.id || normalizarCantidad(item.cantidad) < 1 || Number(item.precio) <= 0
    );
    if (tieneCantidadInvalida) {
      setError('Verifica que todos los productos tengan una cantidad válida mayor o igual a 1.');
      return;
    }

    const resumenCompra = {
      nombreCliente: usuario.nombre || 'Cliente',
      total: totalPagar,
      unidades: totalUnidades,
      textoGracias: `¡Muchas gracias por tu compra, ${usuario.nombre || 'Cliente'}! En Veterinaria San Marcos agradecemos tu confianza en el cuidado de tu mascota.`,
    };

    setProcesando(true);
    try {
      for (const item of carrito) {
        const cantidadItem = normalizarCantidad(item.cantidad);
        const subtotalItem = Number(item.precio || 0) * cantidadItem;

        const payload = {
          ...(usuario.id ? { cliente: { id: Number(usuario.id) } } : {}),
          correoCliente: usuario.correo,
          producto: { id: Number(item.id) },
          cantidad: cantidadItem,
          total: subtotalItem,
          estado: 'CONFIRMADO',
        };

        await PedidoService.crear(payload);
      }

      localStorage.setItem(CLAVE_ULTIMA_COMPRA, JSON.stringify(resumenCompra));
      vaciarCarrito();
      setCompraExitosa(resumenCompra);
      setMensaje(resumenCompra.textoGracias);
    } catch (err) {
      console.error('Error al confirmar pedido:', err);
      setError(err?.response?.data?.message || err.message || 'No se pudo registrar el pedido en el servidor.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <main>
      <section className="tarjeta-panel">
        <h2 className="titulo-seccion">Resumen de Carrito de Compras</h2>

        {error && (
          <div role="alert" className="alerta-form alerta-error">
            ⚠️ {error}
          </div>
        )}

        {carrito.length === 0 ? (
          compraExitosa ? (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '1.75rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-color)',
              }}
            >
              <h3 style={{ color: 'var(--accent-color)', marginBottom: '0.6rem' }}>
                ¡Gracias por preferir Veterinaria San Marcos!
              </h3>
              <p className="mensaje-exito" style={{ marginTop: 0, marginBottom: '0.75rem' }}>
                {mensaje || compraExitosa.textoGracias}
              </p>
              <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Tu pedido ({compraExitosa.unidades}{' '}
                {compraExitosa.unidades === 1 ? 'producto' : 'productos'}) por un total de{' '}
                <strong style={{ color: 'var(--text-main)' }}>
                  ${Number(compraExitosa.total).toLocaleString('es-CL')} CLP
                </strong>{' '}
                quedó registrado con estado <strong>CONFIRMADO</strong>. ¡Un gran saludo de todo nuestro equipo!
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
                Si necesitas coordinar una consulta veterinaria, comunícate directamente con recepción
                según disponibilidad horaria.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link to="/productos" className="btn" onClick={limpiarAgradecimiento}>
                  Seguir comprando
                </Link>
                <Link
                  to="/mascotas"
                  className="btn"
                  style={{ backgroundColor: '#64748b' }}
                  onClick={limpiarAgradecimiento}
                >
                  Ver mis mascotas
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                No hay productos en el carrito actualmente.
              </p>
              <Link to="/productos" className="btn">
                Ir al Catálogo
              </Link>
            </div>
          )
        ) : (
          <>
            <table className="tabla-adaptable">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio Unitario</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {carrito.map((item) => {
                  const cantActual = normalizarCantidad(item.cantidad);
                  const subtotal = Number(item.precio || 0) * cantActual;
                  return (
                    <tr key={item.id}>
                      <td>{item.nombre}</td>
                      <td>${Number(item.precio || 0).toLocaleString('es-CL')} CLP</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          step="1"
                          value={cantActual}
                          onChange={(e) => handleCambioCantidad(item.id, e.target.value)}
                          style={{ width: '70px' }}
                        />
                      </td>
                      <td>${subtotal.toLocaleString('es-CL')} CLP</td>
                      <td>
                        <button
                          type="button"
                          className="btn-accion btn-accion-eliminar"
                          onClick={() => eliminarDelCarrito(item.id)}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginTop: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn"
                  style={{ backgroundColor: '#64748b' }}
                  onClick={vaciarCarrito}
                  disabled={procesando}
                >
                  Vaciar Carrito
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleConfirmarPedido}
                  disabled={procesando}
                >
                  {procesando ? 'Guardando...' : 'Confirmar Pedido'}
                </button>
              </div>

              <p className="texto-destacado" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                Total a Pagar: ${totalPagar.toLocaleString('es-CL')} CLP
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}