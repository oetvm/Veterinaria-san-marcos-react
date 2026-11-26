import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductoService from '../services/ProductoService';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const data = await ProductoService.listar();
        const lista = Array.isArray(data)
          ? data
          : data?._embedded?.productoList || data?.content || [];
        setProductos(lista);
      } catch (err) {
        console.error('Error al cargar productos:', err);
        setError('No se pudieron cargar los productos desde el servidor.');
      } finally {
        setCargando(false);
      }
    };

    cargarProductos();
  }, []);

  return (
    <main>
      <section className="tarjeta-panel">
        <h2 className="titulo-seccion">Catálogo de Productos y Medicamentos</h2>

        {cargando && (
          <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            Cargando productos...
          </p>
        )}

        {error && (
          <p style={{ color: 'var(--error-color)', fontWeight: 600, marginTop: '0.75rem' }}>
            {error}
          </p>
        )}

        {!cargando && !error && productos.length === 0 && (
          <p style={{ color: 'var(--text-muted)', marginTop: '0.75rem' }}>
            No hay productos disponibles en el catálogo en este momento.
          </p>
        )}

        <div className="catalogo-grid">
          {productos.map((prod) => (
            <article key={prod.id} className="tarjeta-producto">
              <img
                src={prod.imagen || '/img/logo.png'}
                alt={prod.nombre}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/img/logo.png';
                }}
              />
              <div>
                <h3>{prod.nombre}</h3>
                {prod.descripcion && <p>{prod.descripcion}</p>}
              </div>
              <div>
                <p className="precio">
                  ${Number(prod.precio || 0).toLocaleString('es-CL')} CLP
                </p>
                <Link to={`/productos/${prod.id}`} className="btn" style={{ width: '100%' }}>
                  Ver Detalle
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}