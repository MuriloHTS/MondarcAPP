const router = require("express").Router();
const ReportController = require("../controllers/ReportController");
const authMiddleware = require("../middlewares/auth");

// Todas as rotas de relatório requerem autenticação
router.use(authMiddleware);

// Rotas de relatórios
router.get("/summary", ReportController.summary.bind(ReportController));
router.get("/detailed", ReportController.detailed.bind(ReportController));
router.get("/trends", ReportController.trends.bind(ReportController));
router.get("/export/pdf", ReportController.exportPDF.bind(ReportController));
router.get("/export/csv", ReportController.exportCSV.bind(ReportController));

module.exports = router;
