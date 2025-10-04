const Joi = require("joi");

const categoryValidation = {
  create: {
    body: Joi.object({
      name: Joi.string().min(2).max(100).required().messages({
        "string.min": "Nome deve ter no mínimo 2 caracteres",
        "string.max": "Nome deve ter no máximo 100 caracteres",
        "any.required": "Nome é obrigatório",
      }),
      type: Joi.string().valid("income", "expense").required().messages({
        "any.only": 'Tipo deve ser "income" ou "expense"',
        "any.required": "Tipo é obrigatório",
      }),
      budget: Joi.number().min(0).default(0).messages({
        "number.min": "Orçamento não pode ser negativo",
      }),
      month: Joi.number().integer().min(1).max(12).allow(null).messages({
        "number.min": "Mês deve ser entre 1 e 12",
        "number.max": "Mês deve ser entre 1 e 12",
      }),
      is_punctual: Joi.boolean().default(false),
      description: Joi.string().max(500).allow("", null).messages({
        "string.max": "Descrição deve ter no máximo 500 caracteres",
      }),
      color: Joi.string()
        .pattern(/^#[0-9A-F]{6}$/i)
        .allow(null)
        .messages({
          "string.pattern.base":
            "Cor deve estar no formato hexadecimal (#RRGGBB)",
        }),
      icon: Joi.string().max(50).allow(null).messages({
        "string.max": "Ícone deve ter no máximo 50 caracteres",
      }),
    }),
  },

  update: {
    body: Joi.object({
      name: Joi.string().min(2).max(100).messages({
        "string.min": "Nome deve ter no mínimo 2 caracteres",
        "string.max": "Nome deve ter no máximo 100 caracteres",
      }),
      type: Joi.string().valid("income", "expense").messages({
        "any.only": 'Tipo deve ser "income" ou "expense"',
      }),
      budget: Joi.number().min(0).messages({
        "number.min": "Orçamento não pode ser negativo",
      }),
      month: Joi.number().integer().min(1).max(12).allow(null).messages({
        "number.min": "Mês deve ser entre 1 e 12",
        "number.max": "Mês deve ser entre 1 e 12",
      }),
      is_punctual: Joi.boolean(),
      description: Joi.string().max(500).allow("", null).messages({
        "string.max": "Descrição deve ter no máximo 500 caracteres",
      }),
      color: Joi.string()
        .pattern(/^#[0-9A-F]{6}$/i)
        .allow(null)
        .messages({
          "string.pattern.base":
            "Cor deve estar no formato hexadecimal (#RRGGBB)",
        }),
      icon: Joi.string().max(50).allow(null).messages({
        "string.max": "Ícone deve ter no máximo 50 caracteres",
      }),
      is_active: Joi.boolean(),
    })
      .min(1)
      .messages({
        "object.min": "Pelo menos um campo deve ser fornecido para atualização",
      }),
  },

  list: {
    query: Joi.object({
      type: Joi.string().valid("income", "expense").messages({
        "any.only": 'Tipo deve ser "income" ou "expense"',
      }),
      is_punctual: Joi.string().valid("true", "false").messages({
        "any.only": 'is_punctual deve ser "true" ou "false"',
      }),
      month: Joi.number().integer().min(1).max(12).messages({
        "number.min": "Mês deve ser entre 1 e 12",
        "number.max": "Mês deve ser entre 1 e 12",
      }),
    }),
  },
};

module.exports = categoryValidation;
