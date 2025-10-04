const Joi = require("joi");

const transactionValidation = {
  create: {
    body: Joi.object({
      category_id: Joi.string().uuid().required().messages({
        "string.guid": "ID da categoria deve ser um UUID válido",
        "any.required": "Categoria é obrigatória",
      }),
      amount: Joi.number().positive().precision(2).required().messages({
        "number.positive": "Valor deve ser maior que zero",
        "any.required": "Valor é obrigatório",
      }),
      description: Joi.string().min(2).max(255).required().messages({
        "string.min": "Descrição deve ter no mínimo 2 caracteres",
        "string.max": "Descrição deve ter no máximo 255 caracteres",
        "any.required": "Descrição é obrigatória",
      }),
      date: Joi.date().iso().max("now").messages({
        "date.max": "Data não pode ser futura",
        "date.format": "Data deve estar no formato ISO (YYYY-MM-DD)",
      }),
      type: Joi.string().valid("income", "expense").required().messages({
        "any.only": 'Tipo deve ser "income" ou "expense"',
        "any.required": "Tipo é obrigatório",
      }),
      notes: Joi.string().max(1000).allow("", null).messages({
        "string.max": "Notas devem ter no máximo 1000 caracteres",
      }),
      tags: Joi.array().items(Joi.string().max(50)).max(10).messages({
        "array.max": "Máximo de 10 tags permitidas",
        "string.max": "Cada tag deve ter no máximo 50 caracteres",
      }),
      recurring: Joi.boolean().default(false),
      recurring_config: Joi.when("recurring", {
        is: true,
        then: Joi.object({
          frequency: Joi.string()
            .valid("daily", "weekly", "monthly", "yearly")
            .required(),
          interval: Joi.number().integer().positive().default(1),
          end_date: Joi.date().iso().greater("now"),
        }).required(),
        otherwise: Joi.forbidden(),
      }).messages({
        "any.unknown":
          "Configuração de recorrência só pode ser definida quando recurring é true",
      }),
      status: Joi.string()
        .valid("pending", "completed", "cancelled")
        .default("completed")
        .messages({
          "any.only": 'Status deve ser "pending", "completed" ou "cancelled"',
        }),
    }),
  },

  update: {
    body: Joi.object({
      category_id: Joi.string().uuid().messages({
        "string.guid": "ID da categoria deve ser um UUID válido",
      }),
      amount: Joi.number().positive().precision(2).messages({
        "number.positive": "Valor deve ser maior que zero",
      }),
      description: Joi.string().min(2).max(255).messages({
        "string.min": "Descrição deve ter no mínimo 2 caracteres",
        "string.max": "Descrição deve ter no máximo 255 caracteres",
      }),
      date: Joi.date().iso().max("now").messages({
        "date.max": "Data não pode ser futura",
        "date.format": "Data deve estar no formato ISO (YYYY-MM-DD)",
      }),
      type: Joi.string().valid("income", "expense").messages({
        "any.only": 'Tipo deve ser "income" ou "expense"',
      }),
      notes: Joi.string().max(1000).allow("", null).messages({
        "string.max": "Notas devem ter no máximo 1000 caracteres",
      }),
      tags: Joi.array().items(Joi.string().max(50)).max(10).messages({
        "array.max": "Máximo de 10 tags permitidas",
        "string.max": "Cada tag deve ter no máximo 50 caracteres",
      }),
      recurring: Joi.boolean(),
      recurring_config: Joi.when("recurring", {
        is: true,
        then: Joi.object({
          frequency: Joi.string()
            .valid("daily", "weekly", "monthly", "yearly")
            .required(),
          interval: Joi.number().integer().positive().default(1),
          end_date: Joi.date().iso().greater("now"),
        }),
        otherwise: Joi.valid(null),
      }),
      status: Joi.string().valid("pending", "completed", "cancelled").messages({
        "any.only": 'Status deve ser "pending", "completed" ou "cancelled"',
      }),
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
      category_id: Joi.string().uuid().messages({
        "string.guid": "ID da categoria deve ser um UUID válido",
      }),
      start_date: Joi.date().iso().messages({
        "date.format": "Data inicial deve estar no formato ISO (YYYY-MM-DD)",
      }),
      end_date: Joi.date()
        .iso()
        .when("start_date", {
          is: Joi.exist(),
          then: Joi.date().greater(Joi.ref("start_date")),
          otherwise: Joi.date(),
        })
        .messages({
          "date.format": "Data final deve estar no formato ISO (YYYY-MM-DD)",
          "date.greater": "Data final deve ser posterior à data inicial",
        }),
      status: Joi.string().valid("pending", "completed", "cancelled").messages({
        "any.only": 'Status deve ser "pending", "completed" ou "cancelled"',
      }),
      page: Joi.number().integer().positive().default(1).messages({
        "number.positive": "Página deve ser um número positivo",
      }),
      limit: Joi.number().integer().positive().max(100).default(20).messages({
        "number.positive": "Limite deve ser um número positivo",
        "number.max": "Limite máximo é 100",
      }),
      order_by: Joi.string()
        .valid("date", "amount", "description", "created_at")
        .default("date")
        .messages({
          "any.only":
            'Ordenação deve ser por "date", "amount", "description" ou "created_at"',
        }),
      order_direction: Joi.string()
        .valid("ASC", "DESC")
        .default("DESC")
        .messages({
          "any.only": 'Direção deve ser "ASC" ou "DESC"',
        }),
    }),
  },

  summary: {
    query: Joi.object({
      start_date: Joi.date().iso().messages({
        "date.format": "Data inicial deve estar no formato ISO (YYYY-MM-DD)",
      }),
      end_date: Joi.date()
        .iso()
        .when("start_date", {
          is: Joi.exist(),
          then: Joi.date().greater(Joi.ref("start_date")),
          otherwise: Joi.date(),
        })
        .messages({
          "date.format": "Data final deve estar no formato ISO (YYYY-MM-DD)",
          "date.greater": "Data final deve ser posterior à data inicial",
        }),
      group_by: Joi.string()
        .valid("category", "month")
        .default("category")
        .messages({
          "any.only": 'Agrupamento deve ser por "category" ou "month"',
        }),
    }),
  },
};

module.exports = transactionValidation;
