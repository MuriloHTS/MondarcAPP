const { User, UserPreference, Company } = require("../models");
const logger = require("../utils/logger");

class SettingsController {
  // Obter configurações do sistema/empresa
  async getSystemSettings(req, res) {
    try {
      if (req.user.system_mode === "empresa") {
        const company = await Company.findByPk(req.user.company_id);
        
        if (!company) {
          return res.status(404).json({ error: "Empresa não encontrada" });
        }

        return res.json({
          company: {
            id: company.id,
            name: company.name,
            tax_id: company.tax_id,
            address: company.address,
            phone: company.phone,
            email: company.email,
            created_at: company.created_at,
          },
          system_mode: "empresa",
          features: {
            multi_user: true,
            role_based_access: true,
            company_management: true,
          }
        });
      } else {
        // Modo pessoal
        return res.json({
          system_mode: "pessoal",
          features: {
            multi_user: false,
            role_based_access: false,
            company_management: false,
          }
        });
      }
    } catch (error) {
      logger.error("Erro ao buscar configurações do sistema:", error);
      return res.status(500).json({ error: "Erro ao buscar configurações" });
    }
  }

  // Atualizar configurações da empresa
  async updateCompanySettings(req, res) {
    try {
      // Apenas super usuários podem atualizar configurações da empresa
      if (req.user.role !== "super") {
        return res.status(403).json({ error: "Acesso negado" });
      }

      if (req.user.system_mode !== "empresa") {
        return res.status(400).json({ error: "Esta funcionalidade é apenas para modo empresa" });
      }

      const company = await Company.findByPk(req.user.company_id);
      
      if (!company) {
        return res.status(404).json({ error: "Empresa não encontrada" });
      }

      // Campos permitidos para atualização
      const allowedFields = ["name", "tax_id", "address", "phone", "email"];
      const updateData = {};
      
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      await company.update(updateData);

      return res.json({
        message: "Configurações da empresa atualizadas com sucesso",
        company: {
          id: company.id,
          name: company.name,
          tax_id: company.tax_id,
          address: company.address,
          phone: company.phone,
          email: company.email,
        }
      });
    } catch (error) {
      logger.error("Erro ao atualizar configurações da empresa:", error);
      return res.status(500).json({ error: "Erro ao atualizar configurações" });
    }
  }

  // Obter configurações de notificações
  async getNotificationSettings(req, res) {
    try {
      const preferences = await UserPreference.findOne({
        where: { user_id: req.user.id }
      });

      if (!preferences) {
        return res.json({
          email_notifications: true,
          browser_notifications: true,
          report_notifications: true,
          budget_alerts: true,
        });
      }

      return res.json({
        email_notifications: preferences.email_notifications !== false,
        browser_notifications: preferences.browser_notifications !== false,
        report_notifications: preferences.report_notifications !== false,
        budget_alerts: preferences.budget_alerts !== false,
      });
    } catch (error) {
      logger.error("Erro ao buscar configurações de notificações:", error);
      return res.status(500).json({ error: "Erro ao buscar configurações" });
    }
  }

  // Atualizar configurações de notificações
  async updateNotificationSettings(req, res) {
    try {
      let preferences = await UserPreference.findOne({
        where: { user_id: req.user.id }
      });

      const notificationData = {
        email_notifications: req.body.email_notifications,
        browser_notifications: req.body.browser_notifications,
        report_notifications: req.body.report_notifications,
        budget_alerts: req.body.budget_alerts,
      };

      if (!preferences) {
        preferences = await UserPreference.create({
          user_id: req.user.id,
          ...notificationData
        });
      } else {
        await preferences.update(notificationData);
      }

      return res.json({
        message: "Configurações de notificações atualizadas",
        ...notificationData
      });
    } catch (error) {
      logger.error("Erro ao atualizar configurações de notificações:", error);
      return res.status(500).json({ error: "Erro ao atualizar configurações" });
    }
  }

  // Obter configurações de exportação
  async getExportSettings(req, res) {
    try {
      const preferences = await UserPreference.findOne({
        where: { user_id: req.user.id }
      });

      const defaultSettings = {
        csv_delimiter: ";",
        csv_encoding: "UTF-8",
        pdf_paper_size: "A4",
        pdf_orientation: "portrait",
        include_logo: false,
        include_summary: true,
      };

      if (!preferences || !preferences.export_settings) {
        return res.json(defaultSettings);
      }

      return res.json({
        ...defaultSettings,
        ...preferences.export_settings
      });
    } catch (error) {
      logger.error("Erro ao buscar configurações de exportação:", error);
      return res.status(500).json({ error: "Erro ao buscar configurações" });
    }
  }

  // Atualizar configurações de exportação
  async updateExportSettings(req, res) {
    try {
      let preferences = await UserPreference.findOne({
        where: { user_id: req.user.id }
      });

      const exportSettings = {
        csv_delimiter: req.body.csv_delimiter || ";",
        csv_encoding: req.body.csv_encoding || "UTF-8",
        pdf_paper_size: req.body.pdf_paper_size || "A4",
        pdf_orientation: req.body.pdf_orientation || "portrait",
        include_logo: req.body.include_logo || false,
        include_summary: req.body.include_summary !== false,
      };

      if (!preferences) {
        preferences = await UserPreference.create({
          user_id: req.user.id,
          export_settings: exportSettings
        });
      } else {
        await preferences.update({
          export_settings: exportSettings
        });
      }

      return res.json({
        message: "Configurações de exportação atualizadas",
        ...exportSettings
      });
    } catch (error) {
      logger.error("Erro ao atualizar configurações de exportação:", error);
      return res.status(500).json({ error: "Erro ao atualizar configurações" });
    }
  }

  // Estatísticas do sistema
  async getSystemStats(req, res) {
    try {
      const stats = {
        users: 0,
        categories: 0,
        transactions: 0,
        last_backup: null,
        system_version: "1.0.0",
      };

      if (req.user.system_mode === "empresa") {
        // Apenas super usuários podem ver estatísticas completas
        if (req.user.role === "super") {
          const userCount = await User.count({
            where: { company_id: req.user.company_id, is_active: true }
          });
          stats.users = userCount;
        }
      }

      return res.json(stats);
    } catch (error) {
      logger.error("Erro ao buscar estatísticas do sistema:", error);
      return res.status(500).json({ error: "Erro ao buscar estatísticas" });
    }
  }
}

module.exports = new SettingsController();
