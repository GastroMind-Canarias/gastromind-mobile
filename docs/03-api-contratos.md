# 03 - API y Contratos

Documento de referencia de endpoints usados por el frontend móvil.

Base URL:

- `EXPO_PUBLIC_API_URL`
- ejemplo: `http://<host>:<port>/api/v1`

Todos los paths de este documento se expresan relativos a esa base.

## Convenciones generales

- Auth por token Bearer gestionado por interceptor.
- Fechas en formato ISO o `YYYY-MM-DD` según endpoint.
- En errores, backend suele responder con `status`, `message`, `timestamp`.

## Auth / Usuario

| Método | Endpoint | Uso en app |
|---|---|---|
| `GET` | `/users/me` (o equivalente backend actual) | Validar sesión y cargar contexto |

Notas:
- Un `401` en rutas de usuario puede disparar limpieza de token y redirección a login.

## Fridge

| Método | Endpoint | Uso en app |
|---|---|---|
| `GET` | `/fridge-items/me` | Listado principal de nevera |
| `POST` | `/fridge-items/me` | Alta de item |
| `PUT` | `/fridge-items/me/{itemId}` | Editar item |
| `DELETE` | `/fridge-items/me/{itemId}` | Eliminar item |
| `PUT` | `/fridge-items/me/consume-from-recipe` | Descontar ingredientes de receta |

### Payload update fridge item

Solo se permiten estos campos:

```json
{
  "quantity": 1.5,
  "expirationDate": "2026-12-31",
  "status": "GOOD"
}
```

Estados esperados:
- `GOOD`
- `OPENED`
- `EXPIRED`

### Payload consume-from-recipe

```json
{
  "ingredientsUsed": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440002",
      "productName": "Tomate",
      "quantityUsed": 0.75
    }
  ]
}
```

Fuente de datos en frontend:
- `ingredientsUsed` se toma de la receta favorita/detalle de receta.

## IA Recetas

| Método | Endpoint | Uso en app |
|---|---|---|
| `POST` | `/households/me/recipes/suggestions` | Generar receta sugerida |

Payload ejemplo:

```json
{ "servings": 2 }
```

Respuesta esperada (resumen):
- `suggestionId` o similar
- `recipe` con `ingredientsUsed`

## Favoritos

| Método | Endpoint | Uso en app |
|---|---|---|
| `GET` | `/user-favorites/me` | Listar favoritos |
| `GET` | `/user-favorites/me/{favoriteId}` | Detalle de favorito |
| `POST` | `/user-favorites/me/from-suggestion` | Crear favorito desde IA |
| `DELETE` | `/user-favorites/me/{favoriteId}` | Eliminar favorito |

Notas:
- El frontend tolera variantes de query param al crear desde sugerencia (`suggestionId` / `suggestion_id`).
- Estructura actual relevante:
  - el favorito incluye `recipe.ingredientsUsed`.

## Compras habituales

| Método | Endpoint | Uso en app |
|---|---|---|
| `GET` | `/usual-purchases/me/suggestions` | Fuente principal para estado de compra habitual |

Ejemplo de respuesta:

```json
[
  {
    "product_id": "prod-uuid",
    "product_name": "Leche entera",
    "target_quantity": 0,
    "quantity_unit": "kg",
    "current_fridge_quantity": 0,
    "score": 0.1,
    "distinct_ticket_count": 10,
    "last_purchased_at": "2026-05-11T10:05:32.739Z",
    "low_stock": true
  }
]
```

Campos usados por UI:
- `product_name`
- `target_quantity`
- `quantity_unit`
- `current_fridge_quantity`
- `score`
- `distinct_ticket_count`
- `last_purchased_at`
- `low_stock`

## Errores comunes por contrato

- `403 Access Denied`
  - endpoint incorrecto (falta `/me`) o permisos backend.
- `400/422`
  - payload inválido (shape o tipos no compatibles).
- `Network Error`
  - host/puerto no accesible, timeout, problema de red.

## Mantenimiento del contrato

Cuando cambie backend:
- actualizar servicio correspondiente en `src/adapters/external/api/`;
- actualizar tipos en `src/core/domain/`;
- actualizar este archivo y `docs/04-flujos-clave-ui.md`.
