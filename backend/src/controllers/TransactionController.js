const { Transaction, Category, User } = require("../models");
const { Op } = require("sequelize");
const logger = require("../utils/logger");

class TransactionController {
  // Listar transações com filtros
  async index(req, res) {
    try {
      const {
        type,
        category_id,
        start_date,
        end_date,
        status,
        page = 1,
        limit = 20,
        order_by = "date",
        order_direction = "DESC",
      } = req.query;

      const where = {};
      const offset = (page - 1) * limit;

      // Filtros baseados no tipo de usuário
      if (req.user.system_mode === "empresa") {
        where.company_id = req.user.company_id;
      } else {
        where.user_id = req.user.id;
      }

      // Filtros opcionais
      if (type) where.type = type;
      if (category_id) where.category_id = category_id;
      if (status) where.status = status;

      // Filtro de datas
      if (start_date || end_date) {
        where.date = {};
        if (start_date) where.date[Op.gte] = start_date;
        if (end_date) where.date[Op.lte] = end_date;
      }

      // Buscar transações com paginação
      const { count, rows: transactions } = await Transaction.findAndCountAll({
        where,
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "type", "color", "icon", "is_punctual"],
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
        ],
        order: [[order_by, order_direction]],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Calcular totais
      const totals = await Transaction.findOne({
        where,
        attributes: [
          [
            Transaction.sequelize.fn(
              "SUM",
              Transaction.sequelize.literal(
                "CASE WHEN type = 'income' THEN amount ELSE 0 END"
              )
            ),
            "totalIncome",
          ],
          [
            Transaction.sequelize.fn(
              "SUM",
              Transaction.sequelize.literal(
                "CASE WHEN type = 'expense' THEN amount ELSE 0 END"
              )
            ),
            "totalExpense",
          ],
        ],
        raw: true,
      });

      return res.json({
        transactions,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
        totals: {
          income: parseFloat(totals.totalIncome) || 0,
          expense: parseFloat(totals.totalExpense) || 0,
          balance:
            (parseFloat(totals.totalIncome) || 0) -
            (parseFloat(totals.totalExpense) || 0),
        },
      });
    } catch (error) {
      logger.error("Erro ao listar transações:", error);
      return res.status(500).json({ error: "Erro ao listar transações" });
    }
  }

  // Buscar transação específica
  async show(req, res) {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findOne({
        where: {
          id,
          ...(req.user.system_mode === "empresa"
            ? { company_id: req.user.company_id }
            : { user_id: req.user.id }),
        },
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "type", "color", "icon", "is_punctual"],
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      if (!transaction) {
        return res.status(404).json({ error: "Transação não encontrada" });
      }

      return res.json(transaction);
    } catch (error) {
      logger.error("Erro ao buscar transação:", error);
      return res.status(500).json({ error: "Erro ao buscar transação" });
    }
  }

