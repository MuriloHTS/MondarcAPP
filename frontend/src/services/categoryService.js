import api from "./api";

const categoryService = {
  // Listar categorias com filtros
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.month) params.append("month", filters.month);
      if (filters.type) params.append("type", filters.type);
      if (filters.companyId) params.append("company_id", filters.companyId);

      const response = await api.get(`/categories?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Buscar categoria por ID
  async getById(id) {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Criar categoria
  async create(categoryData) {
    try {
      const response = await api.post("/categories", categoryData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Atualizar categoria
  async update(id, categoryData) {
    try {
      const response = await api.put(`/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Deletar categoria
  async delete(id) {
    try {
      await api.delete(`/categories/${id}`);
      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Tratamento de erros
  handleError(error) {
    if (error.response) {
      const message =
        error.response.data.error || "Erro ao processar requisição";
      return new Error(message);
    } else if (error.request) {
      return new Error("Servidor não está respondendo");
    } else {
      return new Error("Erro ao processar requisição");
    }
  },
};

// IMPORTANTE: Adicionar o export default
export default categoryService;
