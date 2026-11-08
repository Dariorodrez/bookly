// server/src/routes/admin.js
const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const adminController = require("../controllers/adminController");

const router = express.Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get("/users", adminController.listUsers);
router.patch("/users/:id", adminController.updateUser);

router.get("/appointments", adminController.listAppointments);
router.patch("/appointments/:id/status", adminController.updateAppointmentStatus);

router.get("/hours", adminController.listHours);
router.put("/hours", ...adminController.upsertHour);
router.delete("/hours/:day", adminController.deleteHour);

router.get("/blocks", adminController.listBlocks);
router.post("/blocks", ...adminController.createBlock);
router.delete("/blocks/:id", adminController.deleteBlock);

router.get("/stats", adminController.stats);

module.exports = router;
