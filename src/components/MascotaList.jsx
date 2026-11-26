import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MascotaService from '../services/MascotaService';

export default function MascotaList() {
    const [mascotas, setMascotas] = useState([]);

    useEffect(() => {
        cargarMascotas();
    }, []);

    const cargarMascotas = () => {
        MascotaService.listar()
            .then(datos => setMascotas(datos))
            .catch(err => console.error('Error cargando mascotas:', err));
    };

    const borrarMascota = (id) => {
        MascotaService.eliminar(id)
            .then(() => cargarMascotas())
            .catch(err => console.error('Error borrando mascota:', err));
    };

    return (
        <div>
            <h2>Mascotas Registradas</h2>
            <Link to="/mascotas/nueva">+ Agregar Mascota</Link>
            <table border="1" style={{ width: '100%', marginTop: '15px' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Especie</th>
                        <th>Raza</th>
                        <th>Edad</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {mascotas.map(m => (
                        <tr key={m.id}>
                            <td>{m.id}</td>
                            <td>{m.nombre}</td>
                            <td>{m.especie}</td>
                            <td>{m.raza}</td>
                            <td>{m.edad}</td>
                            <td>
                                <Link to={`/mascotas/editar/${m.id}`}>Editar</Link>
                                {' | '}
                                <button onClick={() => borrarMascota(m.id)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}