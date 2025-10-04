const { Category, Transaction } = require("../models");
const { Op } = require("sequelize");
const logger = require("../utils/logger");

class CategoryController {
  // Listar todas as categorias
  async index(req, res) {
    try {
      const { type, is_punctual, month } = req.query;
      const where = {};

      // Filtros baseados no tipo de usuário
      if (req.user.system_mode === "empresa") {
        where.company_id = req.user.company_id;
      } else {
        where.user_id = req.user.id;
      }

      // Filtros opcionais
      if (type) where.type = type;
      if (is_punctual !== undefined) where.is_punctual = is_punctual === "true";
      if (month) where.month = parseInt(month);

      const categories = await Category.findAll({
        where,
        order: [["name", "ASC"]],
      });

      // Calcular total gasto para cada categoria (mês atual)
      const currentDate = new Date();
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const categoriesWithTotal = await Promise.all(
        categories.map(async (category) => {
          const total = await Transaction.sum("amount", {
            where: {
              category_id: category.id,
              date: {
                [Op.between]: [startOfMonth, endOfMonth],
              },
            },
          });

          return {
            ...category.toJSON(),
            totalSpent: total || 0,
            percentageUsed:
              category.budget > 0 ? ((total || 0) / category.budget) * 100 : 0,
          };
        })
      );

      return res.json(categoriesWithTotal);
    } catch (error) {
      logger.error("Erro ao listar categorias:", error);
      return res.status(500).json({ error: "Erro ao listar categorias" });
    }
  }

  // Buscar uma categoria específica
  async show(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findOne({
        where: {
          id,
          ...(req.user.system_mode === "empresa"
            ? { company_id: req.user.company_id }
            : { user_id: req.user.id }),
        },
      });

      if (!category) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      return res.json(category);
    } catch (error) {
      logger.error("Erro ao buscar categoria:", error);
      return res.status(500).json({ error: "Erro ao buscar categoria" });
    }
  }

  // Criar nova categoria
  async store(req, res) {
    try {
      const {
        name,
        type,
        budget,
        month,
        is_punctual,
        description,
        color,
        icon,
      } = req.body;

      // Validar se já existe categoria com mesmo nome NO MESMO MÊS
      const whereClause = {
        name,
        ...(req.user.system_mode === "empresa"
          ? { company_id: req.user.company_id }
          : { user_id: req.user.id }),
      };
      
      // Se não for pontual, verificar também o mês
      if (!is_punctual && month) {
        whereClause.month = month;
      }

      const existingCategory = await Category.findOne({
        where: whereClause,
      });

      if (existingCategory) {
        return res
          .status(400)
          .json({ error: `Já existe uma categoria "${name}" para ${month ? `o mês ${month}` : 'este período'}` });
      }

      const categoryData = {
        name,
        type,
        budget: budget || 0,
        month: is_punctual ? null : month,
        is_punctual: is_punctual || false,
        description,
        color,
        icon,
      };

      // Adicionar user_id ou company_id baseado no tipo de usuário
      if (req.user.system_mode === "empresa") {
        categoryData.company_id = req.user.company_id;
      } else {
        categoryData.user_id = req.user.id;
      }

      const category = await Category.create(categoryData);

      return res.status(201).json(category);
    } catch (error) {
      logger.error("Erro ao criar categoria:", error);

      if (error.name === "SequelizeValidationError") {
        const errors = error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        }));
        return res.status(400).json({ error: "Erro de validação", errors });
      }

      return res.status(500).json({ error: "Erro ao criar categoria" });
    }
  }

  // Atualizar categoria
  async update(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        type,
        budget,
        month,
        is_punctual,
        description,
        color,
        icon,
        is_active,
      } = req.body;

      const category = await Category.findOne({
        where: {
          id,
          ...(req.user.system_mode === "empresa"
            ? { company_id: req.user.company_id }
            : { user_id: req.user.id }),
        },
      });

      if (!category) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      // Verificar se o novo nome já existe (se estiver mudando o nome)
      if (name && name !== category.name) {
        const existingCategory = await Category.findOne({
          where: {
            name,
            id: { [Op.ne]: id },
            ...(req.user.system_mode === "empresa"
              ? { company_id: req.user.company_id }
              : { user_id: req.user.id }),
          },
        });

        if (existingCategory) {
          return res
            .status(400)
            .json({ error: "Já existe uma categoria com este nome" });
        }
      }

      // Atualizar dados
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (type !== undefined) updateData.type = type;
      if (budget !== undefined) updateData.budget = budget;
      if (is_punctual !== undefined) {
        updateData.is_punctual = is_punctual;
        updateData.month = is_punctual ? null : month || category.month;
      } else if (month !== undefined) {
        updateData.month = month;
      }
      if (description !== undefined) updateData.description = description;
      if (color !== undefined) updateData.color = color;
      if (icon !== undefined) updateData.icon = icon;
      if (is_active !== undefined) updateData.is_active = is_active;

      await category.update(updateData);

      return res.json(category);
    } catch (error) {
      logger.error("Erro ao atualizar categoria:", error);

      if (error.name === "SequelizeValidationError") {
        const errors = error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        }));
        return res.status(400).json({ error: "Erro de validação", errors });
      }

      return res.status(500).json({ error: "Erro ao atualizar categoria" });
    }
  }

  // Deletar categoria
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const category = await Category.findOne({
        where: {
          id,
          ...(req.user.system_mode === "empresa"
            ? { company_id: req.user.company_id }
            : { user_id: req.user.id }),
        },
      });

      if (!category) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }

      // Verificar se existem transações vinculadas
      const transactionCount = await Transaction.count({
        where: { category_id: id },
      });

      if (transactionCount > 0) {
        return res.status(400).json({
          error: "Não é possível excluir categoria com transações vinculadas",
          transactionCount,
        });
      }

      await category.destroy();

      return res.status(204).send();
    } catch (error) {
      logger.error("Erro ao deletar categoria:", error);
      return res.status(500).json({ error: "Erro ao deletar categoria" });
    }
  }
}

module.exports = new CategoryController();
