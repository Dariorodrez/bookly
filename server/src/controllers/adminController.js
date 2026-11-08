// server/src/controllers/adminController.js
const { asyncHandler } = require("../utils/errors");
const validate = require("../middleware/validate");
const { businessHourSchema, blockedSlotSchema } = require("@bookly/shared/schemas");
const userService = require("../services/userService");
const bookingService = require("../services/bookingService");
const hoursService = require("../services/hoursService");
const blockedService = require("../services/blockedService");

// Users
exports.listUsers = asyncHandler(async (_req, res) => {
  const users = await userService.list();
  res.json({ users });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await userService.update(req.params.id, req.body);
  res.json({ user });
});

// Appointments
exports.listAppointments = asyncHandler(async (req, res) => {
  const appointments = await bookingService.listAll({
    status: req.query.status,
    from: req.query.from,
    to: req.query.to,
  });
  res.json({ appointments });
});

exports.updateAppointmentStatus = asyncHandler(async (req, res) => {
  const appointment = await bookingService.updateStatus({
    id: req.params.id,
    status: req.body.status,
  });
  res.json({ appointment });
});

// Hours
exports.listHours = asyncHandler(async (_req, res) => {
  const hours = await hoursService.list();
  res.json({ hours });
});

exports.upsertHour = [
  validate(businessHourSchema),
  asyncHandler(async (req, res) => {
    const hour = await hoursService.upsert(req.body);
    res.json({ hour });
  }),
];

exports.deleteHour = asyncHandler(async (req, res) => {
  await hoursService.remove(Number(req.params.day));
  res.json({ ok: true });
});

// Blocks
exports.listBlocks = asyncHandler(async (req, res) => {
  const blocks = await blockedService.list({ from: req.query.from, to: req.query.to });
  res.json({ blocks });
});

exports.createBlock = [
  validate(blockedSlotSchema),
  asyncHandler(async (req, res) => {
    const block = await blockedService.create(req.body, req.user.id);
    res.status(201).json({ block });
  }),
];

exports.deleteBlock = asyncHandler(async (req, res) => {
  await blockedService.remove(req.params.id);
  res.json({ ok: true });
});

// Stats
exports.stats = asyncHandler(async (_req, res) => {
  const stats = await bookingService.stats();
  res.json({ stats });
});
