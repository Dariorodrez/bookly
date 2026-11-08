# BOOKLY · Reservas y gestión de citas

Aplicación **full-stack** de reservas y gestión de citas para pequeños negocios.
Desarrollada como proyecto demo para mostrar una arquitectura completa y mantenible.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + React Router + TanStack Query + React Hook Form
- **Backend:** Node.js + Express (API REST)
- **Base de datos:** SQLite + Prisma ORM
- **Validación:** Zod compartido entre cliente y servidor
- **Autenticación:** sesiones con cookie httpOnly (`express-session` + `connect-sqlite3`)
- **Pruebas:** Playwright (E2E)

## Funcionalidades

**Clientes**
- Registro e inicio de sesión (contraseñas hasheadas con bcrypt)
- Consulta de servicios
- Consulta de disponibilidad por fecha
- Reserva de citas (sin solapamientos)
- Consulta y cancelación de sus propias reservas

**Administradores**
- Panel privado con estadísticas básicas
- Gestión de servicios (CRUD)
- Gestión de reservas (cambio de estado)
- Gestión de clientes
- Configuración de horarios por día
- Bloqueo de fechas y horas
- Control de permisos por roles y protección de rutas

## Estructura

```
bookly/
├── client/          # React + Vite
├── server/          # Express + Prisma
├── shared/          # Esquemas Zod compartidos
├── tests/           # Playwright E2E
└── package.json     # Workspaces (npm)
```

## Cómo ejecutar

### Requisitos
- Node.js 20+
- npm 10+

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar el backend
```bash
cd server
cp .env.example .env
# edita .env y pon un SESSION_SECRET aleatorio (>= 32 caracteres)
npx prisma migrate deploy
npm run db:seed
```

### 3. Arrancar en desarrollo
En dos terminales:
```bash
# terminal 1
npm run dev:server   # http://localhost:4000

# terminal 2
npm run dev:client   # http://localhost:5173
```

O con un solo comando (concurrently):
```bash
npm run dev
```

### Credenciales de demo
- **Admin:** `admin@bookly.com` / `admin1234`

## Pruebas

```bash
# backend + frontend deben estar corriendo
npx playwright test
```

## Seguridad implementada

- Contraseñas hasheadas (bcrypt, 12 rounds)
- Sesiones con cookie httpOnly, Secure en producción, SameSite=Lax
- Rate limiting en `/api/auth` (20 req/15 min)
- Validación con Zod en cliente y servidor
- Control de roles por middleware (`requireRole`)
- Protección CSRF vía SameSite + validación de Origin
- Cabeceras seguras con Helmet
- CORS restringido al origen del cliente
- Variables sensibles en `.env` (no versionado)
- Anti-solapamiento de reservas (transacción + índice único parcial)

## API REST

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | — | Registro |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/logout` | sesión | Logout |
| GET | `/api/auth/me` | sesión | Usuario actual |
| GET | `/api/services` | — | Servicios activos |
| GET | `/api/availability` | — | Slots libres |
| GET | `/api/appointments/mine` | USER | Mis citas |
| POST | `/api/appointments` | USER | Crear cita |
| PATCH | `/api/appointments/:id/cancel` | USER/owner | Cancelar |
| GET | `/api/admin/users` | ADMIN | Clientes |
| CRUD | `/api/admin/services` | ADMIN | Servicios |
| GET/PATCH | `/api/admin/appointments` | ADMIN | Citas |
| CRUD | `/api/admin/hours` | ADMIN | Horarios |
| CRUD | `/api/admin/blocks` | ADMIN | Bloqueos |
| GET | `/api/admin/stats` | ADMIN | Estadísticas |

## Licencia

ISC — proyecto de demostración. Los datos, imágenes y nombres son ficticios.
