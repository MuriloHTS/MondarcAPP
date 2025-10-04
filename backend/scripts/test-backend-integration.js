#!/usr/bin/env node

/**
 * Script para testar todos os endpoints do backend
 * Execute com: node test-backend-integration.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
let authToken = null;
let testCategoryId = null;
let testTransactionId = null;

// Cores para console
const colors = {
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`
};

// Função helper para fazer requisições
async function makeRequest(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 0 
    };
  }
}

// Testes
async function runTests() {
  console.log(colors.cyan('\n🚀 Iniciando testes de integração do backend...\n'));

  // 1. Teste de Autenticação
  console.log(colors.yellow('📋 Testando Autenticação...'));
  
  // Login
  const loginResult = await makeRequest('POST', '/auth/login', {
    email: 'admin@empresa.com',
    password: '123456'
  });

  if (loginResult.success) {
    console.log(colors.green('✅ Login realizado com sucesso'));
    authToken = loginResult.data.token;
  } else {
    console.log(colors.red('❌ Erro no login:'), loginResult.error);
    return;
  }

  // Get current user
  const meResult = await makeRequest('GET', '/auth/me');
  if (meResult.success) {
    console.log(colors.green('✅ Dados do usuário obtidos'));
  } else {
    console.log(colors.red('❌ Erro ao obter dados do usuário:'), meResult.error);
  }

  // 2. Teste de Usuários
  console.log(colors.yellow('\n📋 Testando Gerenciamento de Usuários...'));
  
  // Listar usuários
  const usersResult = await makeRequest('GET', '/users');
  if (usersResult.success) {
    console.log(colors.green('✅ Listagem de usuários OK'));
  } else {
    console.log(colors.red('❌ Erro ao listar usuários:'), usersResult.error);
  }

  // Buscar preferências
  const prefsResult = await makeRequest('GET', '/users/preferences');
  if (prefsResult.success) {
    console.log(colors.green('✅ Preferências do usuário obtidas'));
  } else {
    console.log(colors.red('❌ Erro ao buscar preferências:'), prefsResult.error);
  }

  // 3. Teste de Categorias
  console.log(colors.yellow('\n📋 Testando Categorias...'));
  
  // Criar categoria
  const categoryResult = await makeRequest('POST', '/categories', {
    name: 'Categoria Teste',
    type: 'expense',
    budget: 1000,
    month: 1
  });

  if (categoryResult.success) {
    console.log(colors.green('✅ Categoria criada com sucesso'));
    testCategoryId = categoryResult.data.id;
  } else {
    console.log(colors.red('❌ Erro ao criar categoria:'), categoryResult.error);
  }

  // Listar categorias
  const categoriesResult = await makeRequest('GET', '/categories');
  if (categoriesResult.success) {
    console.log(colors.green('✅ Listagem de categorias OK'));
    // Pegar ID de uma categoria existente se não criamos uma
    if (!testCategoryId && categoriesResult.data.length > 0) {
      testCategoryId = categoriesResult.data[0].id;
    }
  } else {
    console.log(colors.red('❌ Erro ao listar categorias:'), categoriesResult.error);
  }

  // 4. Teste de Transações
  console.log(colors.yellow('\n📋 Testando Transações...'));
  
  if (testCategoryId) {
    // Criar transação
    const transactionResult = await makeRequest('POST', '/transactions', {
      category_id: testCategoryId,
      amount: 150.50,
      description: 'Transação de teste',
      date: new Date().toISOString().split('T')[0],
      type: 'expense'
    });

    if (transactionResult.success) {
      console.log(colors.green('✅ Transação criada com sucesso'));
      testTransactionId = transactionResult.data.id;
    } else {
      console.log(colors.red('❌ Erro ao criar transação:'), transactionResult.error);
    }
  }

  // Listar transações
  const transactionsResult = await makeRequest('GET', '/transactions');
  if (transactionsResult.success) {
    console.log(colors.green('✅ Listagem de transações OK'));
  } else {
    console.log(colors.red('❌ Erro ao listar transações:'), transactionsResult.error);
  }

  // Summary
  const summaryResult = await makeRequest('GET', '/transactions/summary?group_by=category');
  if (summaryResult.success) {
    console.log(colors.green('✅ Resumo de transações OK'));
  } else {
    console.log(colors.red('❌ Erro ao obter resumo:'), summaryResult.error);
  }

  // 5. Teste de Relatórios
  console.log(colors.yellow('\n📋 Testando Relatórios...'));
  
  // Summary report
  const reportSummaryResult = await makeRequest('GET', '/reports/summary?period=monthly&month=' + (new Date().getMonth() + 1));
  if (reportSummaryResult.success) {
    console.log(colors.green('✅ Relatório resumido OK'));
  } else {
    console.log(colors.red('❌ Erro no relatório resumido:'), reportSummaryResult.error);
  }

  // Detailed report
  const reportDetailedResult = await makeRequest('GET', '/reports/detailed');
  if (reportDetailedResult.success) {
    console.log(colors.green('✅ Relatório detalhado OK'));
  } else {
    console.log(colors.red('❌ Erro no relatório detalhado:'), reportDetailedResult.error);
  }

  // Trends
  const trendsResult = await makeRequest('GET', '/reports/trends?period=6months');
  if (trendsResult.success) {
    console.log(colors.green('✅ Análise de tendências OK'));
  } else {
    console.log(colors.red('❌ Erro na análise de tendências:'), trendsResult.error);
  }

  // 6. Teste de Configurações
  console.log(colors.yellow('\n📋 Testando Configurações...'));
  
  // System settings
  const systemSettingsResult = await makeRequest('GET', '/settings/system');
  if (systemSettingsResult.success) {
    console.log(colors.green('✅ Configurações do sistema OK'));
  } else {
    console.log(colors.red('❌ Erro nas configurações do sistema:'), systemSettingsResult.error);
  }

  // Notification settings
  const notifSettingsResult = await makeRequest('GET', '/settings/notifications');
  if (notifSettingsResult.success) {
    console.log(colors.green('✅ Configurações de notificações OK'));
  } else {
    console.log(colors.red('❌ Erro nas configurações de notificações:'), notifSettingsResult.error);
  }

  // Export settings
  const exportSettingsResult = await makeRequest('GET', '/settings/export');
  if (exportSettingsResult.success) {
    console.log(colors.green('✅ Configurações de exportação OK'));
  } else {
    console.log(colors.red('❌ Erro nas configurações de exportação:'), exportSettingsResult.error);
  }

  // 7. Limpeza
  console.log(colors.yellow('\n🧹 Realizando limpeza...'));
  
  // Deletar transação de teste
  if (testTransactionId) {
    const deleteTransResult = await makeRequest('DELETE', `/transactions/${testTransactionId}`);
    if (deleteTransResult.success) {
      console.log(colors.green('✅ Transação de teste removida'));
    }
  }

  // Deletar categoria de teste
  if (testCategoryId) {
    const deleteCatResult = await makeRequest('DELETE', `/categories/${testCategoryId}`);
    if (deleteCatResult.success) {
      console.log(colors.green('✅ Categoria de teste removida'));
    }
  }

  console.log(colors.cyan('\n✨ Testes concluídos!\n'));

  // Resumo
  console.log(colors.cyan('📊 Resumo dos Endpoints Testados:'));
  console.log('- Auth: Login, Me');
  console.log('- Users: List, Preferences');
  console.log('- Categories: Create, List, Delete');
  console.log('- Transactions: Create, List, Summary, Delete');
  console.log('- Reports: Summary, Detailed, Trends');
  console.log('- Settings: System, Notifications, Export');
}

// Executar testes
runTests().catch(error => {
  console.error(colors.red('\n❌ Erro fatal nos testes:'), error.message);
  process.exit(1);
});
