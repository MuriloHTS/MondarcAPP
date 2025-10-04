import { useState } from "react";
import authService from "../services/authService";

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const handleLogin = async (formData, onSuccess, onError) => {
    setIsLoading(true);
    try {
      const response = await authService.login(
        formData.email,
        formData.password
      );
      setCurrentUser(response.user);
      setLoginForm({ email: "", password: "" });
      if (onSuccess) onSuccess(response.user);
      return response;
    } catch (error) {
      if (onError) onError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  return {
    currentUser,
    setCurrentUser,
    loginForm,
    setLoginForm,
    isLoading,
    handleLogin,
    handleLogout,
  };
};
