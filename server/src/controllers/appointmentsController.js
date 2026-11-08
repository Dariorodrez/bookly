// server/src/controllers/appointmentsController.js
const { asyncHandler } = require("../utils/errors");
const bookingService = require("../services/bookingService");
const validate = require("../middleware/validate");
const { appointmentCreateSchema } = require("@bookly/shared/schemas");
const { requireAuth } = require("../middleware/auth");

exports.mine = asyncHandler(async (req, res) => {
  const appointments = await bookingService.listMine(req.user.id);
  res.json({ appointments });
});

exports.create = [
  validate(appointmentCreateSchema),
  asyncHandler(async (req, res) => {
    const appointment = await bookingService.create({
      userId: req.user.id,
      serviceId: req.body.serviceId,
      startsAt: req.body.startsAt,
    });
    res.status(201).json({ appointment });
  }),
];

exports.cancel = asyncHandler(async (req, res) => {
  const isAdmin = req.user.role === "ADMIN";
  const appointment = await bookingService.cancel({
    appointmentId: req.params.id,
    userId: req.user.id,
    isAdmin,
  });
  res.json({ appointment });
});
