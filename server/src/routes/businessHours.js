// server/src/routes/businessHours.js
const express = require("express");
const { asyncHandler } = require("../utils/errors");
const hoursService = require("../services/hoursService");

const router = express.Router();

// Horario público del negocio (día de apertura, horas y tamaño de hueco).
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const hours = await hoursService.list();
    res.json({
      hours: hours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        openTime: h.openTime,
        closeTime: h.closeTime,
        slotMin: h.slotMin,
        isActive: h.isActive,
      })),
    });
  }),
);

module.exports = router;
