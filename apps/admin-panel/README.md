# Admin Panel (React + Material UI)

Panel interno de operaciones para reservas.

## Requisitos

- Node.js 20+
- npm 10+

## Desarrollo local

```bash
cd apps/admin-panel
npm install
npm run dev
```

Abrir:

- `http://localhost:5173`

## Build de producción (módulo)

```bash
cd apps/admin-panel
npm run build
```

Salida local:

- `apps/admin-panel/dist/`

## Build estático para el sitio actual

Genera versión publicable en el sitio estático existente:

```bash
cd apps/admin-panel
npm run build -- --outDir ../../reserva/panel-react
```

Ruta resultante en el proyecto:

- `reserva/panel-react/index.html`
