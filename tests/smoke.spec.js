import { test, expect } from "@playwright/test";

test("flujo completo de reserva (REST)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/bien reservado/i);
  await expect(page.locator(".service-card").first()).toBeVisible();
  expect(await page.locator(".service-card").count()).toBeGreaterThanOrEqual(4);

  // Reserva
  await page.getByRole("link", { name: /Reservar cita/i }).first().click();
  await expect(page).toHaveURL(/\/reservar/);
  await page.getByRole("button", { name: /Elegir fecha y hora/i }).click();

  const slots = page.locator(".slot");
  await expect(slots.first()).toBeVisible({ timeout: 10000 });
  await slots.first().click();
  await page.getByRole("button", { name: /Revisar reserva/i }).click();

  // Registro dentro del flujo
  await page.getByRole("button", { name: /Crear cuenta/i }).first().click();
  const email = `smoke${Date.now()}@bookly.test`;
  await page.locator("#inline-name").fill("Smoke Tester");
  await page.locator("#inline-email").fill(email);
  await page.locator("#inline-password").fill("smoke12345");
  await page.getByRole("button", { name: /Crear cuenta y continuar/i }).click();

  await expect(page.getByRole("button", { name: /Confirmar mi cita/i })).toBeVisible({
    timeout: 10000,
  });
  await page.getByRole("button", { name: /Confirmar mi cita/i }).click();

  await expect(page).toHaveURL(/\/mi-cuenta/, { timeout: 15000 });
  await expect(page.locator(".next-appointment__service")).toBeVisible();

  // Cancelar
  await page.locator(".next-appointment").getByRole("button", { name: /^Cancelar$/ }).click();
  await page.getByRole("button", { name: /Sí, cancelar/i }).click();
  await expect(page.getByRole("heading", { name: /No tienes citas próximas/i })).toBeVisible({
    timeout: 10000,
  });
});

test("login admin y recorrido por el panel", async ({ page }) => {
  await page.goto("/entrar");
  await page.locator("#email").fill("admin@bookly.com");
  await page.locator("#password").fill("admin1234");
  await page.getByRole("button", { name: /^Entrar$/ }).click();

  await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: /Resumen del negocio/i })).toBeVisible();

  const nav = page.locator(".admin-sidebar");
  await nav.getByRole("button", { name: "Agenda", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Agenda del día/i })).toBeVisible();

  await nav.getByRole("button", { name: "Servicios", exact: true }).click();
  await expect(page.getByText("Corte de pelo").first()).toBeVisible();

  await nav.getByRole("button", { name: "Horario", exact: true }).click();
  await expect(page.getByText("Horario semanal")).toBeVisible();

  await nav.getByRole("button", { name: "Clientes", exact: true }).click();
  await expect(page.getByRole("heading", { name: /^Clientes$/ })).toBeVisible();
});

test("responsive móvil sin desbordes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/bien reservado/i);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(1);

  await page.goto("/reservar");
  await expect(page.locator(".booking-bar")).toBeVisible();
  await expect(page.locator(".booking-summary")).toBeHidden();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(1);
});
