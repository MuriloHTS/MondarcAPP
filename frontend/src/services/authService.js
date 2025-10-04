import api from "./api";

const authService = {
  async login(email, password) {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { user, token, refreshToken } = response.data;

      // Salvar no localStorage
      localStorage.setItem("@FinanceControl:token", token);
      localStorage.setItem("@FinanceControl:user", JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Erro ao fazer login");
    }
  },

  logout() {
    localStorage.removeItem("@FinanceControl:token");
    localStorage.removeItem("@FinanceControl:user");
  },

  getUser() {
    const userStr = localStorage.getItem("@FinanceControl:user");
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem("@FinanceControl:token");
  },
};

export default authService;
