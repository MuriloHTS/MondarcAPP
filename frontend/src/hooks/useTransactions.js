import { useState } from "react";
import transactionService from "../services/transactionService";

export const useTransactions = (showNotification) => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
    pontualName: "",
    pontualType: "expense",
  });

  const loadTransactions = async (filters = {}) => {
    try {
      const data = await transactionService.getAll(filters);
      setTransactions(data.transactions || []);
      return data;
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
      throw error;
    }
  };

  const addTransaction = async (transactionData) => {
    setIsLoading(true);
    try {
      const result = await transactionService.create(transactionData);
      showNotification("Lançamento registrado com sucesso!", "success");
      await loadTransactions();
      return result;
    } catch (error) {
      showNotification(error.message || "Erro ao adicionar transação", "error");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTransaction = async (id, description) => {
    setIsLoading(true);
    try {
      await transactionService.delete(id);
      showNotification(`Transação "${description}" excluída!`, "success");
      await loadTransactions();
    } catch (error) {
      showNotification(error.message || "Erro ao excluir transação", "error");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    transactions,
    setTransactions,
    transactionForm,
    setTransactionForm,
    isLoading,
    loadTransactions,
    addTransaction,
    deleteTransaction,
  };
};
