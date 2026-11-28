import api from './api';

const PedidoService = {
  listar: async () => {
    const res = await api.get('/pedidos');
    return res.data;
  },

  crear: async (pedido) => {
    try {
      const res = await api.post('/pedidos', pedido);
      return res.data;
    } catch (error) {
      const mensajeBackend =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null);
      throw new Error(mensajeBackend || 'Error al registrar el pedido');
    }
  },
};

export default PedidoService;