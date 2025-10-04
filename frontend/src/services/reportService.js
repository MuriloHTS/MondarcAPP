import api from "./api";

const reportService = {
  // Buscar resumo do dashboard
  async getDashboardSummary(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append("period", filters.period);
      if (filters.month) params.append("month", filters.month);
      if (filters.year) params.append("year", filters.year);

      const response = await api.get(`/reports/summary?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Buscar relatório detalhado
  async getDetailedReport(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append("period", filters.period);
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);
      if (filters.groupBy) params.append("group_by", filters.groupBy);

      const response = await api.get(`/reports/detailed?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Exportar relatório em PDF
  async exportPDF(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await api.get(`/reports/export/pdf?${params}`, {
        responseType: "blob",
      });

      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `relatorio_${new Date().toISOString().split("T")[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Exportar relatório em CSV
  async exportCSV(filters = {}) {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await api.get(`/reports/export/csv?${params}`, {
        responseType: "blob",
      });

      // Criar link para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `relatorio_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      return true;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Buscar análise de tendências
  async getTrends(period = "6months") {
    try {
      const response = await api.get(`/reports/trends?period=${period}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Buscar análise de categorias
  async getCategoryAnalysis(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append("period", filters.period);
      if (filters.type) params.append("type", filters.type);

      const response = await api.get(`/reports/categories?${params}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  handleError(error) {
    if (error.response) {
      const message = error.response.data.error || "Erro ao gerar relatório";
      return new Error(message);
    } else if (error.request) {
      return new Error("Servidor não está respondendo");
    } else {
      return new Error("Erro ao processar requisição");
    }
  },
};

export default reportService;
