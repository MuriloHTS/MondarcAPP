const router = require("express").Router();
const UserController = require("../controllers/UserController");
const authMiddleware = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const validate = require("../middlewares/validate");
const userValidation = require("../validations/user.validation");

router.use(authMiddleware);

router.use((req, res, next) => {
  console.log(`🛣️  USER ROUTE: ${req.method} ${req.path}`);
  console.log(`👤 User authenticated:`, !!req.user);
  if (req.user) {
    console.log(`👤 User ID:`, req.user.id);
  }
  next();
});

const debugMiddleware = (req, res, next) => {
  console.log("=== DEBUG MIDDLEWARE ===");
  console.log("URL:", req.url);
  console.log("Method:", req.method);
  console.log("Headers Authorization:", req.headers.authorization);
  console.log("User attached:", !!req.user);
  if (req.user) {
    console.log("User ID:", req.user.id);
    console.log("User role:", req.user.role);
  }
  console.log("========================");
  next();
};

router.get("/preferences", debugMiddleware, UserController.getPreferences);
router.put("/preferences", debugMiddleware, UserController.updatePreferences);

router.get("/", authorize(["super"]), UserController.index);
router.get("/:id", UserController.show);
router.post(
  "/",
  authorize(["super"]),
  validate(userValidation.create),
  UserController.store
);

router.put("/:id", validate(userValidation.update), UserController.update);
router.delete("/:id", authorize(["super"]), UserController.destroy);

router.get("/test", (req, res) => {
  console.log("🧪 Endpoint de teste chamado!");
  res.json({
    message: "Rota de usuário funcionando!",
    user: req.user ? req.user.id : "não autenticado",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
