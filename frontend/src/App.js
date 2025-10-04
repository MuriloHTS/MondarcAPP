import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Eye,
  DollarSign,
  Home,
  PiggyBank,
  Users,
  Lock,
  LogOut,
  User,
  X,
  Settings,
} from "lucide-react";

import { useAuth } from "./hooks/useAuth";
import { useNotifications } from "./hooks/useNotifications";
import { useCategories } from "./hooks/useCategories";
import { useTransactions } from "./hooks/useTransactions";
import { useFormValidation } from "./hooks/useFormValidation";
import { formatCurrencyInput } from "./utils/currencyMask";

// Importações dos services
import api from "./services/api";
import authService from "./services/authService";
import categoryService from "./services/categoryService";
import transactionService from "./services/transactionService";
import userService from "./services/userService";
import reportService from "./services/reportService";

const FinancialControlSystem = () => {
  const [currentScreen, setCurrentScreen] = useState("login");
  const [darkMode, setDarkMode] = useState(false);
  const [users, setUsers] = useState([]);
  const [reportView, setReportView] = useState("detailed");
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [planningMode, setPlanningMode] = useState("monthly");
  const [dataLoaded, setDataLoaded] = useState(false);

  const [transactionMode, setTransactionMode] = useState("existing");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState(""); // 'today', 'week', 'month', 'custom'
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [sortBy, setSortBy] = useState("date"); // 'date', 'amount', 'description', 'category'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc', 'desc'
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv"); // 'csv', 'pdf'

  const [cardAnimations, setCardAnimations] = useState({
    income: false,
    expenses: false,
    balance: false,
    pontual: false,
  });

  const [previousValues, setPreviousValues] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
    pontual: 0,
  });

  //graficos
  const [showCharts, setShowCharts] = useState(true);
  const [chartType, setChartType] = useState("category"); // 'category', 'type', 'monthly'
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [categorySubtype, setCategorySubtype] = useState("expenses");
  const [chartPeriod, setChartPeriod] = useState("current");

  //tendencias
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [trendAnalysis, setTrendAnalysis] = useState(null);
  const [showTrendCharts, setShowTrendCharts] = useState(true);
  const [trendPeriod, setTrendPeriod] = useState("6months"); // '3months', '6months', '12months'

  //timeline
  const [showTimelineChart, setShowTimelineChart] = useState(true);
  const [timelineType, setTimelineType] = useState("monthly"); // 'monthly', 'category_trend'
  const [selectedTimeRange, setSelectedTimeRange] = useState(6); // últimos 6 meses

  //detalhes
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [chartFilters, setChartFilters] = useState({
    minAmount: "",
    maxAmount: "",
    selectedCategories: [],
  });
  const [animateCharts, setAnimateCharts] = useState(true);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  //configs
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [userSettings, setUserSettings] = useState({
    displayName: "",
    email: "",
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
    dateFormat: "DD/MM/YYYY",
    currencyFormat: "BRL",
    notifications: {
      email: true,
      browser: true,
      reports: true,
      alerts: false,
    },
    dashboard: {
      defaultView: "detailed",
      defaultPeriod: "monthly",
      autoRefresh: false,
      showAnimations: true,
    },
  });
  const [tempSettings, setTempSettings] = useState({});
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // User management states
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer",
  });

  //ui geral
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showSystemPrefs, setShowSystemPrefs] = useState(false);

  //preferencias
  const [systemPreferences, setSystemPreferences] = useState({
    // Preferências de exibição
    defaultReportPeriod: "monthly",
    defaultReportView: "detailed",
    defaultChartType: "category",
    showChartsOnLoad: true,

    // Preferências de formato
    dateFormat: "dd/mm/yyyy",
    currencyFormat: "BRL",
    numberFormat: "pt-BR",

    // Preferências de comportamento
    autoSaveDelay: 2,
    showNotifications: true,
    requireConfirmation: true,

    // Preferências de performance
    itemsPerPage: 10,
    cacheReports: true,
  });

  //login generico
  const [isLoading, setIsLoading] = useState({
    login: false,
    addCategory: false,
    addTransaction: false,
    addUser: false,
    deleteCategory: false,
    deleteTransaction: false,
    deleteUser: false,
  });

  //hook notificação
  const { notifications, showNotification, removeNotification } =
    useNotifications(systemPreferences);

  //hook autenticação
  const {
    currentUser,
    setCurrentUser,
    loginForm,
    setLoginForm,
    isLoading: authLoading,
    handleLogin: performLogin,
    handleLogout: performLogout,
  } = useAuth();

  //hook categorias
  const {
    categories,
    setCategories,
    newCategory,
    setNewCategory,
    isLoading: categoryLoading,
    loadCategories,
    addCategory: performAddCategory,
    deleteCategory: performDeleteCategory,
    deleteMultipleCategories,
  } = useCategories(showNotification);

  //hook transações
  const {
    transactions,
    setTransactions,
    transactionForm,
    setTransactionForm,
    isLoading: transactionLoading,
    loadTransactions,
    addTransaction: performAddTransaction,
    deleteTransaction: performDeleteTransaction,
  } = useTransactions(showNotification);

  //hook validação
  const {
    formErrors,
    setFormErrors,
    clearFormErrors,
    clearFieldError,
    validateCategoryForm,
    validateTransactionForm,
    validateUserForm,
  } = useFormValidation();

  useEffect(() => {
    setIsLoading({
      login: authLoading,
      addCategory: categoryLoading,
      addTransaction: transactionLoading,
      addUser: false, // ainda não extraído
      deleteCategory: categoryLoading,
      deleteTransaction: transactionLoading,
      deleteUser: false, // ainda não extraído
    });
  }, [authLoading, categoryLoading, transactionLoading]);

  // User roles
  const USER_ROLES = {
    super: {
      name: "Super Usuário",
      permissions: ["planning", "transactions", "reports", "user_management"],
      color: "red",
    },
    editor: {
      name: "Editor",
      permissions: ["planning", "transactions", "reports"],
      color: "blue",
    },
    viewer: {
      name: "Visualizador",
      permissions: ["reports"],
      color: "green",
    },
  };

  const months = [
    { value: 1, name: "Janeiro" },
    { value: 2, name: "Fevereiro" },
    { value: 3, name: "Março" },
    { value: 4, name: "Abril" },
    { value: 5, name: "Maio" },
    { value: 6, name: "Junho" },
    { value: 7, name: "Julho" },
    { value: 8, name: "Agosto" },
    { value: 9, name: "Setembro" },
    { value: 10, name: "Outubro" },
    { value: 11, name: "Novembro" },
    { value: 12, name: "Dezembro" },
  ];

  // Função para carregar dados da API
  const loadDataFromAPI = async () => {
    try {
      // Usar as funções dos hooks
      await loadCategories();
      await loadTransactions({ limit: systemPreferences.itemsPerPage || 25 });

      // Se for modo empresa, buscar usuários (ainda não extraído)
      if (
        currentUser &&
        currentUser.system_mode === "empresa" &&
        currentUser.role === "super"
      ) {
        const usersData = await userService.getAll();
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      showNotification("Erro ao carregar dados", "error");
    }
  };

  useEffect(() => {
    if (currentUser && !dataLoaded) {
      loadDataFromAPI();
      setDataLoaded(true);
    }
  }, [currentUser, dataLoaded]);

  // injetar CSS:
  useEffect(() => {
    // Adicionar CSS para animações
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .animate-slide-in {
        animation: slide-in 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add sample data on component mount
  useEffect(() => {
    // Sample users
    const sampleUsers = [
      {
        id: 1,
        name: "Admin Master",
        email: "admin@empresa.com",
        password: "123456",
        role: "super",
      },
      {
        id: 2,
        name: "João Editor",
        email: "joao@empresa.com",
        password: "123456",
        role: "editor",
      },
      {
        id: 3,
        name: "Maria Contadora",
        email: "maria@empresa.com",
        password: "123456",
        role: "viewer",
      },
    ];

    const sampleCategories = [
      { id: 1, name: "Salários", type: "expense", budget: 15000, month: 1 },
      { id: 2, name: "Marketing", type: "expense", budget: 3000, month: 1 },
      { id: 3, name: "Vendas", type: "income", budget: 25000, month: 1 },
      { id: 4, name: "Aluguel", type: "expense", budget: 2500, month: 1 },
      { id: 5, name: "Salários", type: "expense", budget: 15000, month: 2 },
      { id: 6, name: "Marketing", type: "expense", budget: 3500, month: 2 },
      { id: 7, name: "Vendas", type: "income", budget: 28000, month: 2 },
    ];

    const sampleTransactions = [
      {
        id: 1,
        categoryId: 1,
        amount: 15000,
        description: "Folha de pagamento Janeiro",
        date: "2025-01-15",
        type: "expense",
      },
      {
        id: 2,
        categoryId: 3,
        amount: 18000,
        description: "Vendas produto A",
        date: "2025-01-20",
        type: "income",
      },
      {
        id: 3,
        categoryId: 2,
        amount: 1200,
        description: "Google Ads",
        date: "2025-01-10",
        type: "expense",
      },
      {
        id: 4,
        categoryId: 4,
        amount: 2500,
        description: "Aluguel escritório",
        date: "2025-01-05",
        type: "expense",
      },
    ];

    setUsers(sampleUsers);
    setCategories(sampleCategories);
    setTransactions(sampleTransactions);
  }, []);

  // Update newCategory month when selectedMonth changes or planning mode changes
  useEffect(() => {
    if (planningMode === "monthly" && selectedMonth) {
      setNewCategory((prev) => ({ ...prev, month: selectedMonth }));
    } else if (planningMode === "annual") {
      setNewCategory((prev) => ({ ...prev, month: "all" }));
    }
  }, [selectedMonth, planningMode]);

  //reordenar quando sortBy ou sortOrder mudam
  useEffect(() => {
    if (searchTerm || filterCategory || filterType || filterPeriod) {
      performSearchAndFilter(
        searchTerm,
        filterCategory,
        filterType,
        filterPeriod,
        customDateFrom,
        customDateTo
      );
    } else {
      // Se não há filtros, apenas reordena todas as transações
      setFilteredTransactions(
        sortTransactions(transactions, sortBy, sortOrder)
      );
    }
  }, [sortBy, sortOrder, transactions]); // Dependências: sortBy, sortOrder e transactions

  // Utility functions
  const setLoadingState = (action, state) => {
    setIsLoading((prev) => ({ ...prev, [action]: state }));
  };

  // Authentication functions
  const handleLogin = async () => {
    clearFormErrors("login");

    const errors = {};
    if (!loginForm.email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email)) {
      errors.email = "Formato de email inválido";
    }

    if (!loginForm.password) {
      errors.password = "Senha é obrigatória";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, login: errors }));
      return;
    }

    try {
      await performLogin(
        loginForm,
        async (user) => {
          // Callback de sucesso
          setCurrentScreen("menu");
          setDataLoaded(false);

          // IMPORTANTE: Carregar preferências do usuário após login
          setTimeout(async () => {
            await loadUserPreferences();
            showNotification(`Bem-vindo, ${user.name}!`, "success");
          }, 100);
        },
        (error) => {
          // Callback de erro
          setFormErrors((prev) => ({
            ...prev,
            login: { general: error.message || "Email ou senha incorretos!" },
          }));
        }
      );
    } catch (error) {
      // Erro já tratado no callback
    }
  };

  const handleLogout = () => {
    showConfirmDialog(
      "Confirmar Logout",
      "Tem certeza que deseja sair do sistema?",
      confirmLogout,
      "normal"
    );
  };

  const confirmLogout = () => {
    performLogout();
    clearUserSession();
    setCategories([]);
    setTransactions([]);
    setDataLoaded(false);
    setCurrentScreen("login");
    showNotification("Logout realizado com sucesso", "info");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    return USER_ROLES[currentUser.role].permissions.includes(permission);
  };

  const addUser = async () => {
    if (isLoading.addUser) return;

    clearFormErrors("user");
    const errors = validateUserForm(newUserForm, users);

    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, user: errors }));
      showNotification("Corrija os erros no formulário", "error");
      return;
    }

    setLoadingState("addUser", true);

    try {
      console.log("Enviando usuário para API:", newUserForm);

      // Chamar o serviço para criar usuário
      const newUser = await userService.create({
        name: newUserForm.name,
        email: newUserForm.email,
        password: newUserForm.password,
        role: newUserForm.role,
      });

      console.log("Usuário criado:", newUser);

      showNotification(`Usuário ${newUserForm.name} adicionado!`, "success");

      // Recarregar lista de usuários
      if (
        currentUser.system_mode === "empresa" &&
        currentUser.role === "super"
      ) {
        const usersData = await userService.getAll();
        setUsers(usersData);
      }

      // Limpar formulário
      setNewUserForm({ name: "", email: "", password: "", role: "viewer" });
    } catch (error) {
      console.error("Erro ao adicionar usuário:", error);
      showNotification(error.message || "Erro ao adicionar usuário", "error");
    } finally {
      setLoadingState("addUser", false);
    }
  };

  const deleteUser = async (id, name) => {
    const performDelete = async () => {
      setIsLoading((prev) => ({ ...prev, deleteUser: true }));

      try {
        await userService.delete(id);
        showNotification(`Usuário "${name}" excluído!`, "success");

        // Recarregar lista
        if (
          currentUser.system_mode === "empresa" &&
          currentUser.role === "super"
        ) {
          const usersData = await userService.getAll();
          setUsers(usersData);
        }
      } catch (error) {
        console.error("Erro ao excluir usuário:", error);
        showNotification(error.message || "Erro ao excluir usuário", "error");
      } finally {
        setIsLoading((prev) => ({ ...prev, deleteUser: false }));
      }
    };

    if (systemPreferences.requireConfirmation) {
      showConfirmDialog(
        "Confirmar Exclusão",
        `Tem certeza que deseja excluir o usuário "${name}"?`,
        performDelete,
        "danger"
      );
    } else {
      await performDelete();
    }
  };

  const addCategory = async () => {
    if (categoryLoading) return;

    clearFormErrors("category");
    const errors = validateCategoryForm(
      newCategory,
      planningMode,
      selectedMonth
    );

    if (Object.keys(errors).length > 0) {
      setFormErrors((prev) => ({ ...prev, category: errors }));
      showNotification(
        "Corrija os erros no formulário antes de continuar",
        "error"
      );
      return;
    }

    // Para modo anual, verificar se já existe alguma categoria com esse nome
    if (planningMode === "annual") {
      const existingCategory = categories.find(
        (cat) => cat.name === newCategory.name && cat.type === newCategory.type
      );

      if (existingCategory) {
        showNotification(
          `Já existe uma categoria "${newCategory.name}" cadastrada. Para categorias anuais, use um nome único.`,
          "error"
        );
        return;
      }
    }

    try {
      await performAddCategory(newCategory, planningMode, months);

      // Limpar formulário
      setNewCategory({
        name: "",
        type: "expense",
        budget: "",
        month: planningMode === "monthly" ? selectedMonth : "all",
      });
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const deleteCategory = (id, name) => {
    const performDelete = async () => {
      try {
        await performDeleteCategory(id, name);
      } catch (error) {
        // Erro já tratado no hook
      }
    };

    if (systemPreferences.requireConfirmation) {
      showConfirmDialog(
        "Confirmar Exclusão",
        `Tem certeza que deseja excluir a categoria "${name}"? Todas as transações desta categoria também serão excluídas.`,
        performDelete,
        "danger"
      );
    } else {
      performDelete();
    }
  };

  const addTransaction = async () => {
    console.log("🚀 INICIANDO addTransaction");
    console.log("📊 Estado atual:", {
      transactionLoading,
      transactionMode,
      transactionForm,
      categories: categories?.length || 0
    });

    // Verificar se está carregando
    if (transactionLoading) {
      console.log("⏳ Transação já está sendo processada, cancelando");
      return;
    }

    // Limpar erros
    clearFormErrors("transaction");
    console.log("🧹 Erros do formulário limpos");

    // Validação do formulário
    console.log("🔍 Validando formulário...");
    const errors = validateTransactionForm(
      transactionForm,
      transactionMode,
      transactionMode === "pontual"
        ? {
            name: transactionForm.pontualName,
            type: transactionForm.pontualType,
          }
        : null
    );

    console.log("📋 Resultado da validação:", errors);

    if (Object.keys(errors).length > 0) {
      console.log("❌ Formulário com erros, cancelando");
      setFormErrors((prev) => ({ ...prev, transaction: errors }));
      showNotification(
        "Corrija os erros no formulário antes de continuar",
        "error"
      );
      return;
    }

    console.log("✅ Formulário válido, prosseguindo...");

    try {
      let categoryId;

      if (transactionMode === "pontual") {
        console.log("🎯 Modo pontual: criando categoria primeiro");
        
        // Criar categoria pontual primeiro - CORRIGIDO para backend
        const pontualCategoryData = {
          name: `${transactionForm.pontualName} (Lançamento pontual)`,
          type: transactionForm.pontualType,
          budget: 0,
          month: null, // CORRIGIDO: backend pode esperar null para pontuais
          is_punctual: true, // ADICIONADO: flag para identificar pontuais
        };
        
        console.log("📦 Dados da categoria pontual:", pontualCategoryData);
        
        try {
          const pontualCategory = await categoryService.create(pontualCategoryData);
          console.log("✅ Categoria pontual criada:", pontualCategory);

          categoryId = pontualCategory.id;
          showNotification(`Categoria pontual criada!`, "success");

          // Recarregar categorias
          console.log("🔄 Recarregando categorias...");
          await loadCategories();
          
        } catch (categoryError) {
          console.error("💥 ERRO ao criar categoria pontual:", categoryError);
          
          // Tentar com month como string se o primeiro falhar
          if (categoryError.message?.includes('validação')) {
            console.log("🔄 Tentando novamente com month como string...");
            
            const pontualCategoryDataV2 = {
              name: `${transactionForm.pontualName} (Lançamento pontual)`,
              type: transactionForm.pontualType,
              budget: 0,
              month: "pontual", // Como string
            };
            
            const pontualCategory = await categoryService.create(pontualCategoryDataV2);
            console.log("✅ Categoria pontual criada (v2):", pontualCategory);
            
            categoryId = pontualCategory.id;
            showNotification(`Categoria pontual criada!`, "success");
            await loadCategories();
            
          } else {
            throw categoryError; // Re-throw se não for erro de validação
          }
        }
        
      } else {
        console.log("📊 Modo categoria existente");
        
        // Verificar se categoria foi selecionada
        if (!transactionForm.categoryId) {
          console.log("❌ Nenhuma categoria selecionada");
          showNotification("Selecione uma categoria", "error");
          return;
        }
        
        // CORRIGIDO: Como os IDs são UUIDs (strings), não precisamos converter para número
        const rawCategoryId = transactionForm.categoryId;
        console.log("🔍 Raw categoryId:", rawCategoryId, typeof rawCategoryId);
        
        // Para UUIDs, apenas usar diretamente como string
        categoryId = rawCategoryId;
        
        console.log("🎯 Categoria selecionada ID final:", categoryId);
        
        // Verificar se é um UUID válido (formato básico)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(categoryId)) {
          console.log("❌ CategoryId não é um UUID válido");
          showNotification("Erro: ID da categoria inválido", "error");
          return;
        }
      }

      // Validar se categoria existe (para modo existing)
      if (transactionMode !== "pontual") {
        const selectedCategory = categories.find(cat => cat.id === categoryId);
        console.log("🔍 Categoria encontrada:", selectedCategory);
        
        if (!selectedCategory) {
          console.log("❌ Categoria não encontrada na lista");
          console.log("📋 Categorias disponíveis:", categories.map(c => ({id: c.id, name: c.name})));
          showNotification("Categoria não encontrada", "error");
          return;
        }
      }

      // Preparar dados da transação
      const selectedCategory = categories.find(cat => cat.id === categoryId);
      const transactionData = {
        category_id: categoryId,
        amount: parseFloat(transactionForm.amount),
        description: transactionForm.description,
        date: transactionForm.date,
        type: transactionMode === "pontual"
          ? transactionForm.pontualType
          : selectedCategory?.type || "expense"
      };

      console.log("📦 Dados da transação preparados:", transactionData);

      // Verificar se performAddTransaction existe
      if (!performAddTransaction) {
        console.log("❌ performAddTransaction não está definido!");
        showNotification("Erro interno: função não encontrada", "error");
        return;
      }

      console.log("🚀 Chamando performAddTransaction...");

      // Criar transação usando o hook
      const result = await performAddTransaction(transactionData);
      console.log("✅ Transação criada com sucesso:", result);

      // Limpar formulário
      console.log("🧹 Limpando formulário...");
      setTransactionForm({
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        categoryId: "",
        pontualName: "",
        pontualType: "expense",
      });

      // Recarregar dados
      console.log("🔄 Recarregando dados...");
      await loadDataFromAPI();
      
      console.log("🎉 Processo concluído com sucesso!");
      showNotification("Transação adicionada com sucesso!", "success");

    } catch (error) {
      console.error("💥 ERRO na addTransaction:", error);
      console.error("Stack trace:", error.stack);
      showNotification(error.message || "Erro ao adicionar transação", "error");
    }
  };

  const deleteTransaction = (id, description) => {
    const performDelete = async () => {
      try {
        await performDeleteTransaction(id, description);
      } catch (error) {
        // Erro já tratado no hook
      }
    };

    if (systemPreferences.requireConfirmation) {
      showConfirmDialog(
        "Confirmar Exclusão",
        `Tem certeza que deseja excluir a transação "${description}"?`,
        performDelete,
        "danger"
      );
    } else {
      performDelete();
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (!category) return "Categoria não encontrada";

    // Se for categoria pontual, mostrar sem o sufixo
    if (category.month === "pontual") {
      return category.name;
    }

    return `${category.name} - ${getMonthName(category.month)}`;
  };

  const getFilteredCategories = () => {
    if (!selectedMonth) return [];
    return categories.filter((cat) => cat.month === selectedMonth);
  };

  const generateReport = () => {
    // Verificar se há período selecionado
    if (reportPeriod === "monthly" && !selectedMonth) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        categoryTotals: [],
        pontualTotal: null,
        period: reportPeriod,
        selectedMonth,
        selectedSemester,
      };
    }

    let filteredTransactions = [];
    let filteredCategories = [];

    if (reportPeriod === "monthly" && selectedMonth) {
      const monthTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() + 1 === selectedMonth;
      });
      filteredTransactions = monthTransactions;
      filteredCategories = categories.filter(
        (cat) => cat.month === selectedMonth || cat.month === "pontual"
      );
    } else if (reportPeriod === "semester") {
      const semesterMonths =
        selectedSemester === 1 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12];
      const semesterTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return semesterMonths.includes(transactionDate.getMonth() + 1);
      });
      filteredTransactions = semesterTransactions;
      filteredCategories = categories.filter(
        (cat) => semesterMonths.includes(cat.month) || cat.month === "pontual"
      );
    } else {
      // Annual
      filteredTransactions = transactions;
      filteredCategories = categories;
    }

    // Calcular totais com valores numéricos garantidos
    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const totalExpenses = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    // Separar categorias
    const plannedCategories = filteredCategories.filter(
      (cat) => cat.month !== "pontual"
    );
    const pontualCategories = filteredCategories.filter(
      (cat) => cat.month === "pontual"
    );

    // Processar categorias planejadas
    const plannedCategoryTotals = plannedCategories.map((category) => {
      const categoryTransactions = filteredTransactions.filter(
        (t) => t.categoryId === category.id || t.category_id === category.id
      );
      const spent = categoryTransactions.reduce(
        (sum, t) => sum + Math.abs(parseFloat(t.amount) || 0),
        0
      );
      const budget = parseFloat(category.budget) || 0;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      const remaining = budget - spent;

      return {
        ...category,
        spent,
        budget, // Garantir que é número
        percentage: Math.round(percentage),
        remaining,
        transactions: categoryTransactions,
      };
    });

    // Processar categorias pontuais
    let pontualCategoryTotal = null;
    if (pontualCategories.length > 0) {
      const pontualTransactions = filteredTransactions.filter((t) =>
        pontualCategories.some(
          (cat) => cat.id === (t.categoryId || t.category_id)
        )
      );
      const pontualSpent = pontualTransactions.reduce(
        (sum, t) => sum + Math.abs(parseFloat(t.amount) || 0),
        0
      );
      const pontualIncome = pontualTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      const pontualExpenses = pontualTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      pontualCategoryTotal = {
        id: "pontual-group",
        name: "Lançamentos Pontuais",
        type: "mixed",
        spent: pontualSpent,
        income: pontualIncome,
        expenses: pontualExpenses,
        budget: 0,
        percentage: 0,
        remaining: 0,
        month: "pontual",
        transactions: pontualTransactions,
        categories: pontualCategories,
      };
    }

    return {
      totalIncome: totalIncome || 0,
      totalExpenses: totalExpenses || 0,
      categoryTotals: plannedCategoryTotals,
      pontualTotal: pontualCategoryTotal,
      period: reportPeriod,
      selectedMonth,
      selectedSemester,
    };
  };

  const formatCurrency = (value) => {
    const currency = systemPreferences.currencyFormat || "BRL";
    const locale = systemPreferences.numberFormat || "pt-BR";

    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const format = systemPreferences.dateFormat || "dd/mm/yyyy";

    switch (format) {
      case "mm/dd/yyyy":
        return date.toLocaleDateString("en-US");
      case "yyyy-mm-dd":
        return date.toISOString().split("T")[0];
      case "dd/mm/yyyy":
      default:
        return date.toLocaleDateString("pt-BR");
    }
  };

  const getMonthName = (monthNumber) => {
    const month = months.find((m) => m.value === monthNumber);
    return month ? month.name : "";
  };

  const getReportTitle = () => {
    if (reportPeriod === "monthly") {
      return `Relatórios Financeiros - ${getMonthName(selectedMonth)}`;
    } else if (reportPeriod === "semester") {
      return `Relatórios Financeiros - ${selectedSemester}º Semestre`;
    } else {
      return "Relatórios Financeiros - Anual";
    }
  };

  const report = generateReport();

  // Inicialize a referência fora dos effects
  const previousValuesRef = useRef({
    income: 0,
    expenses: 0,
    balance: 0,
    pontual: 0,
  });

  // Receita
  useEffect(() => {
    if (!report) return;
    const income = report.totalIncome || 0;
    if (income !== previousValuesRef.current.income) {
      triggerCardAnimation("income");
      previousValuesRef.current.income = income;
    }
  }, [report?.totalIncome]);

  // Despesas
  useEffect(() => {
    if (!report) return;
    const expenses = report.totalExpenses || 0;
    if (expenses !== previousValuesRef.current.expenses) {
      triggerCardAnimation("expenses");
      previousValuesRef.current.expenses = expenses;
    }
  }, [report?.totalExpenses]);

  // Saldo (balance = income - expenses)
  useEffect(() => {
    if (!report) return;
    const balance = (report.totalIncome || 0) - (report.totalExpenses || 0);
    if (balance !== previousValuesRef.current.balance) {
      triggerCardAnimation("balance");
      previousValuesRef.current.balance = balance;
    }
  }, [report?.totalIncome, report?.totalExpenses]);

  // Pontual
  useEffect(() => {
    if (!report || !report.pontualTotal) return;
    const pontual = report.pontualTotal.spent || 0;
    if (pontual !== previousValuesRef.current.pontual) {
      triggerCardAnimation("pontual");
      previousValuesRef.current.pontual = pontual;
    }
  }, [report?.pontualTotal?.spent]);

  useEffect(() => {
    if (currentUser) {
      setUserSettings((prev) => ({
        ...prev,
        displayName: currentUser.name,
        email: currentUser.email,
      }));
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.email]);

  // atualizar formatações quando configurações mudam
  useEffect(() => {
    const handleSettingsChange = () => {
      // Forçar re-renderização incrementando renderKey
      setRenderKey((prev) => prev + 1);
    };

    window.addEventListener("settingsChanged", handleSettingsChange);
    return () =>
      window.removeEventListener("settingsChanged", handleSettingsChange);
  }, []);

  const clearUserSession = () => {
    // Limpar todos os formulários
    setLoginForm({ email: "", password: "" });
    setNewUserForm({ name: "", email: "", password: "", role: "viewer" });
    setNewCategory({ name: "", type: "expense", budget: "", month: null });

    setTransactionMode("existing");
    setTransactionForm({
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      categoryId: "",
      pontualName: "",
      pontualType: "expense",
    });

    setSearchTerm("");
    setFilterCategory("");
    setFilterType("");
    setFilteredTransactions([]);
    setFilterPeriod("");
    setCustomDateFrom("");
    setCustomDateTo("");
    setSortBy("date");
    setSortOrder("desc");
    setIsExporting(false);
    setExportFormat("csv");
    setShowCharts(true);
    setChartType("category");
    setHoveredSegment(null);
    setShowTimelineChart(true);
    setTimelineType("monthly");
    setSelectedTimeRange(6);
    setSelectedDataPoint(null);
    setShowDetailModal(false);
    setChartFilters({
      minAmount: "",
      maxAmount: "",
      selectedCategories: [],
    });
    setAnimateCharts(true);
    setShowCategoryDropdown(false);
    setTimeSeriesData([]);
    setTrendAnalysis(null);
    setShowTrendCharts(true);
    setTrendPeriod("6months");

    setShowUserSettings(false);
    setUserSettings({
      displayName: "",
      email: "",
      language: "pt-BR",
      timezone: "America/Sao_Paulo",
      dateFormat: "DD/MM/YYYY",
      currencyFormat: "BRL",
      notifications: {
        email: true,
        browser: true,
        reports: true,
        alerts: false,
      },
      dashboard: {
        defaultView: "detailed",
        defaultPeriod: "monthly",
        autoRefresh: false,
        showAnimations: true,
      },
    });
    setTempSettings({});
    setIsLoadingSettings(false);

    setSystemPreferences({
      defaultReportPeriod: "monthly",
      defaultReportView: "detailed",
      defaultChartType: "category",
      showChartsOnLoad: true,
      dateFormat: "dd/mm/yyyy",
      currencyFormat: "BRL",
      numberFormat: "pt-BR",
      autoSaveDelay: 2000, // 2 segundos por padrão
      showNotifications: true,
      requireConfirmation: true,
      itemsPerPage: 10,
      cacheReports: true,
      animationsEnabled: true,
    });
    setShowSystemPrefs(false);

    setCardAnimations({
      income: false,
      expenses: false,
      balance: false,
      pontual: false,
    });
    setPreviousValues({
      income: 0,
      expenses: 0,
      balance: 0,
      pontual: 0,
    });

    // Limpar estados de seleção
    setSelectedMonth(null);
    setSelectedSemester(1);
    setPlanningMode("monthly");
    setReportPeriod("monthly");
    setReportView("detailed");
    setTransactionMode("existing");

    // Limpar estados de erro e loading
    setIsLoading({
      login: false,
      addCategory: false,
      addTransaction: false,
      addUser: false,
      deleteCategory: false,
      deleteTransaction: false,
      deleteUser: false,
    });

    // Limpar modais e confirmações
    setShowLogoutConfirm(false);
    setConfirmDialog(null);

    setDataLoaded(false);

    // Resetar tema para padrão (opcional)
    // setDarkMode(false);
  };

  const performDeleteMultipleCategories = async (ids, categoryName) => {
    try {
      await deleteMultipleCategories(ids, categoryName);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const showConfirmDialog = (title, message, onConfirm, type = "normal") => {
    setConfirmDialog({
      title,
      message,
      onConfirm,
      onCancel: () => setConfirmDialog(null),
      type,
    });
  };

  const hideConfirmDialog = () => {
    setConfirmDialog(null);
  };

  const performSearchAndFilter = (
    searchTerm = "",
    categoryFilter = "",
    typeFilter = "",
    periodFilter = "",
    dateFrom = "",
    dateTo = ""
  ) => {
    let results = transactions;

    // Aplicar filtro de período
    if (periodFilter) {
      const dateRange =
        periodFilter === "custom"
          ? { from: dateFrom, to: dateTo }
          : getDateRangeForPeriod(periodFilter);

      if (dateRange && dateRange.from && dateRange.to) {
        results = results.filter((transaction) =>
          isDateInRange(transaction.date, dateRange)
        );
      }
    }

    // Aplicar filtro de categoria
    if (categoryFilter) {
      results = results.filter(
        (transaction) => transaction.categoryId === parseInt(categoryFilter)
      );
    }

    // Aplicar filtro de tipo
    if (typeFilter) {
      results = results.filter(
        (transaction) => transaction.type === typeFilter
      );
    }

    // Aplicar busca textual
    if (searchTerm.trim()) {
      results = results.filter((transaction) => {
        const description = transaction.description.toLowerCase();
        const categoryName = getCategoryName(
          transaction.categoryId
        ).toLowerCase();
        const amount = transaction.amount.toString();
        const date = formatDate(transaction.date).toLowerCase();
        const searchLower = searchTerm.toLowerCase();

        return (
          description.includes(searchLower) ||
          categoryName.includes(searchLower) ||
          amount.includes(searchLower) ||
          date.includes(searchLower)
        );
      });
    }

    // APLICAR ORDENAÇÃO
    results = sortTransactions(results, sortBy, sortOrder);

    setFilteredTransactions(results);
    return results;
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterCategory("");
    setFilterType("");
    setFilterPeriod("");
    setCustomDateFrom("");
    setCustomDateTo("");
    setFilteredTransactions([]);
  };

  const getDateRangeForPeriod = (period) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    switch (period) {
      case "today":
        return { from: todayStr, to: todayStr };

      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Domingo
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Sábado
        return {
          from: weekStart.toISOString().split("T")[0],
          to: weekEnd.toISOString().split("T")[0],
        };

      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return {
          from: monthStart.toISOString().split("T")[0],
          to: monthEnd.toISOString().split("T")[0],
        };

      case "custom":
        return { from: customDateFrom, to: customDateTo };

      default:
        return null;
    }
  };

  const isDateInRange = (transactionDate, dateRange) => {
    if (!dateRange) return true;

    const transDate = new Date(transactionDate);
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);

    return transDate >= fromDate && transDate <= toDate;
  };

  const sortTransactions = (transactions, sortBy, sortOrder) => {
    const sorted = [...transactions].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "date":
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          // Para datas, comparação numérica
          if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
          if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
          return 0;

        case "amount":
          aValue = Math.abs(a.amount);
          bValue = Math.abs(b.amount);
          // Para valores, comparação numérica
          if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
          if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
          return 0;

        case "description":
          aValue = a.description.toLowerCase().trim();
          bValue = b.description.toLowerCase().trim();
          // Para strings, usar localeCompare
          const descComparison = aValue.localeCompare(bValue, "pt-BR");
          return sortOrder === "asc" ? descComparison : -descComparison;

        case "category":
          // CORREÇÃO: Pegar diretamente o nome da categoria
          const categoryA = categories.find((cat) => cat.id === a.categoryId);
          const categoryB = categories.find((cat) => cat.id === b.categoryId);

          aValue = (categoryA?.name || "zzz").toLowerCase().trim();
          bValue = (categoryB?.name || "zzz").toLowerCase().trim();

          // Remover sufixos se houver
          aValue = aValue.replace(" (lançamento pontual)", "");
          bValue = bValue.replace(" (lançamento pontual)", "");

          const catComparison = aValue.localeCompare(bValue, "pt-BR");

          return sortOrder === "asc" ? catComparison : -catComparison;

        default:
          return 0;
      }
    });

    return sorted;
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return "↕️"; // Ícone neutro
    }
    return sortOrder === "asc" ? "⬆️" : "⬇️";
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      // Se já está ordenando por este campo, alterna a direção
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Se é um novo campo, começa com descendente
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleReportExport = async () => {
    setIsExporting(true);

    // Aguardar um pouco para simular processamento
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!report) {
      showNotification("Nenhum relatório para exportar", "error", "alerts");
      setIsExporting(false);
      return;
    }

    // Preparar dados para exportação
    const reportData = [];

    // Adicionar categorias planejadas
    report.categoryTotals.forEach((category) => {
      if (reportView === "detailed" && category.transactions.length > 0) {
        // Se é detalhado, adicionar cada transação
        category.transactions.forEach((transaction) => {
          reportData.push({
            data: transaction.date,
            descricao: transaction.description,
            categoria: category.name,
            mes: getMonthName(category.month),
            tipo: transaction.type,
            valor: transaction.amount,
            orcamento: category.budget,
            percentual: category.percentage,
          });
        });
      } else {
        // Se é resumo, adicionar apenas o resumo da categoria
        reportData.push({
          data: "-",
          descricao: `Resumo: ${category.name}`,
          categoria: category.name,
          mes: getMonthName(category.month),
          tipo: category.type,
          valor: category.spent,
          orcamento: category.budget,
          percentual: category.percentage,
        });
      }
    });

    // Adicionar lançamentos pontuais se houver
    if (report.pontualTotal && report.pontualTotal.transactions.length > 0) {
      if (reportView === "detailed") {
        report.pontualTotal.transactions.forEach((transaction) => {
          const pontualCategory = categories.find(
            (cat) => cat.id === transaction.categoryId
          );
          reportData.push({
            data: transaction.date,
            descricao: transaction.description,
            categoria: pontualCategory?.name || "Pontual",
            mes: "Pontual",
            tipo: transaction.type,
            valor: transaction.amount,
            orcamento: 0,
            percentual: 0,
          });
        });
      } else {
        reportData.push({
          data: "-",
          descricao: "Resumo: Lançamentos Pontuais",
          categoria: "Lançamentos Pontuais",
          mes: "Pontual",
          tipo: "mixed",
          valor: report.pontualTotal.spent,
          orcamento: 0,
          percentual: 0,
        });
      }
    }

    // Criar nome do arquivo
    const timestamp = new Date().toISOString().split("T")[0];
    const periodName =
      reportPeriod === "monthly" && selectedMonth
        ? `mes_${selectedMonth}`
        : reportPeriod === "semester" && selectedSemester
        ? `semestre_${selectedSemester}`
        : reportPeriod === "annual"
        ? "anual"
        : "relatorio"; // FALLBACK para evitar null
    const filename = `relatorio_${periodName}_${timestamp}`;

    // Criar objeto de filtros para PDF
    const reportInfo = {
      Período:
        reportPeriod === "monthly"
          ? `${getMonthName(selectedMonth)}`
          : reportPeriod === "semester"
          ? `${selectedSemester}º Semestre`
          : "Anual",
      Visualização: reportView === "detailed" ? "Detalhado" : "Resumo",
      "Total de Receitas": formatCurrency(report.totalIncome),
      "Total de Despesas": formatCurrency(report.totalExpenses),
      Saldo: formatCurrency(report.totalIncome - report.totalExpenses),
    };

    // Exportar baseado no formato
    if (exportFormat === "csv") {
      exportReportToCSV(reportData, filename);
      showNotification(
        `Relatório exportado para CSV (${reportData.length} registros)`,
        "success",
        "reports"
      );
    } else {
      exportReportToPDF(reportData, filename, reportInfo);
      showNotification(
        `Relatório exportado para PDF (${reportData.length} registros)`,
        "success",
        "reports"
      );
    }

    setIsExporting(false);
  };

  const exportReportToCSV = (data, filename) => {
    // Cabeçalhos super detalhados
    const headers = [
      "Data",
      "Descrição",
      "Categoria",
      "Mês/Período",
      "Tipo Transação",
      "Receitas (R$)",
      "Despesas (R$)",
      "Valor Absoluto (R$)",
      "Valor com Sinal (R$)",
      "Orçamento Planejado (R$)",
      "Valor Utilizado (R$)",
      "Saldo Disponível (R$)",
      "Percentual Utilizado (%)",
      "Status Orçamento",
    ];

    // Converter dados para CSV usando PONTO E VÍRGULA como separador
    const csvData = [
      headers.join(";"),
      ...data.map((row) => {
        const valor = Math.abs(parseFloat(row.valor) || 0);
        const orcamento = parseFloat(row.orcamento) || 0;
        const date = row.data === "-" ? "-" : formatDate(row.data);

        // Cálculos detalhados
        const valorReceita = row.tipo === "income" ? valor : 0;
        const valorDespesa = row.tipo === "expense" ? valor : 0;
        const valorComSinal = row.tipo === "income" ? valor : -valor;
        const valorUtilizado = valor;
        const saldoDisponivel =
          orcamento > 0 ? Math.max(0, orcamento - valor) : 0;
        const statusOrcamento =
          orcamento === 0
            ? "Sem Orçamento"
            : row.percentual <= 50
            ? "Dentro do Limite"
            : row.percentual <= 80
            ? "Atenção"
            : row.percentual <= 100
            ? "Próximo do Limite"
            : "Excedeu Limite";

        // não usar vírgulas nos números, usar ponto decimal normal
        return [
          date,
          row.descricao,
          row.categoria,
          row.mes,
          row.tipo === "income"
            ? "Receita"
            : row.tipo === "expense"
            ? "Despesa"
            : "Misto",
          valorReceita.toFixed(2),
          valorDespesa.toFixed(2),
          valor.toFixed(2),
          valorComSinal.toFixed(2),
          orcamento.toFixed(2),
          valorUtilizado.toFixed(2),
          saldoDisponivel.toFixed(2),
          row.percentual.toString(),
          statusOrcamento,
        ].join(";");
      }),
    ].join("\n");

    // Criar e fazer download do arquivo
    const blob = new Blob(["\ufeff" + csvData], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReportToPDF = (data, filename, reportInfo) => {
    // Criar conteúdo HTML específico para relatórios
    let htmlContent = `
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório Financeiro</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #1f2937; text-align: center; margin-bottom: 30px; }
        .summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary h3 { margin: 0 0 15px 0; color: #374151; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .summary p { margin: 5px 0; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        th { background-color: #f9fafb; font-weight: bold; color: #374151; }
        .income { color: #059669; font-weight: bold; }
        .expense { color: #dc2626; font-weight: bold; }
        .mixed { color: #d97706; font-weight: bold; }
        .pontual { background-color: #fef3c7; }
        .footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 10px; }
      </style>
    </head>
    <body>
      <h1>Relatório Financeiro</h1>
  `;

    // Adicionar resumo do relatório
    htmlContent +=
      '<div class="summary"><h3>Resumo do Relatório:</h3><div class="summary-grid">';
    Object.entries(reportInfo).forEach(([key, value]) => {
      htmlContent += `<p><strong>${key}:</strong> ${value}</p>`;
    });
    htmlContent += "</div></div>";

    // Criar tabela
    htmlContent += `
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Descrição</th>
          <th>Categoria</th>
          <th>Mês</th>
          <th>Tipo</th>
          <th>Valor</th>
          <th>Orçamento</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
  `;

    // Adicionar dados
    data.forEach((row) => {
      const type =
        row.tipo === "income"
          ? "Receita"
          : row.tipo === "expense"
          ? "Despesa"
          : "Misto";
      const value = Math.abs(row.valor);
      const formattedValue = formatCurrency(value);
      const formattedBudget = formatCurrency(row.orcamento);
      const date = row.data === "-" ? "-" : formatDate(row.data);
      const isPontual = row.mes === "Pontual";

      htmlContent += `
      <tr${isPontual ? ' class="pontual"' : ""}>
        <td>${date}</td>
        <td>${row.descricao}</td>
        <td>${row.categoria}</td>
        <td>${row.mes}</td>
        <td class="${row.tipo}">${type}</td>
        <td class="${row.tipo}">${
        row.tipo === "income" ? "+" : row.tipo === "expense" ? "-" : ""
      }${formattedValue}</td>
        <td>${formattedBudget}</td>
        <td>${row.percentual}%</td>
      </tr>
    `;
    });

    htmlContent += `
      </tbody>
    </table>
    
    <div class="footer">
      <p>Relatório gerado em ${new Date().toLocaleDateString(
        "pt-BR"
      )} às ${new Date().toLocaleTimeString("pt-BR")}</p>
      <p>Sistema de Controle Financeiro</p>
    </div>
    </body>
    </html>
  `;

    // Abrir em nova janela para impressão/salvar como PDF
    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Aguardar carregamento e abrir diálogo de impressão
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const triggerCardAnimation = (cardType) => {
    setCardAnimations((prev) => ({ ...prev, [cardType]: true }));
    setTimeout(() => {
      setCardAnimations((prev) => ({ ...prev, [cardType]: false }));
    }, 600);
  };

  const getVariationIcon = (current, previous) => {
    if (current > previous) return "📈";
    if (current < previous) return "📉";
    return "➡️";
  };

  const getVariationColor = (current, previous, isBalance = false) => {
    if (current > previous)
      return isBalance ? "text-green-500" : "text-blue-500";
    if (current < previous)
      return isBalance ? "text-red-500" : "text-orange-500";
    return "text-gray-500";
  };

  const formatVariation = (current, previous) => {
    const variation = current - previous;
    const percentage =
      previous !== 0 ? (variation / Math.abs(previous)) * 100 : 0;
    return {
      absolute: Math.abs(variation),
      percentage: Math.abs(percentage),
      isPositive: variation >= 0,
    };
  };

  const generatePieChartData = (
    report,
    type,
    subtype = "expenses",
    filters = {}
  ) => {
    let data = [];
    let totals = {
      income: 0,
      expenses: 0,
      total: 0,
      context: type,
      subtype: subtype,
    };

    switch (type) {
      case "category":
        if (subtype === "expenses") {
          // Gráfico de despesas por categoria
          report.categoryTotals.forEach((category) => {
            if (category.spent > 0 && category.type === "expense") {
              data.push({
                name: category.name,
                value: category.spent,
                color: getExpenseColor(category.name), // Cores variadas para despesas
                type: category.type,
                budget: category.budget,
                percentage: category.percentage,
              });
              totals.expenses += category.spent;
            }
          });

          // Lançamentos pontuais de despesas
          if (report.pontualTotal && report.pontualTotal.expenses > 0) {
            data.push({
              name: "Lançamentos Pontuais",
              value: report.pontualTotal.expenses,
              color: "#f59e0b",
              type: "expense",
              budget: 0,
              percentage: 0,
            });
            totals.expenses += report.pontualTotal.expenses;
          }
          totals.total = totals.expenses;
        } else if (subtype === "income") {
          // Gráfico de receitas por categoria
          report.categoryTotals.forEach((category) => {
            if (category.spent > 0 && category.type === "income") {
              data.push({
                name: category.name,
                value: category.spent,
                color: getIncomeColor(category.name), // Cores variadas para receitas
                type: category.type,
                budget: category.budget,
                percentage: category.percentage,
              });
              totals.income += category.spent;
            }
          });

          // Lançamentos pontuais de receitas
          if (report.pontualTotal && report.pontualTotal.income > 0) {
            data.push({
              name: "Receitas Pontuais",
              value: report.pontualTotal.income,
              color: "#34d399",
              type: "income",
              budget: 0,
              percentage: 0,
            });
            totals.income += report.pontualTotal.income;
          }
          totals.total = totals.income;
        }
        break;

      case "type":
        // Mantém a lógica anterior
        if (report.totalIncome > 0) {
          data.push({
            name: "Receitas",
            value: report.totalIncome,
            color: "#10b981",
            type: "income",
          });
          totals.income = report.totalIncome;
        }

        if (report.totalExpenses > 0) {
          data.push({
            name: "Despesas",
            value: report.totalExpenses,
            color: "#ef4444",
            type: "expense",
          });
          totals.expenses = report.totalExpenses;
        }
        totals.total = totals.income + totals.expenses;
        break;
    }

    return { data, totals };
  };

  // Funções auxiliares para cores variadas
  const getExpenseColor = (categoryName) => {
    const colors = [
      "#ef4444",
      "#dc2626",
      "#b91c1c",
      "#991b1b",
      "#f87171",
      "#fca5a5",
    ];
    const index = categoryName.length % colors.length;
    return colors[index];
  };

  const getIncomeColor = (categoryName) => {
    const colors = [
      "#10b981",
      "#059669",
      "#047857",
      "#065f46",
      "#34d399",
      "#6ee7b7",
    ];
    const index = categoryName.length % colors.length;
    return colors[index];
  };

  const createSVGPath = (centerX, centerY, radius, startAngle, endAngle) => {
    const start = {
      x: centerX + radius * Math.cos(startAngle),
      y: centerY + radius * Math.sin(startAngle),
    };
    const end = {
      x: centerX + radius * Math.cos(endAngle),
      y: centerY + radius * Math.sin(endAngle),
    };

    const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;

    return [
      "M",
      centerX,
      centerY,
      "L",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      1,
      end.x,
      end.y,
      "Z",
    ].join(" ");
  };

  const getChartTitle = (type) => {
    switch (type) {
      case "category":
        return "Distribuição por Categoria";
      case "type":
        return "Receitas vs Despesas";
      default:
        return "Gráfico";
    }
  };

  const generateTimelineData = (timelineType, timeRange, filters = {}) => {
    const currentDate = new Date();
    const data = [];

    // APLICAR FILTROS nas transações base
    let filteredTransactions = transactions;

    // Filtro por valor mínimo
    if (filters.minAmount && !isNaN(parseFloat(filters.minAmount))) {
      filteredTransactions = filteredTransactions.filter(
        (t) => Math.abs(t.amount) >= parseFloat(filters.minAmount)
      );
    }

    // Filtro por valor máximo
    if (filters.maxAmount && !isNaN(parseFloat(filters.maxAmount))) {
      filteredTransactions = filteredTransactions.filter(
        (t) => Math.abs(t.amount) <= parseFloat(filters.maxAmount)
      );
    }

    // Filtro por categorias selecionadas
    if (filters.selectedCategories && filters.selectedCategories.length > 0) {
      filteredTransactions = filteredTransactions.filter((t) => {
        const category = categories.find((cat) => cat.id === t.categoryId);
        return category && filters.selectedCategories.includes(category.name);
      });
    }

    if (timelineType === "monthly") {
      // Gráfico de evolução mensal COM FILTROS
      for (let i = timeRange - 1; i >= 0; i--) {
        const date = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - i,
          1
        );
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        // Filtrar transações do mês (JÁ FILTRADAS)
        const monthTransactions = filteredTransactions.filter((t) => {
          const tDate = new Date(t.date);
          return tDate.getMonth() + 1 === month && tDate.getFullYear() === year;
        });

        const income = monthTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);

        data.push({
          month: `${getMonthName(month).slice(0, 3)}/${year
            .toString()
            .slice(-2)}`,
          monthFull: getMonthName(month),
          income,
          expenses,
          balance: income - expenses,
          transactionCount: monthTransactions.length,
        });
      }
    } else if (timelineType === "category_trend") {
      // Top 5 categorias mais usadas COM FILTROS
      const categoryTotals = {};

      filteredTransactions.forEach((transaction) => {
        const category = categories.find(
          (cat) => cat.id === transaction.categoryId
        );
        if (category && category.month !== "pontual") {
          const categoryName = category.name;
          if (!categoryTotals[categoryName]) {
            categoryTotals[categoryName] = { total: 0, count: 0 };
          }
          categoryTotals[categoryName].total += Math.abs(transaction.amount);
          categoryTotals[categoryName].count += 1;
        }
      });

      // Ordenar e pegar top 5
      const sortedCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 5);

      return sortedCategories.map(([name, data], index) => ({
        name,
        value: data.total,
        count: data.count,
        color: `hsl(${index * 72}, 70%, 50%)`, // Cores distribuídas
      }));
    }

    return data;
  };

  const getMaxValue = (data, field) => {
    return Math.max(...data.map((item) => Math.abs(item[field] || 0)));
  };

  const createBarPath = (x, y, width, height, cornerRadius = 2) => {
    return `M ${x + cornerRadius} ${y + height}
          L ${x + cornerRadius} ${y + cornerRadius}
          Q ${x} ${y} ${x + cornerRadius} ${y}
          L ${x + width - cornerRadius} ${y}
          Q ${x + width} ${y} ${x + width} ${y + cornerRadius}
          L ${x + width} ${y + height}
          Z`;
  };

  const handleDataPointClick = (dataPoint, chartType) => {
    setSelectedDataPoint({ ...dataPoint, chartType });
    setShowDetailModal(true);
  };

  const generateDetailedData = (dataPoint) => {
    if (!dataPoint) return [];

    if (dataPoint.chartType === "monthly") {
      // CORREÇÃO: Melhorar a lógica de filtro por mês
      const [monthName, year] = dataPoint.month
        ? dataPoint.month.split("/")
        : ["", ""];

      if (!monthName || !year) {
        return [];
      }

      // Converter nome do mês abreviado para número
      const monthMap = {
        Jan: 0,
        Fev: 1,
        Mar: 2,
        Abr: 3,
        Mai: 4,
        Jun: 5,
        Jul: 6,
        Ago: 7,
        Set: 8,
        Out: 9,
        Nov: 10,
        Dez: 11,
      };

      const targetMonth = monthMap[monthName];
      const targetYear = parseInt("20" + year); // Converter "25" para 2025

      if (targetMonth === undefined || isNaN(targetYear)) {
        return [];
      }

      // Buscar todas as transações do mês
      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return (
          tDate.getMonth() === targetMonth && tDate.getFullYear() === targetYear
        );
      });

      return monthTransactions.map((t) => ({
        ...t,
        categoryName: getCategoryName(t.categoryId),
      }));
    }

    return [];
  };

  const exportChartData = (chartData, chartType) => {
    if (!chartData || chartData.length === 0) {
      showNotification("Nenhum dado para exportar", "error", "alerts");
      return;
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `grafico_${chartType}_${timestamp}`;

    let csvData = [];

    if (chartType === "monthly" || chartType === "timeline") {
      // CORREÇÃO: Usar os dados corretos do timeline
      csvData = chartData.map((item) => ({
        Mes: item.month || item.monthFull || "",
        "Mes Completo": item.monthFull || item.month || "",
        "Receitas (R$)": (item.income || 0).toFixed(2),
        "Despesas (R$)": (item.expenses || 0).toFixed(2),
        "Saldo (R$)": (item.balance || 0).toFixed(2),
        "Numero de Transacoes": item.transactionCount || 0,
      }));
    } else if (chartType === "category_trend" || chartType === "categories") {
      csvData = chartData.map((item) => ({
        Categoria: item.name || "",
        "Valor Total (R$)": (item.value || 0).toFixed(2),
        "Numero de Transacoes": item.count || 0,
        Cor: item.color || "",
      }));
    } else {
      // Fallback genérico
      csvData = chartData.map((item) => ({
        ...item,
      }));
    }

    if (csvData.length === 0) {
      showNotification(
        "Erro ao processar dados para exportação",
        "error",
        "alerts"
      );
      return;
    }

    // Criar CSV
    const headers = Object.keys(csvData[0]).join(";");
    const rows = csvData.map((row) => Object.values(row).join(";"));
    const csvContent = [headers, ...rows].join("\n");

    // Download
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`Dados exportados: ${filename}.csv`, "success", "reports");
  };

  const saveUserSettings = async () => {
    setIsLoadingSettings(true);

    try {
      const changes = [];
      let userUpdated = false;
      let preferencesUpdated = false;

      // 1. ATUALIZAR DADOS DO USUÁRIO (nome/email)
      const userUpdates = {};

      if (
        tempSettings.displayName &&
        tempSettings.displayName !== currentUser.name
      ) {
        userUpdates.name = tempSettings.displayName;
        changes.push(`nome alterado para "${tempSettings.displayName}"`);
      }

      if (tempSettings.email && tempSettings.email !== currentUser.email) {
        userUpdates.email = tempSettings.email;
        changes.push(`email alterado para "${tempSettings.email}"`);
      }

      // Se houver mudanças no usuário, enviar para API
      if (Object.keys(userUpdates).length > 0) {
        try {
          console.log("Atualizando dados do usuário:", userUpdates);
          const updatedUser = await userService.update(
            currentUser.id,
            userUpdates
          );

          // Atualizar estado local
          setCurrentUser(updatedUser);

          // Atualizar na lista de usuários se existir
          setUsers((prevUsers) =>
            prevUsers.map((user) =>
              user.id === updatedUser.id ? updatedUser : user
            )
          );

          userUpdated = true;
        } catch (error) {
          console.error("Erro ao atualizar usuário:", error);
          throw new Error("Erro ao atualizar dados do usuário");
        }
      }

      // 2. ATUALIZAR PREFERÊNCIAS DO USUÁRIO
      const preferencesData = {
        theme: tempSettings.theme || (darkMode ? "dark" : "light"),
        language: tempSettings.language || userSettings.language || "pt-BR",
        date_format:
          tempSettings.dateFormat || userSettings.dateFormat || "DD/MM/YYYY",
        currency_format:
          tempSettings.currencyFormat || userSettings.currencyFormat || "BRL",
        notifications_enabled:
          tempSettings.notifications?.browser ??
          userSettings.notifications?.browser ??
          true,
        dashboard_config: {
          defaultView:
            tempSettings.dashboard?.defaultView ||
            userSettings.dashboard?.defaultView ||
            "detailed",
          defaultPeriod:
            tempSettings.dashboard?.defaultPeriod ||
            userSettings.dashboard?.defaultPeriod ||
            "monthly",
          showAnimations:
            tempSettings.dashboard?.showAnimations ??
            userSettings.dashboard?.showAnimations ??
            true,
          autoRefresh:
            tempSettings.dashboard?.autoRefresh ??
            userSettings.dashboard?.autoRefresh ??
            false,
        },
      };

      try {
        console.log("Salvando preferências:", preferencesData);
        await userService.updatePreferences(preferencesData);
        preferencesUpdated = true;
      } catch (error) {
        console.error("Erro ao salvar preferências:", error);
        throw new Error("Erro ao salvar preferências");
      }

      // 3. APLICAR MUDANÇAS LOCAIS IMEDIATAMENTE
      if (tempSettings.theme) {
        if (tempSettings.theme === "dark") {
          setDarkMode(true);
          changes.push("tema escuro");
        } else if (tempSettings.theme === "light") {
          setDarkMode(false);
          changes.push("tema claro");
        }
      }

      if (
        tempSettings.dashboard &&
        typeof tempSettings.dashboard === "object"
      ) {
        if (tempSettings.dashboard.showAnimations !== undefined) {
          setAnimateCharts(tempSettings.dashboard.showAnimations);
          changes.push(
            tempSettings.dashboard.showAnimations
              ? "animações ativadas"
              : "animações desativadas"
          );
        }
        if (tempSettings.dashboard.defaultView) {
          setReportView(tempSettings.dashboard.defaultView);
          changes.push(
            `visualização padrão: ${tempSettings.dashboard.defaultView}`
          );
        }
        if (tempSettings.dashboard.defaultPeriod) {
          setReportPeriod(tempSettings.dashboard.defaultPeriod);
          changes.push(
            `período padrão: ${tempSettings.dashboard.defaultPeriod}`
          );
        }
      }

      if (tempSettings.currencyFormat) {
        changes.push(`formato de moeda: ${tempSettings.currencyFormat}`);
      }

      if (tempSettings.dateFormat) {
        changes.push(`formato de data: ${tempSettings.dateFormat}`);
      }

      if (tempSettings.language) {
        changes.push(`idioma: ${tempSettings.language}`);
      }

      // 4. ATUALIZAR ESTADO LOCAL
      setUserSettings((prev) => ({
        ...prev,
        ...tempSettings,
        // Garantir que as preferências do dashboard sejam mescladas corretamente
        dashboard: {
          ...prev.dashboard,
          ...(tempSettings.dashboard || {}),
        },
        notifications: {
          ...prev.notifications,
          ...(tempSettings.notifications || {}),
        },
      }));

      // 5. FORÇAR RE-RENDERIZAÇÃO
      window.dispatchEvent(new Event("settingsChanged"));

      // 6. MOSTRAR NOTIFICAÇÃO DE SUCESSO
      const message =
        changes.length > 0
          ? `Configurações aplicadas: ${changes.join(", ")}`
          : "Configurações salvas!";

      showNotificationIfEnabled(message, "success", "general");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      showNotificationIfEnabled(
        error.message || "Erro ao salvar configurações",
        "error",
        "alerts"
      );
    } finally {
      setIsLoadingSettings(false);
      setShowUserSettings(false);
      setTempSettings({});
    }
  };

  // ADICIONAR: Função para carregar preferências ao fazer login
  const loadUserPreferences = async () => {
    try {
      console.log("Carregando preferências do usuário...");

      console.log("🔍 DEBUG: Iniciando carregamento de preferências...");

      // 1. Verificar se há token
      const token = localStorage.getItem("@FinanceControl:token");
      console.log("🔑 Token disponível:", !!token);
      if (token) {
        console.log(
          "🔑 Token (primeiros 20 chars):",
          token.substring(0, 20) + "..."
        );
      } else {
        console.error("❌ ERRO: Token não encontrado!");
        return;
      }

      // 2. Verificar configuração da API
      console.log("🌐 Base URL da API:", api.defaults.baseURL);
      console.log(
        "🎯 URL completa:",
        api.defaults.baseURL + "/users/preferences"
      );

      // 3. Verificar headers
      console.log("📋 Headers que serão enviados:");
      console.log(
        "  Authorization:",
        `Bearer ${token ? "***TOKEN***" : "NONE"}`
      );
      console.log("  Content-Type:", "application/json");

      // 4. Fazer chamada com logs detalhados
      console.log("📞 Fazendo chamada para /users/preferences...");

      // Buscar preferências do backend
      const response = await api.get("/users/preferences");

      console.log("✅ Resposta recebida:", response);
      console.log("📊 Status:", response.status);
      console.log("📝 Data:", response.data);

      const preferences = response.data;
      console.log("Preferências carregadas:", preferences);

      if (preferences) {
        // Aplicar tema
        if (preferences.theme) {
          setDarkMode(preferences.theme === "dark");
        }

        // Aplicar configurações de dashboard
        if (preferences.dashboard_config) {
          if (preferences.dashboard_config.defaultView) {
            setReportView(preferences.dashboard_config.defaultView);
          }
          if (preferences.dashboard_config.defaultPeriod) {
            setReportPeriod(preferences.dashboard_config.defaultPeriod);
          }
          if (preferences.dashboard_config.showAnimations !== undefined) {
            setAnimateCharts(preferences.dashboard_config.showAnimations);
          }
        }

        // Atualizar estado de configurações do usuário
        setUserSettings((prev) => ({
          ...prev,
          displayName: currentUser?.name || "",
          email: currentUser?.email || "",
          language: preferences.language || "pt-BR",
          dateFormat: preferences.date_format || "DD/MM/YYYY",
          currencyFormat: preferences.currency_format || "BRL",
          notifications: {
            ...prev.notifications,
            browser: preferences.notifications_enabled ?? true,
          },
          dashboard: {
            ...prev.dashboard,
            ...(preferences.dashboard_config || {}),
          },
        }));

        // Aplicar formato de data e moeda ao sistema de preferências
        if (preferences.date_format) {
          setSystemPreferences((prev) => ({
            ...prev,
            dateFormat: preferences.date_format
              .toLowerCase()
              .replace(/[^dmy]/g, "/"),
          }));
        }

        if (preferences.currency_format) {
          setSystemPreferences((prev) => ({
            ...prev,
            currencyFormat: preferences.currency_format,
          }));
        }
      }
    } catch (error) {
      console.error("❌ ERRO DETALHADO ao carregar preferências:");
      console.error("  Tipo do erro:", error.constructor.name);
      console.error("  Mensagem:", error.message);
      console.error("  Código:", error.code);

      if (error.response) {
        console.error("  Status HTTP:", error.response.status);
        console.error("  Status Text:", error.response.statusText);
        console.error("  Response Data:", error.response.data);
        console.error("  Response Headers:", error.response.headers);
      } else if (error.request) {
        console.error("  Request feito mas sem resposta:", error.request);
      } else {
        console.error("  Erro na configuração:", error.message);
      }
      console.error("  Stack trace:", error.stack);
    }
  };

  const resetUserSettings = () => {
    setTempSettings({});
    showNotification(
      "Configurações resetadas para o padrão",
      "info",
      "general"
    );
  };

  const exportUserSettings = () => {
    const settingsData = {
      user: currentUser.name,
      settings: userSettings,
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(settingsData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `configuracoes_${currentUser.name
      .toLowerCase()
      .replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
    link.click();

    // CORRIGIR: Usar notificação condicional para relatórios
    showNotificationIfEnabled(
      "Configurações exportadas!",
      "success",
      "general"
    );
  };

  const getSettingValue = (path, defaultValue = "") => {
    const keys = path.split(".");

    // Primeiro tentar tempSettings (apenas se realmente existe)
    if (Object.keys(tempSettings).length > 0) {
      let value = tempSettings;
      let foundInTemp = true;

      for (const key of keys) {
        if (value && typeof value === "object" && key in value) {
          value = value[key];
        } else {
          foundInTemp = false;
          break;
        }
      }

      if (foundInTemp && value !== undefined) {
        return value;
      }
    }

    // Fallback para valores atuais do sistema
    switch (path) {
      case "displayName":
        return currentUser?.name || "";
      case "email":
        return currentUser?.email || "";
      case "theme":
        return darkMode ? "dark" : "light";
      case "dashboard.showAnimations":
        return animateCharts;
      case "dashboard.defaultView":
        return reportView;
      case "dashboard.defaultPeriod":
        return reportPeriod;
      case "language":
        return userSettings.language || "pt-BR";
      case "timezone":
        return userSettings.timezone || "America/Sao_Paulo";
      case "dateFormat":
        return userSettings.dateFormat || "DD/MM/YYYY";
      case "currencyFormat":
        return userSettings.currencyFormat || "BRL";
      case "notifications.email":
        return userSettings.notifications?.email ?? true;
      case "notifications.browser":
        return userSettings.notifications?.browser ?? true;
      case "notifications.reports":
        return userSettings.notifications?.reports ?? true;
      case "notifications.alerts":
        return userSettings.notifications?.alerts ?? false;
      case "dashboard.autoRefresh":
        return userSettings.dashboard?.autoRefresh ?? false;
      default:
        return defaultValue;
    }
  };

  const updateSetting = (path, value) => {
    const keys = path.split(".");
    const newSettings = { ...tempSettings };

    let current = newSettings;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    setTempSettings(newSettings);
  };

  const shouldShowNotification = (type = "general") => {
    // Verificar configurações de notificação
    const settings = userSettings.notifications || {};

    switch (type) {
      case "email":
        return settings.email ?? true;
      case "browser":
        return settings.browser ?? true;
      case "reports":
        return settings.reports ?? true;
      case "alerts":
        return settings.alerts ?? false;
      case "general":
      default:
        return settings.browser ?? true; // Notificações gerais seguem a configuração do navegador
    }
  };

  // Remover variáveis e funções não utilizadas
  const showNotificationIfEnabled = (
    message,
    type = "info",
    notificationType = "general"
  ) => {
    if (shouldShowNotification(notificationType)) {
      showNotification(message, type);
    }
  };

  const updateSystemPreference = (key, value) => {
    setSystemPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Auto-aplicar algumas preferências imediatamente
    switch (key) {
      case "defaultReportPeriod":
        if (typeof setReportPeriod !== "undefined") setReportPeriod(value);
        break;
      case "defaultReportView":
        if (typeof setReportView !== "undefined") setReportView(value);
        break;
      case "defaultChartType":
        if (typeof setChartType !== "undefined") setChartType(value);
        break;
      case "showChartsOnLoad":
        if (typeof setShowCharts !== "undefined") setShowCharts(value);
        break;
    }

    // Notificar apenas para mudanças não-slider
    if (key !== "autoSaveDelay") {
      showNotification(
        `Preferência "${getPreferenceLabel(key)}" atualizada`,
        "success"
      );
    }
  };

  const getPreferenceLabel = (key) => {
    const labels = {
      defaultReportPeriod: "Período padrão dos relatórios",
      defaultReportView: "Visualização padrão",
      defaultChartType: "Tipo de gráfico padrão",
      showChartsOnLoad: "Mostrar gráficos ao carregar",
      dateFormat: "Formato de data",
      currencyFormat: "Formato de moeda",
      numberFormat: "Formato de números",
      autoSaveDelay: "Delay do auto-save",
      showNotifications: "Mostrar notificações",
      requireConfirmation: "Exigir confirmação",
      itemsPerPage: "Itens por página",
      cacheReports: "Cache de relatórios",
      animationsEnabled: "Animações habilitadas",
    };
    return labels[key] || key;
  };

  const resetSystemPreferences = () => {
    const defaultPrefs = {
      defaultReportPeriod: "monthly",
      defaultReportView: "detailed",
      defaultChartType: "category",
      showChartsOnLoad: true,
      dateFormat: "dd/mm/yyyy",
      currencyFormat: "BRL",
      numberFormat: "pt-BR",
      autoSaveDelay: 1000,
      showNotifications: true,
      requireConfirmation: true,
      itemsPerPage: 10,
      cacheReports: true,
      animationsEnabled: true,
    };

    setSystemPreferences(defaultPrefs);
    showNotification("Preferências do sistema resetadas para padrão", "info");
  };

  const exportSystemPreferences = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `preferencias_sistema_${timestamp}.json`;

    const dataStr = JSON.stringify(systemPreferences, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification("Preferências exportadas com sucesso", "success");
  };

  const importSystemPreferences = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedPrefs = JSON.parse(e.target.result);

        // Validar se tem as chaves necessárias
        const requiredKeys = [
          "defaultReportPeriod",
          "dateFormat",
          "currencyFormat",
        ];
        const isValid = requiredKeys.every((key) =>
          importedPrefs.hasOwnProperty(key)
        );

        if (!isValid) {
          showNotification("Arquivo de preferências inválido", "error");
          return;
        }

        setSystemPreferences((prev) => ({ ...prev, ...importedPrefs }));
        showNotification("Preferências importadas com sucesso", "success");
      } catch (error) {
        showNotification(
          "Erro ao importar preferências: arquivo inválido",
          "error"
        );
      }
    };
    reader.readAsText(file);
  };

  const ToggleSwitch = ({ enabled, onToggle, color = "blue" }) => {
    const colors = {
      blue: enabled ? "bg-blue-600" : darkMode ? "bg-gray-600" : "bg-gray-200",
      green: enabled
        ? "bg-green-600"
        : darkMode
        ? "bg-gray-600"
        : "bg-gray-200",
      purple: enabled
        ? "bg-purple-600"
        : darkMode
        ? "bg-gray-600"
        : "bg-gray-200",
      yellow: enabled
        ? "bg-yellow-600"
        : darkMode
        ? "bg-gray-600"
        : "bg-gray-200",
      orange: enabled
        ? "bg-orange-600"
        : darkMode
        ? "bg-gray-600"
        : "bg-gray-200",
    };

    return (
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${colors[color]}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    );
  };

  // ADICIONAR função para aplicar preset sem notificações individuais
  const applyPreset = (presetName, settings) => {
    // Aplicar todas as configurações
    setSystemPreferences((prev) => {
      const newPrefs = { ...prev, ...settings };
      return newPrefs;
    });

    showNotification(
      `🎯 Preset "${presetName}" aplicado com sucesso!`,
      "success"
    );
  };

  const generateTimeSeriesData = (period) => {
    const months = [
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
    ];
    const currentDate = new Date();
    const data = [];

    let periodsToShow;
    switch (period) {
      case "3months":
        periodsToShow = 3;
        break;
      case "6months":
        periodsToShow = 6;
        break;
      case "12months":
        periodsToShow = 12;
        break;
      default:
        periodsToShow = 6;
    }

    for (let i = periodsToShow - 1; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthNumber = date.getMonth() + 1;
      const year = date.getFullYear();

      // Filtrar transações do mês
      const monthTransactions = transactions.filter((t) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getMonth() + 1 === monthNumber &&
          transactionDate.getFullYear() === year
        );
      });

      const income = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = income - expenses;

      data.push({
        month: months[date.getMonth()],
        year: year,
        period: `${months[date.getMonth()]}/${year.toString().slice(-2)}`,
        income,
        expenses,
        balance,
        transactionCount: monthTransactions.length,
      });
    }

    return data;
  };

  const calculateTrends = (data) => {
    if (data.length < 2) return null;

    const incomeData = data.map((d) => d.income);
    const expenseData = data.map((d) => d.expenses);
    const balanceData = data.map((d) => d.balance);

    // Calcular tendências (simplificado)
    const incomeTrend = incomeData[incomeData.length - 1] - incomeData[0];
    const expenseTrend = expenseData[expenseData.length - 1] - expenseData[0];
    const balanceTrend = balanceData[balanceData.length - 1] - balanceData[0];

    // Calcular médias
    const avgIncome =
      incomeData.reduce((sum, val) => sum + val, 0) / incomeData.length;
    const avgExpenses =
      expenseData.reduce((sum, val) => sum + val, 0) / expenseData.length;
    const avgBalance =
      balanceData.reduce((sum, val) => sum + val, 0) / balanceData.length;

    return {
      income: {
        trend: incomeTrend,
        average: avgIncome,
        direction: incomeTrend > 0 ? "up" : incomeTrend < 0 ? "down" : "stable",
      },
      expenses: {
        trend: expenseTrend,
        average: avgExpenses,
        direction:
          expenseTrend > 0 ? "up" : expenseTrend < 0 ? "down" : "stable",
      },
      balance: {
        trend: balanceTrend,
        average: avgBalance,
        direction:
          balanceTrend > 0 ? "up" : balanceTrend < 0 ? "down" : "stable",
      },
    };
  };

  const updateTimeSeriesData = useCallback(() => {
    const newData = generateTimeSeriesData(trendPeriod);
    setTimeSeriesData(newData);

    const analysis = calculateTrends(newData);
    setTrendAnalysis(analysis);
  }, [trendPeriod]);

  useEffect(() => {
    if (transactions.length > 0) {
      updateTimeSeriesData();
    }
  }, [transactions.length, trendPeriod, updateTimeSeriesData]);

  // Recarregar categorias quando a tela mudar para planning
  useEffect(() => {
    if (currentScreen === "planning" && currentUser && dataLoaded) {
      loadCategories();
    }
  }, [currentScreen, currentUser, dataLoaded]);

  const LineChart = ({ data, width = 400, height = 200, type = "balance" }) => {
    if (!data || data.length === 0) return null;

    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Extrair valores para o tipo selecionado
    const values = data.map((d) => d[type]);
    const maxValue = Math.max(...values, 0);
    const minValue = Math.min(...values, 0);
    const valueRange = maxValue - minValue || 1;

    // Função para calcular posição Y
    const getY = (value) => {
      return chartHeight - ((value - minValue) / valueRange) * chartHeight;
    };

    // Função para calcular posição X
    const getX = (index) => {
      return (index / (data.length - 1)) * chartWidth;
    };

    // Gerar path da linha
    const pathData = data
      .map((d, i) => {
        const x = getX(i);
        const y = getY(d[type]);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    // Cor baseada no tipo
    const getColor = () => {
      switch (type) {
        case "income":
          return "#10b981";
        case "expenses":
          return "#ef4444";
        case "balance":
          return values[values.length - 1] >= 0 ? "#10b981" : "#ef4444";
        default:
          return "#3b82f6";
      }
    };

    return (
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Linha do zero se houver valores negativos */}
          {minValue < 0 && (
            <line
              x1={0}
              y1={getY(0)}
              x2={chartWidth}
              y2={getY(0)}
              stroke={darkMode ? "#6b7280" : "#d1d5db"}
              strokeDasharray="3,3"
            />
          )}

          {/* Linha principal */}
          <path
            d={pathData}
            fill="none"
            stroke={getColor()}
            strokeWidth="2"
            className="transition-all duration-300"
          />

          {/* Pontos */}
          {data.map((d, i) => (
            <circle
              key={`unique-prefix-${i}`}
              cx={getX(i)}
              cy={getY(d[type])}
              r="4"
              fill={getColor()}
              className="hover:r-6 transition-all duration-200 cursor-pointer"
              onMouseEnter={(e) => {
                // Simples tooltip
                const tooltip = document.createElement("div");
                tooltip.style.cssText = `
                position: fixed;
                background: ${darkMode ? "#1f2937" : "white"};
                color: ${darkMode ? "white" : "black"};
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
                pointer-events: none;
              `;
                tooltip.innerHTML = `
                <strong>${d.period}</strong><br/>
                ${
                  type === "income"
                    ? "Receitas"
                    : type === "expenses"
                    ? "Despesas"
                    : "Saldo"
                }: ${formatCurrency(d[type])}
              `;
                document.body.appendChild(tooltip);

                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = rect.left + "px";
                tooltip.style.top = rect.top - 60 + "px";

                e.target._tooltip = tooltip;
              }}
              onMouseLeave={(e) => {
                if (e.target._tooltip) {
                  document.body.removeChild(e.target._tooltip);
                  delete e.target._tooltip;
                }
              }}
            />
          ))}

          {/* Eixo X - Labels */}
          {data.map((d, i) => (
            <text
              key={`unique-prefix-${i}`}
              x={getX(i)}
              y={chartHeight + 20}
              textAnchor="middle"
              className={`text-xs fill-current ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {d.period}
            </text>
          ))}

          {/* Eixo Y - Labels */}
          <text
            x={-40}
            y={getY(maxValue)}
            textAnchor="middle"
            className={`text-xs fill-current ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {formatCurrency(maxValue)}
          </text>

          {minValue < 0 && (
            <text
              x={-40}
              y={getY(minValue)}
              textAnchor="middle"
              className={`text-xs fill-current ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {formatCurrency(minValue)}
            </text>
          )}

          <text
            x={-40}
            y={getY(0)}
            textAnchor="middle"
            className={`text-xs fill-current ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {formatCurrency(0)}
          </text>
        </g>
      </svg>
    );
  };

  // TELA DE LOGIN
  if (currentScreen === "login") {
    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 ${
          darkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="max-w-md w-full">
          <div
            className={`rounded-lg shadow-md p-8 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Toggle Dark Mode no Login */}
            <div className="flex justify-end mb-4">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
                title={darkMode ? "Modo Claro" : "Modo Escuro"}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </div>

            <div className="text-center mb-8">
              <DollarSign className="mx-auto text-green-600 mb-4" size={48} />
              <h1
                className={`text-2xl font-bold ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Sistema Financeiro
              </h1>
              <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                Faça login para continuar
              </p>
            </div>

            {/* Mensagem de erro geral */}
            {formErrors.login && formErrors.login.general && (
              <div
                className={`mb-4 p-3 border rounded-lg text-sm ${
                  darkMode
                    ? "bg-red-900 border-red-700 text-red-300"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {formErrors.login.general}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, email: e.target.value });
                    // Limpar erro quando usuário começar a digitar
                    if (formErrors.login && formErrors.login.email) {
                      clearFieldError("login", "email");
                    }
                  }}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    formErrors.login && formErrors.login.email
                      ? darkMode
                        ? "border-red-500 bg-red-900/20 text-white"
                        : "border-red-500 bg-red-50"
                      : darkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white"
                  }`}
                  placeholder="seu@email.com"
                />
                {formErrors.login && formErrors.login.email && (
                  <p
                    className={`text-sm mt-1 ${
                      darkMode ? "text-red-400" : "text-red-500"
                    }`}
                  >
                    {formErrors.login.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Senha <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => {
                    setLoginForm({ ...loginForm, password: e.target.value });
                    // Limpar erro quando usuário começar a digitar
                    if (formErrors.login && formErrors.login.password) {
                      clearFieldError("login", "password");
                    }
                  }}
                  className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    formErrors.login && formErrors.login.password
                      ? darkMode
                        ? "border-red-500 bg-red-900/20 text-white"
                        : "border-red-500 bg-red-50"
                      : darkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white"
                  }`}
                  placeholder="••••••••"
                />
                {formErrors.login && formErrors.login.password && (
                  <p
                    className={`text-sm mt-1 ${
                      darkMode ? "text-red-400" : "text-red-500"
                    }`}
                  >
                    {formErrors.login.password}
                  </p>
                )}
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoading.login}
                className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  isLoading.login
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
              >
                {isLoading.login && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                )}
                {isLoading.login ? "Entrando..." : "Entrar"}
              </button>
            </div>

            <div
              className={`mt-8 p-4 rounded-lg ${
                darkMode ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <h3
                className={`font-medium mb-2 ${
                  darkMode ? "text-gray-200" : "text-gray-800"
                }`}
              >
                Usuários de Teste:
              </h3>
              <div
                className={`text-sm space-y-1 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                <p>
                  <strong>Super:</strong> admin@empresa.com / 123456
                </p>
                <p>
                  <strong>Editor:</strong> joao@empresa.com / 123456
                </p>
                <p>
                  <strong>Viewer:</strong> maria@empresa.com / 123456
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Menu Principal
  if (currentScreen === "menu") {
    return (
      <div
        className={`min-h-screen p-4 ${
          darkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header
            className={`shadow-lg border-b rounded-lg mb-5 ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } transition-all duration-300 ease-in-out`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">💰</div>
                  <div>
                    <h1
                      className={`text-2xl font-extrabold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Sistema de Controle Financeiro
                    </h1>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Gerencie suas categorias, transações e visualize
                      relatórios detalhados
                    </p>
                  </div>
                </div>

                {/* User Menu */}
                <div className="flex items-center justify-end">
                  <div>
                    <div
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Logado como:
                    </div>
                    <div
                      className={`font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {currentUser?.name}
                    </div>
                  </div>

                  {/* Aumentando a margem esquerda para afastar os botões do texto */}
                  <div className="flex items-center ml-12 gap-4">
                    {/* Theme toggle */}
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`p-3 rounded-full transition-all duration-300 ease-in-out ${
                        darkMode
                          ? "bg-gray-700 text-yellow-400 hover:bg-gray-600 shadow-md"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300 shadow-md"
                      }`}
                      title={
                        darkMode
                          ? "Mudar para tema claro"
                          : "Mudar para tema escuro"
                      }
                    >
                      {darkMode ? "☀️" : "🌙"}
                    </button>

                    {/* Settings */}
                    <button
                      onClick={() => {
                        setTempSettings({});
                        setShowUserSettings(true);
                      }}
                      className={`p-3 rounded-full transition-all duration-300 ease-in-out ${
                        darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600 shadow-md"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300 shadow-md"
                      }`}
                      title="Configurações do Usuário"
                    >
                      ⚙️
                    </button>

                    {/* Logout button */}
                    <button
                      onClick={() => setShowLogoutConfirm(true)}
                      className={`p-3 rounded-full transition-all duration-300 ease-in-out ${
                        darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600 shadow-md"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300 shadow-md"
                      }`}
                      title="Sair da Conta"
                    >
                      🚪
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Planejamento */}
            {hasPermission("planning") && (
              <div
                onClick={() => setCurrentScreen("planning")}
                className={`rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500 ${
                  darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white"
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-blue-100 p-4 rounded-full">
                    <PiggyBank className="text-blue-600" size={32} />
                  </div>
                  <h3
                    className={`text-xl font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Planejamento
                  </h3>
                  <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                    Defina categorias e orçamentos mensais para controle
                    financeiro
                  </p>
                </div>
              </div>
            )}

            {/* Lançamentos */}
            {hasPermission("transactions") && (
              <div
                onClick={() => setCurrentScreen("transactions")}
                className={`rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500 ${
                  darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white"
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-green-100 p-4 rounded-full">
                    <Calendar className="text-green-600" size={32} />
                  </div>
                  <h3
                    className={`text-xl font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Lançamentos
                  </h3>
                  <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                    Registre receitas e despesas realizadas no dia a dia
                  </p>
                </div>
              </div>
            )}

            {/* Relatórios */}
            {hasPermission("reports") && (
              <div
                onClick={() => setCurrentScreen("reports")}
                className={`rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-500 ${
                  darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white"
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-purple-100 p-4 rounded-full">
                    <BarChart3 className="text-purple-600" size={32} />
                  </div>
                  <h3
                    className={`text-xl font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Relatórios
                  </h3>
                  <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                    Visualize performance financeira e fluxo de caixa detalhado
                  </p>
                </div>
              </div>
            )}

            {/* Gerenciar Usuários */}
            {hasPermission("user_management") && (
              <div
                onClick={() => setCurrentScreen("users")}
                className={`rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-red-500 ${
                  darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white"
                }`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-red-100 p-4 rounded-full">
                    <Users className="text-red-600" size={32} />
                  </div>
                  <h3
                    className={`text-xl font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Usuários
                  </h3>
                  <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                    Gerencie usuários e permissões do sistema
                  </p>
                </div>
              </div>
            )}

            {/* Card Configurações */}
            {hasPermission("user_management") && (
              <div
                onClick={() => setCurrentScreen("system-preferences")}
                className={`rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-500 ${
                  darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white"
                }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-indigo-100 p-4 rounded-full mb-4">
                    <Settings className="text-indigo-600" size={32} />
                  </div>
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Configurações
                  </h3>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Preferências e configurações globais do sistema
                  </p>
                </div>
              </div>
            )}

            {/* Botão para mostrar gráficos quando ocultos */}
            {!showTrendCharts && (
              <div className="text-center">
                <button
                  onClick={() => setShowTrendCharts(true)}
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto ${
                    darkMode
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  📈 Mostrar Análise de Tendências
                </button>
              </div>
            )}
          </div>

          {/* Modal de Logout */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div
                className={`rounded-lg p-6 max-w-sm w-full mx-4 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-3 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Confirmar Logout
                </h3>
                <p
                  className={`mb-6 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Tem certeza que deseja sair do sistema?
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={cancelLogout}
                    className={`px-4 py-2 transition-colors ${
                      darkMode
                        ? "text-gray-300 hover:text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Confirmação - Menu Principal */}
          {confirmDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div
                className={`rounded-lg p-6 max-w-md w-full mx-4 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-3 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {confirmDialog.title}
                </h3>
                <p
                  className={`mb-6 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {confirmDialog.message}
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={confirmDialog.onCancel}
                    className={`px-4 py-2 transition-colors ${
                      darkMode
                        ? "text-gray-300 hover:text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    {confirmDialog.type === "warning" ? "Entendi" : "Cancelar"}
                  </button>
                  {confirmDialog.type !== "warning" && (
                    <button
                      onClick={() => {
                        confirmDialog.onConfirm();
                        hideConfirmDialog();
                      }}
                      className={`px-4 py-2 rounded-lg text-white transition-colors ${
                        confirmDialog.type === "danger"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {confirmDialog.type === "danger"
                        ? "Excluir"
                        : "Confirmar"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notificações - Menu Principal */}
          {notifications.length > 0 && (
            <div className="fixed top-4 right-4 z-50 space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-md animate-slide-in ${
                    notification.type === "success"
                      ? darkMode
                        ? "bg-green-800 border-green-600 text-green-100"
                        : "bg-green-50 border-green-200 text-green-800"
                      : notification.type === "error"
                      ? darkMode
                        ? "bg-red-800 border-red-600 text-red-100"
                        : "bg-red-50 border-red-200 text-red-800"
                      : darkMode
                      ? "bg-blue-800 border-blue-600 text-blue-100"
                      : "bg-blue-50 border-blue-200 text-blue-800"
                  } border`}
                >
                  <div className="flex-shrink-0">
                    {notification.type === "success" && (
                      <span className="text-lg">✅</span>
                    )}
                    {notification.type === "error" && (
                      <span className="text-lg">❌</span>
                    )}
                    {notification.type === "info" && (
                      <span className="text-lg">ℹ️</span>
                    )}
                  </div>
                  <span className="font-medium flex-1">
                    {notification.message}
                  </span>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="flex-shrink-0 hover:opacity-70 transition-opacity"
                  >
                    <span className="text-lg">❌</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* User Settings Modal */}
          {showUserSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div
                className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        ⚙️
                      </div>
                      <div>
                        <h3
                          className={`text-xl font-semibold ${
                            darkMode ? "text-white" : "text-gray-800"
                          }`}
                        >
                          Configurações do Usuário
                          {/* indicador de mudanças */}
                          {Object.keys(tempSettings).length > 0 && (
                            <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              {Object.keys(tempSettings).length} alteraç
                              {Object.keys(tempSettings).length !== 1
                                ? "ões"
                                : "ão"}{" "}
                              pendente
                              {Object.keys(tempSettings).length !== 1
                                ? "s"
                                : ""}
                            </span>
                          )}
                        </h3>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Personalize sua experiência no sistema
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowUserSettings(false)}
                      className={`p-2 rounded-lg transition-colors ${
                        darkMode
                          ? "hover:bg-gray-700 text-gray-400"
                          : "hover:bg-gray-100 text-gray-600"
                      }`}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Settings Tabs */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Perfil */}
                    <div
                      className={`p-4 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <h4
                        className={`font-medium mb-4 ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        👤 Perfil
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Nome de Exibição
                          </label>
                          <input
                            type="text"
                            value={getSettingValue(
                              "displayName",
                              currentUser?.name || ""
                            )}
                            onChange={(e) =>
                              updateSetting("displayName", e.target.value)
                            }
                            className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                              darkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          />
                        </div>

                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Email
                          </label>
                          <input
                            type="email"
                            value={getSettingValue(
                              "email",
                              currentUser?.email || ""
                            )}
                            onChange={(e) =>
                              updateSetting("email", e.target.value)
                            }
                            className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                              darkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          />
                        </div>

                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Idioma
                          </label>
                          <select
                            value={getSettingValue("language", "pt-BR")}
                            onChange={(e) =>
                              updateSetting("language", e.target.value)
                            }
                            className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                              darkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                            <option value="en-US">🇺🇸 English (US)</option>
                            <option value="es-ES">🇪🇸 Español</option>
                          </select>
                        </div>

                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Fuso Horário
                          </label>
                          <select
                            value={getSettingValue(
                              "timezone",
                              "America/Sao_Paulo"
                            )}
                            onChange={(e) =>
                              updateSetting("timezone", e.target.value)
                            }
                            className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                              darkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            <option value="America/Sao_Paulo">
                              São Paulo (GMT-3)
                            </option>
                            <option value="America/New_York">
                              New York (GMT-5)
                            </option>
                            <option value="Europe/London">
                              London (GMT+0)
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Formatação */}
                    <div
                      className={`p-4 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <h4
                        className={`font-medium mb-4 ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        🎨 Formatação
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Formato de Data
                          </label>
                          <select
                            value={getSettingValue("dateFormat", "DD/MM/YYYY")}
                            onChange={(e) =>
                              updateSetting("dateFormat", e.target.value)
                            }
                            className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                              darkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            <option value="DD/MM/YYYY">31/12/2025</option>
                            <option value="MM/DD/YYYY">12/31/2025</option>
                            <option value="YYYY-MM-DD">2025-12-31</option>
                          </select>
                        </div>

                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Formato de Moeda
                          </label>
                          <select
                            value={getSettingValue("currencyFormat", "BRL")}
                            onChange={(e) =>
                              updateSetting("currencyFormat", e.target.value)
                            }
                            className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                              darkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            <option value="BRL">R$ 1.234,56 (Real)</option>
                            <option value="USD">$ 1,234.56 (Dólar)</option>
                            <option value="EUR">€ 1.234,56 (Euro)</option>
                          </select>
                        </div>

                        <div>
                          <label
                            className={`block text-sm font-medium mb-1 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Tema
                          </label>
                          <select
                            value={getSettingValue(
                              "theme",
                              darkMode ? "dark" : "light"
                            )}
                            onChange={(e) =>
                              updateSetting("theme", e.target.value)
                            }
                            className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                              darkMode
                                ? "border-gray-600 bg-gray-700 text-white"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            <option value="light">☀️ Claro</option>
                            <option value="dark">🌙 Escuro</option>
                            <option value="auto">🔄 Automático</option>
                          </select>
                        </div>

                        <div className="pt-2">
                          <h5
                            className={`text-sm font-medium mb-3 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Dashboard Padrão
                          </h5>

                          <div className="space-y-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="defaultView"
                                value="detailed"
                                checked={
                                  getSettingValue(
                                    "dashboard.defaultView",
                                    "detailed"
                                  ) === "detailed"
                                }
                                onChange={(e) =>
                                  updateSetting(
                                    "dashboard.defaultView",
                                    e.target.value
                                  )
                                }
                                className="text-blue-600"
                              />
                              <span
                                className={`text-sm ${
                                  darkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                Visualização Detalhada
                              </span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="defaultView"
                                value="summary"
                                checked={
                                  getSettingValue(
                                    "dashboard.defaultView",
                                    "detailed"
                                  ) === "summary"
                                }
                                onChange={(e) =>
                                  updateSetting(
                                    "dashboard.defaultView",
                                    e.target.value
                                  )
                                }
                                className="text-blue-600"
                              />
                              <span
                                className={`text-sm ${
                                  darkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                Visualização Resumida
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notificações */}
                    <div
                      className={`p-4 rounded-lg border ${
                        darkMode
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <h4
                        className={`font-medium mb-4 ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        🔔 Notificações
                      </h4>

                      <div className="space-y-3">
                        <label className="flex items-center justify-between">
                          <span
                            className={`text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Email
                          </span>
                          <input
                            type="checkbox"
                            checked={getSettingValue(
                              "notifications.email",
                              true
                            )}
                            onChange={(e) =>
                              updateSetting(
                                "notifications.email",
                                e.target.checked
                              )
                            }
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <span
                            className={`text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Navegador
                          </span>
                          <input
                            type="checkbox"
                            checked={getSettingValue(
                              "notifications.browser",
                              true
                            )}
                            onChange={(e) =>
                              updateSetting(
                                "notifications.browser",
                                e.target.checked
                              )
                            }
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <span
                            className={`text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Relatórios
                          </span>
                          <input
                            type="checkbox"
                            checked={getSettingValue(
                              "notifications.reports",
                              true
                            )}
                            onChange={(e) =>
                              updateSetting(
                                "notifications.reports",
                                e.target.checked
                              )
                            }
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <span
                            className={`text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Alertas
                          </span>
                          <input
                            type="checkbox"
                            checked={getSettingValue(
                              "notifications.alerts",
                              false
                            )}
                            onChange={(e) =>
                              updateSetting(
                                "notifications.alerts",
                                e.target.checked
                              )
                            }
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                        </label>
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <h5
                          className={`text-sm font-medium mb-3 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Performance
                        </h5>

                        <label className="flex items-center justify-between">
                          <span
                            className={`text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Animações
                          </span>
                          <input
                            type="checkbox"
                            checked={getSettingValue(
                              "dashboard.showAnimations",
                              true
                            )}
                            onChange={(e) =>
                              updateSetting(
                                "dashboard.showAnimations",
                                e.target.checked
                              )
                            }
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                        </label>

                        <label className="flex items-center justify-between mt-2">
                          <span
                            className={`text-sm ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Atualização Automática
                          </span>
                          <input
                            type="checkbox"
                            checked={getSettingValue(
                              "dashboard.autoRefresh",
                              false
                            )}
                            onChange={(e) =>
                              updateSetting(
                                "dashboard.autoRefresh",
                                e.target.checked
                              )
                            }
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex gap-2">
                      <button
                        onClick={exportUserSettings}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          darkMode
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        📄 Exportar Config
                      </button>

                      <button
                        onClick={resetUserSettings}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          darkMode
                            ? "bg-yellow-600 text-white hover:bg-yellow-700"
                            : "bg-yellow-600 text-white hover:bg-yellow-700"
                        }`}
                      >
                        🔄 Resetar
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowUserSettings(false)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          darkMode
                            ? "bg-gray-600 text-white hover:bg-gray-700"
                            : "bg-gray-600 text-white hover:bg-gray-700"
                        }`}
                      >
                        Cancelar
                      </button>

                      <button
                        onClick={saveUserSettings}
                        disabled={isLoadingSettings}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                          isLoadingSettings
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        } ${
                          darkMode
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isLoadingSettings && (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        )}
                        💾 Salvar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div
          className={`rounded-lg shadow-md p-6 mb-6 ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentScreen("menu")}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                <Home size={20} />
              </button>
              <div>
                <h1
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {currentScreen === "planning" && "Planejamento"}
                  {currentScreen === "transactions" && "Lançamentos"}
                  {currentScreen === "reports" && "Relatórios"}
                  {currentScreen === "users" && "Gerenciar Usuários"}
                </h1>
                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {currentScreen === "planning" &&
                    "Defina suas categorias e orçamentos por mês"}
                  {currentScreen === "transactions" &&
                    "Registre suas receitas e despesas"}
                  {currentScreen === "reports" &&
                    "Acompanhe sua performance financeira"}
                  {currentScreen === "users" &&
                    "Gerencie usuários e permissões do sistema"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <User
                    size={16}
                    className={darkMode ? "text-gray-400" : "text-gray-600"}
                  />
                  <span
                    className={`font-medium ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {currentUser.name}
                  </span>
                </div>
              </div>

              {/* Botão Dark Mode */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-yellow-400"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
                title={darkMode ? "Modo Claro" : "Modo Escuro"}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>

              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Planning Screen */}
        {currentScreen === "planning" && hasPermission("planning") && (
          <div className="space-y-6">
            {/* Planning Mode Selector */}
            <div
              className={`rounded-lg shadow-md p-6 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Tipo de Planejamento
              </h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setPlanningMode("monthly")}
                  className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                    planningMode === "monthly"
                      ? "bg-blue-600 text-white"
                      : darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Calendar size={20} />
                  Planejamento Mensal
                </button>
                <button
                  onClick={() => setPlanningMode("annual")}
                  className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                    planningMode === "annual"
                      ? "bg-green-600 text-white"
                      : darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <BarChart3 size={20} />
                  Planejamento Anual
                </button>
              </div>
              <p
                className={`text-sm mt-2 ${
                  darkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {planningMode === "monthly"
                  ? "Adicione categorias específicas para cada mês"
                  : "Adicione categorias que se aplicam a todos os meses do ano"}
              </p>
            </div>

            {/* Month Selector - Only show in monthly mode */}
            {planningMode === "monthly" && (
              <div
                className={`rounded-lg shadow-md p-6 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <h2
                  className={`text-xl font-semibold mb-4 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Selecionar Mês
                </h2>
                <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
                  {months.map((month) => (
                    <button
                      key={month.value}
                      onClick={() => setSelectedMonth(month.value)}
                      className={`p-3 rounded-lg font-medium text-sm transition-colors ${
                        selectedMonth === month.value
                          ? "bg-blue-600 text-white"
                          : darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {month.name.substring(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add Category Form */}
            <div
              className={`rounded-lg shadow-md p-6 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                {planningMode === "monthly"
                  ? selectedMonth
                    ? `Adicionar Categoria - ${getMonthName(selectedMonth)}`
                    : "Adicionar Categoria - Selecione um Mês"
                  : "Adicionar Categoria - Todos os Meses"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Campo Nome */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nome da categoria"
                    value={newCategory.name}
                    onChange={(e) => {
                      setNewCategory({ ...newCategory, name: e.target.value });
                      if (formErrors.category && formErrors.category.name) {
                        clearFieldError("category", "name");
                      }
                    }}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      formErrors.category && formErrors.category.name
                        ? darkMode
                          ? "border-red-500 bg-red-900/20 text-white placeholder-gray-400"
                          : "border-red-500 bg-red-50"
                        : darkMode
                        ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  {formErrors.category && formErrors.category.name && (
                    <p
                      className={`text-sm mt-1 ${
                        darkMode ? "text-red-400" : "text-red-500"
                      }`}
                    >
                      {formErrors.category.name}
                    </p>
                  )}
                </div>

                {/* Campo Tipo */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newCategory.type}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, type: e.target.value })
                    }
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      darkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                </div>

                {/* Campo Orçamento */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Orçamento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={
                      planningMode === "monthly"
                        ? "Orçamento mensal"
                        : "Orçamento mensal (aplicado a todos)"
                    }
                    value={newCategory.budget}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permitir apenas números e ponto decimal
                      const numericValue = value.replace(/[^\d.]/g, "");
                      setNewCategory({
                        ...newCategory,
                        budget: numericValue,
                      });
                      if (formErrors.category && formErrors.category.budget) {
                        clearFieldError("category", "budget");
                      }
                    }}
                    onBlur={(e) => {
                      // Formatar ao sair do campo
                      const value = parseFloat(e.target.value) || 0;
                      if (value > 0) {
                        setNewCategory({
                          ...newCategory,
                          budget: value.toFixed(2),
                        });
                      }
                    }}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      formErrors.category && formErrors.category.budget
                        ? darkMode
                          ? "border-red-500 bg-red-900/20 text-white placeholder-gray-400"
                          : "border-red-500 bg-red-50"
                        : darkMode
                        ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  {formErrors.category && formErrors.category.budget && (
                    <p
                      className={`text-sm mt-1 ${
                        darkMode ? "text-red-400" : "text-red-500"
                      }`}
                    >
                      {formErrors.category.budget}
                    </p>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      darkMode ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    Máximo: R$ 1.000.000
                  </p>
                </div>

                {/* Botão continua igual */}
                <div>
                  {/* Label com mesma altura dos outros */}
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                    style={{ visibility: "hidden" }}
                  >
                    Adicionar
                  </label>
                  <button
                    onClick={addCategory}
                    disabled={isLoading.addCategory}
                    className={`w-full text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors h-10 ${
                      isLoading.addCategory
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:opacity-90"
                    } ${
                      planningMode === "monthly"
                        ? "bg-blue-600"
                        : "bg-green-600"
                    }`}
                  >
                    {isLoading.addCategory && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    )}
                    <Plus size={16} />
                    {isLoading.addCategory
                      ? "Salvando..."
                      : planningMode === "monthly"
                      ? "Adicionar"
                      : "Adicionar a Todos"}
                  </button>
                </div>
              </div>

              {/* Mostrar erro de mês não selecionado */}
              {formErrors.category && formErrors.category.month && (
                <div
                  className={`mt-4 p-3 border rounded-lg text-sm ${
                    darkMode
                      ? "bg-red-900 border-red-700 text-red-300"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  {formErrors.category.month}
                </div>
              )}
            </div>

            {/* Categories List */}
            <div
              className={`rounded-lg shadow-md p-6 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                {planningMode === "monthly"
                  ? selectedMonth
                    ? `Gastos Planejados - ${getMonthName(selectedMonth)}`
                    : "Gastos Planejados - Selecione um Mês"
                  : "Gastos Planejados - Visão Anual"}
              </h2>
              <div className="space-y-3">
                {planningMode === "monthly"
                  ? // Show categories for selected month
                    getFilteredCategories().map((category) => (
                      <div
                        key={category.id}
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          darkMode
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {category.type === "income" ? (
                            <TrendingUp className="text-green-600" size={20} />
                          ) : (
                            <TrendingDown className="text-red-600" size={20} />
                          )}
                          <div>
                            <h3
                              className={`font-medium ${
                                darkMode ? "text-white" : "text-gray-800"
                              }`}
                            >
                              {category.name}
                            </h3>
                            <p
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              {category.type === "income"
                                ? "Receita"
                                : "Despesa"}{" "}
                              - Orçamento: {formatCurrency(category.budget)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            deleteCategory(category.id, category.name)
                          }
                          disabled={isLoading.deleteCategory}
                          className={`transition-colors ${
                            isLoading.deleteCategory
                              ? "opacity-50 cursor-not-allowed"
                              : darkMode
                              ? "text-red-400 hover:text-red-300"
                              : "text-red-600 hover:text-red-800"
                          }`}
                        >
                          {isLoading.deleteCategory ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    ))
                  : // Show all categories grouped by name
                    (() => {
                      const groupedCategories = categories.reduce(
                        (acc, category) => {
                          const key = `${category.name}-${category.type}`;
                          if (!acc[key]) {
                            acc[key] = {
                              name: category.name,
                              type: category.type,
                              budget: category.budget,
                              months: [],
                              ids: [],
                            };
                          }
                          acc[key].months.push(category.month);
                          acc[key].ids.push(category.id);
                          return acc;
                        },
                        {}
                      );

                      return Object.values(groupedCategories).map(
                        (group, index) => (
                          <div
                            key={`unique-prefix-${index}`}
                            className={`border rounded-lg p-4 ${
                              darkMode
                                ? "border-gray-600 bg-gray-700"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                {group.type === "income" ? (
                                  <TrendingUp
                                    className="text-green-600"
                                    size={20}
                                  />
                                ) : (
                                  <TrendingDown
                                    className="text-red-600"
                                    size={20}
                                  />
                                )}
                                <div>
                                  <h3
                                    className={`font-medium ${
                                      darkMode ? "text-white" : "text-gray-800"
                                    }`}
                                  >
                                    {group.name}
                                  </h3>
                                  <p
                                    className={`text-sm ${
                                      darkMode
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {group.type === "income"
                                      ? "Receita"
                                      : "Despesa"}{" "}
                                    - Orçamento: {formatCurrency(group.budget)}
                                  </p>
                                  <p
                                    className={`text-sm ${
                                      darkMode
                                        ? "text-gray-500"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    Presente em {group.months.length}{" "}
                                    {group.months.length === 1
                                      ? "mês"
                                      : "meses"}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (!isLoading.deleteCategory) {
                                    showConfirmDialog(
                                      "Confirmar Exclusão",
                                      `Tem certeza que deseja excluir a categoria "${group.name}" de todos os meses? Todos os lançamentos relacionados também serão removidos.`,
                                      () =>
                                        performDeleteMultipleCategories(
                                          group.ids,
                                          group.name
                                        ),
                                      "danger"
                                    );
                                  }
                                }}
                                disabled={isLoading.deleteCategory}
                                className={`transition-colors ${
                                  isLoading.deleteCategory
                                    ? "opacity-50 cursor-not-allowed"
                                    : darkMode
                                    ? "text-red-400 hover:text-red-300"
                                    : "text-red-600 hover:text-red-800"
                                }`}
                              >
                                {isLoading.deleteCategory ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            </div>
                          </div>
                        )
                      );
                    })()}
                {(planningMode === "monthly"
                  ? getFilteredCategories().length === 0
                  : categories.length === 0) && (
                  <div
                    className={`text-center py-8 ${
                      darkMode ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    {(planningMode === "monthly"
                      ? getFilteredCategories().length === 0
                      : categories.length === 0) && (
                      <div
                        className={`text-center py-8 ${
                          darkMode ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        {planningMode === "monthly"
                          ? selectedMonth
                            ? `Nenhuma categoria cadastrada para ${getMonthName(
                                selectedMonth
                              )}`
                            : "Selecione um mês para ver as categorias"
                          : "Nenhuma categoria cadastrada"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transactions List */}
        {currentScreen === "transactions" && hasPermission("transactions") && (
          <div className="space-y-6">
            {/* Add Transaction Form */}
            <div
              className={`rounded-lg shadow-md p-6 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Novo Lançamento
              </h2>

              {/* Seletor de Modo */}
              <div className="mb-6">
                <h3
                  className={`text-lg font-medium mb-3 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  Tipo de Categoria
                </h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setTransactionMode("existing");
                      setTransactionForm((prev) => ({
                        ...prev,
                        categoryId: "",
                        pontualName: "",
                        pontualType: "expense",
                      }));
                    }}
                    className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                      transactionMode === "existing"
                        ? "bg-blue-600 text-white"
                        : darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <PiggyBank size={20} />
                    Categoria Planejada
                  </button>
                  <button
                    onClick={() => {
                      setTransactionMode("pontual");
                      setTransactionForm((prev) => ({
                        ...prev,
                        categoryId: "",
                        pontualName: "",
                        pontualType: "expense",
                      }));
                    }}
                    className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                      transactionMode === "pontual"
                        ? "bg-orange-600 text-white"
                        : darkMode
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Plus size={20} />
                    Lançamento Pontual
                  </button>
                </div>
              </div>

              {/* Formulário Unificado */}
              <div className="space-y-4">
                {/* Linha 1: Campo específico do modo */}
                {transactionMode === "existing" ? (
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Categoria <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={transactionForm.categoryId}
                      onChange={(e) => {
                        console.log("📋 SELECT onChange:", {
                          rawValue: e.target.value,
                          type: typeof e.target.value,
                          parsed: parseInt(e.target.value),
                          isNaN: isNaN(parseInt(e.target.value))
                        });
                        
                        setTransactionForm({
                          ...transactionForm,
                          categoryId: e.target.value, // Manter como string por enquanto
                        });
                        if (
                          formErrors.transaction &&
                          formErrors.transaction.categoryId
                        ) {
                          clearFieldError("transaction", "categoryId");
                        }
                      }}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        formErrors.transaction &&
                        formErrors.transaction.categoryId
                          ? darkMode
                            ? "border-red-500 bg-red-900/20 text-white"
                            : "border-red-500 bg-red-50"
                          : darkMode
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <option value="">Selecione a categoria</option>
                      {categories
                        .filter((cat) => cat.month !== "pontual")
                        .map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name} - {getMonthName(category.month)} (
                            {category.type === "income" ? "Receita" : "Despesa"}
                            )
                          </option>
                        ))}
                    </select>
                    {formErrors.transaction &&
                      formErrors.transaction.categoryId && (
                        <p
                          className={`text-sm mt-1 ${
                            darkMode ? "text-red-400" : "text-red-500"
                          }`}
                        >
                          {formErrors.transaction.categoryId}
                        </p>
                      )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Nome da Categoria{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Compra pontual, Gasto extra..."
                        value={transactionForm.pontualName}
                        onChange={(e) => {
                          setTransactionForm({
                            ...transactionForm,
                            pontualName: e.target.value,
                          });
                          if (
                            formErrors.transaction &&
                            formErrors.transaction.pontualName
                          ) {
                            clearFieldError("transaction", "pontualName");
                          }
                        }}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                          formErrors.transaction &&
                          formErrors.transaction.pontualName
                            ? darkMode
                              ? "border-red-500 bg-red-900/20 text-white placeholder-gray-400"
                              : "border-red-500 bg-red-50"
                            : darkMode
                            ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                            : "border-gray-300 bg-white"
                        }`}
                      />
                      {formErrors.transaction &&
                        formErrors.transaction.pontualName && (
                          <p
                            className={`text-sm mt-1 ${
                              darkMode ? "text-red-400" : "text-red-500"
                            }`}
                          >
                            {formErrors.transaction.pontualName}
                          </p>
                        )}
                    </div>
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Tipo <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={transactionForm.pontualType}
                        onChange={(e) =>
                          setTransactionForm({
                            ...transactionForm,
                            pontualType: e.target.value,
                          })
                        }
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                          darkMode
                            ? "border-gray-600 bg-gray-700 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <option value="expense">Despesa</option>
                        <option value="income">Receita</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Linha 2: Campos compartilhados */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Valor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Valor"
                      value={transactionForm.amount}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Permitir apenas números e ponto decimal
                        const numericValue = value.replace(/[^\d.]/g, "");
                        setTransactionForm({
                          ...transactionForm,
                          amount: numericValue,
                        });
                        if (
                          formErrors.transaction &&
                          formErrors.transaction.amount
                        ) {
                          clearFieldError("transaction", "amount");
                        }
                      }}
                      onBlur={(e) => {
                        // Formatar ao sair do campo
                        const value = parseFloat(e.target.value) || 0;
                        if (value > 0) {
                          setTransactionForm({
                            ...transactionForm,
                            amount: value.toFixed(2),
                          });
                        }
                      }}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 transition-colors ${
                        transactionMode === "existing"
                          ? "focus:ring-blue-500"
                          : "focus:ring-orange-500"
                      } focus:border-transparent ${
                        formErrors.transaction && formErrors.transaction.amount
                          ? darkMode
                            ? "border-red-500 bg-red-900/20 text-white placeholder-gray-400"
                            : "border-red-500 bg-red-50"
                          : darkMode
                          ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                          : "border-gray-300 bg-white"
                      }`}
                    />

                    <p
                      className={`text-xs mt-1 ${
                        darkMode ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      Use ponto (.) como separador decimal. Ex: 1500.50
                    </p>

                    {formErrors.transaction &&
                      formErrors.transaction.amount && (
                        <p
                          className={`text-sm mt-1 ${
                            darkMode ? "text-red-400" : "text-red-500"
                          }`}
                        >
                          {formErrors.transaction.amount}
                        </p>
                      )}
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Descrição <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Descrição"
                      value={transactionForm.description}
                      onChange={(e) => {
                        setTransactionForm({
                          ...transactionForm,
                          description: e.target.value,
                        });
                        if (
                          formErrors.transaction &&
                          formErrors.transaction.description
                        ) {
                          clearFieldError("transaction", "description");
                        }
                      }}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 transition-colors ${
                        transactionMode === "existing"
                          ? "focus:ring-blue-500"
                          : "focus:ring-orange-500"
                      } focus:border-transparent ${
                        formErrors.transaction &&
                        formErrors.transaction.description
                          ? darkMode
                            ? "border-red-500 bg-red-900/20 text-white placeholder-gray-400"
                            : "border-red-500 bg-red-50"
                          : darkMode
                          ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                          : "border-gray-300 bg-white"
                      }`}
                    />
                    {formErrors.transaction &&
                      formErrors.transaction.description && (
                        <p
                          className={`text-sm mt-1 ${
                            darkMode ? "text-red-400" : "text-red-500"
                          }`}
                        >
                          {formErrors.transaction.description}
                        </p>
                      )}
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Data <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={transactionForm.date}
                      onChange={(e) => {
                        setTransactionForm({
                          ...transactionForm,
                          date: e.target.value,
                        });
                        if (
                          formErrors.transaction &&
                          formErrors.transaction.date
                        ) {
                          clearFieldError("transaction", "date");
                        }
                      }}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 transition-colors ${
                        transactionMode === "existing"
                          ? "focus:ring-blue-500"
                          : "focus:ring-orange-500"
                      } focus:border-transparent ${
                        formErrors.transaction && formErrors.transaction.date
                          ? darkMode
                            ? "border-red-500 bg-red-900/20 text-white"
                            : "border-red-500 bg-red-50"
                          : darkMode
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    />
                    {formErrors.transaction && formErrors.transaction.date && (
                      <p
                        className={`text-sm mt-1 ${
                          darkMode ? "text-red-400" : "text-red-500"
                        }`}
                      >
                        {formErrors.transaction.date}
                      </p>
                    )}
                  </div>
                </div>

                {/* Explicação */}
                <div
                  className={`p-4 rounded-lg ${
                    transactionMode === "existing"
                      ? darkMode
                        ? "bg-blue-900/20 border border-blue-800"
                        : "bg-blue-50 border border-blue-200"
                      : darkMode
                      ? "bg-orange-900/20 border border-orange-800"
                      : "bg-orange-50 border border-orange-200"
                  }`}
                >
                  <p
                    className={`text-sm ${
                      transactionMode === "existing"
                        ? darkMode
                          ? "text-blue-200"
                          : "text-blue-700"
                        : darkMode
                        ? "text-orange-200"
                        : "text-orange-700"
                    }`}
                  >
                    {transactionMode === "existing"
                      ? "📊 Este lançamento será vinculado a uma categoria já planejada e contará para o orçamento definido."
                      : "🎯 Este lançamento criará uma categoria pontual que aparecerá separadamente nos relatórios."}
                  </p>
                </div>

                {/* Botão */}
                <div className="pt-4">
                  <button
                    onClick={addTransaction}
                    disabled={isLoading.addTransaction}
                    className={`px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      transactionMode === "existing"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-orange-600 hover:bg-orange-700"
                    } text-white ${
                      isLoading.addTransaction
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {isLoading.addTransaction && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    )}
                    <Plus size={16} />
                    {isLoading.addTransaction
                      ? "Lançando..."
                      : transactionMode === "existing"
                      ? "Lançar em Categoria Planejada"
                      : "Criar e Lançar"}
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions List with Search */}
            <div
              className={`rounded-lg shadow-md p-6 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              {/* Search and Filters Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className={`text-xl font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Lançamentos Recentes
                  </h2>
                </div>

                {/* Search and Filter Controls */}
                <div className="space-y-4">
                  {/* Primeira linha: Busca e contador */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Buscar por descrição, categoria, valor ou data..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          performSearchAndFilter(
                            e.target.value,
                            filterCategory,
                            filterType,
                            filterPeriod,
                            customDateFrom,
                            customDateTo
                          );
                        }}
                        className={`w-full border rounded-lg px-3 py-2 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          darkMode
                            ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                            : "border-gray-300 bg-white placeholder-gray-500"
                        }`}
                      />
                      <div className="absolute left-3 top-2.5">
                        <svg
                          className={`w-4 h-4 ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Contador em destaque */}
                    <div
                      className={`px-4 py-2 rounded-lg font-medium ${
                        searchTerm ||
                        filterCategory ||
                        filterType ||
                        filterPeriod
                          ? darkMode
                            ? "bg-blue-600 text-white"
                            : "bg-blue-600 text-white"
                          : darkMode
                          ? "bg-gray-700 text-gray-300"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {searchTerm ||
                      filterCategory ||
                      filterType ||
                      filterPeriod
                        ? filteredTransactions.length
                        : transactions.length}{" "}
                      resultado
                      {(searchTerm ||
                      filterCategory ||
                      filterType ||
                      filterPeriod
                        ? filteredTransactions.length
                        : transactions.length) !== 1
                        ? "s"
                        : ""}
                    </div>

                    {(searchTerm ||
                      filterCategory ||
                      filterType ||
                      filterPeriod) && (
                      <button
                        onClick={clearAllFilters}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                          darkMode
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                      >
                        <X size={14} />
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Segunda linha: Filtros */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Filtro por Categoria */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Filtrar por Categoria
                      </label>
                      <select
                        value={filterCategory}
                        onChange={(e) => {
                          setFilterCategory(e.target.value);
                          performSearchAndFilter(
                            searchTerm,
                            e.target.value,
                            filterType
                          );
                        }}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          darkMode
                            ? "border-gray-600 bg-gray-700 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <option value="">Todas as categorias</option>
                        {/* Categorias planejadas */}
                        <optgroup label="Categorias Planejadas">
                          {categories
                            .filter((cat) => cat.month !== "pontual")
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name} - {getMonthName(category.month)}
                              </option>
                            ))}
                        </optgroup>
                        {/* Categorias pontuais */}
                        {categories.some((cat) => cat.month === "pontual") && (
                          <optgroup label="Lançamentos Pontuais">
                            {categories
                              .filter((cat) => cat.month === "pontual")
                              .sort((a, b) => a.name.localeCompare(b.name))
                              .map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name.replace(
                                    " (Lançamento pontual)",
                                    ""
                                  )}
                                </option>
                              ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    {/* Filtro por Tipo */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Filtrar por Tipo
                      </label>
                      <select
                        value={filterType}
                        onChange={(e) => {
                          setFilterType(e.target.value);
                          performSearchAndFilter(
                            searchTerm,
                            filterCategory,
                            e.target.value
                          );
                        }}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          darkMode
                            ? "border-gray-600 bg-gray-700 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <option value="">Todos os tipos</option>
                        <option value="income">🟢 Receitas</option>
                        <option value="expense">🔴 Despesas</option>
                      </select>
                    </div>

                    {/* Filtro por Período */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Filtrar por Período
                      </label>
                      <select
                        value={filterPeriod}
                        onChange={(e) => {
                          setFilterPeriod(e.target.value);
                          if (e.target.value !== "custom") {
                            // Limpar datas customizadas se não for período customizado
                            setCustomDateFrom("");
                            setCustomDateTo("");
                          }
                          performSearchAndFilter(
                            searchTerm,
                            filterCategory,
                            filterType,
                            e.target.value,
                            customDateFrom,
                            customDateTo
                          );
                        }}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          darkMode
                            ? "border-gray-600 bg-gray-700 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <option value="">Todos os períodos</option>
                        <option value="today">📅 Hoje</option>
                        <option value="week">🗓️ Esta semana</option>
                        <option value="month">📆 Este mês</option>
                        <option value="custom">🎯 Período personalizado</option>
                      </select>
                    </div>
                  </div>

                  {/* Resumo dos Filtros Ativos */}
                  {(searchTerm ||
                    filterCategory ||
                    filterType ||
                    filterPeriod) && (
                    <div
                      className={`p-4 rounded-lg border-l-4 ${
                        darkMode
                          ? "border-blue-500 bg-blue-900/10 text-blue-200"
                          : "border-blue-500 bg-blue-50 text-blue-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium mb-2">Filtros Ativos:</h4>
                          <div className="flex flex-wrap gap-2">
                            {searchTerm && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  darkMode
                                    ? "bg-gray-700 text-gray-300"
                                    : "bg-white text-gray-700"
                                }`}
                              >
                                🔍 Busca: "{searchTerm}"
                              </span>
                            )}
                            {filterCategory && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  darkMode
                                    ? "bg-gray-700 text-gray-300"
                                    : "bg-white text-gray-700"
                                }`}
                              >
                                📁 {getCategoryName(parseInt(filterCategory))}
                              </span>
                            )}
                            {filterType && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  darkMode
                                    ? "bg-gray-700 text-gray-300"
                                    : "bg-white text-gray-700"
                                }`}
                              >
                                {filterType === "income"
                                  ? "🟢 Receitas"
                                  : "🔴 Despesas"}
                              </span>
                            )}
                            {filterPeriod && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  darkMode
                                    ? "bg-gray-700 text-gray-300"
                                    : "bg-white text-gray-700"
                                }`}
                              >
                                📅{" "}
                                {filterPeriod === "today"
                                  ? "Hoje"
                                  : filterPeriod === "week"
                                  ? "Esta semana"
                                  : filterPeriod === "month"
                                  ? "Este mês"
                                  : filterPeriod === "custom"
                                  ? "Período personalizado"
                                  : filterPeriod}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={clearAllFilters}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                            darkMode
                              ? "bg-red-900/20 text-red-300 hover:bg-red-900/30"
                              : "bg-red-50 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          <X size={14} />
                          Limpar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Terceira linha: Período Personalizado (só aparece se selecionado) */}
                  {filterPeriod === "custom" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Data Inicial
                        </label>
                        <input
                          type="date"
                          value={customDateFrom}
                          onChange={(e) => {
                            setCustomDateFrom(e.target.value);
                            if (e.target.value && customDateTo) {
                              performSearchAndFilter(
                                searchTerm,
                                filterCategory,
                                filterType,
                                filterPeriod,
                                e.target.value,
                                customDateTo
                              );
                            }
                          }}
                          className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            darkMode
                              ? "border-gray-600 bg-gray-700 text-white"
                              : "border-gray-300 bg-white"
                          }`}
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-1 ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Data Final
                        </label>
                        <input
                          type="date"
                          value={customDateTo}
                          onChange={(e) => {
                            setCustomDateTo(e.target.value);
                            if (customDateFrom && e.target.value) {
                              performSearchAndFilter(
                                searchTerm,
                                filterCategory,
                                filterType,
                                filterPeriod,
                                customDateFrom,
                                e.target.value
                              );
                            }
                          }}
                          className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                            darkMode
                              ? "border-gray-600 bg-gray-700 text-white"
                              : "border-gray-300 bg-white"
                          }`}
                        />
                      </div>

                      <div className="flex flex-col justify-end">
                        <button
                          onClick={() => {
                            if (customDateFrom && customDateTo) {
                              performSearchAndFilter(
                                searchTerm,
                                filterCategory,
                                filterType,
                                filterPeriod,
                                customDateFrom,
                                customDateTo
                              );
                            }
                          }}
                          disabled={!customDateFrom || !customDateTo}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            customDateFrom && customDateTo
                              ? darkMode
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                              : darkMode
                              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          Aplicar Período
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Terceira linha: Ordenação */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span
                        className={`text-sm font-medium ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Ordenar por:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSort("date")}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                            sortBy === "date"
                              ? darkMode
                                ? "bg-blue-600 text-white"
                                : "bg-blue-600 text-white"
                              : darkMode
                              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {getSortIcon("date")} Data
                        </button>
                        <button
                          onClick={() => toggleSort("amount")}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                            sortBy === "amount"
                              ? darkMode
                                ? "bg-blue-600 text-white"
                                : "bg-blue-600 text-white"
                              : darkMode
                              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {getSortIcon("amount")} Valor
                        </button>
                        <button
                          onClick={() => toggleSort("description")}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                            sortBy === "description"
                              ? darkMode
                                ? "bg-blue-600 text-white"
                                : "bg-blue-600 text-white"
                              : darkMode
                              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {getSortIcon("description")} Descrição
                        </button>
                        <button
                          onClick={() => toggleSort("category")}
                          className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                            sortBy === "category"
                              ? darkMode
                                ? "bg-blue-600 text-white"
                                : "bg-blue-600 text-white"
                              : darkMode
                              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {getSortIcon("category")} Categoria
                        </button>
                      </div>
                    </div>

                    {/* Indicador da ordenação atual */}
                    <div
                      className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {sortOrder === "asc" ? "⬆️ Crescente" : "⬇️ Decrescente"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction List */}
              {/* Transaction List */}
              <div className="space-y-3">
                {/* USAR ORDENAÇÃO SEMPRE */}
                {(() => {
                  const transactionsToShow =
                    searchTerm || filterCategory || filterType || filterPeriod
                      ? filteredTransactions
                      : sortTransactions(transactions, sortBy, sortOrder);

                  return transactionsToShow.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        darkMode
                          ? "border-gray-600 bg-gray-700"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Calendar
                          className={
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }
                          size={16}
                        />
                        <div>
                          <h3
                            className={`font-medium ${
                              darkMode ? "text-white" : "text-gray-800"
                            }`}
                          >
                            {searchTerm ? (
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: transaction.description.replace(
                                    new RegExp(`(${searchTerm})`, "gi"),
                                    '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                                  ),
                                }}
                              />
                            ) : (
                              transaction.description
                            )}
                          </h3>
                          <p
                            className={`text-sm ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            {searchTerm ? (
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: getCategoryName(
                                    transaction.categoryId
                                  ).replace(
                                    new RegExp(`(${searchTerm})`, "gi"),
                                    '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                                  ),
                                }}
                              />
                            ) : (
                              getCategoryName(transaction.categoryId)
                            )}{" "}
                            - {formatDate(transaction.date)}
                            {categories.find(
                              (cat) => cat.id === transaction.categoryId
                            )?.month === "pontual" && (
                              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                Pontual
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`font-semibold ${
                            transaction.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(Math.abs(transaction.amount))}
                        </span>
                        <button
                          onClick={() =>
                            deleteTransaction(
                              transaction.id,
                              transaction.description
                            )
                          }
                          disabled={isLoading.deleteTransaction}
                          className={`transition-colors ${
                            isLoading.deleteTransaction
                              ? "opacity-50 cursor-not-allowed"
                              : darkMode
                              ? "text-red-400 hover:text-red-300"
                              : "text-red-600 hover:text-red-800"
                          }`}
                        >
                          {isLoading.deleteTransaction ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  ));
                })()}

                {/* Mensagem quando não há resultados */}
                {(() => {
                  const transactionsToShow =
                    searchTerm || filterCategory || filterType || filterPeriod
                      ? filteredTransactions
                      : transactions;

                  return (
                    transactionsToShow.length === 0 && (
                      <div
                        className={`text-center py-8 ${
                          darkMode ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        {searchTerm ||
                        filterCategory ||
                        filterType ||
                        filterPeriod
                          ? "Nenhuma transação encontrada com os filtros aplicados"
                          : "Nenhuma transação registrada ainda"}
                      </div>
                    )
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Reports Screen */}
        {currentScreen === "reports" && hasPermission("reports") && (
          <div className="space-y-6">
            {/* Report Controls */}
            <div
              className={`rounded-lg shadow-md p-6 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h2
                    className={`text-xl font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    {getReportTitle()}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReportView("detailed")}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                        reportView === "detailed"
                          ? "bg-blue-600 text-white"
                          : darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      <Eye size={16} />
                      Detalhado
                    </button>
                    <button
                      onClick={() => setReportView("summary")}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                        reportView === "summary"
                          ? "bg-blue-600 text-white"
                          : darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      <BarChart3 size={16} />
                      Resumo
                    </button>

                    {/* NOVO: Seletor de formato de exportação */}
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        darkMode
                          ? "bg-gray-700 text-gray-300 border-gray-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      <option value="csv">📊 CSV</option>
                      <option value="pdf">📄 PDF</option>
                    </select>

                    {/* NOVO: Botão de exportação */}
                    <button
                      onClick={handleReportExport}
                      disabled={
                        isExporting ||
                        !report ||
                        (report.categoryTotals.length === 0 &&
                          !report.pontualTotal) ||
                        !reportPeriod || // ADICIONAR ESTA LINHA
                        (reportPeriod === "monthly" && !selectedMonth) || // ADICIONAR ESTA LINHA
                        (reportPeriod === "semester" && !selectedSemester) // ADICIONAR ESTA LINHA
                      }
                      className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                        isExporting ||
                        !report ||
                        (report.categoryTotals.length === 0 &&
                          !report.pontualTotal) ||
                        !reportPeriod ||
                        (reportPeriod === "monthly" && !selectedMonth) ||
                        (reportPeriod === "semester" && !selectedSemester)
                          ? darkMode
                            ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : darkMode
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {isExporting && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      )}
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {isExporting ? "Exportando..." : "Exportar Relatório"}
                    </button>
                  </div>
                </div>

                {/* Period Filter */}
                <div className="flex flex-col space-y-3">
                  <h3
                    className={`text-lg font-medium ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Período do Relatório
                  </h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setReportPeriod("monthly")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        reportPeriod === "monthly"
                          ? "bg-green-600 text-white"
                          : darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Mensal
                    </button>
                    <button
                      onClick={() => setReportPeriod("semester")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        reportPeriod === "semester"
                          ? "bg-orange-600 text-white"
                          : darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Semestral
                    </button>
                    <button
                      onClick={() => setReportPeriod("annual")}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        reportPeriod === "annual"
                          ? "bg-purple-600 text-white"
                          : darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Anual
                    </button>
                  </div>

                  {/* Monthly Selector */}
                  {reportPeriod === "monthly" && (
                    <div className="mt-3">
                      <h4
                        className={`text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Selecionar Mês:
                      </h4>
                      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
                        {months.map((month) => (
                          <button
                            key={month.value}
                            onClick={() => setSelectedMonth(month.value)}
                            className={`p-2 rounded text-sm font-medium transition-colors ${
                              selectedMonth === month.value
                                ? "bg-green-600 text-white"
                                : darkMode
                                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            {month.name.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Semester Selector */}
                  {reportPeriod === "semester" && (
                    <div className="mt-3">
                      <h4
                        className={`text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Selecionar Semestre:
                      </h4>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedSemester(1)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedSemester === 1
                              ? "bg-orange-600 text-white"
                              : darkMode
                              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          1º Semestre (Jan - Jun)
                        </button>
                        <button
                          onClick={() => setSelectedSemester(2)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedSemester === 2
                              ? "bg-orange-600 text-white"
                              : darkMode
                              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          2º Semestre (Jul - Dez)
                        </button>
                      </div>
                    </div>
                  )}

                  {reportPeriod === "annual" && (
                    <div className="mt-3">
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Exibindo dados de todo o ano (Janeiro - Dezembro)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Enhanced Financial Summary Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card Receitas Aprimorado */}
              <div
                key={renderKey}
                className={`rounded-xl shadow-lg p-6 border-l-4 border-green-500 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  darkMode
                    ? "bg-gradient-to-br from-gray-800 to-gray-700"
                    : "bg-gradient-to-br from-white to-green-50"
                } ${cardAnimations.income ? "animate-pulse" : ""}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-3 rounded-full">
                      <TrendingUp className="text-green-600" size={24} />
                    </div>
                    <div>
                      <h3
                        className={`text-sm font-medium ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Total de Receitas
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-500">
                          {getVariationIcon(
                            report.totalIncome,
                            previousValues.income
                          )}
                        </span>
                        <span
                          className={`text-xs ${getVariationColor(
                            report.totalIncome,
                            previousValues.income
                          )}`}
                        >
                          {previousValues.income !== 0 &&
                            formatVariation(
                              report.totalIncome,
                              previousValues.income
                            ).percentage.toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(report.totalIncome)}
                  </p>
                  {previousValues.income !== 0 && (
                    <p
                      className={`text-xs ${getVariationColor(
                        report.totalIncome,
                        previousValues.income
                      )}`}
                    >
                      {formatVariation(
                        report.totalIncome,
                        previousValues.income
                      ).isPositive
                        ? "+"
                        : "-"}
                      {formatCurrency(
                        formatVariation(
                          report.totalIncome,
                          previousValues.income
                        ).absolute
                      )}{" "}
                      vs período anterior
                    </p>
                  )}
                </div>

                {/* Mini sparkline visual */}
                <div className="mt-4 flex items-end gap-1 h-8">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={`sparkline-income-${i}`}
                      className="bg-green-200 rounded-sm flex-1 transition-all duration-500"
                      style={{
                        height: `${Math.random() * 100}%`,
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Card Despesas Aprimorado */}
              <div
                key={renderKey}
                className={`rounded-xl shadow-lg p-6 border-l-4 border-red-500 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  darkMode
                    ? "bg-gradient-to-br from-gray-800 to-gray-700"
                    : "bg-gradient-to-br from-white to-red-50"
                } ${cardAnimations.expenses ? "animate-pulse" : ""}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-3 rounded-full">
                      <TrendingDown className="text-red-600" size={24} />
                    </div>
                    <div>
                      <h3
                        className={`text-sm font-medium ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Total de Despesas
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-500">
                          {getVariationIcon(
                            report.totalExpenses,
                            previousValues.expenses
                          )}
                        </span>
                        <span
                          className={`text-xs ${getVariationColor(
                            report.totalExpenses,
                            previousValues.expenses
                          )}`}
                        >
                          {previousValues.expenses !== 0 &&
                            formatVariation(
                              report.totalExpenses,
                              previousValues.expenses
                            ).percentage.toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(report.totalExpenses)}
                  </p>
                  {previousValues.expenses !== 0 && (
                    <p
                      className={`text-xs ${getVariationColor(
                        report.totalExpenses,
                        previousValues.expenses
                      )}`}
                    >
                      {formatVariation(
                        report.totalExpenses,
                        previousValues.expenses
                      ).isPositive
                        ? "+"
                        : "-"}
                      {formatCurrency(
                        formatVariation(
                          report.totalExpenses,
                          previousValues.expenses
                        ).absolute
                      )}{" "}
                      vs período anterior
                    </p>
                  )}
                </div>

                {/* Mini sparkline visual */}
                <div className="mt-4 flex items-end gap-1 h-8">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={`unique-prefix-${i}`}
                      className="bg-red-200 rounded-sm flex-1 transition-all duration-500"
                      style={{
                        height: `${Math.random() * 100}%`,
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Card Saldo Aprimorado */}
              <div
                key={renderKey}
                className={`rounded-xl shadow-lg p-6 border-l-4 ${
                  report.totalIncome - report.totalExpenses >= 0
                    ? "border-blue-500"
                    : "border-orange-500"
                } transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  darkMode
                    ? "bg-gradient-to-br from-gray-800 to-gray-700"
                    : report.totalIncome - report.totalExpenses >= 0
                    ? "bg-gradient-to-br from-white to-blue-50"
                    : "bg-gradient-to-br from-white to-orange-50"
                } ${cardAnimations.balance ? "animate-pulse" : ""}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-full ${
                        report.totalIncome - report.totalExpenses >= 0
                          ? "bg-blue-100"
                          : "bg-orange-100"
                      }`}
                    >
                      <DollarSign
                        className={`${
                          report.totalIncome - report.totalExpenses >= 0
                            ? "text-blue-600"
                            : "text-orange-600"
                        }`}
                        size={24}
                      />
                    </div>
                    <div>
                      <h3
                        className={`text-sm font-medium ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Saldo Final
                      </h3>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs ${
                            report.totalIncome - report.totalExpenses >= 0
                              ? "text-blue-500"
                              : "text-orange-500"
                          }`}
                        >
                          {report.totalIncome - report.totalExpenses >= 0
                            ? "💰"
                            : "⚠️"}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            report.totalIncome - report.totalExpenses >= 0
                              ? "text-blue-600"
                              : "text-orange-600"
                          }`}
                        >
                          {report.totalIncome - report.totalExpenses >= 0
                            ? "Positivo"
                            : "Negativo"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p
                    className={`text-3xl font-bold ${
                      report.totalIncome - report.totalExpenses >= 0
                        ? "text-blue-600"
                        : "text-orange-600"
                    }`}
                  >
                    {formatCurrency(report.totalIncome - report.totalExpenses)}
                  </p>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span
                        className={darkMode ? "text-gray-400" : "text-gray-600"}
                      >
                        Receitas:
                      </span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(report.totalIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span
                        className={darkMode ? "text-gray-400" : "text-gray-600"}
                      >
                        Despesas:
                      </span>
                      <span className="text-red-600 font-medium">
                        {formatCurrency(report.totalExpenses)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Visual bar comparison */}
                <div className="mt-4 space-y-2">
                  <div className="flex gap-1 h-2">
                    <div
                      className="bg-green-400 rounded-sm transition-all duration-1000"
                      style={{
                        width: `${
                          report.totalIncome + report.totalExpenses > 0
                            ? (report.totalIncome /
                                (report.totalIncome + report.totalExpenses)) *
                              100
                            : 50
                        }%`,
                      }}
                    />
                    <div
                      className="bg-red-400 rounded-sm transition-all duration-1000"
                      style={{
                        width: `${
                          report.totalIncome + report.totalExpenses > 0
                            ? (report.totalExpenses /
                                (report.totalIncome + report.totalExpenses)) *
                              100
                            : 50
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Pontuais Aprimorado */}
              <div
                key={renderKey}
                className={`rounded-xl shadow-lg p-6 border-l-4 border-orange-500 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  darkMode
                    ? "bg-gradient-to-br from-gray-800 to-gray-700"
                    : "bg-gradient-to-br from-white to-orange-50"
                } ${cardAnimations.pontual ? "animate-pulse" : ""}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-3 rounded-full">
                      <Plus className="text-orange-600" size={24} />
                    </div>
                    <div>
                      <h3
                        className={`text-sm font-medium ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Lançamentos Pontuais
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-orange-500">🎯</span>
                        <span className="text-xs text-orange-600 font-medium">
                          Não Planejados
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-3xl font-bold text-orange-600">
                    {report.pontualTotal
                      ? formatCurrency(report.pontualTotal.spent)
                      : formatCurrency(0)}
                  </p>
                  {report.pontualTotal && (
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span
                          className={
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          Transações:
                        </span>
                        <span className="text-orange-600 font-medium">
                          {report.pontualTotal.transactions.length}
                        </span>
                      </div>
                      {report.pontualTotal.income > 0 && (
                        <div className="flex justify-between">
                          <span
                            className={
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }
                          >
                            Receitas:
                          </span>
                          <span className="text-green-600 font-medium">
                            {formatCurrency(report.pontualTotal.income)}
                          </span>
                        </div>
                      )}
                      {report.pontualTotal.expenses > 0 && (
                        <div className="flex justify-between">
                          <span
                            className={
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }
                          >
                            Despesas:
                          </span>
                          <span className="text-red-600 font-medium">
                            {formatCurrency(report.pontualTotal.expenses)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Barras de valores - VERSÃO CONTROLADA */}
                <div className="mt-4 space-y-1">
                  {report.pontualTotal &&
                  report.pontualTotal.transactions.length > 0 ? (
                    <>
                      {/* Mostrar só as 3 maiores transações */}
                      {report.pontualTotal.transactions
                        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)) // Ordenar por valor
                        .slice(0, 3)
                        .map((transaction, index) => {
                          const maxValue = Math.max(
                            ...report.pontualTotal.transactions.map((t) =>
                              Math.abs(t.amount)
                            )
                          );
                          const percentage =
                            (Math.abs(transaction.amount) / maxValue) * 100;

                          return (
                            <div
                              key={`unique-prefix-${index}`}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="h-2 bg-orange-400 rounded-full transition-all duration-1000 min-w-[20px]"
                                style={{
                                  width: `${Math.max(20, percentage)}%`, // Mínimo 20% para visibilidade
                                  animationDelay: `${index * 200}ms`,
                                }}
                              />
                              <span className="text-xs text-orange-600 whitespace-nowrap">
                                {formatCurrency(Math.abs(transaction.amount))}
                              </span>
                            </div>
                          );
                        })}

                      {/* Contador se há mais transações */}
                      {report.pontualTotal.transactions.length > 3 && (
                        <div className="text-xs text-orange-500 text-center pt-1 border-t border-orange-200">
                          +{report.pontualTotal.transactions.length - 3}{" "}
                          transações adicionais
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      className={`text-center text-2xl ${
                        darkMode ? "text-gray-600" : "text-gray-400"
                      }`}
                    >
                      🎯
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Interactive Filters Panel */}
            <div
              className={`mb-6 p-4 rounded-lg border ${
                darkMode
                  ? "bg-gray-700 border-gray-600"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4
                  className={`font-medium ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  🔧 Filtros Interativos
                </h4>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={animateCharts}
                      onChange={(e) => setAnimateCharts(e.target.checked)}
                      className="rounded"
                    />
                    <span
                      className={darkMode ? "text-gray-300" : "text-gray-700"}
                    >
                      Animações
                    </span>
                  </label>
                  <button
                    onClick={() => {
                      const timelineData = generateTimelineData(
                        timelineType,
                        selectedTimeRange,
                        chartFilters
                      ); // ADICIONAR chartFilters
                      exportChartData(timelineData, timelineType);
                    }}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      darkMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    📊 Exportar Dados
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro por valor mínimo */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Valor Mínimo
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 100"
                    value={chartFilters.minAmount}
                    onChange={(e) =>
                      setChartFilters((prev) => ({
                        ...prev,
                        minAmount: e.target.value,
                      }))
                    }
                    className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                      darkMode
                        ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                        : "border-gray-300 bg-white placeholder-gray-500"
                    }`}
                  />
                </div>

                {/* Filtro por valor máximo */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Valor Máximo
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 5000"
                    value={chartFilters.maxAmount}
                    onChange={(e) =>
                      setChartFilters((prev) => ({
                        ...prev,
                        maxAmount: e.target.value,
                      }))
                    }
                    className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                      darkMode
                        ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                        : "border-gray-300 bg-white placeholder-gray-500"
                    }`}
                  />
                </div>

                {/* Filtro por categorias */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Categorias
                  </label>

                  <div className="relative">
                    {/* Botão do dropdown */}
                    <button
                      type="button"
                      onClick={() =>
                        setShowCategoryDropdown(!showCategoryDropdown)
                      }
                      className={`w-full border rounded-lg px-3 py-2 text-sm text-left transition-colors flex items-center justify-between ${
                        darkMode
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white text-gray-700"
                      }`}
                    >
                      <span>
                        {chartFilters.selectedCategories.length === 0
                          ? "Selecionar categorias..."
                          : `${chartFilters.selectedCategories.length} categoria(s) selecionada(s)`}
                      </span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Dropdown content */}
                    {showCategoryDropdown && (
                      <div
                        className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-48 overflow-y-auto ${
                          darkMode
                            ? "border-gray-600 bg-gray-700"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {/* Header com ações */}
                        <div
                          className={`px-3 py-2 border-b ${
                            darkMode ? "border-gray-600" : "border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between">
                            <button
                              onClick={() => {
                                const allCategories = [
                                  ...new Set(
                                    categories
                                      .filter((cat) => cat.month !== "pontual")
                                      .map((cat) => cat.name)
                                  ),
                                ];
                                setChartFilters((prev) => ({
                                  ...prev,
                                  selectedCategories: allCategories,
                                }));
                              }}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Selecionar todas
                            </button>
                            <button
                              onClick={() =>
                                setChartFilters((prev) => ({
                                  ...prev,
                                  selectedCategories: [],
                                }))
                              }
                              className="text-xs text-red-600 hover:underline"
                            >
                              Limpar
                            </button>
                          </div>
                        </div>

                        {/* Lista de categorias */}
                        {[
                          ...new Set(
                            categories
                              .filter((cat) => cat.month !== "pontual")
                              .map((cat) => cat.name)
                          ),
                        ].map((categoryName) => (
                          <label
                            key={categoryName}
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600`}
                          >
                            <input
                              type="checkbox"
                              checked={chartFilters.selectedCategories.includes(
                                categoryName
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setChartFilters((prev) => ({
                                    ...prev,
                                    selectedCategories: [
                                      ...prev.selectedCategories,
                                      categoryName,
                                    ],
                                  }));
                                } else {
                                  setChartFilters((prev) => ({
                                    ...prev,
                                    selectedCategories:
                                      prev.selectedCategories.filter(
                                        (cat) => cat !== categoryName
                                      ),
                                  }));
                                }
                              }}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {categoryName}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Indicadores de filtros ativos */}
              {(chartFilters.minAmount ||
                chartFilters.maxAmount ||
                chartFilters.selectedCategories.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {chartFilters.minAmount && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        darkMode
                          ? "bg-blue-900 text-blue-300"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      Min: {formatCurrency(parseFloat(chartFilters.minAmount))}
                    </span>
                  )}
                  {chartFilters.maxAmount && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        darkMode
                          ? "bg-blue-900 text-blue-300"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      Max: {formatCurrency(parseFloat(chartFilters.maxAmount))}
                    </span>
                  )}
                  {chartFilters.selectedCategories.map((category) => (
                    <span
                      key={category}
                      className={`px-2 py-1 rounded-full text-xs ${
                        darkMode
                          ? "bg-green-900 text-green-300"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {category}
                    </span>
                  ))}
                  <button
                    onClick={() =>
                      setChartFilters({
                        minAmount: "",
                        maxAmount: "",
                        selectedCategories: [],
                      })
                    }
                    className={`px-2 py-1 rounded-full text-xs transition-colors ${
                      darkMode
                        ? "bg-red-900 text-red-300 hover:bg-red-800"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    }`}
                  >
                    ✕ Limpar Filtros
                  </button>
                </div>
              )}
            </div>

            {/* Trend Charts Section */}
            {showTrendCharts && timeSeriesData.length > 0 && (
              <div
                className={`rounded-lg shadow-md p-6 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3
                    className={`text-lg font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    📈 Análise de Tendências
                  </h3>
                  <div className="flex items-center gap-4">
                    {/* Seletor de período */}
                    <select
                      value={trendPeriod}
                      onChange={(e) => setTrendPeriod(e.target.value)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        darkMode
                          ? "bg-gray-700 text-gray-300 border-gray-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      <option value="3months">📅 Últimos 3 meses</option>
                      <option value="6months">📆 Últimos 6 meses</option>
                      <option value="12months">🗓️ Último ano</option>
                    </select>

                    {/* Botão para mostrar/ocultar */}
                    <button
                      onClick={() => setShowTrendCharts(!showTrendCharts)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      📈 Ocultar
                    </button>
                  </div>
                </div>

                {/* Grid de gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Gráfico de Receitas */}
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <h4
                      className={`text-sm font-medium mb-3 flex items-center gap-2 ${
                        darkMode ? "text-green-300" : "text-green-700"
                      }`}
                    >
                      📈 Receitas
                      {trendAnalysis && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            trendAnalysis.income.direction === "up"
                              ? "bg-green-100 text-green-800"
                              : trendAnalysis.income.direction === "down"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {trendAnalysis.income.direction === "up"
                            ? "↗️ Crescendo"
                            : trendAnalysis.income.direction === "down"
                            ? "↘️ Caindo"
                            : "→ Estável"}
                        </span>
                      )}
                    </h4>

                    <div className="flex justify-center mb-3">
                      <LineChart
                        data={timeSeriesData}
                        width={280}
                        height={150}
                        type="income"
                      />
                    </div>

                    {trendAnalysis && (
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span
                            className={
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }
                          >
                            Média:
                          </span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(trendAnalysis.income.average)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span
                            className={
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }
                          >
                            Tendência:
                          </span>
                          <span
                            className={`font-medium ${
                              trendAnalysis.income.trend >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {trendAnalysis.income.trend >= 0 ? "+" : ""}
                            {formatCurrency(trendAnalysis.income.trend)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Gráfico de Despesas */}
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <h4
                      className={`text-sm font-medium mb-3 flex items-center gap-2 ${
                        darkMode ? "text-red-300" : "text-red-700"
                      }`}
                    >
                      📉 Despesas
                      {trendAnalysis && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            trendAnalysis.expenses.direction === "up"
                              ? "bg-red-100 text-red-800"
                              : trendAnalysis.expenses.direction === "down"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {trendAnalysis.expenses.direction === "up"
                            ? "↗️ Aumentando"
                            : trendAnalysis.expenses.direction === "down"
                            ? "↘️ Diminuindo"
                            : "→ Estável"}
                        </span>
                      )}
                    </h4>

                    <div className="flex justify-center mb-3">
                      <LineChart
                        data={timeSeriesData}
                        width={280}
                        height={150}
                        type="expenses"
                      />
                    </div>

                    {trendAnalysis && (
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span
                            className={
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }
                          >
                            Média:
                          </span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(trendAnalysis.expenses.average)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span
                            className={
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }
                          >
                            Tendência:
                          </span>
                          <span
                            className={`font-medium ${
                              trendAnalysis.expenses.trend <= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {trendAnalysis.expenses.trend >= 0 ? "+" : ""}
                            {formatCurrency(trendAnalysis.expenses.trend)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Gráfico de Saldo */}
                  <div
                    className={`p-4 rounded-lg ${
                      darkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <h4
                      className={`text-sm font-medium mb-3 flex items-center gap-2 ${
                        darkMode ? "text-blue-300" : "text-blue-700"
                      }`}
                    >
                      💰 Saldo
                      {trendAnalysis && (
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            trendAnalysis.balance.direction === "up"
                              ? "bg-green-100 text-green-800"
                              : trendAnalysis.balance.direction === "down"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {trendAnalysis.balance.direction === "up"
                            ? "↗️ Melhorando"
                            : trendAnalysis.balance.direction === "down"
                            ? "↘️ Piorando"
                            : "→ Estável"}
                        </span>
                      )}
                    </h4>

                    <div className="flex justify-center mb-3">
                      <LineChart
                        data={timeSeriesData}
                        width={280}
                        height={150}
                        type="balance"
                      />
                    </div>

                    {trendAnalysis && (
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span
                            className={
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }
                          >
                            Média:
                          </span>
                          <span
                            className={`font-medium ${
                              trendAnalysis.balance.average >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(trendAnalysis.balance.average)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span
                            className={
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }
                          >
                            Tendência:
                          </span>
                          <span
                            className={`font-medium ${
                              trendAnalysis.balance.trend >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {trendAnalysis.balance.trend >= 0 ? "+" : ""}
                            {formatCurrency(trendAnalysis.balance.trend)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumo da análise */}
                {trendAnalysis && (
                  <div
                    className={`mt-6 p-4 rounded-lg ${
                      darkMode
                        ? "bg-blue-900/20 border border-blue-800"
                        : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    <h4
                      className={`text-sm font-medium mb-2 ${
                        darkMode ? "text-blue-300" : "text-blue-800"
                      }`}
                    >
                      🔍 Insights da Análise:
                    </h4>
                    <div
                      className={`text-sm space-y-1 ${
                        darkMode ? "text-blue-200" : "text-blue-700"
                      }`}
                    >
                      {trendAnalysis.balance.direction === "up" && (
                        <div>
                          ✅ Situação financeira melhorando ao longo do período
                        </div>
                      )}
                      {trendAnalysis.balance.direction === "down" && (
                        <div>⚠️ Atenção: saldo em tendência de queda</div>
                      )}
                      {trendAnalysis.income.direction === "up" && (
                        <div>📈 Receitas em crescimento - boa performance</div>
                      )}
                      {trendAnalysis.expenses.direction === "up" &&
                        trendAnalysis.income.direction !== "up" && (
                          <div>
                            🔴 Despesas aumentando - considere revisar gastos
                          </div>
                        )}
                      {trendAnalysis.balance.direction === "stable" && (
                        <div>➡️ Situação financeira estável no período</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Botão para mostrar gráficos quando ocultos */}
            {!showTrendCharts && (
              <div className="text-center">
                <button
                  onClick={() => setShowTrendCharts(true)}
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto ${
                    darkMode
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  📈 Mostrar Análise de Tendências
                </button>
              </div>
            )}

            {/* Charts Section */}
            {showCharts && (
              <div
                className={`rounded-lg shadow-md p-6 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3
                    className={`text-lg font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Visualizações Gráficas
                  </h3>
                  <div className="flex items-center gap-4">
                    <select
                      value={chartPeriod}
                      onChange={(e) => setChartPeriod(e.target.value)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        darkMode
                          ? "bg-gray-700 text-gray-300 border-gray-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      <option value="current">📅 Período Atual</option>
                      <option value="last3months">📊 Últimos 3 Meses</option>
                      <option value="last6months">📈 Últimos 6 Meses</option>
                      <option value="lastyear">🗓️ Último Ano</option>
                    </select>

                    {/* Seletor de tipo de gráfico */}
                    <select
                      value={chartType}
                      onChange={(e) => setChartType(e.target.value)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        darkMode
                          ? "bg-gray-700 text-gray-300 border-gray-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      <option value="category">📊 Por Categoria</option>
                      <option value="type">💰 Receitas vs Despesas</option>
                    </select>

                    {/* Botão para mostrar/ocultar gráficos */}
                    <button
                      onClick={() => setShowCharts(!showCharts)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      📈 Ocultar
                    </button>
                  </div>
                </div>

                {/* Gráfico de Pizza */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Gráfico SVG com controles */}
                  <div className="flex flex-col items-center">
                    {chartType === "category" && (
                      <div className="mb-4 flex items-center gap-2">
                        <button
                          onClick={() => setCategorySubtype("expenses")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                            categorySubtype === "expenses"
                              ? "bg-red-600 text-white shadow-lg transform scale-105"
                              : darkMode
                              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <span className="text-lg">💸</span>
                          Despesas
                          {categorySubtype === "expenses" && (
                            <span className="ml-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                              {(() => {
                                const { data } = generatePieChartData(
                                  report,
                                  chartType,
                                  "expenses",
                                  chartFilters
                                );
                                return data.length;
                              })()}
                            </span>
                          )}
                        </button>

                        <div
                          className={`w-8 h-8 flex items-center justify-center ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          <svg
                            className="w-6 h-6 transform transition-transform duration-300 hover:scale-110"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                            />
                          </svg>
                        </div>

                        <button
                          onClick={() => setCategorySubtype("income")}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                            categorySubtype === "income"
                              ? "bg-green-600 text-white shadow-lg transform scale-105"
                              : darkMode
                              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          <span className="text-lg">💰</span>
                          Receitas
                          {categorySubtype === "income" && (
                            <span className="ml-1 text-xs bg-white/20 px-2 py-1 rounded-full">
                              {(() => {
                                const { data } = generatePieChartData(
                                  report,
                                  chartType,
                                  "income",
                                  chartFilters
                                );
                                return data.length;
                              })()}
                            </span>
                          )}
                        </button>
                      </div>
                    )}

                    {(() => {
                      const { data: chartData, totals } = generatePieChartData(
                        report,
                        chartType,
                        chartType === "category" ? categorySubtype : "both",
                        chartFilters
                      );

                      if (chartData.length === 0) {
                        return (
                          <div
                            className={`text-center py-12 ${
                              darkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            <div className="text-6xl mb-4">📊</div>
                            <p>Nenhum dado para exibir</p>
                            <p className="text-sm">
                              {chartType === "category"
                                ? "Adicione transações de despesa para ver o gráfico"
                                : "Adicione transações para ver o gráfico"}
                            </p>
                          </div>
                        );
                      }

                      let currentAngle = -Math.PI / 2;
                      const centerX = 140; // Era 120
                      const centerY = 140;
                      const radius = 80;

                      return (
                        <div className="relative">
                          <svg width="280" height="280" viewBox="0 0 280 280">
                            {chartData.map((item, index) => {
                              const percentage =
                                (item.value / totals.total) * 100;
                              const angleSize =
                                (item.value / totals.total) * 2 * Math.PI;
                              const endAngle = currentAngle + angleSize;

                              // ADICIONAR: Lógica especial para item único
                              const isSingleItem = chartData.length === 1;

                              let path;
                              if (isSingleItem) {
                                // Para item único, criar um círculo completo com borda visível
                                path = `M ${centerX} ${centerY} m -${radius} 0 a ${radius} ${radius} 0 1 1 ${
                                  radius * 2
                                } 0 a ${radius} ${radius} 0 1 1 -${
                                  radius * 2
                                } 0`;
                              } else {
                                // Para múltiplos itens, usar o path normal
                                path = createSVGPath(
                                  centerX,
                                  centerY,
                                  radius,
                                  currentAngle,
                                  endAngle
                                );
                              }

                              const isHovered = hoveredSegment === index;
                              const adjustedRadius = isHovered
                                ? radius + 8
                                : radius;

                              let hoveredPath;
                              if (isSingleItem) {
                                // Círculo expandido para hover
                                hoveredPath = `M ${centerX} ${centerY} m -${adjustedRadius} 0 a ${adjustedRadius} ${adjustedRadius} 0 1 1 ${
                                  adjustedRadius * 2
                                } 0 a ${adjustedRadius} ${adjustedRadius} 0 1 1 -${
                                  adjustedRadius * 2
                                } 0`;
                              } else {
                                hoveredPath = isHovered
                                  ? createSVGPath(
                                      centerX,
                                      centerY,
                                      adjustedRadius,
                                      currentAngle,
                                      endAngle
                                    )
                                  : path;
                              }

                              // Calcular posição do label
                              const midAngle = currentAngle + angleSize / 2;
                              const labelRadius = radius + 25;
                              const labelX =
                                centerX + labelRadius * Math.cos(midAngle);
                              const labelY =
                                centerY + labelRadius * Math.sin(midAngle);

                              currentAngle = endAngle;

                              return (
                                <g key={`chart-segment-${item.name}-${index}`}>
                                  <path
                                    d={hoveredPath}
                                    fill={item.color}
                                    stroke={darkMode ? "#374151" : "#ffffff"}
                                    strokeWidth={isSingleItem ? "4" : "2"} // Borda mais grossa para item único
                                    className="transition-all duration-300 cursor-pointer"
                                    onMouseEnter={() =>
                                      setHoveredSegment(index)
                                    }
                                    onMouseLeave={() => setHoveredSegment(null)}
                                    style={{
                                      filter: isHovered
                                        ? "brightness(1.15) drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
                                        : "none",
                                    }}
                                  />

                                  {/* Label do percentual - só mostrar se não for item único */}
                                  {!isSingleItem && percentage > 5 && (
                                    <text
                                      x={labelX}
                                      y={labelY}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                      className={`text-xs font-medium fill-current transition-all duration-300 ${
                                        darkMode
                                          ? "text-gray-300"
                                          : "text-gray-700"
                                      } ${isHovered ? "font-bold" : ""}`}
                                    >
                                      {percentage.toFixed(1)}%
                                    </text>
                                  )}

                                  {/* NOVO: Label especial para item único */}
                                  {isSingleItem && (
                                    <text
                                      x={centerX + radius + 30}
                                      y={centerY}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                      className={`text-sm font-bold fill-current transition-all duration-300 ${
                                        categorySubtype === "income"
                                          ? "text-green-600"
                                          : "text-red-600"
                                      } ${isHovered ? "text-lg" : ""}`}
                                    >
                                      100%
                                    </text>
                                  )}
                                </g>
                              );
                            })}

                            {/* Círculo central com conteúdo contextual */}
                            <circle
                              cx={centerX}
                              cy={centerY}
                              r="55"
                              fill={darkMode ? "#1f2937" : "#ffffff"}
                              stroke={darkMode ? "#374151" : "#e5e7eb"}
                              strokeWidth="3"
                            />

                            {/* Conteúdo central baseado no tipo e subtipo */}
                            {chartType === "category" ? (
                              <>
                                <text
                                  x={centerX}
                                  y={centerY - 10}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className={`text-sm font-bold fill-current ${
                                    darkMode ? "text-gray-300" : "text-gray-700"
                                  }`}
                                >
                                  {categorySubtype === "expenses"
                                    ? "Despesas"
                                    : "Receitas"}
                                </text>
                                <text
                                  x={centerX}
                                  y={centerY + 8}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className={`text-xs font-medium fill-current ${
                                    darkMode ? "text-gray-400" : "text-gray-600"
                                  }`}
                                >
                                  {formatCurrency(
                                    categorySubtype === "expenses"
                                      ? totals.expenses
                                      : totals.income
                                  )}
                                </text>
                              </>
                            ) : (
                              <>
                                <text
                                  x={centerX}
                                  y={centerY - 15}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className={`text-xs font-bold fill-current ${
                                    darkMode ? "text-gray-300" : "text-gray-700"
                                  }`}
                                >
                                  Movimentação
                                </text>
                                <text
                                  x={centerX}
                                  y={centerY - 2}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className={`text-xs font-medium fill-current ${
                                    darkMode ? "text-gray-400" : "text-gray-600"
                                  }`}
                                >
                                  {formatCurrency(totals.total)}
                                </text>
                                <text
                                  x={centerX}
                                  y={centerY + 12}
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  className={`text-xs fill-current ${
                                    darkMode ? "text-gray-500" : "text-gray-500"
                                  }`}
                                >
                                  Saldo:{" "}
                                  {formatCurrency(
                                    totals.income - totals.expenses
                                  )}
                                </text>
                              </>
                            )}
                          </svg>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Legenda */}
                  <div className="space-y-4">
                    <h4
                      className={`font-medium ${
                        darkMode ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {getChartTitle(chartType)}
                    </h4>

                    <div className="space-y-3">
                      {(() => {
                        const { data: chartData, totals } =
                          generatePieChartData(report, chartType, chartFilters);

                        return chartData.map((item, index) => {
                          const percentage =
                            totals.total > 0
                              ? (item.value / totals.total) * 100
                              : 0;

                          return (
                            <div
                              key={`legend-${item.name}-${index}`}
                              className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                                hoveredSegment === index
                                  ? darkMode
                                    ? "bg-gray-700 shadow-lg"
                                    : "bg-gray-50 shadow-lg"
                                  : darkMode
                                  ? "hover:bg-gray-700"
                                  : "hover:bg-gray-50"
                              }`}
                              onMouseEnter={() => setHoveredSegment(index)}
                              onMouseLeave={() => setHoveredSegment(null)}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                                    hoveredSegment === index
                                      ? "w-5 h-5 shadow-lg"
                                      : ""
                                  }`}
                                  style={{ backgroundColor: item.color }}
                                />
                                <div>
                                  <div
                                    className={`text-sm font-medium transition-all duration-300 ${
                                      darkMode ? "text-white" : "text-gray-800"
                                    } ${
                                      hoveredSegment === index
                                        ? "font-bold text-lg"
                                        : ""
                                    }`}
                                  >
                                    {item.name}
                                  </div>
                                  {item.budget > 0 && (
                                    <div
                                      className={`text-xs ${
                                        darkMode
                                          ? "text-gray-400"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      Orçamento: {formatCurrency(item.budget)} (
                                      {item.percentage}%)
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`text-sm font-bold transition-all duration-300 ${
                                    darkMode ? "text-white" : "text-gray-800"
                                  } ${
                                    hoveredSegment === index ? "text-lg" : ""
                                  }`}
                                >
                                  {formatCurrency(item.value)}
                                </div>
                                <div
                                  className={`text-xs ${
                                    darkMode ? "text-gray-400" : "text-gray-600"
                                  }`}
                                >
                                  {percentage.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Resumo contextual corrigido */}
                    <div
                      className={`mt-6 p-4 rounded-lg ${
                        darkMode ? "bg-gray-700" : "bg-gray-50"
                      }`}
                    >
                      <h5
                        className={`text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        {chartType === "category"
                          ? categorySubtype === "income"
                            ? "Análise de Receitas:"
                            : "Análise de Despesas:"
                          : "Resumo Financeiro:"}
                      </h5>

                      {chartType === "category" ? (
                        categorySubtype === "income" ? (
                          // Análise de Receitas
                          <div className="grid grid-cols-1 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span
                                className={
                                  darkMode ? "text-gray-400" : "text-gray-600"
                                }
                              >
                                Receitas Planejadas:
                              </span>
                              <span className="font-bold text-green-600">
                                {formatCurrency(
                                  report.categoryTotals
                                    .filter((cat) => cat.type === "income")
                                    .reduce((sum, cat) => sum + cat.spent, 0)
                                )}
                              </span>
                            </div>

                            {report.pontualTotal &&
                              report.pontualTotal.income > 0 && (
                                <div className="flex justify-between">
                                  <span
                                    className={
                                      darkMode
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                    }
                                  >
                                    Receitas Pontuais:
                                  </span>
                                  <span className="font-bold text-green-500">
                                    {formatCurrency(report.pontualTotal.income)}
                                  </span>
                                </div>
                              )}

                            <div className="flex justify-between">
                              <span
                                className={
                                  darkMode ? "text-gray-400" : "text-gray-600"
                                }
                              >
                                Meta de Receitas:
                              </span>
                              <span className="font-bold text-blue-600">
                                {formatCurrency(
                                  report.categoryTotals
                                    .filter((cat) => cat.type === "income")
                                    .reduce((sum, cat) => sum + cat.budget, 0)
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                              <span
                                className={`font-medium ${
                                  darkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                Total Recebido:
                              </span>
                              <span className="font-bold text-lg text-green-600">
                                {formatCurrency(
                                  report.categoryTotals
                                    .filter((cat) => cat.type === "income")
                                    .reduce((sum, cat) => sum + cat.spent, 0) +
                                    (report.pontualTotal?.income || 0)
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (
                          // Análise de Despesas
                          <div className="grid grid-cols-1 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span
                                className={
                                  darkMode ? "text-gray-400" : "text-gray-600"
                                }
                              >
                                Despesas Planejadas:
                              </span>
                              <span className="font-bold text-red-600">
                                {formatCurrency(
                                  report.categoryTotals
                                    .filter((cat) => cat.type === "expense")
                                    .reduce((sum, cat) => sum + cat.spent, 0)
                                )}
                              </span>
                            </div>

                            {report.pontualTotal &&
                              report.pontualTotal.expenses > 0 && (
                                <div className="flex justify-between">
                                  <span
                                    className={
                                      darkMode
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                    }
                                  >
                                    Despesas Pontuais:
                                  </span>
                                  <span className="font-bold text-orange-600">
                                    {formatCurrency(
                                      report.pontualTotal.expenses
                                    )}
                                  </span>
                                </div>
                              )}

                            <div className="flex justify-between">
                              <span
                                className={
                                  darkMode ? "text-gray-400" : "text-gray-600"
                                }
                              >
                                Orçamento Total:
                              </span>
                              <span className="font-bold text-blue-600">
                                {formatCurrency(
                                  report.categoryTotals
                                    .filter((cat) => cat.type === "expense")
                                    .reduce((sum, cat) => sum + cat.budget, 0)
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                              <span
                                className={`font-medium ${
                                  darkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                Total Gasto:
                              </span>
                              <span className="font-bold text-lg text-red-600">
                                {formatCurrency(
                                  report.categoryTotals
                                    .filter((cat) => cat.type === "expense")
                                    .reduce((sum, cat) => sum + cat.spent, 0) +
                                    (report.pontualTotal?.expenses || 0)
                                )}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span
                                className={
                                  darkMode ? "text-gray-400" : "text-gray-600"
                                }
                              >
                                Saldo Disponível:
                              </span>
                              <span className="font-bold text-green-600">
                                {formatCurrency(
                                  Math.max(
                                    0,
                                    report.categoryTotals
                                      .filter((cat) => cat.type === "expense")
                                      .reduce(
                                        (sum, cat) => sum + cat.budget,
                                        0
                                      ) -
                                      report.categoryTotals
                                        .filter((cat) => cat.type === "expense")
                                        .reduce(
                                          (sum, cat) => sum + cat.spent,
                                          0
                                        ) -
                                      (report.pontualTotal?.expenses || 0)
                                  )
                                )}
                              </span>
                            </div>
                          </div>
                        )
                      ) : (
                        // Resumo para gráfico "Receitas vs Despesas"
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span
                              className={
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }
                            >
                              Receitas:
                            </span>
                            <span className="ml-2 font-bold text-green-600">
                              {formatCurrency(report.totalIncome)}
                            </span>
                          </div>
                          <div>
                            <span
                              className={
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }
                            >
                              Despesas:
                            </span>
                            <span className="ml-2 font-bold text-red-600">
                              {formatCurrency(report.totalExpenses)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline Charts Section */}
            {showTimelineChart && (
              <div
                className={`rounded-lg shadow-md p-6 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3
                    className={`text-lg font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Análise Temporal
                    {/* indicador de filtros ativos */}
                    {(chartFilters.minAmount ||
                      chartFilters.maxAmount ||
                      chartFilters.selectedCategories.length > 0) && (
                      <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Filtros Ativos
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-4">
                    {/* Seletor de tipo de gráfico temporal */}
                    <select
                      value={timelineType}
                      onChange={(e) => setTimelineType(e.target.value)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        darkMode
                          ? "bg-gray-700 text-gray-300 border-gray-600"
                          : "bg-white text-gray-700 border-gray-300"
                      }`}
                    >
                      <option value="monthly">📅 Evolução Mensal</option>
                      <option value="category_trend">📊 Top Categorias</option>
                    </select>

                    {/* Seletor de período (só para evolução mensal) */}
                    {timelineType === "monthly" && (
                      <select
                        value={selectedTimeRange}
                        onChange={(e) =>
                          setSelectedTimeRange(parseInt(e.target.value))
                        }
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          darkMode
                            ? "bg-gray-700 text-gray-300 border-gray-600"
                            : "bg-white text-gray-700 border-gray-300"
                        }`}
                      >
                        <option value={3}>3 meses</option>
                        <option value={6}>6 meses</option>
                        <option value={12}>12 meses</option>
                      </select>
                    )}

                    {/* Botão para ocultar */}
                    <button
                      onClick={() => setShowTimelineChart(!showTimelineChart)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      📈 Ocultar
                    </button>
                  </div>
                </div>

                {/* Gráfico Temporal */}
                <div className="h-64">
                  {(() => {
                    // ADICIONAR filtros aqui
                    const timelineData = generateTimelineData(
                      timelineType,
                      selectedTimeRange,
                      chartFilters
                    );

                    if (timelineData.length === 0) {
                      return (
                        <div
                          className={`flex items-center justify-center h-full ${
                            darkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-6xl mb-4">📈</div>
                            <p>Nenhum dado disponível</p>
                            <p className="text-sm">
                              {chartFilters.minAmount ||
                              chartFilters.maxAmount ||
                              chartFilters.selectedCategories.length > 0
                                ? "Ajuste os filtros para ver dados"
                                : "Adicione mais transações em diferentes meses"}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    if (timelineType === "monthly") {
                      // Gráfico de barras da evolução mensal
                      const maxIncome = getMaxValue(timelineData, "income");
                      const maxExpenses = getMaxValue(timelineData, "expenses");
                      const maxValue = Math.max(maxIncome, maxExpenses);
                      const chartHeight = 200;
                      const chartWidth = 800;
                      const barWidth = (chartWidth / timelineData.length) * 0.7;
                      const spacing = chartWidth / timelineData.length;

                      return (
                        <div className="w-full overflow-x-auto">
                          <svg
                            width={chartWidth}
                            height={chartHeight + 60}
                            viewBox={`0 0 ${chartWidth} ${chartHeight + 60}`}
                          >
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                              <g key={`unique-prefix-${index}`}>
                                <line
                                  x1="0"
                                  y1={chartHeight * (1 - ratio)}
                                  x2={chartWidth}
                                  y2={chartHeight * (1 - ratio)}
                                  stroke={darkMode ? "#374151" : "#e5e7eb"}
                                  strokeWidth="1"
                                  strokeDasharray="2,2"
                                />
                                <text
                                  x="-5"
                                  y={chartHeight * (1 - ratio) + 4}
                                  textAnchor="end"
                                  className={`text-xs fill-current ${
                                    darkMode ? "text-gray-400" : "text-gray-600"
                                  }`}
                                >
                                  {formatCurrency(maxValue * ratio)}
                                </text>
                              </g>
                            ))}

                            {/* Barras */}
                            {timelineData.map((item, index) => {
                              const x =
                                index * spacing + (spacing - barWidth) / 2;
                              const incomeHeight =
                                maxValue > 0
                                  ? (item.income / maxValue) * chartHeight
                                  : 0;
                              const expenseHeight =
                                maxValue > 0
                                  ? (item.expenses / maxValue) * chartHeight
                                  : 0;

                              return (
                                <g key={`unique-prefix-${index}`}>
                                  {/* Barra de receitas */}
                                  <path
                                    d={createBarPath(
                                      x,
                                      chartHeight - incomeHeight,
                                      barWidth / 2 - 2,
                                      incomeHeight
                                    )}
                                    fill="#10b981"
                                    className="transition-all duration-300 hover:brightness-110"
                                  />

                                  {/* Barra de despesas */}
                                  <path
                                    d={createBarPath(
                                      x + barWidth / 2 + 2,
                                      chartHeight - expenseHeight,
                                      barWidth / 2 - 2,
                                      expenseHeight
                                    )}
                                    fill="#ef4444"
                                    className="transition-all duration-300 hover:brightness-110"
                                  />

                                  {/* Label do mês */}
                                  <text
                                    x={x + barWidth / 2}
                                    y={chartHeight + 20}
                                    textAnchor="middle"
                                    className={`text-xs fill-current ${
                                      darkMode
                                        ? "text-gray-300"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {item.month}
                                  </text>

                                  {/* Valores no hover */}
                                  {/* Área clicável para drill-down */}
                                  <rect
                                    x={x}
                                    y="0"
                                    width={barWidth}
                                    height={chartHeight}
                                    fill="transparent"
                                    className="cursor-pointer hover:fill-blue-500 hover:fill-opacity-10 transition-all"
                                    onClick={() => {
                                      // CORREÇÃO: Definir currentDate aqui
                                      const now = new Date();
                                      const clickDate = new Date(
                                        now.getFullYear(),
                                        now.getMonth() -
                                          (timelineData.length - 1 - index),
                                        1
                                      );

                                      handleDataPointClick(
                                        {
                                          ...item,
                                          date: clickDate,
                                        },
                                        "monthly"
                                      );
                                    }}
                                  >
                                    <title>
                                      {item.monthFull}&#10;Receitas:{" "}
                                      {formatCurrency(item.income)}
                                      &#10;Despesas:{" "}
                                      {formatCurrency(
                                        item.expenses
                                      )}&#10;Saldo:{" "}
                                      {formatCurrency(item.balance)}
                                      &#10;&#10;Clique para ver detalhes
                                    </title>
                                  </rect>
                                </g>
                              );
                            })}

                            {/* Legenda */}
                            <g transform={`translate(${chartWidth - 150}, 20)`}>
                              <rect
                                x="0"
                                y="0"
                                width="12"
                                height="12"
                                fill="#10b981"
                              />
                              <text
                                x="20"
                                y="10"
                                className={`text-xs fill-current ${
                                  darkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                Receitas
                              </text>
                              <rect
                                x="0"
                                y="20"
                                width="12"
                                height="12"
                                fill="#ef4444"
                              />
                              <text
                                x="20"
                                y="30"
                                className={`text-xs fill-current ${
                                  darkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                Despesas
                              </text>
                            </g>
                          </svg>
                        </div>
                      );
                    } else {
                      // Gráfico de barras horizontais para categorias
                      const maxValue = Math.max(
                        ...timelineData.map((item) => item.value)
                      );

                      return (
                        <div className="space-y-4">
                          <h4
                            className={`font-medium ${
                              darkMode ? "text-white" : "text-gray-800"
                            }`}
                          >
                            Top 5 Categorias por Volume
                          </h4>
                          <div className="space-y-3">
                            {timelineData.map((item, index) => {
                              const percentage =
                                maxValue > 0
                                  ? (item.value / maxValue) * 100
                                  : 0;

                              return (
                                <div
                                  key={`unique-prefix-${index}`}
                                  className="flex items-center gap-4"
                                >
                                  <div className="w-32 text-right">
                                    <div
                                      className={`text-sm font-medium ${
                                        darkMode
                                          ? "text-white"
                                          : "text-gray-800"
                                      }`}
                                    >
                                      {item.name}
                                    </div>
                                    <div
                                      className={`text-xs ${
                                        darkMode
                                          ? "text-gray-400"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      {item.count} transações
                                    </div>
                                  </div>
                                  <div className="flex-1 relative">
                                    <div
                                      className={`h-6 rounded-full ${
                                        darkMode ? "bg-gray-700" : "bg-gray-200"
                                      }`}
                                    >
                                      <div
                                        className="h-6 rounded-full transition-all duration-1000 flex items-center justify-end pr-2"
                                        style={{
                                          width: `${percentage}%`,
                                          backgroundColor: item.color,
                                          animationDelay: `${index * 200}ms`,
                                        }}
                                      >
                                        <span className="text-xs font-medium text-white">
                                          {formatCurrency(item.value)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Estatísticas resumidas */}
                {timelineType === "monthly" && (
                  <div
                    className={`mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t ${
                      darkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    {(() => {
                      const timelineData = generateTimelineData(
                        timelineType,
                        selectedTimeRange,
                        chartFilters
                      );
                      const totalIncome = timelineData.reduce(
                        (sum, item) => sum + item.income,
                        0
                      );
                      const totalExpenses = timelineData.reduce(
                        (sum, item) => sum + item.expenses,
                        0
                      );
                      const avgMonthlyIncome =
                        totalIncome / timelineData.length;
                      const avgMonthlyExpenses =
                        totalExpenses / timelineData.length;

                      return (
                        <>
                          <div className="text-center">
                            <div
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Receita Média Mensal
                            </div>
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(avgMonthlyIncome)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Despesa Média Mensal
                            </div>
                            <div className="text-lg font-bold text-red-600">
                              {formatCurrency(avgMonthlyExpenses)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Saldo Médio Mensal
                            </div>
                            <div
                              className={`text-lg font-bold ${
                                avgMonthlyIncome - avgMonthlyExpenses >= 0
                                  ? "text-blue-600"
                                  : "text-orange-600"
                              }`}
                            >
                              {formatCurrency(
                                avgMonthlyIncome - avgMonthlyExpenses
                              )}
                            </div>
                          </div>
                          <div className="text-center">
                            <div
                              className={`text-sm ${
                                darkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Total do Período
                            </div>
                            <div
                              className={`text-lg font-bold ${
                                totalIncome - totalExpenses >= 0
                                  ? "text-blue-600"
                                  : "text-orange-600"
                              }`}
                            >
                              {formatCurrency(totalIncome - totalExpenses)}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div
                className={`p-4 rounded-lg text-center ${
                  darkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <div className="text-2xl mb-2">🎯</div>
                <div
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Meta Atingida
                </div>
                <div
                  className={`text-lg font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {report.categoryTotals.length > 0
                    ? Math.round(
                        report.categoryTotals.reduce(
                          (acc, cat) => acc + cat.percentage,
                          0
                        ) / report.categoryTotals.length
                      )
                    : 0}
                  %
                </div>
              </div>

              <div
                className={`p-4 rounded-lg text-center ${
                  darkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <div className="text-2xl mb-2">📊</div>
                <div
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Categorias Ativas
                </div>
                <div
                  className={`text-lg font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {report.categoryTotals.filter((cat) => cat.spent > 0).length}
                </div>
              </div>

              <div
                className={`p-4 rounded-lg text-center ${
                  darkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <div className="text-2xl mb-2">⚡</div>
                <div
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Maior Gasto
                </div>
                <div
                  className={`text-lg font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {report.categoryTotals.length > 0
                    ? formatCurrency(
                        Math.max(
                          ...report.categoryTotals.map((cat) => cat.spent)
                        )
                      )
                    : formatCurrency(0)}
                </div>
              </div>

              <div
                className={`p-4 rounded-lg text-center ${
                  darkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <div className="text-2xl mb-2">💡</div>
                <div
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Economia Possível
                </div>
                <div
                  className={`text-lg font-bold ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  {formatCurrency(
                    report.categoryTotals.reduce(
                      (acc, cat) => acc + Math.max(0, cat.remaining),
                      0
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedDataPoint && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div
                  className={`max-w-4xl w-full max-h-[80vh] overflow-y-auto rounded-lg shadow-xl ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3
                        className={`text-xl font-semibold ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        Detalhes - {selectedDataPoint.monthFull}
                      </h3>
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className={`p-2 rounded-lg transition-colors ${
                          darkMode
                            ? "hover:bg-gray-700 text-gray-400"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Resumo do período */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div
                        className={`p-4 rounded-lg ${
                          darkMode ? "bg-gray-700" : "bg-green-50"
                        }`}
                      >
                        <div className="text-sm text-green-600 font-medium">
                          Receitas
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(selectedDataPoint.income)}
                        </div>
                      </div>
                      <div
                        className={`p-4 rounded-lg ${
                          darkMode ? "bg-gray-700" : "bg-red-50"
                        }`}
                      >
                        <div className="text-sm text-red-600 font-medium">
                          Despesas
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(selectedDataPoint.expenses)}
                        </div>
                      </div>
                      <div
                        className={`p-4 rounded-lg ${
                          selectedDataPoint.balance >= 0
                            ? darkMode
                              ? "bg-gray-700"
                              : "bg-blue-50"
                            : darkMode
                            ? "bg-gray-700"
                            : "bg-orange-50"
                        }`}
                      >
                        <div
                          className={`text-sm font-medium ${
                            selectedDataPoint.balance >= 0
                              ? "text-blue-600"
                              : "text-orange-600"
                          }`}
                        >
                          Saldo
                        </div>
                        <div
                          className={`text-2xl font-bold ${
                            selectedDataPoint.balance >= 0
                              ? "text-blue-600"
                              : "text-orange-600"
                          }`}
                        >
                          {formatCurrency(selectedDataPoint.balance)}
                        </div>
                      </div>
                    </div>

                    {/* Lista de transações */}
                    <div>
                      <h4
                        className={`text-lg font-medium mb-4 ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        Transações do Período (
                        {selectedDataPoint.transactionCount})
                      </h4>

                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {generateDetailedData(selectedDataPoint).map(
                          (transaction, index) => (
                            <div
                              key={`unique-prefix-${index}`}
                              className={`flex items-center justify-between p-3 rounded-lg ${
                                darkMode ? "bg-gray-700" : "bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    transaction.type === "income"
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }`}
                                />
                                <div>
                                  <div
                                    className={`font-medium ${
                                      darkMode ? "text-white" : "text-gray-800"
                                    }`}
                                  >
                                    {transaction.description}
                                  </div>
                                  <div
                                    className={`text-sm ${
                                      darkMode
                                        ? "text-gray-400"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {transaction.categoryName} •{" "}
                                    {formatDate(transaction.date)}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`font-semibold ${
                                  transaction.type === "income"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {transaction.type === "income" ? "+" : "-"}
                                {formatCurrency(Math.abs(transaction.amount))}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <button
                        onClick={() => {
                          exportChartData(
                            generateDetailedData(selectedDataPoint),
                            "detailed"
                          );
                          showNotification(
                            "Dados detalhados exportados!",
                            "success",
                            "general"
                          );
                        }}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          darkMode
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        📊 Exportar Detalhes
                      </button>
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          darkMode
                            ? "bg-gray-600 text-white hover:bg-gray-700"
                            : "bg-gray-600 text-white hover:bg-gray-700"
                        }`}
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Botão para mostrar gráficos temporais quando ocultos */}
            {!showTimelineChart && (
              <div className="text-center">
                <button
                  onClick={() => setShowTimelineChart(true)}
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto ${
                    darkMode
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  📈 Mostrar Análise Temporal
                </button>
              </div>
            )}
            {/* Botão para mostrar gráficos quando ocultos */}
            {!showCharts && (
              <div className="text-center">
                <button
                  onClick={() => setShowCharts(true)}
                  className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto ${
                    darkMode
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  📊 Mostrar Gráficos
                </button>
              </div>
            )}
            {/* Category Performance */}
            <div
              className={`rounded-lg shadow-md p-6 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Performance por Categoria
              </h3>

              {/* Categorias Planejadas */}
              {report.categoryTotals.length > 0 && (
                <div className="space-y-4 mb-6">
                  <h4
                    className={`text-md font-medium ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    📊 Categorias Planejadas
                  </h4>
                  {report.categoryTotals.map((category) => (
                    <div
                      key={category.id}
                      className={`border rounded-lg p-4 ${
                        darkMode
                          ? "border-gray-600 bg-gray-700"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4
                          className={`font-medium ${
                            darkMode ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {category.name} - {getMonthName(category.month)}
                        </h4>
                        <span
                          className={`font-semibold ${
                            category.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(category.spent)} /{" "}
                          {formatCurrency(category.budget)}
                        </span>
                      </div>

                      <div
                        className={`w-full rounded-full h-2 mb-2 ${
                          darkMode ? "bg-gray-600" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`h-2 rounded-full ${
                            category.percentage > 100
                              ? "bg-red-500"
                              : category.percentage > 80
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(category.percentage, 100)}%`,
                          }}
                        ></div>
                      </div>

                      <div
                        className={`flex justify-between text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        <span>{category.percentage}% atingido</span>
                        <span>
                          Restante: {formatCurrency(category.remaining)}
                        </span>
                      </div>

                      {reportView === "detailed" &&
                        category.transactions.length > 0 && (
                          <div
                            className={`mt-3 pt-3 border-t ${
                              darkMode ? "border-gray-600" : "border-gray-200"
                            }`}
                          >
                            <h5
                              className={`text-sm font-medium mb-2 ${
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Transações:
                            </h5>
                            <div className="space-y-1">
                              {category.transactions.map((transaction) => (
                                <div
                                  key={transaction.id}
                                  className={`flex justify-between text-sm ${
                                    darkMode ? "text-gray-400" : "text-gray-600"
                                  }`}
                                >
                                  <span>{transaction.description}</span>
                                  <span>
                                    {formatDate(transaction.date)} -{" "}
                                    {formatCurrency(transaction.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}

              {/* Lançamentos Pontuais */}
              {report.pontualTotal && (
                <div className="space-y-4">
                  <h4
                    className={`text-md font-medium ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    🎯 Lançamentos Pontuais
                  </h4>
                  <div
                    className={`border rounded-lg p-4 ${
                      darkMode
                        ? "border-orange-600 bg-orange-900/10"
                        : "border-orange-200 bg-orange-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4
                        className={`font-medium ${
                          darkMode ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {report.pontualTotal.name}
                      </h4>
                      <div className="flex gap-4">
                        {report.pontualTotal.income > 0 && (
                          <span className="font-semibold text-green-600">
                            +{formatCurrency(report.pontualTotal.income)}
                          </span>
                        )}
                        {report.pontualTotal.expenses > 0 && (
                          <span className="font-semibold text-red-600">
                            -{formatCurrency(report.pontualTotal.expenses)}
                          </span>
                        )}
                      </div>
                    </div>

                    {reportView === "detailed" &&
                      report.pontualTotal.transactions.length > 0 && (
                        <div
                          className={`mt-3 pt-3 border-t ${
                            darkMode ? "border-orange-700" : "border-orange-200"
                          }`}
                        >
                          <h5
                            className={`text-sm font-medium mb-2 ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            Detalhes dos Lançamentos Pontuais:
                          </h5>
                          <div className="space-y-2">
                            {report.pontualTotal.categories.map(
                              (pontualCat) => {
                                const catTransactions =
                                  report.pontualTotal.transactions.filter(
                                    (t) => t.categoryId === pontualCat.id
                                  );
                                return (
                                  <div
                                    key={pontualCat.id}
                                    className={`p-2 rounded ${
                                      darkMode ? "bg-gray-800" : "bg-white"
                                    }`}
                                  >
                                    <div
                                      className={`font-medium text-sm ${
                                        darkMode
                                          ? "text-orange-300"
                                          : "text-orange-700"
                                      }`}
                                    >
                                      {pontualCat.name}
                                    </div>
                                    {catTransactions.map((transaction) => (
                                      <div
                                        key={transaction.id}
                                        className={`flex justify-between text-xs mt-1 ${
                                          darkMode
                                            ? "text-gray-400"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        <span>{transaction.description}</span>
                                        <span
                                          className={
                                            transaction.type === "income"
                                              ? "text-green-600"
                                              : "text-red-600"
                                          }
                                        >
                                          {transaction.type === "income"
                                            ? "+"
                                            : "-"}
                                          {formatCurrency(
                                            Math.abs(transaction.amount)
                                          )}{" "}
                                          - {formatDate(transaction.date)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Mensagem quando não há dados */}
              {report.categoryTotals.length === 0 && !report.pontualTotal && (
                <div
                  className={`text-center py-8 ${
                    darkMode ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  Nenhuma categoria ou lançamento encontrado para este período
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Management Screen - Only for Super Users */}
        {currentScreen === "users" && hasPermission("user_management") && (
          <div className="space-y-6">
            {/* Add User Form */}
            <div
              className={`rounded-lg shadow-md p-6 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Adicionar Novo Usuário
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Campo Nome */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={newUserForm.name}
                    onChange={(e) => {
                      setNewUserForm({ ...newUserForm, name: e.target.value });
                      if (formErrors.user && formErrors.user.name) {
                        clearFieldError("user", "name");
                      }
                    }}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      formErrors.user && formErrors.user.name
                        ? darkMode
                          ? "border-red-500 bg-red-900/20 text-white placeholder-gray-400"
                          : "border-red-500 bg-red-50"
                        : darkMode
                        ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  {formErrors.user && formErrors.user.name && (
                    <p
                      className={`text-sm mt-1 ${
                        darkMode ? "text-red-400" : "text-red-500"
                      }`}
                    >
                      {formErrors.user.name}
                    </p>
                  )}
                </div>

                {/* Campo Email */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUserForm.email}
                    onChange={(e) => {
                      setNewUserForm({ ...newUserForm, email: e.target.value });
                      if (formErrors.user && formErrors.user.email) {
                        clearFieldError("user", "email");
                      }
                    }}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      formErrors.user && formErrors.user.email
                        ? darkMode
                          ? "border-red-500 bg-red-900/20 text-white placeholder-gray-400"
                          : "border-red-500 bg-red-50"
                        : darkMode
                        ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  {formErrors.user && formErrors.user.email && (
                    <p
                      className={`text-sm mt-1 ${
                        darkMode ? "text-red-400" : "text-red-500"
                      }`}
                    >
                      {formErrors.user.email}
                    </p>
                  )}
                </div>

                {/* Campo Senha */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Senha <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Senha"
                    value={newUserForm.password}
                    onChange={(e) => {
                      setNewUserForm({
                        ...newUserForm,
                        password: e.target.value,
                      });
                      if (formErrors.user && formErrors.user.password) {
                        clearFieldError("user", "password");
                      }
                    }}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      formErrors.user && formErrors.user.password
                        ? darkMode
                          ? "border-red-500 bg-red-900/20 text-white placeholder-gray-400"
                          : "border-red-500 bg-red-50"
                        : darkMode
                        ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                        : "border-gray-300 bg-white"
                    }`}
                  />
                  {formErrors.user && formErrors.user.password && (
                    <p
                      className={`text-sm mt-1 ${
                        darkMode ? "text-red-400" : "text-red-500"
                      }`}
                    >
                      {formErrors.user.password}
                    </p>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      darkMode ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    Mín. 6 caracteres, deve conter letra e número
                  </p>
                </div>

                {/* Campo Role */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Nível <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) =>
                      setNewUserForm({ ...newUserForm, role: e.target.value })
                    }
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      darkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <option value="viewer">Visualizador</option>
                    <option value="editor">Editor</option>
                    <option value="super">Super Usuário</option>
                  </select>
                </div>

                {/* Botão */}
                <div>
                  {/* Label invisível para manter alinhamento */}
                  <label className="block text-sm font-medium mb-1 opacity-0">
                    Ação
                  </label>
                  <button
                    onClick={addUser}
                    disabled={isLoading.addUser}
                    className={`w-full bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                      isLoading.addUser
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-700"
                    }`}
                  >
                    {isLoading.addUser && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    )}
                    <Plus size={16} />
                    {isLoading.addUser ? "Adicionando..." : "Adicionar"}
                  </button>
                </div>
              </div>
            </div>

            {/* Users List */}
            <div
              className={`rounded-lg shadow-md p-6 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Usuários do Sistema
              </h2>
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      darkMode
                        ? "border-gray-600 bg-gray-700"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-full ${
                          darkMode ? "bg-gray-600" : "bg-blue-100"
                        }`}
                      >
                        <User
                          className={`${
                            darkMode ? "text-gray-300" : "text-blue-600"
                          }`}
                          size={20}
                        />
                      </div>
                      <div>
                        <h3
                          className={`font-medium flex items-center gap-2 ${
                            darkMode ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {user.name}
                          {user.id === currentUser.id && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Você
                            </span>
                          )}
                        </h3>
                        <p
                          className={`text-sm ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            {USER_ROLES[user.role].name}
                          </span>
                          <div
                            className={`text-xs ${
                              darkMode ? "text-gray-500" : "text-gray-500"
                            }`}
                          >
                            Permissões:{" "}
                            {USER_ROLES[user.role].permissions
                              .map((p) => {
                                const permissionNames = {
                                  planning: "Planejamento",
                                  transactions: "Lançamentos",
                                  reports: "Relatórios",
                                  user_management: "Usuários",
                                };
                                return permissionNames[p];
                              })
                              .join(", ")}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => deleteUser(user.id, user.name)}
                          disabled={isLoading.deleteUser}
                          className={`p-2 rounded-lg transition-colors ${
                            isLoading.deleteUser
                              ? "opacity-50 cursor-not-allowed"
                              : darkMode
                              ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              : "text-red-600 hover:text-red-800 hover:bg-red-50"
                          }`}
                          title="Excluir usuário"
                        >
                          {isLoading.deleteUser ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permissions Guide */}
            <div
              className={`rounded-lg shadow-md p-6 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2
                className={`text-xl font-semibold mb-4 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Guia de Permissões
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className={`border rounded-lg p-4 ${
                    darkMode ? "border-gray-600 bg-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <User className="text-red-600" size={20} />
                    <h3 className="font-medium text-red-600">Super Usuário</h3>
                  </div>
                  <p
                    className={`text-sm mb-2 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Acesso total ao sistema
                  </p>
                  <ul
                    className={`text-xs space-y-1 ${
                      darkMode ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    <li>• Gerenciar usuários</li>
                    <li>• Planejamento financeiro</li>
                    <li>• Lançamentos</li>
                    <li>• Todos os relatórios</li>
                  </ul>
                </div>

                <div
                  className={`border rounded-lg p-4 ${
                    darkMode ? "border-gray-600 bg-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <User className="text-blue-600" size={20} />
                    <h3 className="font-medium text-blue-600">Editor</h3>
                  </div>
                  <p
                    className={`text-sm mb-2 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Operações financeiras
                  </p>
                  <ul
                    className={`text-xs space-y-1 ${
                      darkMode ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    <li>• Planejamento financeiro</li>
                    <li>• Lançamentos</li>
                    <li>• Todos os relatórios</li>
                    <li>
                      •{" "}
                      <span className="text-red-500">
                        Não gerencia usuários
                      </span>
                    </li>
                  </ul>
                </div>

                <div
                  className={`border rounded-lg p-4 ${
                    darkMode ? "border-gray-600 bg-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <User className="text-green-600" size={20} />
                    <h3 className="font-medium text-green-600">Visualizador</h3>
                  </div>
                  <p
                    className={`text-sm mb-2 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Apenas consulta
                  </p>
                  <ul
                    className={`text-xs space-y-1 ${
                      darkMode ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    <li>• Visualizar relatórios</li>
                    <li>
                      •{" "}
                      <span className="text-red-500">
                        Não edita planejamento
                      </span>
                    </li>
                    <li>
                      •{" "}
                      <span className="text-red-500">Não faz lançamentos</span>
                    </li>
                    <li>
                      •{" "}
                      <span className="text-red-500">
                        Não gerencia usuários
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Preferences Screen */}
        {currentScreen === "system-preferences" &&
          hasPermission("user_management") && (
            <div className="space-y-6">
              {/* Header*/}
              <div
                className={`rounded-lg shadow-md p-6 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className={`text-xl font-semibold ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    Preferências do Sistema
                  </h2>
                  <div className="flex gap-3">
                    <button
                      onClick={exportSystemPreferences}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                        darkMode
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Exportar
                    </button>

                    <label
                      className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 cursor-pointer ${
                        darkMode
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      Importar
                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            importSystemPreferences(e.target.files[0]);
                            e.target.value = "";
                          }
                        }}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={() => {
                        showConfirmDialog(
                          "Resetar Preferências",
                          "Tem certeza que deseja resetar todas as preferências para os valores padrão? Esta ação não pode ser desfeita.",
                          resetSystemPreferences,
                          "warning"
                        );
                      }}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                        darkMode
                          ? "bg-red-600 text-white hover:bg-red-700"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Resetar
                    </button>
                  </div>
                </div>

                <p
                  className={`text-sm ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Configure as preferências globais do sistema que se aplicam a
                  todos os usuários e sessões.
                </p>
              </div>

              {/* Preferências de Exibição */}
              <div
                className={`rounded-lg shadow-md p-6 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                {/* Seção de Exibição Funcional */}
                <div
                  className={`rounded-lg shadow-md p-6 ${
                    darkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <h3
                    className={`text-lg font-semibold mb-4 ${
                      darkMode ? "text-white" : "text-gray-800"
                    }`}
                  >
                    📊 Preferências de Exibição
                  </h3>

                  <div className="space-y-6">
                    {/* Período padrão dos relatórios */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Período Padrão dos Relatórios
                      </label>
                      <select
                        value={systemPreferences.defaultReportPeriod}
                        onChange={(e) =>
                          updateSystemPreference(
                            "defaultReportPeriod",
                            e.target.value
                          )
                        }
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          darkMode
                            ? "border-gray-600 bg-gray-700 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <option value="monthly">📅 Mensal</option>
                        <option value="semester">📆 Semestral</option>
                        <option value="annual">🗓️ Anual</option>
                      </select>
                    </div>

                    {/* Mostrar gráficos ao carregar */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Mostrar Gráficos ao Carregar
                      </label>
                      <div className="flex items-center gap-3">
                        <ToggleSwitch
                          enabled={systemPreferences.showChartsOnLoad}
                          onToggle={() =>
                            updateSystemPreference(
                              "showChartsOnLoad",
                              !systemPreferences.showChartsOnLoad
                            )
                          }
                          color="green"
                        />
                        <span
                          className={`text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {systemPreferences.showChartsOnLoad
                            ? "Habilitado"
                            : "Desabilitado"}
                        </span>
                      </div>
                    </div>

                    {/* Botão de teste */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex gap-3">
                        <button
                          onClick={exportSystemPreferences}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            darkMode
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          📥 Exportar preferências
                        </button>

                        <button
                          onClick={() => {
                            showConfirmDialog(
                              "Resetar Preferências",
                              "Tem certeza que deseja resetar as preferências?",
                              resetSystemPreferences,
                              "warning"
                            );
                          }}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                            darkMode
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          🔄 Limpar preferências
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferências de Formato */}
              <div
                className={`rounded-lg shadow-md p-6 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  🌐 Preferências de Formato
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Formato de data */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Formato de Data
                    </label>
                    <select
                      value={systemPreferences.dateFormat}
                      onChange={(e) =>
                        updateSystemPreference("dateFormat", e.target.value)
                      }
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        darkMode
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <option value="dd/mm/yyyy">DD/MM/AAAA</option>
                      <option value="mm/dd/yyyy">MM/DD/AAAA</option>
                      <option value="yyyy-mm-dd">AAAA-MM-DD</option>
                    </select>
                    <p
                      className={`text-xs mt-1 ${
                        darkMode ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      Exemplo: {new Date().toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  {/* Formato de moeda */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Formato de Moeda
                    </label>
                    <select
                      value={systemPreferences.currencyFormat}
                      onChange={(e) =>
                        updateSystemPreference("currencyFormat", e.target.value)
                      }
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        darkMode
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <option value="BRL">🇧🇷 Real Brasileiro (BRL)</option>
                      <option value="USD">🇺🇸 Dólar Americano (USD)</option>
                      <option value="EUR">🇪🇺 Euro (EUR)</option>
                    </select>
                    <p
                      className={`text-xs mt-1 ${
                        darkMode ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      Exemplo: R$ 1.234,56
                    </p>
                  </div>

                  {/* Formato de números */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Formato de Números
                    </label>
                    <select
                      value={systemPreferences.numberFormat}
                      onChange={(e) =>
                        updateSystemPreference("numberFormat", e.target.value)
                      }
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        darkMode
                          ? "border-gray-600 bg-gray-700 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <option value="pt-BR">🇧🇷 Brasileiro (1.234,56)</option>
                      <option value="en-US">🇺🇸 Americano (1,234.56)</option>
                      <option value="en-GB">🇬🇧 Inglês (1,234.56)</option>
                    </select>
                  </div>
                </div>

                {/* Preview dos formatos */}
                <div
                  className={`mt-6 p-4 rounded-lg ${
                    darkMode ? "bg-gray-700" : "bg-gray-50"
                  }`}
                >
                  <h4
                    className={`text-sm font-medium mb-3 ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    📋 Preview dos Formatos:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span
                        className={`block ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Data:
                      </span>
                      <span
                        className={`font-mono ${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {(() => {
                          const today = new Date();
                          switch (systemPreferences.dateFormat) {
                            case "mm/dd/yyyy":
                              return today.toLocaleDateString("en-US");
                            case "yyyy-mm-dd":
                              return today.toISOString().split("T")[0];
                            default:
                              return today.toLocaleDateString("pt-BR");
                          }
                        })()}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`block ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Moeda:
                      </span>
                      <span
                        className={`font-mono ${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {(() => {
                          const value = 1234.56;
                          const locale = systemPreferences.numberFormat;
                          const currency = systemPreferences.currencyFormat;
                          return new Intl.NumberFormat(locale, {
                            style: "currency",
                            currency,
                          }).format(value);
                        })()}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`block ${
                          darkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Número:
                      </span>
                      <span
                        className={`font-mono ${
                          darkMode ? "text-gray-200" : "text-gray-800"
                        }`}
                      >
                        {new Intl.NumberFormat(
                          systemPreferences.numberFormat
                        ).format(1234.56)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferências de Comportamento */}
              <div
                className={`rounded-lg shadow-md p-6 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  ⚙️ Preferências de Comportamento
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Auto-save delay */}
                  {/* Auto-save delay - COM DEBOUNCE MELHORADO */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Delay do Auto-Save
                    </label>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={systemPreferences.autoSaveDelay / 1000}
                        onChange={(e) => {
                          // Atualiza o estado imediatamente (sem notificação)
                          const newValue = parseFloat(e.target.value) * 1000;
                          setSystemPreferences((prev) => ({
                            ...prev,
                            autoSaveDelay: newValue,
                          }));
                        }}
                        onMouseUp={(e) => {
                          // Só notifica quando soltar o mouse
                          const newValue = parseFloat(e.target.value) * 1000;
                          showNotification(
                            `Delay do auto-save alterado para ${(
                              newValue / 1000
                            ).toFixed(1)}s`,
                            "success"
                          );
                        }}
                        onKeyUp={(e) => {
                          // Também para navegação por teclado
                          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                            const newValue = parseFloat(e.target.value) * 1000;
                            showNotification(
                              `Delay do auto-save alterado para ${(
                                newValue / 1000
                              ).toFixed(1)}s`,
                              "success"
                            );
                          }
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>1s</span>
                        <span
                          className={`font-medium ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          }`}
                        >
                          {(systemPreferences.autoSaveDelay / 1000).toFixed(1)}s
                        </span>
                        <span>10s</span>
                      </div>
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        Tempo de espera antes de salvar automaticamente
                      </p>
                    </div>
                  </div>

                  {/* Mostrar notificações */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Notificações do Sistema
                    </label>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ToggleSwitch
                          enabled={systemPreferences.showNotifications}
                          onToggle={() =>
                            updateSystemPreference(
                              "showNotifications",
                              !systemPreferences.showNotifications
                            )
                          }
                          color="green"
                        />
                        <span
                          className={`text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {systemPreferences.showNotifications
                            ? "Habilitadas"
                            : "Desabilitadas"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Exigir confirmação */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Confirmação para Exclusões
                    </label>
                    <div className="flex items-center gap-3">
                      <ToggleSwitch
                        enabled={systemPreferences.requireConfirmation}
                        onToggle={() =>
                          updateSystemPreference(
                            "requireConfirmation",
                            !systemPreferences.requireConfirmation
                          )
                        }
                        color="yellow"
                      />
                      <span
                        className={`text-sm ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {systemPreferences.requireConfirmation
                          ? "Sempre perguntar"
                          : "Excluir diretamente"}
                      </span>
                    </div>
                    <p
                      className={`text-xs mt-1 ${
                        darkMode ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      {systemPreferences.requireConfirmation
                        ? "Pedirá confirmação antes de excluir itens"
                        : "Excluirá itens sem confirmação (perigoso)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Preferências de Performance*/}
              <div
                className={`rounded-lg shadow-md p-6 ${
                  darkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  🚀 Preferências de Performance
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna 1: Configurações */}
                  <div className="space-y-6">
                    {/* Itens por página */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Itens por Página
                      </label>
                      <select
                        value={systemPreferences.itemsPerPage}
                        onChange={(e) =>
                          updateSystemPreference(
                            "itemsPerPage",
                            parseInt(e.target.value)
                          )
                        }
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          darkMode
                            ? "border-gray-600 bg-gray-700 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <option value={5}>5 itens (Performance máxima)</option>
                        <option value={10}>10 itens (Recomendado)</option>
                        <option value={25}>25 itens (Padrão)</option>
                        <option value={50}>50 itens (Alto)</option>
                        <option value={100}>100 itens (Pode ser lento)</option>
                      </select>
                      <p
                        className={`text-xs mt-1 ${
                          darkMode ? "text-gray-500" : "text-gray-500"
                        }`}
                      >
                        Controla quantos itens são exibidos por vez nas listas
                      </p>
                    </div>

                    {/* Cache de relatórios */}
                    <div>
                      <label
                        className={`block text-sm font-medium mb-2 ${
                          darkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        Cache de Relatórios
                      </label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ToggleSwitch
                              enabled={systemPreferences.cacheReports}
                              onToggle={() =>
                                updateSystemPreference(
                                  "cacheReports",
                                  !systemPreferences.cacheReports
                                )
                              }
                              color="blue"
                            />
                            <span
                              className={`text-sm ${
                                darkMode ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              {systemPreferences.cacheReports
                                ? "Ativado"
                                : "Desativado"}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            {systemPreferences.cacheReports && (
                              <>
                                <button
                                  onClick={() => {
                                    // Simular tempo de carregamento com cache
                                    const startTime = Date.now();
                                    showNotification(
                                      "🔄 Gerando relatório com cache...",
                                      "info"
                                    );

                                    setTimeout(() => {
                                      const loadTime = Date.now() - startTime;
                                      showNotification(
                                        `⚡ Relatório carregado em ${loadTime}ms (cache ativo)`,
                                        "success"
                                      );
                                    }, 100); // Simula carregamento rápido com cache
                                  }}
                                  className={`px-3 py-1 text-xs rounded transition-colors ${
                                    darkMode
                                      ? "bg-blue-600 text-white hover:bg-blue-700"
                                      : "bg-blue-600 text-white hover:bg-blue-700"
                                  }`}
                                >
                                  ⚡ Testar Cache
                                </button>

                                <button
                                  onClick={() => {
                                    showNotification(
                                      "🗑️ Cache de relatórios limpo com sucesso",
                                      "success"
                                    );
                                  }}
                                  className={`px-3 py-1 text-xs rounded transition-colors ${
                                    darkMode
                                      ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  }`}
                                >
                                  🗑️ Limpar
                                </button>
                              </>
                            )}

                            {!systemPreferences.cacheReports && (
                              <button
                                onClick={() => {
                                  // Simular tempo de carregamento sem cache
                                  const startTime = Date.now();
                                  showNotification(
                                    "🔄 Gerando relatório sem cache...",
                                    "info"
                                  );

                                  setTimeout(() => {
                                    const loadTime = Date.now() - startTime;
                                    showNotification(
                                      `🐌 Relatório carregado em ${loadTime}ms (sem cache)`,
                                      "warning"
                                    );
                                  }, 800); // Simula carregamento lento sem cache
                                }}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  darkMode
                                    ? "bg-yellow-600 text-white hover:bg-yellow-700"
                                    : "bg-yellow-600 text-white hover:bg-yellow-700"
                                }`}
                              >
                                🐌 Testar Sem Cache
                              </button>
                            )}
                          </div>
                        </div>
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          {systemPreferences.cacheReports
                            ? '⚡ Clique "Testar Cache" para ver a diferença de velocidade'
                            : '🐌 Clique "Testar Sem Cache" para ver o carregamento lento'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Coluna 2: Indicadores */}
                  <div className="space-y-6">
                    {/* Monitor de Performance */}
                    <div
                      className={`p-4 rounded-lg border-2 border-dashed ${
                        darkMode
                          ? "border-gray-600 bg-gray-700/50"
                          : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      <h4
                        className={`text-sm font-medium mb-3 ${
                          darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        📊 Monitor de Performance
                      </h4>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div
                            className={`text-2xl font-bold ${
                              systemPreferences.itemsPerPage <= 10
                                ? "text-green-500"
                                : systemPreferences.itemsPerPage <= 25
                                ? "text-yellow-500"
                                : "text-red-500"
                            }`}
                          >
                            {systemPreferences.itemsPerPage}
                          </div>
                          <div
                            className={`text-xs ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Itens/página
                          </div>
                        </div>

                        <div className="text-center">
                          <div
                            className={`text-2xl font-bold ${
                              systemPreferences.cacheReports
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {systemPreferences.cacheReports ? "⚡" : "🐌"}
                          </div>
                          <div
                            className={`text-xs ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Cache
                          </div>
                        </div>

                        <div className="text-center">
                          <div
                            className={`text-2xl font-bold ${
                              systemPreferences.autoSaveDelay <= 2000
                                ? "text-green-500"
                                : "text-yellow-500"
                            }`}
                          >
                            {(systemPreferences.autoSaveDelay / 1000).toFixed(
                              1
                            )}
                            s
                          </div>
                          <div
                            className={`text-xs ${
                              darkMode ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            Auto-save
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Configurações Rápidas */}
                    <div className="space-y-3">
                      <h4
                        className={`text-sm font-medium ${
                          darkMode ? "text-gray-200" : "text-gray-700"
                        }`}
                      >
                        ⚡ Configurações Rápidas
                      </h4>

                      <button
                        onClick={() =>
                          applyPreset("Performance Máxima", {
                            itemsPerPage: 10,
                            cacheReports: true,
                            autoSaveDelay: 1500,
                            animationsEnabled: true,
                          })
                        }
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          darkMode
                            ? "bg-green-900/20 border border-green-800 hover:bg-green-900/30"
                            : "bg-green-50 border border-green-200 hover:bg-green-100"
                        }`}
                      >
                        <div
                          className={`font-medium text-sm ${
                            darkMode ? "text-green-300" : "text-green-800"
                          }`}
                        >
                          🚀 Performance Máxima
                        </div>
                        <div
                          className={`text-xs ${
                            darkMode ? "text-green-400" : "text-green-600"
                          }`}
                        >
                          10 itens, cache ativo, auto-save 1.5s, animações ON
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          applyPreset("Balanceado", {
                            itemsPerPage: 25,
                            cacheReports: true,
                            autoSaveDelay: 3000,
                            animationsEnabled: true,
                          })
                        }
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          darkMode
                            ? "bg-blue-900/20 border border-blue-800 hover:bg-blue-900/30"
                            : "bg-blue-50 border border-blue-200 hover:bg-blue-100"
                        }`}
                      >
                        <div
                          className={`font-medium text-sm ${
                            darkMode ? "text-blue-300" : "text-blue-800"
                          }`}
                        >
                          ⚖️ Balanceado
                        </div>
                        <div
                          className={`text-xs ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          }`}
                        >
                          25 itens, cache ativo, auto-save 3s, animações ON
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          applyPreset("Modo Econômico", {
                            itemsPerPage: 5,
                            cacheReports: false,
                            autoSaveDelay: 1000,
                            animationsEnabled: false,
                          })
                        }
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          darkMode
                            ? "bg-gray-700 border border-gray-600 hover:bg-gray-600"
                            : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <div
                          className={`font-medium text-sm ${
                            darkMode ? "text-gray-300" : "text-gray-800"
                          }`}
                        >
                          🔋 Modo Econômico
                        </div>
                        <div
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          5 itens, sem cache, auto-save 1s, animações OFF
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Access Denied Screen */}
        {((currentScreen === "planning" && !hasPermission("planning")) ||
          (currentScreen === "transactions" &&
            !hasPermission("transactions")) ||
          (currentScreen === "reports" && !hasPermission("reports")) ||
          (currentScreen === "users" && !hasPermission("user_management"))) && (
          <div
            className={`rounded-lg shadow-md p-8 text-center ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex flex-col items-center space-y-4">
              <Lock className="text-red-500" size={48} />
              <h2
                className={`text-2xl font-bold ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                Acesso Negado
              </h2>
              <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                Você não tem permissão para acessar esta seção.
              </p>
              <p
                className={`text-sm ${
                  darkMode ? "text-gray-500" : "text-gray-500"
                }`}
              >
                Seu nível de acesso:{" "}
                <span className="font-medium text-blue-600">
                  {USER_ROLES[currentUser.role].name}
                </span>
              </p>
              <button
                onClick={() => setCurrentScreen("menu")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
              >
                <Home size={16} />
                Voltar ao Menu
              </button>
            </div>
          </div>
        )}

        {/* Modal de Confirmação Genérico */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`rounded-lg p-6 max-w-md w-full mx-4 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h3
                className={`text-lg font-semibold mb-3 ${
                  darkMode ? "text-white" : "text-gray-800"
                }`}
              >
                {confirmDialog.title}
              </h3>
              <p
                className={`mb-6 ${
                  darkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {confirmDialog.message}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={confirmDialog.onCancel}
                  className={`px-4 py-2 transition-colors ${
                    darkMode
                      ? "text-gray-300 hover:text-white"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  {confirmDialog.type === "warning" ? "Entendi" : "Cancelar"}
                </button>
                {confirmDialog.type !== "warning" && (
                  <button
                    onClick={() => {
                      confirmDialog.onConfirm();
                      hideConfirmDialog();
                    }}
                    className={`px-4 py-2 rounded-lg text-white transition-colors ${
                      confirmDialog.type === "danger"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {confirmDialog.type === "danger" ? "Excluir" : "Confirmar"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sistema de Notificações Toast */}
        {notifications.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-md animate-slide-in ${
                  notification.type === "success"
                    ? darkMode
                      ? "bg-green-800 border-green-600 text-green-100"
                      : "bg-green-50 border-green-200 text-green-800"
                    : notification.type === "error"
                    ? darkMode
                      ? "bg-red-800 border-red-600 text-red-100"
                      : "bg-red-50 border-red-200 text-red-800"
                    : darkMode
                    ? "bg-blue-800 border-blue-600 text-blue-100"
                    : "bg-blue-50 border-blue-200 text-blue-800"
                } border`}
              >
                {/* Ícone baseado no tipo */}
                <div className="flex-shrink-0">
                  {notification.type === "success" && (
                    <span className="text-lg">✅</span>
                  )}
                  {notification.type === "error" && (
                    <span className="text-lg">❌</span>
                  )}
                  {notification.type === "info" && (
                    <span className="text-lg">ℹ️</span>
                  )}
                </div>

                {/* Mensagem */}
                <span className="font-medium flex-1">
                  {notification.message}
                </span>

                {/* Botão fechar */}
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 hover:opacity-70 transition-opacity"
                >
                  <span className="text-lg">❌</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialControlSystem;
