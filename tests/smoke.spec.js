import { test, expect } from "@playwright/test";

test("flujo completo de reserva", async ({ page }) => {
  await page.goto("http://localhost:5173/");
  await expect(page.getByRole("heading", { name: "Servicios disponibles" })).toBeVisible();

  // Registro
  await page.getByRole("link", { name: "Registrarse" }).click();
  const email = `user${Date.now()}@bookly.com`;
  await page.getByLabel("Nombre").fill("Usuario Demo");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill("password123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("heading", { name: "Servicios disponibles" })).toBeVisible();

  // Reservar primer servicio
  await page.getByRole("link", { name: "Reservar" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Corte|Coloración|Tratamiento/);

  // Elegir fecha mañana y un slot
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10);
  await page.locator('input[type="date"]').fill(dateStr);
  await page.waitForTimeout(500);
  const slot = page.locator("button").filter({ hasText: /^\d{2}:\d{2}$/ }).first();
  await expect(slot).toBeVisible({ timeout: 10000 });
  await slot.click();
  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(page).toHaveURL(/\/mis-citas/);
  await expect(page.getByText(/Corte|Coloración|Tratamiento/)).toBeVisible();

  // Cancelar
  await page.getByRole("button", { name: "Cancelar" }).first().click();
  await expect(page.getByText("CANCELLED")).toBeVisible({ timeout: 10000 });
});

test("login admin y panel", async ({ page }) => {
  await page.goto("http://localhost:5173/login");
  await page.getByLabel("Email").fill("admin@bookly.com");
  await page.getByLabel("Contraseña").fill("admin1234");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole("heading", { name: "Panel de administración" })).toBeVisible();
  await page.getByRole("button", { name: "Servicios" }).click();
  await expect(page.getByText("Corte de pelo")).toBeVisible();
  await page.getByRole("button", { name: "Estadísticas" }).click();
  await expect(page.getByText("Servicios activos")).toBeVisible();
});

test("responsive móvil", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:5173/");
  await expect(page.getByRole("heading", { name: "Servicios disponibles" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
