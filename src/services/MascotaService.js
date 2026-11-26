import api from './api';

class MascotaService {
  async listar() {
    const res = await api.get('/mascotas');
    if (res.data && res.data._embedded) {
      return Object.values(res.data._embedded)[0] || [];
    }
    return Array.isArray(res.data) ? res.data : [];
  }

  async obtenerPorId(id) {
    const res = await api.get(`/mascotas/${id}`);
    return res.data;
  }

  crear(mascota) {
    return api.post('/mascotas', mascota);
  }

  actualizar(id, mascota) {
    return api.put(`/mascotas/${id}`, mascota);
  }

  eliminar(id) {
    return api.delete(`/mascotas/${id}`);
  }
}

export default new MascotaService();