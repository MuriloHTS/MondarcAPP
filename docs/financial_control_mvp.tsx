import React, { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Calendar, BarChart3, Eye, DollarSign, Home, PiggyBank, Users, Lock, LogOut, User, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';

const FinancialControlSystem = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reportView, setReportView] = useState('detailed');
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [planningMode, setPlanningMode] = useState('monthly');
  
  // Form states
  const [newCategory, setNewCategory] = useState({ name: '', type: 'expense', budget: '', month: selectedMonth });
  const [newTransaction, setNewTransaction] = useState({ 
    categoryId: '', 
    amount: '', 
    description: '', 
    date: new Date().toISOString().split('T')[0],
    type: 'expense'
  });

  // User management states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'viewer' });

  // Loading and validation states
  const [isLoading, setIsLoading] = useState({
    login: false,
    addCategory: false,
    addTransaction: false,
    addUser: false,
    deleteCategory: false,
    deleteTransaction: false,
    deleteUser: false
  });

  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // User roles
  const USER_ROLES = {
    super: { 
      name: 'Super Usuário', 
      permissions: ['planning', 'transactions', 'reports', 'user_management'],
      color: 'red'
    },
    editor: { 
      name: 'Editor', 
      permissions: ['planning', 'transactions', 'reports'],
      color: 'blue'
    },
    viewer: { 
      name: 'Visualizador', 
      permissions: ['reports'],
      color: 'green'
    }
  };

  const months = [
    { value: 1, name: 'Janeiro' },
    { value: 2, name: 'Fevereiro' },
    { value: 3, name: 'Março' },
    { value: 4, name: 'Abril' },
    { value: 5, name: 'Maio' },
    { value: 6, name: 'Junho' },
    { value: 7, name: 'Julho' },
    { value: 8, name: 'Agosto' },
    { value: 9, name: 'Setembro' },
    { value: 10, name: 'Outubro' },
    { value: 11, name: 'Novembro' },
    { value: 12, name: 'Dezembro' }
  ];

  // Add sample data on component mount
  useEffect(() => {
    // Sample users
    const sampleUsers = [
      { id: 1, name: 'Admin Master', email: 'admin@empresa.com', password: '123456', role: 'super' },
      { id: 2, name: 'João Editor', email: 'joao@empresa.com', password: '123456', role: 'editor' },
      { id: 3, name: 'Maria Contadora', email: 'maria@empresa.com', password: '123456', role: 'viewer' }
    ];
    
    const sampleCategories = [
      { id: 1, name: 'Salários', type: 'expense', budget: 15000, month: 1 },
      { id: 2, name: 'Marketing', type: 'expense', budget: 3000, month: 1 },
      { id: 3, name: 'Vendas', type: 'income', budget: 25000, month: 1 },
      { id: 4, name: 'Aluguel', type: 'expense', budget: 2500, month: 1 },
      { id: 5, name: 'Salários', type: 'expense', budget: 15000, month: 2 },
      { id: 6, name: 'Marketing', type: 'expense', budget: 3500, month: 2 },
      { id: 7, name: 'Vendas', type: 'income', budget: 28000, month: 2 }
    ];
    
    const sampleTransactions = [
      { id: 1, categoryId: 1, amount: 15000, description: 'Folha de pagamento Janeiro', date: '2025-01-15', type: 'expense' },
      { id: 2, categoryId: 3, amount: 18000, description: 'Vendas produto A', date: '2025-01-20', type: 'income' },
      { id: 3, categoryId: 2, amount: 1200, description: 'Google Ads', date: '2025-01-10', type: 'expense' },
      { id: 4, categoryId: 4, amount: 2500, description: 'Aluguel escritório', date: '2025-01-05', type: 'expense' }
    ];
    
    setUsers(sampleUsers);
    setCategories(sampleCategories);
    setTransactions(sampleTransactions);
  }, []);

  // Update newCategory month when selectedMonth changes or planning mode changes
  useEffect(() => {
    if (planningMode === 'monthly') {
      setNewCategory(prev => ({ ...prev, month: selectedMonth }));
    } else {
      setNewCategory(prev => ({ ...prev, month: 'all' }));
    }
  }, [selectedMonth, planningMode]);

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Utility functions
  const setLoadingState = (action, state) => {
    setIsLoading(prev => ({ ...prev, [action]: state }));
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const clearErrors = () => {
    setErrors({});
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (formData, formType) => {
    const newErrors = {};

    switch (formType) {
      case 'login':
        if (!formData.email) newErrors.email = 'Email é obrigatório';
        else if (!validateEmail(formData.email)) newErrors.email = 'Email inválido';
        if (!formData.password) newErrors.password = 'Senha é obrigatória';
        break;

      case 'category':
        if (!formData.name.trim()) newErrors.name = 'Nome da categoria é obrigatório';
        if (!formData.budget || formData.budget <= 0) newErrors.budget = 'Orçamento deve ser maior que zero';
        break;

      case 'transaction':
        if (!formData.categoryId) newErrors.categoryId = 'Categoria é obrigatória';
        if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Valor deve ser maior que zero';
        if (!formData.description.trim()) newErrors.description = 'Descrição é obrigatória';
        if (!formData.date) newErrors.date = 'Data é obrigatória';
        break;

      case 'user':
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!formData.email) newErrors.email = 'Email é obrigatório';
        else if (!validateEmail(formData.email)) newErrors.email = 'Email inválido';
        if (!formData.password || formData.password.length < 6) newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
        // Check if email already exists
        if (users.find(u => u.email === formData.email)) newErrors.email = 'Email já está em uso';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Authentication functions
  const handleLogin = async () => {
    clearErrors();
    if (!validateForm(loginForm, 'login')) return;

    setLoadingState('login', true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = users.find(u => u.email === loginForm.email && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setCurrentScreen('menu');
      setLoginForm({ email: '', password: '' });
      showNotification(`Bem-vindo, ${user.name}!`, 'success');
    } else {
      setErrors({ general: 'Email ou senha incorretos!' });
    }
    
    setLoadingState('login', false);
  };

  const handleLogout = () => {
    setConfirmDialog({
      title: 'Confirmar Logout',
      message: 'Tem certeza que deseja sair do sistema?',
      onConfirm: () => {
        setCurrentUser(null);
        setCurrentScreen('login');
        setConfirmDialog(null);
        showNotification('Logout realizado com sucesso', 'info');
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    return USER_ROLES[currentUser.role].permissions.includes(permission);
  };

  // User management functions
  const addUser = async () => {
    clearErrors();
    if (!validateForm(newUserForm, 'user')) return;

    setLoadingState('addUser', true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newUser = {
      id: Date.now(),
      name: newUserForm.name,
      email: newUserForm.email,
      password: newUserForm.password,
      role: newUserForm.role
    };
    setUsers([...users, newUser]);
    setNewUserForm({ name: '', email: '', password: '', role: 'viewer' });
    showNotification(`Usuário ${newUser.name} adicionado com sucesso!`, 'success');
    
    setLoadingState('addUser', false);
  };

  const deleteUser = (userId, userName) => {
    if (userId === currentUser.id) {
      showNotification('Você não pode excluir seu próprio usuário!', 'error');
      return;
    }
    
    setConfirmDialog({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o usuário "${userName}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setLoadingState('deleteUser', true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 600));
        
        setUsers(users.filter(user => user.id !== userId));
        setConfirmDialog(null);
        showNotification(`Usuário ${userName} excluído com sucesso`, 'success');
        
        setLoadingState('deleteUser', false);
      },
      onCancel: () => setConfirmDialog(null),
      type: 'danger'
    });
  };

  const addCategory = async () => {
    clearErrors();
    if (!validateForm(newCategory, 'category')) return;

    setLoadingState('addCategory', true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    if (planningMode === 'annual') {
      // Add category to all months
      const newCategories = months.map(month => ({
        id: Date.now() + month.value,
        name: newCategory.name,
        type: newCategory.type,
        budget: parseFloat(newCategory.budget),
        month: month.value
      }));
      setCategories([...categories, ...newCategories]);
      showNotification(`Categoria "${newCategory.name}" adicionada a todos os meses!`, 'success');
    } else {
      // Add category to selected month only
      const category = {
        id: Date.now(),
        name: newCategory.name,
        type: newCategory.type,
        budget: parseFloat(newCategory.budget),
        month: newCategory.month
      };
      setCategories([...categories, category]);
      showNotification(`Categoria "${newCategory.name}" adicionada para ${getMonthName(selectedMonth)}!`, 'success');
    }
    setNewCategory({ name: '', type: 'expense', budget: '', month: planningMode === 'monthly' ? selectedMonth : 'all' });
    
    setLoadingState('addCategory', false);
  };

  const addTransaction = async () => {
    clearErrors();
    if (!validateForm(newTransaction, 'transaction')) return;

    setLoadingState('addTransaction', true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const transaction = {
      id: Date.now(),
      categoryId: parseInt(newTransaction.categoryId),
      amount: parseFloat(newTransaction.amount),
      description: newTransaction.description,
      date: newTransaction.date,
      type: newTransaction.type
    };
    setTransactions([...transactions, transaction]);
    setNewTransaction({ 
      categoryId: '', 
      amount: '', 
      description: '', 
      date: new Date().toISOString().split('T')[0],
      type: 'expense'
    });
    showNotification(`Lançamento "${transaction.description}" registrado com sucesso!`, 'success');
    
    setLoadingState('addTransaction', false);
  };

  const deleteCategory = (id, categoryName) => {
    setConfirmDialog({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir a categoria "${categoryName}"? Todos os lançamentos relacionados também serão removidos.`,
      onConfirm: async () => {
        setLoadingState('deleteCategory', true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setCategories(categories.filter(cat => cat.id !== id));
        setTransactions(transactions.filter(trans => trans.categoryId !== id));
        setConfirmDialog(null);
        showNotification(`Categoria "${categoryName}" excluída com sucesso`, 'success');
        
        setLoadingState('deleteCategory', false);
      },
      onCancel: () => setConfirmDialog(null),
      type: 'danger'
    });
  };

  const deleteTransaction = (id, transactionDescription) => {
    setConfirmDialog({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja excluir o lançamento "${transactionDescription}"?`,
      onConfirm: async () => {
        setLoadingState('deleteTransaction', true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setTransactions(transactions.filter(trans => trans.id !== id));
        setConfirmDialog(null);
        showNotification(`Lançamento excluído com sucesso`, 'success');
        
        setLoadingState('deleteTransaction', false);
      },
      onCancel: () => setConfirmDialog(null),
      type: 'danger'
    });
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Categoria não encontrada';
  };

  const getFilteredCategories = () => {
    return categories.filter(cat => cat.month === selectedMonth);
  };

  const generateReport = () => {
    let filteredCategories = categories;
    let filteredTransactions = transactions;

    // Filter based on report period
    if (reportPeriod === 'monthly') {
      filteredCategories = categories.filter(cat => cat.month === selectedMonth);
      // Filter transactions by date (same month and year)
      filteredTransactions = transactions.filter(trans => {
        const transDate = new Date(trans.date);
        return transDate.getMonth() + 1 === selectedMonth && transDate.getFullYear() === 2025;
      });
    } else if (reportPeriod === 'semester') {
      const semesterMonths = selectedSemester === 1 ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12];
      filteredCategories = categories.filter(cat => semesterMonths.includes(cat.month));
      filteredTransactions = transactions.filter(trans => {
        const transDate = new Date(trans.date);
        return semesterMonths.includes(transDate.getMonth() + 1) && transDate.getFullYear() === 2025;
      });
    }
    // For annual, use all categories and transactions (no filtering needed)

    const categoryTotals = filteredCategories.map(category => {
      const categoryTransactions = filteredTransactions.filter(trans => trans.categoryId === category.id);
      const spent = categoryTransactions.reduce((sum, trans) => sum + trans.amount, 0);
      const remaining = category.budget - spent;
      const percentage = category.budget > 0 ? (spent / category.budget) * 100 : 0;
      
      return {
        ...category,
        spent,
        remaining,
        percentage: Math.round(percentage * 100) / 100,
        transactions: categoryTransactions
      };
    });

    const totalBudget = filteredCategories.reduce((sum, cat) => sum + cat.budget, 0);
    const totalSpent = filteredTransactions.reduce((sum, trans) => sum + trans.amount, 0);
    const totalIncome = filteredTransactions.filter(trans => trans.type === 'income').reduce((sum, trans) => sum + trans.amount, 0);
    const totalExpenses = filteredTransactions.filter(trans => trans.type === 'expense').reduce((sum, trans) => sum + trans.amount, 0);

    return { categoryTotals, totalBudget, totalSpent, totalIncome, totalExpenses };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getMonthName = (monthNumber) => {
    const month = months.find(m => m.value === monthNumber);
    return month ? month.name : '';
  };

  const getReportTitle = () => {
    if (reportPeriod === 'monthly') {
      return `Relatórios Financeiros - ${getMonthName(selectedMonth)}`;
    } else if (reportPeriod === 'semester') {
      return `Relatórios Financeiros - ${selectedSemester}º Semestre`;
    } else {
      return 'Relatórios Financeiros - Anual';
    }
  };

  const report = generateReport();

  // Notification Component
  const NotificationComponent = () => {
    if (!notification) return null;

    const icons = {
      success: <CheckCircle size={20} />,
      error: <AlertCircle size={20} />,
      info: <AlertCircle size={20} />
    };

    const colors = {
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    return (
      <div className="fixed top-4 right-4 z-50">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${colors[notification.type]} max-w-md`}>
          {icons[notification.type]}
          <span className="font-medium">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-70"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  };

  // Confirmation Dialog Component
  const ConfirmationDialog = () => {
    if (!confirmDialog) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-3">{confirmDialog.title}</h3>
          <p className="text-gray-600 mb-6">{confirmDialog.message}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={confirmDialog.onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDialog.onConfirm}
              className={`px-4 py-2 rounded-lg text-white transition-colors ${
                confirmDialog.type === 'danger' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Input Component with Validation
  const FormInput = ({ 
    type = 'text', 
    placeholder, 
    value, 
    onChange, 
    error, 
    label,
    required = false,
    className = '',
    ...props 
  }) => (
    <div className="flex flex-col">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300'
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="text-red-500 text-sm mt-1 flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </span>
      )}
    </div>
  );

  // Loading Button Component
  const LoadingButton = ({ 
    loading, 
    children, 
    className = '', 
    onClick,
    disabled = false,
    ...props 
  }) => (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center justify-center gap-2 transition-all duration-200 ${
        loading || disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:opacity-90'
      } ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );

  // Login Screen
  if (currentScreen === 'login') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <DollarSign className="mx-auto text-green-600 mb-4" size={48} />
              <h1 className="text-2xl font-bold text-gray-800">Sistema Financeiro</h1>
              <p className="text-gray-600">Faça login para continuar</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="seu@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              
              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Entrar
              </button>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-2">Usuários de Teste:</h3>
              <div className="text-sm space-y-1">
                <p><strong>Super:</strong> admin@empresa.com / 123456</p>
                <p><strong>Editor:</strong> joao@empresa.com / 123456</p>
                <p><strong>Viewer:</strong> maria@empresa.com / 123456</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Menu Principal
  if (currentScreen === 'menu') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <DollarSign className="text-green-600" />
                  Sistema de Controle Financeiro
                </h1>
                <p className="text-gray-600 mt-2">Gerencie suas categorias, transações e visualize relatórios detalhados</p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Logado como:</p>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-600" />
                    <span className="font-medium">{currentUser.name}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {USER_ROLES[currentUser.role].name}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
                  title="Sair"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Planejamento */}
            {hasPermission('planning') && (
              <div 
                onClick={() => setCurrentScreen('planning')}
                className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-blue-100 p-4 rounded-full">
                    <PiggyBank className="text-blue-600" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Planejamento</h3>
                  <p className="text-gray-600">Defina categorias e orçamentos mensais para controle financeiro</p>
                </div>
              </div>
            )}

            {/* Lançamentos */}
            {hasPermission('transactions') && (
              <div 
                onClick={() => setCurrentScreen('transactions')}
                className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-green-100 p-4 rounded-full">
                    <Calendar className="text-green-600" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Lançamentos</h3>
                  <p className="text-gray-600">Registre receitas e despesas realizadas no dia a dia</p>
                </div>
              </div>
            )}

            {/* Relatórios */}
            {hasPermission('reports') && (
              <div 
                onClick={() => setCurrentScreen('reports')}
                className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-500"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-purple-100 p-4 rounded-full">
                    <BarChart3 className="text-purple-600" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Relatórios</h3>
                  <p className="text-gray-600">Visualize performance financeira e fluxo de caixa detalhado</p>
                </div>
              </div>
            )}

            {/* Gerenciar Usuários - Só para Super Usuário */}
            {hasPermission('user_management') && (
              <div 
                onClick={() => setCurrentScreen('users')}
                className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-red-500"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="bg-red-100 p-4 rounded-full">
                    <Users className="text-red-600" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Usuários</h3>
                  <p className="text-gray-600">Gerencie usuários e permissões do sistema</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentScreen('menu')}
                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
              >
                <Home size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  {currentScreen === 'planning' && 'Planejamento'}
                  {currentScreen === 'transactions' && 'Lançamentos'}
                  {currentScreen === 'reports' && 'Relatórios'}
                  {currentScreen === 'users' && 'Gerenciar Usuários'}
                </h1>
                <p className="text-gray-600 text-sm">
                  {currentScreen === 'planning' && 'Defina suas categorias e orçamentos por mês'}
                  {currentScreen === 'transactions' && 'Registre suas receitas e despesas'}
                  {currentScreen === 'reports' && 'Acompanhe sua performance financeira'}
                  {currentScreen === 'users' && 'Gerencie usuários e permissões do sistema'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-600" />
                  <span className="font-medium">{currentUser.name}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Planning Screen */}
        {currentScreen === 'planning' && hasPermission('planning') && (
          <div className="space-y-6">
            {/* Planning Mode Selector */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Tipo de Planejamento</h2>
              <div className="flex gap-4">
                <button
                  onClick={() => setPlanningMode('monthly')}
                  className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                    planningMode === 'monthly'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Calendar size={20} />
                  Planejamento Mensal
                </button>
                <button
                  onClick={() => setPlanningMode('annual')}
                  className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                    planningMode === 'annual'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <BarChart3 size={20} />
                  Planejamento Anual
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {planningMode === 'monthly' 
                  ? 'Adicione categorias específicas para cada mês'
                  : 'Adicione categorias que se aplicam a todos os meses do ano'
                }
              </p>
            </div>

            {/* Month Selector - Only show in monthly mode */}
            {planningMode === 'monthly' && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Selecionar Mês</h2>
                <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
                  {months.map(month => (
                    <button
                      key={month.value}
                      onClick={() => setSelectedMonth(month.value)}
                      className={`p-3 rounded-lg font-medium text-sm ${
                        selectedMonth === month.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {month.name.substring(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add Category Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                {planningMode === 'monthly' 
                  ? `Adicionar Categoria - ${getMonthName(selectedMonth)}`
                  : 'Adicionar Categoria - Todos os Meses'
                }
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="text"
                  placeholder="Nome da categoria"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={newCategory.type}
                  onChange={(e) => setNewCategory({...newCategory, type: e.target.value})}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
                <input
                  type="number"
                  placeholder={planningMode === 'monthly' ? 'Orçamento mensal' : 'Orçamento mensal (aplicado a todos)'}
                  value={newCategory.budget}
                  onChange={(e) => setNewCategory({...newCategory, budget: e.target.value})}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addCategory}
                  className={`text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center justify-center gap-2 ${
                    planningMode === 'monthly' ? 'bg-blue-600' : 'bg-green-600'
                  }`}
                >
                  <Plus size={16} />
                  {planningMode === 'monthly' ? 'Adicionar' : 'Adicionar a Todos'}
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                {planningMode === 'monthly' 
                  ? `Gastos Planejados - ${getMonthName(selectedMonth)}`
                  : 'Gastos Planejados - Visão Anual'
                }
              </h2>
              <div className="space-y-3">
                {planningMode === 'monthly' ? (
                  // Show categories for selected month
                  getFilteredCategories().map(category => (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {category.type === 'income' ? 
                          <TrendingUp className="text-green-600" size={20} /> : 
                          <TrendingDown className="text-red-600" size={20} />
                        }
                        <div>
                          <h3 className="font-medium">{category.name}</h3>
                          <p className="text-sm text-gray-600">
                            {category.type === 'income' ? 'Receita' : 'Despesa'} - Orçamento: {formatCurrency(category.budget)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  // Show all categories grouped by name
                  (() => {
                    const groupedCategories = categories.reduce((acc, category) => {
                      const key = `${category.name}-${category.type}`;
                      if (!acc[key]) {
                        acc[key] = {
                          name: category.name,
                          type: category.type,
                          budget: category.budget,
                          months: [],
                          ids: []
                        };
                      }
                      acc[key].months.push(category.month);
                      acc[key].ids.push(category.id);
                      return acc;
                    }, {});

                    return Object.values(groupedCategories).map((group, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {group.type === 'income' ? 
                              <TrendingUp className="text-green-600" size={20} /> : 
                              <TrendingDown className="text-red-600" size={20} />
                            }
                            <div>
                              <h3 className="font-medium">{group.name}</h3>
                              <p className="text-sm text-gray-600">
                                {group.type === 'income' ? 'Receita' : 'Despesa'} - Orçamento: {formatCurrency(group.budget)}
                              </p>
                              <p className="text-sm text-gray-500">
                                Presente em {group.months.length} {group.months.length === 1 ? 'mês' : 'meses'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              // Delete all instances of this category
                              group.ids.forEach(id => deleteCategory(id));
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ));
                  })()
                )}
                {(planningMode === 'monthly' ? getFilteredCategories().length === 0 : categories.length === 0) && (
                  <div className="text-center py-8 text-gray-500">
                    {planningMode === 'monthly' 
                      ? `Nenhuma categoria cadastrada para ${getMonthName(selectedMonth)}`
                      : 'Nenhuma categoria cadastrada'
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Transactions Screen */}
        {currentScreen === 'transactions' && hasPermission('transactions') && (
          <div className="space-y-6">
            {/* Add Transaction Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Novo Lançamento</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select
                  value={newTransaction.categoryId}
                  onChange={(e) => setNewTransaction({...newTransaction, categoryId: e.target.value})}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione a categoria</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} - {getMonthName(category.month)} ({category.type === 'income' ? 'Receita' : 'Despesa'})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Valor"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Descrição"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addTransaction}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Lançar
                </button>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Lançamentos Recentes</h2>
              <div className="space-y-3">
                {transactions.map(transaction => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Calendar className="text-gray-400" size={16} />
                      <div>
                        <h3 className="font-medium">{transaction.description}</h3>
                        <p className="text-sm text-gray-600">
                          {getCategoryName(transaction.categoryId)} - {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </span>
                      <button
                        onClick={() => deleteTransaction(transaction.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reports Screen */}
        {currentScreen === 'reports' && hasPermission('reports') && (
          <div className="space-y-6">
            {/* Report Controls */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">{getReportTitle()}</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setReportView('detailed')}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${reportView === 'detailed' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      <Eye size={16} />
                      Detalhado
                    </button>
                    <button
                      onClick={() => setReportView('summary')}
                      className={`px-4 py-2 rounded-lg flex items-center gap-2 ${reportView === 'summary' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                      <BarChart3 size={16} />
                      Resumo
                    </button>
                  </div>
                </div>

                {/* Period Filter */}
                <div className="flex flex-col space-y-3">
                  <h3 className="text-lg font-medium">Período do Relatório</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setReportPeriod('monthly')}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        reportPeriod === 'monthly'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Mensal
                    </button>
                    <button
                      onClick={() => setReportPeriod('semester')}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        reportPeriod === 'semester'
                          ? 'bg-orange-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Semestral
                    </button>
                    <button
                      onClick={() => setReportPeriod('annual')}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        reportPeriod === 'annual'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Anual
                    </button>
                  </div>

                  {/* Monthly Selector */}
                  {reportPeriod === 'monthly' && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Selecionar Mês:</h4>
                      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
                        {months.map(month => (
                          <button
                            key={month.value}
                            onClick={() => setSelectedMonth(month.value)}
                            className={`p-2 rounded text-sm font-medium ${
                              selectedMonth === month.value
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {month.name.substring(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Semester Selector */}
                  {reportPeriod === 'semester' && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Selecionar Semestre:</h4>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedSemester(1)}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            selectedSemester === 1
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          1º Semestre (Jan - Jun)
                        </button>
                        <button
                          onClick={() => setSelectedSemester(2)}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            selectedSemester === 2
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          2º Semestre (Jul - Dez)
                        </button>
                      </div>
                    </div>
                  )}

                  {reportPeriod === 'annual' && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">Exibindo dados de todo o ano (Janeiro - Dezembro)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-green-600" size={24} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Receitas</h3>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(report.totalIncome)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3">
                  <TrendingDown className="text-red-600" size={24} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Despesas</h3>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(report.totalExpenses)}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="text-blue-600" size={24} />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Saldo</h3>
                    <p className={`text-2xl font-bold ${(report.totalIncome - report.totalExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(report.totalIncome - report.totalExpenses)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Performance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Performance por Categoria</h3>
              <div className="space-y-4">
                {report.categoryTotals.map(category => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{category.name} - {getMonthName(category.month)}</h4>
                      <span className={`font-semibold ${category.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(category.spent)} / {formatCurrency(category.budget)}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full ${
                          category.percentage > 100 ? 'bg-red-500' : 
                          category.percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(category.percentage, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{category.percentage}% atingido</span>
                      <span>Restante: {formatCurrency(category.remaining)}</span>
                    </div>

                    {reportView === 'detailed' && category.transactions.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Transações:</h5>
                        <div className="space-y-1">
                          {category.transactions.map(transaction => (
                            <div key={transaction.id} className="flex justify-between text-sm">
                              <span>{transaction.description}</span>
                              <span>{formatDate(transaction.date)} - {formatCurrency(transaction.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Management Screen - Only for Super Users */}
        {currentScreen === 'users' && hasPermission('user_management') && (
          <div className="space-y-6">
            {/* Add User Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Adicionar Novo Usuário</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({...newUserForm, name: e.target.value})}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({...newUserForm, email: e.target.value})}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="Senha"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({...newUserForm, role: e.target.value})}
                  className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="viewer">Visualizador</option>
                  <option value="editor">Editor</option>
                  <option value="super">Super Usuário</option>
                </select>
                <button
                  onClick={addUser}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Usuários do Sistema</h2>
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-blue-100">
                        <User className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          {user.name}
                          {user.id === currentUser.id && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                              Você
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                            {USER_ROLES[user.role].name}
                          </span>
                          <div className="text-xs text-gray-500">
                            Permissões: {USER_ROLES[user.role].permissions.map(p => {
                              const permissionNames = {
                                planning: 'Planejamento',
                                transactions: 'Lançamentos', 
                                reports: 'Relatórios',
                                user_management: 'Usuários'
                              };
                              return permissionNames[p];
                            }).join(', ')}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.id !== currentUser.id && (
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir usuário"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permissions Guide */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Guia de Permissões</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="text-red-600" size={20} />
                    <h3 className="font-medium text-red-600">Super Usuário</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Acesso total ao sistema</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Gerenciar usuários</li>
                    <li>• Planejamento financeiro</li>
                    <li>• Lançamentos</li>
                    <li>• Todos os relatórios</li>
                  </ul>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="text-blue-600" size={20} />
                    <h3 className="font-medium text-blue-600">Editor</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Operações financeiras</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Planejamento financeiro</li>
                    <li>• Lançamentos</li>
                    <li>• Todos os relatórios</li>
                    <li>• <span className="text-red-500">Não gerencia usuários</span></li>
                  </ul>
                </div>
                
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="text-green-600" size={20} />
                    <h3 className="font-medium text-green-600">Visualizador</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Apenas consulta</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Visualizar relatórios</li>
                    <li>• <span className="text-red-500">Não edita planejamento</span></li>
                    <li>• <span className="text-red-500">Não faz lançamentos</span></li>
                    <li>• <span className="text-red-500">Não gerencia usuários</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Access Denied Screen */}
        {((currentScreen === 'planning' && !hasPermission('planning')) ||
          (currentScreen === 'transactions' && !hasPermission('transactions')) ||
          (currentScreen === 'reports' && !hasPermission('reports')) ||
          (currentScreen === 'users' && !hasPermission('user_management'))) && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Lock className="text-red-500" size={48} />
              <h2 className="text-2xl font-bold text-gray-800">Acesso Negado</h2>
              <p className="text-gray-600">Você não tem permissão para acessar esta seção.</p>
              <p className="text-sm text-gray-500">
                Seu nível de acesso: <span className="font-medium text-blue-600">
                  {USER_ROLES[currentUser.role].name}
                </span>
              </p>
              <button
                onClick={() => setCurrentScreen('menu')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Home size={16} />
                Voltar ao Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialControlSystem;