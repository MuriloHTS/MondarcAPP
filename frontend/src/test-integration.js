// Script para testar a integração Frontend-Backend
// Execute este arquivo no console do navegador enquanto o frontend estiver rodando

console.log('🚀 Iniciando teste de integração Frontend-Backend...\n');

// Importar os serviços (você precisará executar isso no contexto do React)
const testIntegration = async () => {
  try {
    // 1. Teste de Login
    console.log('📋 Testando Login...');
    const loginData = {
      email: 'admin@empresa.com',
      password: '123456'
    };
    
    // Simular login via fetch direto
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    if (!loginResponse.ok) {
      throw new Error('Erro no login');
    }
    
    const loginResult = await loginResponse.json();
    console.log('✅ Login bem-sucedido!');
    console.log('👤 Usuário:', loginResult.user.name);
    console.log('🔑 Token recebido');
    
    const token = loginResult.token;
    
    // 2. Teste de Categorias
    console.log('\n📋 Testando Categorias...');
    const categoriesResponse = await fetch('http://localhost:3001/api/categories', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (categoriesResponse.ok) {
      const categories = await categoriesResponse.json();
      console.log('✅ Categorias carregadas:', categories.length);
    } else {
      console.log('❌ Erro ao carregar categorias');
    }
    
    // 3. Teste de Transações
    console.log('\n📋 Testando Transações...');
    const transactionsResponse = await fetch('http://localhost:3001/api/transactions', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (transactionsResponse.ok) {
      const result = await transactionsResponse.json();
      console.log('✅ Transações carregadas:', result.data?.length || 0);
    } else {
      console.log('❌ Erro ao carregar transações');
    }
    
    // 4. Teste de Preferências
    console.log('\n📋 Testando Preferências do Usuário...');
    const prefsResponse = await fetch('http://localhost:3001/api/users/preferences', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (prefsResponse.ok) {
      const prefs = await prefsResponse.json();
      console.log('✅ Preferências carregadas');
      console.log('   Tema:', prefs.theme);
      console.log('   Idioma:', prefs.language);
    } else {
      console.log('❌ Erro ao carregar preferências');
    }
    
    // 5. Teste de Relatórios
    console.log('\n📋 Testando Relatórios...');
    const reportResponse = await fetch('http://localhost:3001/api/reports/summary?period=monthly&month=' + (new Date().getMonth() + 1), {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (reportResponse.ok) {
      const report = await reportResponse.json();
      console.log('✅ Relatório carregado');
      console.log('   Total Receitas:', report.summary?.totalIncome || 0);
      console.log('   Total Despesas:', report.summary?.totalExpenses || 0);
    } else {
      console.log('❌ Erro ao carregar relatório');
    }
    
    console.log('\n✨ Teste de integração concluído!');
    console.log('\n📝 Resumo:');
    console.log('- API Backend: http://localhost:3001');
    console.log('- Frontend: http://localhost:3000');
    console.log('- Autenticação: JWT funcionando');
    console.log('- Endpoints testados: 5/5');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
};

// Executar o teste
testIntegration();
