// server/src/routes/availability.js
const express = require("express");
const availabilityController = require("../controllers/availabilityController");

const router = express.Router();
router.get("/", availabilityController.get);
module.exports = router;
