const { Transaction, Category, User } = require("../models");
const { Op } = require("sequelize");
const logger = require("../utils/logger");
const PDFDocument = require("pdfkit");

class ReportController {
  async summary(req, res) {
    try {
      const { period, month, year } = req.query;
      const where = this.buildWhereClause(req.user, { period, month, year });

      // Buscar totais
      const totals = await Transaction.findAll({
        where,
        attributes: [
          "type",
          [Transaction.sequelize.fn("SUM", Transaction.sequelize.col("amount")), "total"],
          [Transaction.sequelize.fn("COUNT", Transaction.sequelize.col("id")), "count"],
        ],
        group: ["type"],
        raw: true,
      });

      // Buscar por categoria
      const byCategory = await Transaction.findAll({
        where,
        attributes: [
          "category_id",
          "type",
          [Transaction.sequelize.fn("SUM", Transaction.sequelize.col("Transaction.amount")), "total"],
          [Transaction.sequelize.fn("COUNT", Transaction.sequelize.col("Transaction.id")), "count"],
        ],
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "budget", "color", "icon"],
          },
        ],
        group: ["Transaction.category_id", "Transaction.type", "category.id"],
        raw: true,
        nest: true,
      });

      // Formatar resposta
      const income = totals.find((t) => t.type === "income")?.total || 0;
      const expenses = totals.find((t) => t.type === "expense")?.total || 0;

      const categoryTotals = byCategory.map((item) => ({
        category: item.category,
        type: item.type,
        total: parseFloat(item.total),
        count: parseInt(item.count),
        percentage:
          item.category.budget > 0
            ? (parseFloat(item.total) / item.category.budget) * 100
            : 0,
      }));

      // Identificar categorias pontuais
      const pontualCategories = categoryTotals.filter(
        (ct) => ct.category.month === "pontual"
      );
      const plannedCategories = categoryTotals.filter(
        (ct) => ct.category.month !== "pontual"
      );

      return res.json({
        summary: {
          totalIncome: parseFloat(income),
          totalExpenses: parseFloat(expenses),
          balance: parseFloat(income) - parseFloat(expenses),
          transactionCount: totals.reduce(
            (sum, t) => sum + parseInt(t.count),
            0
          ),
        },
        categories: {
          planned: plannedCategories,
          pontual: pontualCategories,
        },
        period: { period, month, year },
      });
    } catch (error) {
      logger.error("Erro ao gerar resumo:", error);
      return res.status(500).json({ error: "Erro ao gerar resumo" });
    }
  }

  async detailed(req, res) {
    try {
      const { start_date, end_date, group_by } = req.query;
      const where = this.buildWhereClause(req.user, { start_date, end_date });

      // Buscar transações com todas as informações
      const transactions = await Transaction.findAll({
        where,
        include: [
          {
            model: Category,
            as: "category",
            attributes: [
              "id",
              "name",
              "type",
              "budget",
              "color",
              "icon",
              "month",
            ],
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [
          ["date", "DESC"],
          ["created_at", "DESC"],
        ],
      });

      // Agrupar se solicitado
      let result = transactions;
      if (group_by === "category") {
        result = this.groupByCategory(transactions);
      } else if (group_by === "month") {
        result = this.groupByMonth(transactions);
      }

      return res.json({
        transactions: result,
        total: transactions.length,
        period: { start_date, end_date },
      });
    } catch (error) {
      logger.error("Erro ao gerar relatório detalhado:", error);
      return res
        .status(500)
        .json({ error: "Erro ao gerar relatório detalhado" });
    }
  }

  async exportPDF(req, res) {
    try {
      const reportData = await this.getReportData(req);

      // Criar documento PDF
      const doc = new PDFDocument({ margin: 50 });

      // Configurar response
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=relatorio_${
          new Date().toISOString().split("T")[0]
        }.pdf`
      );

      // Pipe do documento para response
      doc.pipe(res);

      // Título
      doc.fontSize(20).text("Relatório Financeiro", { align: "center" });
      doc.moveDown();

      // Informações do período
      doc
        .fontSize(12)
        .text(
          `Período: ${reportData.period.start} até ${reportData.period.end}`
        );
      doc.moveDown();

      // Resumo
      doc.fontSize(16).text("Resumo", { underline: true });
      doc.fontSize(12);
      doc.text(
        `Total de Receitas: ${this.formatCurrency(
          reportData.summary.totalIncome
        )}`
      );
      doc.text(
        `Total de Despesas: ${this.formatCurrency(
          reportData.summary.totalExpenses
        )}`
      );
      doc.text(`Saldo: ${this.formatCurrency(reportData.summary.balance)}`);
      doc.moveDown();

      // Categorias
      doc.fontSize(16).text("Por Categoria", { underline: true });
      doc.fontSize(10);

      reportData.categories.forEach((category) => {
        doc.text(
          `${category.name}: ${this.formatCurrency(
            category.total
          )} (${category.percentage.toFixed(1)}%)`
        );
      });

      // Finalizar documento
      doc.end();
    } catch (error) {
      logger.error("Erro ao exportar PDF:", error);
      return res.status(500).json({ error: "Erro ao gerar PDF" });
    }
  }

  async exportCSV(req, res) {
    try {
      const reportData = await this.getReportData(req);

      // Preparar dados para CSV
      const headers = ["Data", "Descrição", "Categoria", "Tipo", "Valor", "Usuário"];
      const rows = [];
      
      // Adicionar header
      rows.push(headers.join(";"));
      
      // Adicionar dados
      reportData.transactions.forEach((transaction) => {
        const row = [
          new Date(transaction.date).toLocaleDateString("pt-BR"),
          transaction.description.replace(/;/g, ","), // Escapar ponto e vírgula
          (transaction.category?.name || "Sem categoria").replace(/;/g, ","),
          transaction.type === "income" ? "Receita" : "Despesa",
          transaction.amount.toFixed(2).replace(".", ","), // Formato brasileiro
          (transaction.creator?.name || "Sistema").replace(/;/g, ",")
        ];
        rows.push(row.join(";"));
      });
      
      const csv = rows.join("\n");

      // Enviar resposta
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=relatorio_${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      res.send("\ufeff" + csv); // BOM para UTF-8
    } catch (error) {
      logger.error("Erro ao exportar CSV:", error);
      return res.status(500).json({ error: "Erro ao gerar CSV" });
    }
  }

  async trends(req, res) {
    try {
      const { period = "6months" } = req.query;
      const months = period === "3months" ? 3 : period === "12months" ? 12 : 6;

      // Calcular range de datas
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const where = this.buildWhereClause(req.user, {
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      });

      // Buscar dados agrupados por mês
      const monthlyData = await Transaction.findAll({
        where,
        attributes: [
          [Transaction.sequelize.fn("DATE_TRUNC", "month", Transaction.sequelize.col("date")), "month"],
          "type",
          [Transaction.sequelize.fn("SUM", Transaction.sequelize.col("amount")), "total"],
          [Transaction.sequelize.fn("COUNT", Transaction.sequelize.col("id")), "count"],
        ],
        group: [
          Transaction.sequelize.fn("DATE_TRUNC", "month", Transaction.sequelize.col("date")),
          "type",
        ],
        order: [
          [Transaction.sequelize.fn("DATE_TRUNC", "month", Transaction.sequelize.col("date")), "ASC"],
        ],
        raw: true,
      });

      // Formatar dados para o frontend
      const trendData = {};
      monthlyData.forEach((item) => {
        const monthKey = new Date(item.month).toISOString().slice(0, 7);
        if (!trendData[monthKey]) {
          trendData[monthKey] = { income: 0, expenses: 0, count: 0 };
        }
        if (item.type === "income") {
          trendData[monthKey].income = parseFloat(item.total);
        } else {
          trendData[monthKey].expenses = parseFloat(item.total);
        }
        trendData[monthKey].count += parseInt(item.count);
      });

      // Calcular tendências
      const values = Object.values(trendData);
      const trend = this.calculateTrend(values);

      return res.json({
        data: trendData,
        trend,
        period: { months, startDate, endDate },
      });
    } catch (error) {
      logger.error("Erro ao calcular tendências:", error);
      return res.status(500).json({ error: "Erro ao calcular tendências" });
    }
  }

  // Métodos auxiliares
  buildWhereClause(user, filters) {
    const where = {};

    // Filtro por empresa/usuário
    if (user.system_mode === "empresa") {
      where.company_id = user.company_id;
    } else {
      where.user_id = user.id;
    }

    // Filtros de data
    if (filters.start_date && filters.end_date) {
      where.date = {
        [Op.between]: [filters.start_date, filters.end_date],
      };
    } else if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0);
      where.date = {
        [Op.between]: [startDate, endDate],
      };
    } else if (filters.period === "monthly" && filters.month) {
      const year = filters.year || new Date().getFullYear();
      const startDate = new Date(year, filters.month - 1, 1);
      const endDate = new Date(year, filters.month, 0);
      where.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    return where;
  }

  async getReportData(req) {
    const where = this.buildWhereClause(req.user, req.query);

    const transactions = await Transaction.findAll({
      where,
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "type", "budget", "month"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "name"],
        },
      ],
      order: [["date", "DESC"]],
    });

    // Calcular resumo
    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
    };

    const categorySummary = {};

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        summary.totalIncome += transaction.amount;
      } else {
        summary.totalExpenses += transaction.amount;
      }

      if (transaction.category) {
        const catId = transaction.category.id;
        if (!categorySummary[catId]) {
          categorySummary[catId] = {
            ...transaction.category.toJSON(),
            total: 0,
            count: 0,
            percentage: 0,
          };
        }
        categorySummary[catId].total += transaction.amount;
        categorySummary[catId].count += 1;
      }
    });

    summary.balance = summary.totalIncome - summary.totalExpenses;

    // Calcular percentuais
    Object.values(categorySummary).forEach((cat) => {
      if (cat.budget > 0) {
        cat.percentage = (cat.total / cat.budget) * 100;
      }
    });

    return {
      transactions,
      summary,
      categories: Object.values(categorySummary),
      period: {
        start: req.query.start_date || "Início",
        end: req.query.end_date || "Fim",
      },
    };
  }

  groupByCategory(transactions) {
    const grouped = {};

    transactions.forEach((transaction) => {
      const catId = transaction.category?.id || "no-category";
      if (!grouped[catId]) {
        grouped[catId] = {
          category: transaction.category || { name: "Sem categoria" },
          transactions: [],
          total: 0,
          count: 0,
        };
      }
      grouped[catId].transactions.push(transaction);
      grouped[catId].total += transaction.amount;
      grouped[catId].count += 1;
    });

    return Object.values(grouped);
  }

  groupByMonth(transactions) {
    const grouped = {};

    transactions.forEach((transaction) => {
      const monthKey = new Date(transaction.date).toISOString().slice(0, 7);
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          month: monthKey,
          transactions: [],
          income: 0,
          expenses: 0,
          count: 0,
        };
      }
      grouped[monthKey].transactions.push(transaction);
      if (transaction.type === "income") {
        grouped[monthKey].income += transaction.amount;
      } else {
        grouped[monthKey].expenses += transaction.amount;
      }
      grouped[monthKey].count += 1;
    });

    return Object.values(grouped).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }

  calculateTrend(values) {
    if (values.length < 2) return { direction: "stable", percentage: 0 };

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const avgFirst =
      firstHalf.reduce((sum, v) => sum + (v.income - v.expenses), 0) /
      firstHalf.length;
    const avgSecond =
      secondHalf.reduce((sum, v) => sum + (v.income - v.expenses), 0) /
      secondHalf.length;

    const change = ((avgSecond - avgFirst) / Math.abs(avgFirst)) * 100;

    return {
      direction: change > 5 ? "up" : change < -5 ? "down" : "stable",
      percentage: Math.abs(change),
      avgFirst,
      avgSecond,
    };
  }

  formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }
}

module.exports = new ReportController();
