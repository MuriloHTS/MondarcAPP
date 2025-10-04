import api from "./api";

const transactionService = {
  // Listar transações com paginação e filtros
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      if (filters.categoryId) params.append("category_id", filters.categoryId);
      if (filters.type) params.append("type", filters.type);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(`/transactions?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Buscar resumo de transações
  async getSummary(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.groupBy) params.append("group_by", filters.groupBy);
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      if (filters.month) params.append("month", filters.month);
      if (filters.year) params.append("year", filters.year);

      const response = await api.get(`/transactions/summary?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Buscar transação por ID
  async getById(id) {
    try {
      const response = await api.get(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Criar transação
  async create(transactionData) {
    try {
      const response = await api.post("/transactions", transactionData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Atualizar transação
  async update(id, transactionData) {
    try {
      const response = await api.put(`/transactions/${id}`, transactionData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Deletar transação
  async delete(id) {
    try {
      await api.delete(`/transactions/${id}`);
      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Tratamento de erros
  handleError(error) {
    if (error.response) {
      const message =
        error.response.data.error || "Erro ao processar transação";
      return new Error(message);
    } else if (error.request) {
      return new Error("Servidor não está respondendo");
    } else {
      return new Error("Erro ao processar requisição");
    }
  },
};

// IMPORTANTE: Adicionar o export default
export default transactionService;
