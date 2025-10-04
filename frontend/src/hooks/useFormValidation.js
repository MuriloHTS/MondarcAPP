import { useState } from "react";

export const useFormValidation = () => {
  const [formErrors, setFormErrors] = useState({
    login: {},
    category: {},
    transaction: {},
    user: {},
  });

  const clearFormErrors = (formType = null) => {
    if (formType) {
      setFormErrors((prev) => ({
        ...prev,
        [formType]: {},
      }));
    } else {
      setFormErrors({
        login: {},
        category: {},
        transaction: {},
        user: {},
      });
    }
  };

  const clearFieldError = (formType, fieldName) => {
    setFormErrors((prev) => {
      if (!prev[formType]) return prev;

      const updatedFormErrors = { ...prev[formType] };
      delete updatedFormErrors[fieldName];

      return {
        ...prev,
        [formType]: updatedFormErrors,
      };
    });
  };

  const validateCategoryForm = (category, mode, selectedMonth) => {
    const errors = {};

    if (!category.name.trim()) {
      errors.name = "Nome da categoria é obrigatório";
    } else if (category.name.length < 2) {
      errors.name = "Nome deve ter pelo menos 2 caracteres";
    }

    if (!category.budget || isNaN(category.budget)) {
      errors.budget = "Orçamento é obrigatório";
    } else if (parseFloat(category.budget) <= 0) {
      errors.budget = "Orçamento deve ser maior que zero";
    } else if (parseFloat(category.budget) > 1000000) {
      errors.budget = "Orçamento não pode exceder R$ 1.000.000";
    }

    if (mode === "monthly" && !selectedMonth) {
      errors.month = "Selecione um mês primeiro";
    }

    return errors;
  };

  const validateTransactionForm = (
    transactionForm,
    mode = "existing",
    pontualCategory = null
  ) => {
    const errors = {};

    if (mode === "existing") {
      if (!transactionForm.categoryId) {
        errors.categoryId = "Categoria é obrigatória";
      }
    } else {
      if (!pontualCategory || !pontualCategory.name.trim()) {
        errors.pontualName = "Nome da categoria é obrigatório";
      } else if (pontualCategory.name.length < 2) {
        errors.pontualName = "Nome deve ter pelo menos 2 caracteres";
      }
    }

    if (!transactionForm.amount || isNaN(transactionForm.amount)) {
      errors.amount = "Valor é obrigatório";
    } else if (parseFloat(transactionForm.amount) <= 0) {
      errors.amount = "Valor deve ser maior que zero";
    } else if (parseFloat(transactionForm.amount) > 10000000) {
      errors.amount = "Valor não pode exceder R$ 10.000.000";
    }

    if (!transactionForm.description.trim()) {
      errors.description = "Descrição é obrigatória";
    } else if (transactionForm.description.length < 3) {
      errors.description = "Descrição deve ter pelo menos 3 caracteres";
    } else if (transactionForm.description.length > 100) {
      errors.description = "Descrição não pode exceder 100 caracteres";
    }

    if (!transactionForm.date) {
      errors.date = "Data é obrigatória";
    } else {
      const selectedDate = new Date(transactionForm.date);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(today.getFullYear() + 1);

      if (selectedDate < oneYearAgo) {
        errors.date = "Data não pode ser anterior a 1 ano";
      } else if (selectedDate > oneYearFromNow) {
        errors.date = "Data não pode ser superior a 1 ano";
      }
    }

    return errors;
  };

  const validateUserForm = (user, existingUsers) => {
    const errors = {};

    if (!user.name.trim()) {
      errors.name = "Nome é obrigatório";
    } else if (user.name.length < 2) {
      errors.name = "Nome deve ter pelo menos 2 caracteres";
    } else if (user.name.length > 50) {
      errors.name = "Nome não pode exceder 50 caracteres";
    }

    if (!user.email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
      errors.email = "Formato de email inválido";
    } else if (existingUsers.find((u) => u.email === user.email)) {
      errors.email = "Este email já está em uso";
    }

    if (!user.password) {
      errors.password = "Senha é obrigatória";
    } else if (user.password.length < 6) {
      errors.password = "Senha deve ter pelo menos 6 caracteres";
    } else if (user.password.length > 20) {
      errors.password = "Senha não pode exceder 20 caracteres";
    } else if (!/(?=.*[a-z])(?=.*[0-9])/.test(user.password)) {
      errors.password = "Senha deve conter pelo menos 1 letra e 1 número";
    }

    return errors;
  };

  return {
    formErrors,
    setFormErrors,
    clearFormErrors,
    clearFieldError,
    validateCategoryForm,
    validateTransactionForm,
    validateUserForm,
  };
};
