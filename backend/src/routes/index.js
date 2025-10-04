const { Router } = require("express");

// Importar rotas
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const categoryRoutes = require("./category.routes");
const transactionRoutes = require("./transaction.routes");
const reportRoutes = require("./report.routes");
const settingsRoutes = require("./settings.routes");

const router = Router();

// Rota de boas-vindas da API
router.get("/", (req, res) => {
  res.json({
    message: "API Sistema de Controle Financeiro",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      categories: "/api/categories",
      transactions: "/api/transactions",
      reports: "/api/reports",
      settings: "/api/settings",
    },
  });
});

// Aplicar rotas
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/transactions", transactionRoutes);
router.use("/reports", reportRoutes);
router.use("/settings", settingsRoutes);

module.exports = router;