  // Criar nova transação
  async store(req, res) {
    try {
      const {
        category_id,
        amount,
        description,
        date,
        type,
        notes,
        tags,
        recurring,
        recurring_config,
        status,
      } = req.body;

      // Verificar se a categoria existe e pertence ao usuário/empresa
      const category = await Category.findOne({
        where: {
          id: category_id,
          ...(req.user.system_mode === "empresa"
            ? { company_id: req.user.company_id }
            : { user_id: req.user.id }),
        },
      });

      if (!category) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      // Verificar se o tipo da transação corresponde ao tipo da categoria
      if (category.type !== type) {
        return res.status(400).json({
          error: `Tipo da transação (${type}) não corresponde ao tipo da categoria (${category.type})`,
        });
      }

      // Verificar permissões para criar transação (empresarial)
      if (req.user.system_mode === "empresa" && req.user.role === "viewer") {
        return res.status(403).json({
          error: "Usuários visualizadores não podem criar transações",
        });
      }

      // Criar transação
      const transactionData = {
        category_id,
        amount,
        description,
        date: date || new Date(),
        type,
        notes,
        tags,
        recurring: recurring || false,
        recurring_config,
        status: status || "completed",
        user_id: req.user.id,
        created_by: req.user.id,
      };

      // Adicionar company_id se for usuário empresarial
      if (req.user.system_mode === "empresa") {
        transactionData.company_id = req.user.company_id;
      }

      const transaction = await Transaction.create(transactionData);

      // Buscar transação com associações
      const transactionWithAssociations = await Transaction.findByPk(
        transaction.id,
        {
          include: [
            {
              model: Category,
              as: "category",
              attributes: [
                "id",
                "name",
                "type",
                "color",
                "icon",
                "is_punctual",
              ],
            },
            {
              model: User,
              as: "creator",
              attributes: ["id", "name", "email"],
            },
          ],
        }
      );

      return res.status(201).json(transactionWithAssociations);
    } catch (error) {
      logger.error("Erro ao criar transação:", error);

      if (error.name === "SequelizeValidationError") {
        const errors = error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        }));
        return res.status(400).json({ error: "Erro de validação", errors });
      }

      return res.status(500).json({ error: "Erro ao criar transação" });
    }
  }

  // Atualizar transação
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        category_id,
        amount,
        description,
        date,
        type,
        notes,
        tags,
        recurring,
        recurring_config,
        status,
      } = req.body;

      // Verificar permissões para editar transação (empresarial)
      if (req.user.system_mode === "empresa" && req.user.role === "viewer") {
        return res.status(403).json({
          error: "Usuários visualizadores não podem editar transações",
        });
      }

      const transaction = await Transaction.findOne({
        where: {
          id,
          ...(req.user.system_mode === "empresa"
            ? { company_id: req.user.company_id }
            : { user_id: req.user.id }),
        },
      });

      if (!transaction) {
        return res.status(404).json({ error: "Transação não encontrada" });
      }

      // Se estiver mudando a categoria, verificar se a nova categoria existe
      if (category_id && category_id !== transaction.category_id) {
        const category = await Category.findOne({
          where: {
            id: category_id,
            ...(req.user.system_mode === "empresa"
              ? { company_id: req.user.company_id }
              : { user_id: req.user.id }),
          },
        });

        if (!category) {
          return res.status(404).json({ error: "Categoria não encontrada" });
        }

        // Verificar se o tipo corresponde
        const newType = type || transaction.type;
        if (category.type !== newType) {
          return res.status(400).json({
            error: `Tipo da transação (${newType}) não corresponde ao tipo da categoria (${category.type})`,
          });
        }
      }

      // Atualizar dados
      const updateData = {};
      if (category_id !== undefined) updateData.category_id = category_id;
      if (amount !== undefined) updateData.amount = amount;
      if (description !== undefined) updateData.description = description;
      if (date !== undefined) updateData.date = date;
      if (type !== undefined) updateData.type = type;
      if (notes !== undefined) updateData.notes = notes;
      if (tags !== undefined) updateData.tags = tags;
      if (recurring !== undefined) updateData.recurring = recurring;
      if (recurring_config !== undefined)
        updateData.recurring_config = recurring_config;
      if (status !== undefined) updateData.status = status;

      await transaction.update(updateData);

      // Buscar transação atualizada com associações
      const updatedTransaction = await Transaction.findByPk(id, {
        include: [
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "type", "color", "icon", "is_punctual"],
          },
          {
            model: User,
            as: "creator",
            attributes: ["id", "name", "email"],
          },
        ],
      });

      return res.json(updatedTransaction);
    } catch (error) {
      logger.error("Erro ao atualizar transação:", error);

      if (error.name === "SequelizeValidationError") {
        const errors = error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        }));
        return res.status(400).json({ error: "Erro de validação", errors });
      }

      return res.status(500).json({ error: "Erro ao atualizar transação" });
    }
  }

  // Deletar transação
  async destroy(req, res) {
    try {
      const { id } = req.params;

      // Verificar permissões para deletar transação (empresarial)
      if (
        req.user.system_mode === "empresa" &&
        !["super", "editor"].includes(req.user.role)
      ) {
        return res.status(403).json({
          error: "Você não tem permissão para deletar transações",
        });
      }

      const transaction = await Transaction.findOne({
        where: {
          id,
          ...(req.user.system_mode === "empresa"
            ? { company_id: req.user.company_id }
            : { user_id: req.user.id }),
        },
      });

      if (!transaction) {
        return res.status(404).json({ error: "Transação não encontrada" });
      }

      await transaction.destroy();

      return res.status(204).send();
    } catch (error) {
      logger.error("Erro ao deletar transação:", error);
      return res.status(500).json({ error: "Erro ao deletar transação" });
    }
  }

  // Buscar resumo por período
  async summary(req, res) {
    try {
      const { start_date, end_date, group_by = "category" } = req.query;

      const where = {};

      // Filtros baseados no tipo de usuário
      if (req.user.system_mode === "empresa") {
        where.company_id = req.user.company_id;
      } else {
        where.user_id = req.user.id;
      }

      // Filtro de datas
      if (start_date || end_date) {
        where.date = {};
        if (start_date) where.date[Op.gte] = start_date;
        if (end_date) where.date[Op.lte] = end_date;
      }

      if (group_by === "category") {
        // Agrupar por categoria
        const summary = await Transaction.findAll({
          where,
          attributes: [
            "category_id",
            "type",
            [
              Transaction.sequelize.fn(
                "SUM",
                Transaction.sequelize.col("Transaction.amount")
              ),
              "total",
            ],
            [
              Transaction.sequelize.fn(
                "COUNT",
                Transaction.sequelize.col("Transaction.id")
              ),
              "count",
            ],
          ],
          include: [
            {
              model: Category,
              as: "category",
              attributes: [
                "id",
                "name",
                "budget",
                "color",
                "icon",
                "is_punctual",
              ],
            },
          ],
          group: [
            "Transaction.category_id",
            "Transaction.type",
            "category.id",
            "category.name",
            "category.budget",
            "category.color",
            "category.icon",
            "category.is_punctual",
          ],
          raw: true,
          nest: true,
        });

        // Formatar resposta
        const formattedSummary = summary.map((item) => ({
          category_id: item.category_id,
          category: item.category,
          type: item.type,
          total: parseFloat(item.total) || 0,
          count: parseInt(item.count) || 0,
          budgetPercentage:
            item.category.budget > 0
              ? ((parseFloat(item.total) || 0) / item.category.budget) * 100
              : 0,
        }));

        return res.json(formattedSummary);
      } else if (group_by === "month") {
        // Agrupar por mês
        const summary = await Transaction.findAll({
          where,
          attributes: [
            [
              Transaction.sequelize.fn(
                "TO_CHAR",
                Transaction.sequelize.col("date"),
                "YYYY-MM"
              ),
              "month",
            ],
            "type",
            [
              Transaction.sequelize.fn(
                "SUM",
                Transaction.sequelize.col("amount")
              ),
              "total",
            ],
            [
              Transaction.sequelize.fn(
                "COUNT",
                Transaction.sequelize.col("id")
              ),
              "count",
            ],
          ],
          group: [
            Transaction.sequelize.fn(
              "TO_CHAR",
              Transaction.sequelize.col("date"),
              "YYYY-MM"
            ),
            "type",
          ],
          order: [
            [
              Transaction.sequelize.fn(
                "TO_CHAR",
                Transaction.sequelize.col("date"),
                "YYYY-MM"
              ),
              "ASC",
            ],
          ],
          raw: true,
        });

        // Formatar resposta agrupando por mês
        const monthlyData = {};
        summary.forEach((item) => {
          if (!monthlyData[item.month]) {
            monthlyData[item.month] = {
              month: item.month,
              income: 0,
              expense: 0,
              transactions: 0,
            };
          }

          if (item.type === "income") {
            monthlyData[item.month].income = parseFloat(item.total) || 0;
          } else {
            monthlyData[item.month].expense = parseFloat(item.total) || 0;
          }
          monthlyData[item.month].transactions += parseInt(item.count) || 0;
        });

        // Calcular balanço para cada mês
        const formattedSummary = Object.values(monthlyData).map((month) => ({
          ...month,
          balance: month.income - month.expense,
        }));

        return res.json(formattedSummary);
      }

      return res.status(400).json({ error: "Tipo de agrupamento inválido" });
    } catch (error) {
      logger.error("Erro ao buscar resumo:", error);
      logger.error("Query details:", { where, group_by });
      return res.status(500).json({
        error: "Erro ao buscar resumo",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
}

module.exports = new TransactionController();
