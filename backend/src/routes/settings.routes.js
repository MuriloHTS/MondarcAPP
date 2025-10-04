const router = require("express").Router();
const SettingsController = require("../controllers/SettingsController");
const authMiddleware = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const Joi = require("joi");

// Todas as rotas de configurações requerem autenticação
router.use(authMiddleware);

// Validações
const companySettingsValidation = {
  body: Joi.object({
    name: Joi.string().min(3).max(100),
    tax_id: Joi.string().max(20),
    address: Joi.string().max(255),
    phone: Joi.string().max(20),
    email: Joi.string().email()
  }).min(1)
};

const notificationSettingsValidation = {
  body: Joi.object({
    email_notifications: Joi.boolean(),
    browser_notifications: Joi.boolean(),
    report_notifications: Joi.boolean(),
    budget_alerts: Joi.boolean()
  })
};

const exportSettingsValidation = {
  body: Joi.object({
    csv_delimiter: Joi.string().valid(';', ',', '\t', '|'),
    csv_encoding: Joi.string().valid('UTF-8', 'ISO-8859-1'),
    pdf_paper_size: Joi.string().valid('A4', 'Letter', 'Legal'),
    pdf_orientation: Joi.string().valid('portrait', 'landscape'),
    include_logo: Joi.boolean(),
    include_summary: Joi.boolean()
  })
};

// Rotas
router.get("/system", SettingsController.getSystemSettings.bind(SettingsController));
router.put("/company", validate(companySettingsValidation), SettingsController.updateCompanySettings.bind(SettingsController));

router.get("/notifications", SettingsController.getNotificationSettings.bind(SettingsController));
router.put("/notifications", validate(notificationSettingsValidation), SettingsController.updateNotificationSettings.bind(SettingsController));

router.get("/export", SettingsController.getExportSettings.bind(SettingsController));
router.put("/export", validate(exportSettingsValidation), SettingsController.updateExportSettings.bind(SettingsController));

router.get("/stats", SettingsController.getSystemStats.bind(SettingsController));

// Rota genérica para compatibilidade com frontend
router.get("/", (req, res) => {
  res.json({
    theme: "light",
    language: "pt-BR",
    currency: "BRL",
    notifications: {
      email: true,
      browser: true,
    },
  });
});

module.exports = router;
