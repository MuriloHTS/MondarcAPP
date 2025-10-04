// backend/src/routes/auth.routes.js
const router = require("express").Router();
const authMiddleware = require("../middlewares/auth");
const CategoryController = require("../controllers/CategoryController");
const validate = require("../middlewares/validate");
const categoryValidation = require("../validations/category.validation");

// Todas as rotas de categoria requerem autenticação
router.use(authMiddleware);

// Rotas
router.get("/", validate(categoryValidation.list), CategoryController.index);

router.get("/:id", CategoryController.show);

router.post("/", validate(categoryValidation.create), CategoryController.store);

router.put(
  "/:id",
  validate(categoryValidation.update),
  CategoryController.update
);

router.delete("/:id", CategoryController.destroy);

module.exports = router;
