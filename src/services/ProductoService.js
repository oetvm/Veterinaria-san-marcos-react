import api from './api';

class ProductoService {
    async listar() {
        const res = await api.get('/productos');
        if (res.data && res.data._embedded) {
            return Object.values(res.data._embedded)[0] || [];
        }
        return Array.isArray(res.data) ? res.data : [];
    }

    crear(producto) {
        return api.post('/productos', producto);
    }

    actualizar(id, producto) {
        return api.put(`/productos/${id}`, producto);
    }

    eliminar(id) {
        return api.delete(`/productos/${id}`);
    }
}

export default new ProductoService();