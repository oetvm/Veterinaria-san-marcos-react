import { useState, useEffect } from 'react';
import Input from '../components/atoms/Input';
import Button from '../components/atoms/Button';
import ProductoService from '../services/ProductoService';

export default function Admin({ agregarProducto, eliminarProducto, editarProducto, productos = [] }) {
  const [listaProductos, setListaProductos] = useState(productos);
  const [idEditando, setIdEditando] = useState(null);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [especie, setEspecie] = useState('Canino');

  const [modoImagen, setModoImagen] = useState('url');
  const [urlImagen, setUrlImagen] = useState('');
  const [imagenActual, setImagenActual] = useState('');
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [preview, setPreview] = useState('');

  const [alerta, setAlerta] = useState(null);
  const [cargando, setCargando] = useState(false);

  const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

  useEffect(() => {
    cargarProductosDesdeBD();
  }, []);

  const cargarProductosDesdeBD = async () => {
    try {
      const datosBD = await ProductoService.listar();
      setListaProductos(datosBD);
    } catch (error) {
      console.error('Error cargando productos desde MySQL:', error);
      if (productos.length > 0) setListaProductos(productos);
    }
  };

  const handleUrlChange = (e) => {
    const valor = e.target.value.trim();
    setUrlImagen(e.target.value);
    setNombreArchivo('');
    setPreview(valor);
  };

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNombreArchivo(file.name);
      setPreview(URL.createObjectURL(file));
    }
  };

  const cargarProductoParaEditar = (prod) => {
    const imgExistente = prod.imagen || prod.imagenUrl || '';
    const esUrlExterna = imgExistente.startsWith('http://') || imgExistente.startsWith('https://');

    setIdEditando(prod.id);
    setNombre(prod.nombre);
    setPrecio(prod.precio);
    setDescripcion(prod.descripcion || '');
    setEspecie(prod.especie || 'Canino');
    setImagenActual(imgExistente);
    setModoImagen(esUrlExterna ? 'url' : 'archivo');
    setUrlImagen(esUrlExterna ? imgExistente : '');
    setNombreArchivo('');
    setPreview(imgExistente);
    setAlerta(null);
  };

  const cancelarEdicion = () => {
    setIdEditando(null);
    setNombre('');
    setPrecio('');
    setDescripcion('');
    setEspecie('Canino');
    setModoImagen('url');
    setUrlImagen('');
    setImagenActual('');
    setNombreArchivo('');
    setPreview('');
  };

  const resolverRutaImagen = () => {
    if (modoImagen === 'url') {
      const limpia = urlImagen.trim();
      if (limpia) return limpia;
      return imagenActual || '/img/producto1.avif';
    }

    if (nombreArchivo) {
      return `/img/${nombreArchivo}`;
    }

    return imagenActual || '/img/producto1.avif';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlerta(null);

    if (!nombre.trim() || !precio || !descripcion.trim()) {
      setAlerta({ tipo: 'error', texto: 'Complete todos los campos obligatorios.' });
      return;
    }

    if (!regexSoloLetras.test(nombre.trim())) {
      setAlerta({ tipo: 'error', texto: 'El nombre del producto solo debe contener letras y espacios.' });
      return;
    }

    const precioNum = parseFloat(precio);
    if (Number.isNaN(precioNum) || precioNum <= 0) {
      setAlerta({ tipo: 'error', texto: 'Ingrese un precio válido mayor a 0.' });
      return;
    }

    setCargando(true);

    const rutaImagen = resolverRutaImagen();

    const payloadBD = {
      nombre: nombre.trim(),
      precio: precioNum,
      descripcion: descripcion.trim(),
      especie: especie,
      stock: 20,
      imagen: rutaImagen,
      imagenUrl: rutaImagen
    };

    try {
      if (idEditando) {
        const res = await ProductoService.actualizar(idEditando, payloadBD);
        const actualizado = res.data || { id: idEditando, ...payloadBD };

        if (editarProducto) {
          editarProducto({ ...actualizado, id: idEditando, imagen: rutaImagen });
        }

        await cargarProductosDesdeBD();
        cancelarEdicion();
        setAlerta({ tipo: 'exito', texto: '¡Producto actualizado correctamente en la base de datos!' });
      } else {
        const res = await ProductoService.crear(payloadBD);
        const creado = res.data || { id: Date.now(), ...payloadBD };

        if (agregarProducto) {
          agregarProducto({ ...creado, imagen: rutaImagen });
        }

        await cargarProductosDesdeBD();
        cancelarEdicion();
        setAlerta({ tipo: 'exito', texto: '¡Producto registrado con éxito en la base de datos!' });
      }
    } catch (error) {
      console.error('Error guardando producto en MySQL:', error);
      setAlerta({ tipo: 'error', texto: 'No se pudo guardar el producto en el servidor. Revisa la consola.' });
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (id) => {
    setAlerta(null);
    try {
      await ProductoService.eliminar(id);
      if (eliminarProducto) {
        eliminarProducto(id);
      }
      await cargarProductosDesdeBD();
      setAlerta({ tipo: 'exito', texto: '¡Producto eliminado de la base de datos!' });
    } catch (error) {
      console.error('Error eliminando producto en MySQL:', error);
      setAlerta({ tipo: 'error', texto: 'No se pudo eliminar el producto en el servidor.' });
    }
  };

  return (
    <main style={{ maxWidth: '850px', margin: '2rem auto' }}>
      <section className="form-container" style={{ maxWidth: '100%', marginBottom: '2rem' }}>
        <h2>{idEditando ? 'Panel de Control - Modificar Producto' : 'Panel de Control - Registro de Producto'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <Input label="Nombre del Producto" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <Input label="Precio (CLP)" type="number" id="precio" value={precio} onChange={(e) => setPrecio(e.target.value)} />

          <div className="campo">
            <label htmlFor="especie">Especie Destino (Contexto Vet):</label>
            <select id="especie" value={especie} onChange={(e) => setEspecie(e.target.value)}>
              <option value="Canino">Canino (Perros)</option>
              <option value="Felino">Felino (Gatos)</option>
              <option value="Exóticos">Aves / Conejos / Exóticos</option>
              <option value="Uso General">Uso General Clínico</option>
            </select>
          </div>

          <div className="campo">
            <label>Imagen del Producto:</label>

            <div className="imagen-modo-tabs">
              <button
                type="button"
                className={`imagen-modo-btn ${modoImagen === 'url' ? 'activo' : ''}`}
                onClick={() => {
                  setModoImagen('url');
                  setPreview(urlImagen.trim() || imagenActual);
                }}
              >
                Pegar Link / URL
              </button>
              <button
                type="button"
                className={`imagen-modo-btn ${modoImagen === 'archivo' ? 'activo' : ''}`}
                onClick={() => {
                  setModoImagen('archivo');
                  if (!nombreArchivo) setPreview(imagenActual);
                }}
              >
                Seleccionar Archivo
              </button>
            </div>

            {modoImagen === 'url' ? (
              <input
                type="text"
                id="imagenUrl"
                placeholder="https://... o /img/producto3.jpg"
                value={urlImagen}
                onChange={handleUrlChange}
              />
            ) : (
              <div className="file-upload-box">
                <input
                  type="file"
                  id="imagen"
                  accept="image/*"
                  className="file-input-oculto"
                  onChange={handleImagenChange}
                />
                <label htmlFor="imagen" className="file-upload-btn">
                  Seleccionar archivo
                </label>
                <span className="file-upload-nombre">
                  {nombreArchivo || (imagenActual ? `Actual: ${imagenActual}` : 'Sin archivos seleccionados')}
                </span>
              </div>
            )}
          </div>

          {preview && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Imagen actual / Vista previa:
              </p>
              <img
                src={preview}
                alt="Vista previa"
                style={{
                  width: '110px',
                  height: '110px',
                  objectFit: 'contain',
                  backgroundColor: '#ffffff',
                  padding: '6px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/img/logo.png';
                }}
              />
            </div>
          )}

          <Input label="Descripción del Producto" id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />

          {alerta && (
            <div
              role="alert"
              className={`alerta-form ${alerta.tipo === 'error' ? 'alerta-error' : 'alerta-exito'}`}
            >
              {alerta.tipo === 'error' ? '⚠️ ' : '✓ '}
              {alerta.texto}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button type="submit" disabled={cargando}>
              {cargando ? 'Guardando en BD...' : (idEditando ? 'Guardar Cambios' : 'Agregar al Catálogo')}
            </Button>
            {idEditando && (
              <button
                type="button"
                onClick={() => { cancelarEdicion(); setAlerta(null); }}
                className="btn"
                style={{ backgroundColor: '#64748b' }}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="tarjeta-panel">
        <h3 className="titulo-seccion">Gestión e Inventario de Productos</h3>
        <table className="tabla-adaptable">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Especie</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaProductos.map((prod) => (
              <tr key={prod.id}>
                <td>
                  <img
                    src={prod.imagen || prod.imagenUrl || '/img/producto1.avif'}
                    alt={prod.nombre}
                    style={{ width: '45px', height: '45px', objectFit: 'cover', borderRadius: '4px' }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/img/logo.png';
                    }}
                  />
                </td>
                <td style={{ fontWeight: '600' }}>{prod.nombre}</td>
                <td>${Number(prod.precio).toLocaleString()}</td>
                <td>{prod.especie || 'General'}</td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button
                      onClick={() => cargarProductoParaEditar(prod)}
                      style={{ backgroundColor: '#0d828a', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(prod.id)}
                      style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}