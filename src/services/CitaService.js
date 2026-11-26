import api from './api';

class CitaService {
  async listar() {
    const res = await api.get('/citas');
    if (res.data && res.data._embedded) {
      return Object.values(res.data._embedded)[0] || [];
    }
    return Array.isArray(res.data) ? res.data : [];
  }

  async obtenerPorId(id) {
    const res = await api.get(`/citas/${id}`);
    return res.data;
  }

  crear(cita) {
    return api.post('/citas', cita);
  }

  actualizar(id, cita) {
    return api.put(`/citas/${id}`, cita);
  }

  eliminar(id) {
    return api.delete(`/citas/${id}`);
  }
}

export default new CitaService();