import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CitaService from '../services/CitaService';

export default function CitaList() {
    const [citas, setCitas] = useState([]);

    useEffect(() => {
        cargarCitas();
    }, []);

    const cargarCitas = () => {
        CitaService.listar()
            .then(datos => setCitas(datos))
            .catch(err => console.error('Error cargando citas:', err));
    };

    const borrarCita = (id) => {
        CitaService.eliminar(id)
            .then(() => cargarCitas())
            .catch(err => console.error('Error borrando cita:', err));
    };

    return (
        <div>
            <h2>Citas Médicas</h2>
            <Link to="/citas/nueva">+ Agendar Cita</Link>
            <table border="1" style={{ width: '100%', marginTop: '15px' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Fecha y Hora</th>
                        <th>Motivo</th>
                        <th>Estado</th>
                        <th>Mascota</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {citas.map(c => (
                        <tr key={c.id}>
                            <td>{c.id}</td>
                            <td>{c.fechaHora}</td>
                            <td>{c.motivo}</td>
                            <td>{c.estado}</td>
                            <td>{c.mascota ? c.mascota.nombre : 'Sin asignar'}</td>
                            <td>
                                <Link to={`/citas/editar/${c.id}`}>Editar</Link>
                                {' | '}
                                <button onClick={() => borrarCita(c.id)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}