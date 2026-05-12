# 01 - Producto y Setup

## Que es Gastromind Mobile

Gastromind Mobile es la aplicación móvil del ecosistema Gastromind. Su objetivo es ayudar al usuario a decidir mejor qué cocinar y qué comprar, usando el estado real de su nevera y hábitos de compra.

En términos prácticos, la app se centra en cuatro capacidades:
- inventario de nevera (alta, edición, consumo y borrado de productos);
- recetas sugeridas por IA en función de lo disponible;
- favoritos de recetas con consumo desde receta;
- compras habituales con cobertura y faltantes.

## Ecosistema

Referencias (actualizar URLs reales si cambia organización/repos):
- Mobile: `gastromind-mobile` (este repositorio)
- Backend API: `gastromind-backend`
- Web/Admin: `gastromind-web`

## Alcance funcional actual

### Fridge
- listar items de la nevera;
- crear item;
- editar solo `quantity`, `expirationDate`, `status`;
- eliminar item;
- consumir ingredientes desde receta.

### IA Recetas
- generar receta sugerida con comensales;
- visualizar ingredientes usados;
- guardar receta en favoritos;
- consumir ingredientes usados.

### Favoritos
- listar recetas favoritas;
- filtrar por utensilio y tiempo;
- abrir detalle de receta favorita;
- eliminar favorito con dialogo visual unificado.

### Compras habituales
- mostrar estado de cobertura;
- mostrar faltantes y métricas de compra;
- integrar sugerencias backend.

## Stack y requisitos

- Node.js 20+
- npm 10+
- Expo CLI via `npx expo`

Stack principal:
- Expo SDK 54
- React 19
- React Native 0.81
- TypeScript strict

## Variables de entorno

Crear `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_API_URL=http://<host>:<port>/api/v1
```

Notas:
- no hardcodear URLs de API en código;
- revisar que el host sea alcanzable desde dispositivo/emulador.

## Instalacion y ejecucion

```bash
npm install
npx expo start
```

Targets:

```bash
npm run android
npm run ios
npm run web
```

## Scripts de calidad

```bash
npm run lint
npx tsc --noEmit
```

No hay suite formal de tests automatizados en este momento.

## Verificacion inicial (smoke test)

1. abrir app y validar pantalla de login;
2. iniciar sesión;
3. validar carga de Home sin errores;
4. ir a Fridge y comprobar listado;
5. abrir IA y generar receta;
6. abrir Favoritos;
7. abrir Compras habituales.

## Problemas comunes de setup

- `Network Error` al llamar API:
  - revisar `EXPO_PUBLIC_API_URL`;
  - revisar red/dispositivo y puerto backend.

- cambios no reflejados en app:
  - limpiar cache de Expo:

```bash
npx expo start -c
```
