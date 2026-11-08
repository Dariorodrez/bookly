// server/src/routes/auth.js
const express = require("express");
const validate = require("../middleware/validate");
const { registerSchema, loginSchema } = require("@bookly/shared/schemas");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", requireAuth, authController.logout);
router.get("/me", authController.me);

module.exports = router;
