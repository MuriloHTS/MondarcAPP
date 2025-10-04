import { useState } from "react";
import categoryService from "../services/categoryService";

export const useCategories = (showNotification) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "expense",
    budget: "",
    month: null,
  });

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
      return data;
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      throw error;
    }
  };

  const addCategory = async (categoryData, planningMode, months) => {
    setIsLoading(true);
    try {
      if (planningMode === "annual") {
        const promises = months.map((month) =>
          categoryService.create({
            ...categoryData,
            budget: parseFloat(categoryData.budget),
            month: month.value,
          })
        );
        await Promise.all(promises);
        showNotification(
          `Categoria "${categoryData.name}" adicionada a todos os meses!`,
          "success"
        );
      } else {
        await categoryService.create({
          ...categoryData,
          budget: parseFloat(categoryData.budget),
        });
        showNotification(
          `Categoria "${categoryData.name}" adicionada!`,
          "success"
        );
      }
      await loadCategories();
      return true;
    } catch (error) {
      showNotification(error.message || "Erro ao adicionar categoria", "error");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCategory = async (id, name) => {
    setIsLoading(true);
    try {
      await categoryService.delete(id);
      showNotification(`Categoria "${name}" excluída com sucesso!`, "success");
      await loadCategories();
    } catch (error) {
      showNotification(error.message || "Erro ao excluir categoria", "error");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMultipleCategories = async (ids, name) => {
    setIsLoading(true);
    try {
      const deletePromises = ids.map(id => categoryService.delete(id));
      await Promise.all(deletePromises);
      showNotification(`Categoria "${name}" excluída de todos os meses!`, "success");
      await loadCategories();
    } catch (error) {
      showNotification(error.message || "Erro ao excluir categorias", "error");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    categories,
    setCategories,
    newCategory,
    setNewCategory,
    isLoading,
    loadCategories,
    addCategory,
    deleteCategory,
    deleteMultipleCategories,
  };
};
