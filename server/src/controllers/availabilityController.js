// server/src/controllers/availabilityController.js
const { asyncHandler, badRequest } = require("../utils/errors");
const availabilityService = require("../services/availabilityService");

exports.get = asyncHandler(async (req, res) => {
  const { serviceId, date } = req.query;
  if (!serviceId || !date) throw badRequest("serviceId y date son requeridos");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw badRequest("date debe ser YYYY-MM-DD");
  const slots = await availabilityService.getSlots({ serviceId, date });
  res.json({ slots });
});
