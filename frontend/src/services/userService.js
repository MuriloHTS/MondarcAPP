import api from "./api";

const userService = {
  // Listar usuários da empresa
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.role) params.append("role", filters.role);
      if (filters.active !== undefined) params.append("active", filters.active);

      const response = await api.get(`/users?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Buscar usuário por ID
  async getById(id) {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Criar usuário
  async create(userData) {
    try {
      const response = await api.post("/users", userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Atualizar usuário
  async update(id, userData) {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Deletar usuário
  async delete(id) {
    try {
      await api.delete(`/users/${id}`);
      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Atualizar preferências
  async updatePreferences(preferences) {
    try {
      const response = await api.put("/users/preferences", preferences);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Alterar senha
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async getPreferences() {
    try {
      const response = await api.get("/users/preferences");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

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

export default userService;
