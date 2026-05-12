# Gastromind Mobile

Aplicación móvil de **Gastromind** (Expo + React Native) para gestionar tu cocina de forma inteligente.

La app permite:
- gestionar la nevera (alta, edición, consumo y borrado de productos);
- generar recetas con IA según lo disponible en casa;
- guardar recetas favoritas y consumir ingredientes desde receta;
- visualizar compras habituales, cobertura y sugerencias de reposición.

## Aplicaciones del ecosistema

> Actualiza estos enlaces con las URLs reales de cada proyecto.

- Mobile (este repo): `https://github.com/<org>/gastromind-mobile`
- Backend API: `https://github.com/<org>/gastromind-backend`
- Web / Admin: `https://github.com/<org>/gastromind-web`
- Documentación: [`docs/README.md`](./docs/README.md)

## Stack técnico

- Expo SDK 54
- React 19
- React Native 0.81
- TypeScript (`strict`)
- Expo Router (navegación file-based)
- Axios (cliente API centralizado)

## Funcionalidades clave

- **Fridge**
  - CRUD de items de nevera
  - update por `PUT /fridge-items/me/{itemId}`
  - consumo desde receta por `PUT /fridge-items/me/consume-from-recipe`
- **IA de recetas**
  - generación de receta sugerida por comensales
  - guardado en favoritos
  - consumo de ingredientes usados
- **Favoritos**
  - listado de recetas guardadas
  - detalle de receta favorita
  - eliminación con diálogo consistente de app
- **Compras habituales**
  - resumen de cobertura
  - sugerencias desde `GET /usual-purchases/me/suggestions`

## Estructura del proyecto

```txt
src/
├── core/
│   └── domain/                  # Tipos y contratos de dominio
├── adapters/
│   ├── ui/
│   │   ├── components/          # Componentes reutilizables (AppDialog, AppField, etc.)
│   │   ├── screens/             # Pantallas de la app
│   │   └── navigation/          # Rutas y helpers de navegación
│   └── external/
│       ├── api/                 # Servicios HTTP / mapeo DTO
│       └── storage/             # Persistencia local
└── shared/
    ├── theme/                   # Tokens visuales / theme provider
    └── network/                 # Estado de conectividad
```

## Requisitos

- Node.js 20+
- npm 10+
- Expo CLI (vía `npx expo`)

## Configuración

Crear archivo `.env` en la raíz con:

```env
EXPO_PUBLIC_API_URL=http://<host>:<port>/api/v1
```

## Scripts

- `npm install` - instalar dependencias
- `npm run start` - iniciar Expo
- `npm run android` - abrir en Android
- `npm run ios` - abrir en iOS
- `npm run web` - abrir en web
- `npm run lint` - lint
- `npx tsc --noEmit` - chequeo TypeScript

## Documentación interna

Plan de documentación en 5 páginas (carpeta `docs/`):
- [`docs/README.md`](./docs/README.md) (índice)
- [`docs/01-producto-setup.md`](./docs/01-producto-setup.md)
- [`docs/02-arquitectura-navegacion.md`](./docs/02-arquitectura-navegacion.md)
- [`docs/03-api-contratos.md`](./docs/03-api-contratos.md)
- [`docs/04-flujos-clave-ui.md`](./docs/04-flujos-clave-ui.md)
- [`docs/05-operacion-debug.md`](./docs/05-operacion-debug.md)

## Estado actual

Proyecto en evolución activa. Si cambias contratos backend o endpoints, actualiza:
- servicios en `src/adapters/external/api/`
- tipos de dominio en `src/core/domain/`
- esta documentación (`README` + `docs/`).
