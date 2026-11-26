const API_URL = 'http://localhost:8080/api/pedidos';

const PedidoService = {
  listar: async () => {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Error al obtener pedidos');
    return res.json();
  },

  crear: async (pedido) => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido),
    });
    if (!res.ok) {
      const texto = await res.text();
      throw new Error(texto || 'Error al registrar el pedido');
    }
    return res.json();
  },
};

export default PedidoService;