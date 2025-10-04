// backend/src/routes/auth.routes.js
const router = require("express").Router();
const AuthController = require("../controllers/AuthController");
const validate = require("../middlewares/validate");
const authValidation = require("../validations/auth.validation");
const authMiddleware = require("../middlewares/auth");

// Rotas públicas (sem autenticação)
router.post("/login", validate(authValidation.login), AuthController.login);
router.post(
  "/register",
  validate(authValidation.register),
  AuthController.register
);
router.post(
  "/refresh",
  validate(authValidation.refresh),
  AuthController.refresh
);

// Rotas protegidas (com autenticação)
router.use(authMiddleware); // A partir daqui, todas as rotas precisam de autenticação

router.get("/me", AuthController.me);
router.post("/logout", AuthController.logout);
router.post(
  "/change-password",
  validate(authValidation.changePassword),
  AuthController.changePassword
);

module.exports = router;
