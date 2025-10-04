import React, { createContext, useState, useContext, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar se existe usuário salvo ao iniciar
  useEffect(() => {
    async function loadStoredData() {
      try {
        const storedUser = authService.getCurrentUser();

        if (storedUser && authService.isAuthenticated()) {
          // Verificar se o token ainda é válido
          const updatedUser = await authService.getMe();
          setUser(updatedUser);
          localStorage.setItem(
            "@FinanceControl:user",
            JSON.stringify(updatedUser)
          );
        }
      } catch (error) {
        // Token inválido, limpar dados
        authService.logout();
      } finally {
        setLoading(false);
      }
    }

    loadStoredData();
  }, []);

  // Login
  async function signIn(email, password) {
    try {
      setError(null);
      const { user } = await authService.login(email, password);
      setUser(user);
      return { success: true };
    } catch (error) {
      setError(error.message || "Erro ao fazer login");
      return { success: false, error: error.message };
    }
  }

  // Registro
  async function signUp(name, email, password) {
    try {
      setError(null);
      const { user } = await authService.register(name, email, password);
      setUser(user);
      return { success: true };
    } catch (error) {
      setError(error.message || "Erro ao criar conta");
      return { success: false, error: error.message };
    }
  }

  // Logout
  async function signOut() {
    try {
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (error) {
      // Mesmo com erro, limpar dados locais
      setUser(null);
    }
  }

  // Atualizar dados do usuário
  async function updateUser() {
    try {
      const updatedUser = await authService.getMe();
      setUser(updatedUser);
      localStorage.setItem("@FinanceControl:user", JSON.stringify(updatedUser));
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  // Alterar senha
  async function changePassword(currentPassword, newPassword) {
    try {
      setError(null);
      await authService.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      setError(error.message || "Erro ao alterar senha");
      return { success: false, error: error.message };
    }
  }

  // Verificar permissões
  function hasPermission(requiredRoles = []) {
    if (!user) return false;

    // Usuários pessoais têm acesso total aos seus dados
    if (user.system_mode === "pessoal") return true;

    // Verificar roles para usuários empresariais
    if (requiredRoles.length === 0) return true;
    return requiredRoles.includes(user.role);
  }

  function canEdit() {
    if (!user) return false;
    if (user.system_mode === "pessoal") return true;
    return ["super", "editor"].includes(user.role);
  }

  function canDelete() {
    if (!user) return false;
    if (user.system_mode === "pessoal") return true;
    return user.role === "super";
  }

  function isAdmin() {
    if (!user) return false;
    return user.role === "super";
  }

  return (
    <AuthContext.Provider
      value={{
        signed: !!user,
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        updateUser,
        changePassword,
        hasPermission,
        canEdit,
        canDelete,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }

  return context;
}

export default AuthContext;
