// server/src/routes/services.js
const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const servicesController = require("../controllers/servicesController");

const router = express.Router();

router.get("/", servicesController.list);
router.get("/all", requireAuth, requireRole("ADMIN"), servicesController.listAll);
router.get("/:id", servicesController.get);
router.post("/", requireAuth, requireRole("ADMIN"), ...servicesController.create);
router.patch("/:id", requireAuth, requireRole("ADMIN"), ...servicesController.update);
router.delete("/:id", requireAuth, requireRole("ADMIN"), servicesController.remove);

module.exports = router;
