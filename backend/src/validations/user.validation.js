const Joi = require("joi");

const userValidation = {
  // Validação para criar usuário
  create: {
    body: Joi.object({
      name: Joi.string().min(2).max(100).required().messages({
        "string.min": "Nome deve ter pelo menos 2 caracteres",
        "string.max": "Nome não pode exceder 100 caracteres",
        "any.required": "Nome é obrigatório",
      }),

      email: Joi.string().email().required().messages({
        "string.email": "Email inválido",
        "any.required": "Email é obrigatório",
      }),

      password: Joi.string()
        .min(6)
        .max(20)
        .pattern(/^(?=.*[a-z])(?=.*[0-9])/)
        .required()
        .messages({
          "string.min": "Senha deve ter pelo menos 6 caracteres",
          "string.max": "Senha não pode exceder 20 caracteres",
          "string.pattern.base":
            "Senha deve conter pelo menos 1 letra e 1 número",
          "any.required": "Senha é obrigatória",
        }),

      role: Joi.string()
        .valid("super", "editor", "viewer")
        .required()
        .messages({
          "any.only": "Role deve ser: super, editor ou viewer",
          "any.required": "Role é obrigatório",
        }),
    }),
  },

  // Validação para atualizar usuário
  update: {
    body: Joi.object({
      name: Joi.string().min(2).max(100).messages({
        "string.min": "Nome deve ter pelo menos 2 caracteres",
        "string.max": "Nome não pode exceder 100 caracteres",
      }),

      email: Joi.string().email().messages({
        "string.email": "Email inválido",
      }),

      role: Joi.string().valid("super", "editor", "viewer").messages({
        "any.only": "Role deve ser: super, editor ou viewer",
      }),

      is_active: Joi.boolean(),
    })
      .min(1)
      .messages({
        "object.min": "Pelo menos um campo deve ser fornecido para atualização",
      }),
  },

  updatePreferences: {
    body: Joi.object({
      theme: Joi.string().valid("light", "dark", "auto").messages({
        "any.only": "Tema deve ser: light, dark ou auto",
      }),
      language: Joi.string().valid("pt-BR", "en-US", "es-ES").messages({
        "any.only": "Idioma deve ser: pt-BR, en-US ou es-ES",
      }),
      date_format: Joi.string()
        .valid("DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD")
        .messages({
          "any.only":
            "Formato de data deve ser: DD/MM/YYYY, MM/DD/YYYY ou YYYY-MM-DD",
        }),
      currency_format: Joi.string().valid("BRL", "USD", "EUR").messages({
        "any.only": "Formato de moeda deve ser: BRL, USD ou EUR",
      }),
      notifications_enabled: Joi.boolean(),
      dashboard_config: Joi.object({
        defaultView: Joi.string().valid("detailed", "summary"),
        defaultPeriod: Joi.string().valid("monthly", "semester", "annual"),
        showAnimations: Joi.boolean(),
        autoRefresh: Joi.boolean(),
      }),
    }),
  },
};

module.exports = userValidation;
