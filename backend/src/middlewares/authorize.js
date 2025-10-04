/**
 * Middleware para verificar se o usuário tem as permissões necessárias
 * @param {Array} allowedRoles - Array com os roles permitidos para acessar a rota
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      // Verifica se o usuário está autenticado
      if (!req.user) {
        return res.status(401).json({
          error: "Usuário não autenticado",
        });
      }

      // Se não houver roles específicos, permite qualquer usuário autenticado
      if (allowedRoles.length === 0) {
        return next();
      }

      // Verifica se o role do usuário está na lista de permitidos
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          error:
            "Acesso negado. Você não tem permissão para acessar este recurso.",
        });
      }

      // Se passou por todas as verificações, continua
      next();
    } catch (error) {
      console.error("Erro no middleware de autorização:", error);
      return res.status(500).json({
        error: "Erro ao verificar permissões",
      });
    }
  };
};

module.exports = authorize;
