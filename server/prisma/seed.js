// server/prisma/seed.js
require("dotenv").config();
const bcrypt = require("bcryptjs");
const prisma = require("../src/config/prisma");

async function main() {
  const adminEmail = "admin@bookly.com";
  const adminPassword = "admin1234";

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const hash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: { email: adminEmail, passwordHash: hash, name: "Administrador", role: "ADMIN" },
    });
    console.log("Admin creado:", adminEmail, "/", adminPassword);
  } else {
    console.log("Admin ya existe:", adminEmail);
  }

  // Horarios por defecto: lunes(1)-sábado(6) 09:00-18:00, slot 30 min
  for (let day = 1; day <= 6; day++) {
    await prisma.businessHour.upsert({
      where: { dayOfWeek: day },
      create: { dayOfWeek: day, openTime: "09:00", closeTime: "18:00", slotMin: 30, isActive: true },
      update: {},
    });
  }
  // Domingo cerrado
  await prisma.businessHour.upsert({
    where: { dayOfWeek: 0 },
    create: { dayOfWeek: 0, openTime: "09:00", closeTime: "18:00", slotMin: 30, isActive: false },
    update: {},
  });

  const services = [
    { name: "Corte de pelo", description: "Corte clásico o moderno, incluye lavado.", durationMin: 30, price: 25 },
    { name: "Corte + barba", description: "Corte y arreglo de barba.", durationMin: 45, price: 35 },
    { name: "Coloración", description: "Tinte completo con productos premium.", durationMin: 90, price: 70 },
    { name: "Tratamiento capilar", description: "Hidratación profunda y masaje.", durationMin: 60, price: 45 },
  ];
  for (const s of services) {
    const exists = await prisma.service.findFirst({ where: { name: s.name } });
    if (!exists) await prisma.service.create({ data: s });
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
