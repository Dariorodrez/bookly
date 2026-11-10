// shared/schemas/index.js
const { z } = require("zod");

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
  name: z.string().min(2, "Mínimo 2 caracteres").max(80),
  phone: z.string().max(30).optional().or(z.literal("")),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

const serviceSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional().or(z.literal("")),
  durationMin: z.number().int().min(5).max(480),
  price: z.number().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
});

const appointmentCreateSchema = z.object({
  serviceId: z.string().min(1),
  startsAt: z.string().datetime({ offset: true }),
});

const appointmentRescheduleSchema = z.object({
  startsAt: z.string().datetime({ offset: true }),
});

const businessHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  slotMin: z.number().int().min(5).max(120),
  isActive: z.boolean(),
});

const blockedSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  reason: z.string().max(200).optional().or(z.literal("")),
});

module.exports = {
  registerSchema,
  loginSchema,
  serviceSchema,
  appointmentCreateSchema,
  appointmentRescheduleSchema,
  businessHourSchema,
  blockedSlotSchema,
};
