const router = require("express").Router();
const authMiddleware = require("../middlewares/auth");
const TransactionController = require("../controllers/TransactionController");
const validate = require("../middlewares/validate");
const transactionValidation = require("../validations/transaction.validation");

// Todas as rotas de transação requerem autenticação
router.use(authMiddleware);

// Rotas
router.get(
  "/",
  validate(transactionValidation.list),
  TransactionController.index
);

router.get(
  "/summary",
  validate(transactionValidation.summary),
  TransactionController.summary
);

router.get("/:id", TransactionController.show);

router.post(
  "/",
  validate(transactionValidation.create),
  TransactionController.store
);

router.put(
  "/:id",
  validate(transactionValidation.update),
  TransactionController.update
);

router.delete("/:id", TransactionController.destroy);

module.exports = router;
