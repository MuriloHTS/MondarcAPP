const { User, Company, UserPreference } = require("../models");
const logger = require("../utils/logger");

class UserController {
  async index(req, res) {
    try {
      const { role, active } = req.query;
      const where = {};

      // Filtros baseados no contexto
      if (req.user.system_mode === "empresa") {
        where.company_id = req.user.company_id;
      } else {
        // Usuário pessoal não pode listar outros usuários
        return res.status(403).json({ error: "Acesso negado" });
      }

      if (role) where.role = role;
      if (active !== undefined) where.is_active = active === "true";

      const users = await User.findAll({
        where,
        attributes: { exclude: ["password"] },
        include: [
          {
            model: Company,
            as: "company",
            attributes: ["id", "name"],
          },
        ],
        order: [["name", "ASC"]],
      });

      return res.json(users);
    } catch (error) {
      logger.error("Erro ao listar usuários:", error);
      return res.status(500).json({ error: "Erro ao listar usuários" });
    }
  }

  async getPreferences(req, res) {
    try {
      console.log("=== DEBUG: Iniciando getPreferences ===");
      console.log("req.user:", JSON.stringify(req.user, null, 2));

      // Verificar se req.user existe
      if (!req.user) {
        console.log("ERROR: req.user é undefined");
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      if (!req.user.id) {
        console.log("ERROR: req.user.id é undefined");
        return res.status(401).json({ error: "ID do usuário não encontrado" });
      }

      const userId = req.user.id;
      console.log("DEBUG: userId =", userId);

      // Verificar se o modelo UserPreference está disponível
      if (!UserPreference) {
        console.log("ERROR: Modelo UserPreference não está disponível");
        return res
          .status(500)
          .json({ error: "Erro interno: modelo não encontrado" });
      }

      console.log("DEBUG: Tentando buscar preferências...");

      // Tentar buscar preferências com tratamento de erro mais específico
      let preferences;
      try {
        preferences = await UserPreference.findOne({
          where: { user_id: userId },
        });
        console.log(
          "DEBUG: Busca concluída. Preferências encontradas:",
          !!preferences
        );
      } catch (dbError) {
        console.log("ERROR: Erro na consulta ao banco:", dbError.message);
        console.log("Stack trace:", dbError.stack);
        return res.status(500).json({
          error: "Erro ao consultar banco de dados",
          details: dbError.message,
        });
      }

      if (!preferences) {
        console.log("DEBUG: Nenhuma preferência encontrada, retornando padrão");
        const defaultPreferences = {
          theme: "light",
          language: "pt-BR",
          date_format: "DD/MM/YYYY",
          currency_format: "BRL",
          notifications_enabled: true,
          dashboard_config: {
            defaultView: "detailed",
            defaultPeriod: "monthly",
            showAnimations: true,
            autoRefresh: false,
          },
        };
        console.log("DEBUG: Retornando preferências padrão");
        return res.json(defaultPreferences);
      }

      console.log(
        "DEBUG: Preferências encontradas:",
        JSON.stringify(preferences, null, 2)
      );

      // Construir resposta com fallbacks
      const userPreferences = {
        theme: preferences.theme || "light",
        language: preferences.language || "pt-BR",
        date_format: preferences.date_format || "DD/MM/YYYY",
        currency_format: preferences.currency_format || "BRL",
        notifications_enabled: preferences.notifications_enabled !== false,
        dashboard_config: preferences.dashboard_config || {
          defaultView: "detailed",
          defaultPeriod: "monthly",
          showAnimations: true,
          autoRefresh: false,
        },
      };

      console.log(
        "DEBUG: Resposta construída:",
        JSON.stringify(userPreferences, null, 2)
      );
      console.log("=== DEBUG: Finalizando getPreferences com sucesso ===");

      return res.json(userPreferences);
    } catch (error) {
      console.log("=== ERROR: Erro geral no getPreferences ===");
      console.log("Error message:", error.message);
      console.log("Error stack:", error.stack);
      console.log("Error name:", error.name);

      logger.error("Erro ao buscar preferências do usuário:", error);
      return res.status(500).json({
        error: "Erro ao buscar preferências do usuário",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }

  async updatePreferences(req, res) {
    try {
      const userId = req.user.id;
      const preferences = await UserPreference.findOne({
        where: { user_id: userId },
      });

      if (!preferences) {
        // Criar preferências se não existirem
        const newPreferences = await UserPreference.create({
          user_id: userId,
          ...req.body,
        });
        return res.json(newPreferences);
      }

      await preferences.update(req.body);
      return res.json(preferences);
    } catch (error) {
      logger.error("Erro ao atualizar preferências:", error);
      return res.status(500).json({ error: "Erro ao atualizar preferências" });
    }
  }

  async show(req, res) {
    try {
      const { id } = req.params;

      // Verificar se o usuário pode ver este perfil
      if (req.user.role !== "super" && req.user.id !== id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const user = await User.findByPk(id, {
        attributes: { exclude: ["password"] },
        include: [
          {
            model: Company,
            as: "company",
            attributes: ["id", "name"],
          },
          {
            model: UserPreference,
            as: "preferences",
          },
        ],
      });

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Verificar se é da mesma empresa
      if (
        req.user.system_mode === "empresa" &&
        user.company_id !== req.user.company_id
      ) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      return res.json(user);
    } catch (error) {
      logger.error("Erro ao buscar usuário:", error);
      return res.status(500).json({ error: "Erro ao buscar usuário" });
    }
  }

  async store(req, res) {
    try {
      // Apenas super usuários podem criar usuários
      if (req.user.role !== "super") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const { name, email, password, role } = req.body;

      // Verificar se email já existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Criar usuário
      const user = await User.create({
        name,
        email,
        password, // Será hasheado pelo hook
        role,
        company_id: req.user.company_id,
        system_mode: "empresa",
      });

      // Criar preferências padrão
      await UserPreference.create({
        user_id: user.id,
        theme: "light",
        language: "pt-BR",
        notifications_enabled: true,
      });

      // Buscar usuário completo
      const userWithAssociations = await User.findByPk(user.id, {
        attributes: { exclude: ["password"] },
        include: [
          {
            model: Company,
            as: "company",
            attributes: ["id", "name"],
          },
        ],
      });

      return res.status(201).json(userWithAssociations);
    } catch (error) {
      logger.error("Erro ao criar usuário:", error);
      return res.status(500).json({ error: "Erro ao criar usuário" });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, email } = req.body;

      // Verificar permissões
      if (req.user.role !== "super" && req.user.id !== id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Verificar se é da mesma empresa
      if (
        req.user.system_mode === "empresa" &&
        user.company_id !== req.user.company_id
      ) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Verificar se email já existe (se mudou)
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
          return res.status(400).json({ error: "Email já está em uso" });
        }
      }

      // Campos que podem ser atualizados
      const allowedFields = ["name", "email"];
      if (req.user.role === "super") {
        allowedFields.push("role", "is_active");
      }

      const updateData = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      await user.update(updateData);

      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ["password"] },
        include: [
          {
            model: Company,
            as: "company",
            attributes: ["id", "name"],
          },
        ],
      });

      return res.json(updatedUser);
    } catch (error) {
      logger.error("Erro ao atualizar usuário:", error);
      return res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
  }

  async destroy(req, res) {
    try {
      const { id } = req.params;

      // Apenas super usuários podem deletar
      if (req.user.role !== "super") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Não pode deletar a si mesmo
      if (req.user.id === id) {
        return res
          .status(400)
          .json({ error: "Você não pode deletar sua própria conta" });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      // Verificar se é da mesma empresa
      if (user.company_id !== req.user.company_id) {
        return res.status(403).json({ error: "Acesso negado" });
      }

      // Soft delete - apenas desativa
      await user.update({ is_active: false });

      return res.status(204).send();
    } catch (error) {
      logger.error("Erro ao deletar usuário:", error);
      return res.status(500).json({ error: "Erro ao deletar usuário" });
    }
  }
}

module.exports = new UserController();
