# 02 - Arquitectura y Navegacion

## Vista general

El proyecto sigue una arquitectura por capas con separación clara entre:
- dominio (tipos/reglas);
- UI (pantallas y componentes);
- infraestructura de red (servicios API);
- utilidades transversales (tema, red, constantes).

Objetivo: evitar que las pantallas se acoplen al contrato HTTP y mantener cambios de backend encapsulados en servicios.

## Estructura real

```txt
src/
├── core/
│   └── domain/                         # Tipos base (Recipe, FridgeItem, Profile, etc.)
├── adapters/
│   ├── ui/
│   │   ├── components/                 # AppDialog, AppField, AppBanner, estados, etc.
│   │   ├── screens/                    # Home, Fridge, AIChat, Favoritos, RecipeDetail...
│   │   └── navigation/                 # Rutas y helpers de navegación
│   ├── external/
│   │   ├── api/                        # apiClient, interceptores, servicios por módulo
│   │   └── storage/                    # almacenamiento local/offline
│   └── ...
└── shared/
    ├── theme/                          # COLORS, ThemeProvider, tokens
    └── network/                        # NetworkProvider (online/offline)
```

## Responsabilidades por capa

## `core/domain`
- Define contratos de datos que usa UI.
- No contiene lógica de transporte ni dependencias de React Native.

## `adapters/external/api`
- Encapsula endpoints y payloads backend.
- Traduce formatos (`snake_case` / `camelCase`) cuando hace falta.
- Centraliza fallbacks de contrato para no duplicar en pantallas.

## `adapters/ui/screens`
- Orquesta interacción de usuario.
- Consume servicios API y maneja estados visuales (loading/error/success).
- No debería construir URLs ni contratos de red manualmente.

## `shared/*`
- Estado y configuración transversal:
  - tema claro/oscuro;
  - conectividad;
  - tokens visuales comunes.

## Navegación principal

Flujo de alto nivel:
- `Auth/Login` -> `Home`
- `Home` -> `Fridge`
- `Home` -> `AIChat`
- `Home` -> `Favoritos`
- `Favoritos` -> `RecipeDetail`
- `Home` -> `ComprasHabituales`

Notas:
- la app usa `expo-router` para navegación;
- rutas y helpers viven en `src/adapters/ui/navigation/routes.ts`.

## Flujos técnicos clave

## 1) Fridge update/delete
- UI dispara acción en `FridgeScreen`.
- Servicio ejecuta endpoint `/fridge-items/me/{itemId}`.
- UI actualiza estado local y refleja resultado.

## 2) Consumo desde receta favorita
- `RecipeDetailScreen` toma `ingredientsUsed` de receta favorita.
- envía `PUT /fridge-items/me/consume-from-recipe`.
- feedback visual vía `AppDialog`.

## 3) Compras habituales
- `ShoppingHabitsService` llama sugerencias y métricas backend.
- `ShoppingHabitsScreen` renderiza cobertura/estado en UI.

## Estado global y proveedores

- `ThemeProvider`
  - controla tema y paleta (incluye dark mode).
- `NetworkProvider`
  - expone `isOnline` para bloquear/permitir acciones de red.

## Convenciones de implementación

- Imports: externos -> internos -> tipos.
- Componentes y pantallas: PascalCase.
- Hooks: `useXxx`.
- Tipo-only imports cuando aplique.
- Evitar `any` salvo frontera externa y con normalización inmediata.

## Decisiones de diseño actuales

- Contratos backend se centralizan en servicios API.
- UI usa `AppDialog` para feedback consistente (evitar `Alert` disperso).
- Acciones críticas muestran logs estructurados para diagnóstico rápido.

## Checklist de revisión arquitectónica (PR)

- Endpoint nuevo agregado en servicio correcto.
- Tipos de dominio actualizados si cambia contrato.
- Pantalla sin lógica HTTP embebida.
- Dark mode validado en componentes nuevos.
- Manejo de error con mensaje usuario + log técnico.
