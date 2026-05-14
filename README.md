# Control App

Aplicación web para gestionar proyectos, cotizaciones, tareas tipo Kanban y accesos por proyecto.

## Stack principal

- Next.js 16 (App Router)
- React 19
- TypeScript
- Drizzle ORM + drizzle-kit
- Neon Postgres (`@neondatabase/serverless`)
- Tailwind CSS 4
- dnd-kit (arrastrar y soltar)

## Funcionalidades

- Autenticación por sesión usando tablas en esquema `neon_auth`
- Panel con pestañas de tareas, proyectos, cotizaciones y archivados
- Tablero Kanban por proyecto
- Tareas simples y tareas con checklist
- Reordenamiento drag-and-drop de tarjetas en tablero
- Reordenamiento drag-and-drop de tareas en dashboard (la primera posición representa mayor prioridad)
- Gestión de accesos/credenciales por proyecto

## Requisitos

- Node.js 20+
- npm 10+
- Base de datos Postgres (recomendado: Neon)
- Tablas de Neon Auth disponibles en esquema `neon_auth`

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto.

Variables usadas por la app:

- `DATABASE_URL` (requerida)
- `INITIAL_USER_PASSWORD` (opcional, usada por seed)
- `INITIAL_USER_NAME` (opcional, usada por seed)

## Primer arranque local

1. Instalar dependencias:

```bash
npm install
```

2. Sincronizar esquema con la base de datos:

```bash
npm run db:push
```

3. Crear/actualizar usuario inicial en `neon_auth`:

```bash
npm run db:seed
```

4. Ejecutar en desarrollo:

```bash
npm run dev
```

5. Abrir:

```text
http://localhost:3000
```

## Acceso inicial

La pantalla de login precarga el correo:

- `jcaicedev@gmail.com`

La contraseña será:

- `INITIAL_USER_PASSWORD` si está definida
- En caso contrario, el valor por defecto del seed (`Control2026!`)

## Scripts disponibles

- `npm run dev`: servidor de desarrollo
- `npm run build`: build de producción
- `npm run start`: ejecutar build en producción
- `npm run lint`: lint del proyecto
- `npm run db:push`: aplicar esquema Drizzle
- `npm run db:seed`: crear/sincronizar usuario inicial

## Endpoint de salud

Endpoint:

```text
GET /api/health
```

Valida:

- Presencia de `DATABASE_URL`
- Conexión a base de datos
- Existencia de credencial inicial en `neon_auth`

## Notas de operación

- El orden visual de tareas en dashboard se guarda como prioridad descendente.
- El proyecto usa `cards.position` para orden y prioridad en tareas.
- Si modificas el esquema en `db/schema.ts`, vuelve a ejecutar `npm run db:push`.

## Estructura resumida

- `app/`: rutas y páginas (dashboard, auth, API)
- `components/`: UI y clientes interactivos (board, tasks, forms)
- `db/`: conexión, esquema y seed
- `lib/`: utilidades, auth y validadores

## Deploy

Build de producción:

```bash
npm run build
```

Este proyecto incluye script `vercel-build` para despliegues en Vercel.
