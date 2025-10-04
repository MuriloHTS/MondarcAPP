const Joi = require("joi");

const authValidation = {
  login: {
    body: Joi.object({
      email: Joi.string().email().required().messages({
        "string.email": "Email deve ser válido",
        "any.required": "Email é obrigatório",
      }),
      password: Joi.string().required().messages({
        "any.required": "Senha é obrigatória",
      }),
    }),
  },

  register: {
    body: Joi.object({
      name: Joi.string().min(2).max(100).required().messages({
        "string.min": "Nome deve ter no mínimo 2 caracteres",
        "string.max": "Nome deve ter no máximo 100 caracteres",
        "any.required": "Nome é obrigatório",
      }),
      email: Joi.string().email().required().messages({
        "string.email": "Email deve ser válido",
        "any.required": "Email é obrigatório",
      }),
      password: Joi.string().min(6).required().messages({
        "string.min": "Senha deve ter no mínimo 6 caracteres",
        "any.required": "Senha é obrigatória",
      }),
    }),
  },

  refresh: {
    body: Joi.object({
      refreshToken: Joi.string().required().messages({
        "any.required": "Refresh token é obrigatório",
      }),
    }),
  },

  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required().messages({
        "any.required": "Senha atual é obrigatória",
      }),
      newPassword: Joi.string().min(6).required().messages({
        "string.min": "Nova senha deve ter no mínimo 6 caracteres",
        "any.required": "Nova senha é obrigatória",
      }),
    }),
  },
};

module.exports = authValidation;
