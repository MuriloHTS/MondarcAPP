import React, { useState, useEffect } from "react";
import categoryService from "../services/categoryService";
import { useAuth } from "../contexts/AuthContext";

function CategoryList() {
  const { canEdit, canDelete } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, income, expense

  useEffect(() => {
    loadCategories();
  }, [filter]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const filters = {};
      if (filter !== "all") {
        filters.type = filter;
      }

      const data = await categoryService.getAll(filters);
      setCategories(data);
    } catch (error) {
      setError("Erro ao carregar categorias");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deseja excluir a categoria "${name}"?`)) {
      return;
    }

    try {
      await categoryService.delete(id);
      // Remover da lista local
      setCategories(categories.filter((cat) => cat.id !== id));
    } catch (error) {
      if (error.response?.status === 400) {
        alert("Não é possível excluir categoria com transações vinculadas");
      } else {
        alert("Erro ao excluir categoria");
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getProgressColor = (percentage) => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-400">Carregando categorias...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex gap-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg transition ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter("income")}
          className={`px-4 py-2 rounded-lg transition ${
            filter === "income"
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
          }`}
        >
          Receitas
        </button>
        <button
          onClick={() => setFilter("expense")}
          className={`px-4 py-2 rounded-lg transition ${
            filter === "expense"
              ? "bg-red-600 text-white"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600"
          }`}
        >
          Despesas
        </button>
      </div>

      {/* Lista de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-gray-800 rounded-lg p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {category.type === "income" ? "Receita" : "Despesa"}
                  {category.is_punctual && " • Pontual"}
                </p>
              </div>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color || "#3B82F6" }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Orçamento:</span>
                <span className="text-white">
                  {formatCurrency(category.budget)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Gasto:</span>
                <span className="text-white">
                  {formatCurrency(category.totalSpent)}
                </span>
              </div>
            </div>

            {/* Barra de progresso */}
            {category.budget > 0 && (
              <div className="space-y-1">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getProgressColor(
                      category.percentageUsed
                    )}`}
                    style={{
                      width: `${Math.min(category.percentageUsed, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-right">
                  {category.percentageUsed.toFixed(1)}% utilizado
                </p>
              </div>
            )}

            {/* Ações */}
            {(canEdit() || canDelete()) && (
              <div className="flex gap-2 pt-2">
                {canEdit() && (
                  <button className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition text-sm">
                    Editar
                  </button>
                )}
                {canDelete() && (
                  <button
                    onClick={() => handleDelete(category.id, category.name)}
                    className="flex-1 px-3 py-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition text-sm"
                  >
                    Excluir
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          Nenhuma categoria encontrada
        </div>
      )}
    </div>
  );
}

export default CategoryList;
