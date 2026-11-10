// server/src/controllers/servicesController.js
const { asyncHandler } = require("../utils/errors");
const serviceService = require("../services/serviceService");
const validate = require("../middleware/validate");
const { serviceSchema } = require("@bookly/shared/schemas");

exports.list = asyncHandler(async (req, res) => {
  const includeInactive = req.query.all === "true" && req.user && req.user.role === "ADMIN";
  const services = await serviceService.list({ includeInactive });
  res.json({ services });
});

exports.listAll = asyncHandler(async (_req, res) => {
  const services = await serviceService.list({ includeInactive: true });
  res.json({ services });
});

exports.get = asyncHandler(async (req, res) => {
  const service = await serviceService.getById(req.params.id);
  res.json({ service });
});

exports.create = [validate(serviceSchema), asyncHandler(async (req, res) => {
  const service = await serviceService.create(req.body);
  res.status(201).json({ service });
})];

exports.update = [validate(serviceSchema.partial()), asyncHandler(async (req, res) => {
  const service = await serviceService.update(req.params.id, req.body);
  res.json({ service });
})];

exports.remove = asyncHandler(async (req, res) => {
  const result = await serviceService.remove(req.params.id);
  res.json(result);
});
