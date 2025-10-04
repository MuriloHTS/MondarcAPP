const jwt = require("jsonwebtoken");
const { User, Company, UserPreference } = require("../models");
const authConfig = require("../config/auth");
const logger = require("../utils/logger");

class AuthController {
  // Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Buscar usuário com empresa e preferências
      const user = await User.findOne({
        where: { email: email.toLowerCase() },
        include: [
          {
            model: Company,
            as: "company",
            attributes: ["id", "name", "cnpj"],
          },
          {
            model: UserPreference,
            as: "preferences",
          },
        ],
      });

      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      // Verificar se usuário está ativo
      if (!user.is_active) {
        return res.status(401).json({ error: "Usuário inativo" });
      }

      // Verificar senha
      const validPassword = await user.checkPassword(password);
      if (!validPassword) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      // Gerar tokens
      const token = jwt.sign({ id: user.id }, authConfig.jwt.secret, {
        expiresIn: authConfig.jwt.expiresIn,
      });

      const refreshToken = jwt.sign(
        { id: user.id },
        authConfig.refreshToken.secret,
        { expiresIn: authConfig.refreshToken.expiresIn }
      );

      // Atualizar último login
      await user.update({ last_login: new Date() });

      // Responder com dados do usuário e tokens
      return res.json({
        user: user.toJSON(),
        token,
        refreshToken,
      });
    } catch (error) {
      logger.error("Erro no login:", error);
      return res.status(500).json({ error: "Erro ao realizar login" });
    }
  }

  // Refresh Token
  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token não fornecido" });
      }

      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, authConfig.refreshToken.secret);

      // Buscar usuário
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
        include: [
          {
            model: Company,
            as: "company",
            attributes: ["id", "name", "cnpj"],
          },
        ],
      });

      if (!user || !user.is_active) {
        return res.status(401).json({ error: "Usuário inválido" });
      }

      // Gerar novo token
      const token = jwt.sign({ id: user.id }, authConfig.jwt.secret, {
        expiresIn: authConfig.jwt.expiresIn,
      });

      return res.json({ token, user: user.toJSON() });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Refresh token expirado" });
      }

      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "Refresh token inválido" });
      }

      logger.error("Erro ao renovar token:", error);
      return res.status(500).json({ error: "Erro ao renovar token" });
    }
  }

  // Obter dados do usuário autenticado
  async me(req, res) {
    try {
      const user = await User.findByPk(req.userId, {
        attributes: { exclude: ["password"] },
        include: [
          {
            model: Company,
            as: "company",
            attributes: ["id", "name", "cnpj", "settings"],
          },
          {
            model: UserPreference,
            as: "preferences",
          },
        ],
      });

      return res.json(user);
    } catch (error) {
      logger.error("Erro ao buscar dados do usuário:", error);
      return res.status(500).json({ error: "Erro ao buscar dados do usuário" });
    }
  }

  // Registro de novo usuário (para modo pessoal)
  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      // Verificar se email já existe
      const existingUser = await User.findOne({
        where: { email: email.toLowerCase() },
      });

      if (existingUser) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // Criar usuário
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        system_mode: "pessoal",
        role: null,
      });

      // Criar preferências padrão
      await UserPreference.create({
        user_id: user.id,
        theme: "light",
        default_view: "detailed",
        show_charts: true,
        notifications: {
          email: true,
          browser: true,
          budget_alerts: true,
        },
      });

      // Gerar tokens
      const token = jwt.sign({ id: user.id }, authConfig.jwt.secret, {
        expiresIn: authConfig.jwt.expiresIn,
      });

      const refreshToken = jwt.sign(
        { id: user.id },
        authConfig.refreshToken.secret,
        { expiresIn: authConfig.refreshToken.expiresIn }
      );

      // Buscar usuário com associações
      const userWithAssociations = await User.findByPk(user.id, {
        attributes: { exclude: ["password"] },
        include: [
          {
            model: UserPreference,
            as: "preferences",
          },
        ],
      });

      return res.status(201).json({
        user: userWithAssociations,
        token,
        refreshToken,
      });
    } catch (error) {
      logger.error("Erro ao registrar usuário:", error);

      if (error.name === "SequelizeValidationError") {
        const errors = error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        }));
        return res.status(400).json({ error: "Erro de validação", errors });
      }

      return res.status(500).json({ error: "Erro ao registrar usuário" });
    }
  }

  // Logout (pode ser usado para invalidar tokens no futuro)
  async logout(req, res) {
    // Em uma implementação completa, você poderia:
    // 1. Adicionar o token a uma blacklist
    // 2. Deletar refresh tokens do banco
    // 3. Registrar o logout

    return res.json({ message: "Logout realizado com sucesso" });
  }

  // Alterar senha
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Buscar usuário com senha
      const user = await User.findByPk(req.userId);

      // Verificar senha atual
      const validPassword = await user.checkPassword(currentPassword);
      if (!validPassword) {
        return res.status(401).json({ error: "Senha atual incorreta" });
      }

      // Atualizar senha
      user.password = newPassword;
      await user.save();

      return res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      logger.error("Erro ao alterar senha:", error);

      if (error.name === "SequelizeValidationError") {
        const errors = error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        }));
        return res.status(400).json({ error: "Erro de validação", errors });
      }

      return res.status(500).json({ error: "Erro ao alterar senha" });
    }
  }
}

module.exports = new AuthController();
