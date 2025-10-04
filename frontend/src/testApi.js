import authService from "./services/authService";

// Função para testar o login
export async function testLogin() {
  console.log("🔍 Testando conexão com a API...\n");

  try {
    // Teste 1: Login com credenciais de admin
    console.log("Teste 1: Login como admin");
    const result = await authService.login("admin@empresa.com", "123456");
    console.log("✅ Login bem sucedido!");
    console.log("Usuário:", result.user.name);
    console.log("Role:", result.user.role);
    console.log("Token recebido:", result.token ? "Sim" : "Não");

    // Teste 2: Verificar se está autenticado
    console.log("\nTeste 2: Verificar autenticação");
    const isAuth = authService.isAuthenticated();
    console.log("Está autenticado?", isAuth ? "Sim" : "Não");

    // Teste 3: Obter usuário salvo
    console.log("\nTeste 3: Obter usuário salvo");
    const user = authService.getUser();
    console.log("Usuário salvo:", user);

    return true;
  } catch (error) {
    console.error("❌ Erro no teste:", error.message);
    return false;
  }
}

// Executar o teste ao importar (remova isto depois)
// testLogin();
