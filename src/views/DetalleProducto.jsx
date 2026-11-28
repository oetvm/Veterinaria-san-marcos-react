import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductoService from '../services/ProductoService';

export default function DetalleProducto({ productos = [], agregarAlCarrito }) {
  const { id } = useParams();
  const [producto, setProducto] = useState(() =>
    productos.find((p) => String(p.id) === String(id)) || null
  );
  const [cargando, setCargando] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let activo = true;

    const buscarProducto = async () => {
      setCargando(true);
      try {
        const data = await ProductoService.listar();
        const lista = Array.isArray(data)
          ? data
          : data?._embedded?.productoList || data?.content || [];
        const encontradoBD = lista.find((p) => String(p.id) === String(id));

        if (activo) {
          if (encontradoBD) {
            setProducto(encontradoBD);
          } else {
            const encontradoProp = productos.find((p) => String(p.id) === String(id));
            setProducto(encontradoProp || null);
          }
        }
      } catch (err) {
        console.error('Error al cargar detalle del producto:', err);
        if (activo) {
          const encontradoProp = productos.find((p) => String(p.id) === String(id));
          setProducto(encontradoProp || null);
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    buscarProducto();
    return () => {
      activo = false;
    };
  }, [id, productos]);

  if (cargando) {
    return (
      <main style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando detalle del producto...</p>
      </main>
    );
  }

  if (!producto) {
    return (
      <main style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <h2>Producto no encontrado</h2>
        <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>
          El producto que buscas no existe o fue eliminado.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/productos" className="btn">Volver al Catálogo</Link>
          <Link to="/carrito" className="btn" style={{ backgroundColor: '#475569' }}>
            Ir al Carrito
          </Link>
        </div>
      </main>
    );
  }

  const imagenSrc = producto.imagen || producto.imagenUrl || '/img/logo.png';

  const handleAgregar = () => {
    const cantidadValida = Math.max(1, Math.min(99, parseInt(cantidad, 10) || 1));
    setCantidad(cantidadValida);
    agregarAlCarrito(producto, cantidadValida);
    setMensaje(`¡Agregaste ${cantidadValida} unidad(es) al carrito!`);
    setTimeout(() => setMensaje(''), 3000);
  };

  return (
    <main>
      <section className="detalle-container">
        <div className="detalle-imagen-box">
          <img
            src={imagenSrc}
            alt={producto.nombre}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/img/logo.png';
            }}
          />
        </div>

        <div className="detalle-info">
          <h2>{producto.nombre}</h2>
          <p className="especie-tag">Categoría: {producto.especie || 'General'}</p>
          <p className="precio-detalle">${Number(producto.precio || 0).toLocaleString()} CLP</p>
          <p className="descripcion-detalle">{producto.descripcion}</p>

          <div className="acciones-compra">
            <label htmlFor="cantidad">Cantidad:</label>
            <input
              type="number"
              id="cantidad"
              min="1"
              max="99"
              value={cantidad}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setCantidad(Number.isNaN(val) || val < 1 ? 1 : Math.min(99, val));
              }}
            />
            <button type="button" onClick={handleAgregar} className="btn">
              Agregar al Carrito
            </button>
          </div>

          {mensaje && <p className="mensaje-exito">{mensaje}</p>}

          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <Link
              to="/productos"
              style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}
            >
              ← Volver al Catálogo
            </Link>
            <Link
              to="/carrito"
              style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}
            >
              Ir al Carrito →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}