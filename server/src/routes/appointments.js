// server/src/routes/appointments.js
const express = require("express");
const { requireAuth } = require("../middleware/auth");
const appointmentsController = require("../controllers/appointmentsController");

const router = express.Router();
router.use(requireAuth);
router.get("/mine", appointmentsController.mine);
router.post("/", ...appointmentsController.create);
router.patch("/:id/cancel", appointmentsController.cancel);
router.patch("/:id/reschedule", ...appointmentsController.reschedule);
module.exports = router;
