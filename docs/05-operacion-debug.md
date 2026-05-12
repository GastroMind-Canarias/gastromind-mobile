# 05 - Operacion y Debug

Runbook operativo para resolver incidencias de frontend rápidamente.

## Triage inicial (30-60 segundos)

Antes de tocar código:

1. confirmar `EXPO_PUBLIC_API_URL` activo;
2. identificar endpoint, método y pantalla afectada;
3. revisar log de request/error de ese flujo;
4. distinguir si falla en frontend, red o backend.

## Checklist universal

1. endpoint correcto (incluye `/me` cuando corresponde);
2. método correcto (`GET/POST/PUT/DELETE`);
3. payload con shape y tipos correctos;
4. token/sesión vigente;
5. conectividad real al host/puerto backend;
6. confirmar que no estás en bundle cacheado viejo.

## Diagnóstico por síntoma

## Sintoma A: `403 Access Denied`

Causas probables:
- endpoint incorrecto (path equivocado);
- recurso no pertenece al usuario autenticado;
- política backend bloquea método.

Acciones:
1. confirmar `fullUrl` en log;
2. confirmar método exacto;
3. comprobar que el recurso es del usuario de sesión;
4. contrastar con backend contract/seguridad.

## Sintoma B: `Network Error`

Causas probables:
- API no accesible desde dispositivo/emulador;
- timeout insuficiente;
- URL mal configurada.

Acciones:
1. verificar `EXPO_PUBLIC_API_URL`;
2. probar reachability de host/puerto;
3. aumentar timeout en endpoints costosos (IA);
4. revisar logs de `code`, `status`, `message`.

## Sintoma C: botón/flujo no aparece

Causas probables:
- dato condicional no llega (ej. `ingredientsUsed`);
- mapeo en servicio perdió campos;
- render condicionado por estado erróneo.

Acciones:
1. loggear payload fuente;
2. validar mapeo en servicio;
3. validar condición de render en pantalla.

## Sintoma D: cambio no se refleja

Causa probable:
- cache de Metro/Expo.

Acción:

```bash
npx expo start -c
```

Reiniciar app después del clear cache.

## Logs clave del proyecto

## Fridge
- `[FridgeDebug][Update][Request|Success|Error]`
- `[FridgeDebug][Delete][Request|Success|Error]`

## IA
- `[AIChat][Suggestion][Error]`
- `[AIChat][ConsumeRecipe][Request|Success|Error]`

## Favoritos / Detalle
- `[RecipeDetail][ConsumeRecipe][Request|Success|Error]`

## Compras habituales
- revisar request/response de `GET /usual-purchases/me/suggestions` si hay vacío o datos inconsistentes.

## Playbooks de incidencias comunes

## Playbook 1 - Update Fridge falla

1. verificar request `PUT /fridge-items/me/{itemId}`;
2. confirmar payload solo con `quantity`, `expirationDate`, `status`;
3. verificar `status` permitido (`GOOD/OPENED/EXPIRED`);
4. si 403, validar ownership/permisos backend.

## Playbook 2 - Consumir desde receta falla

1. verificar endpoint `PUT /fridge-items/me/consume-from-recipe`;
2. confirmar payload:

```json
{
  "ingredientsUsed": [
    {
      "productId": "...",
      "productName": "...",
      "quantityUsed": 0.5
    }
  ]
}
```

3. validar que `ingredientsUsed` venga de receta favorita/IA;
4. revisar `responseData` backend.

## Playbook 3 - Dark mode con texto invisible

1. identificar bloque y color real de fondo en dark;
2. aplicar variante dark explícita para texto y background;
3. evitar mezcla de estilos donde el estilo claro sobreescriba dark.

## QA previo a merge

Checklist mínimo:
- Fridge: create/update/delete OK.
- IA: generar, guardar favorito, consumir.
- Favoritos: listar, eliminar, detalle, consumir.
- Compras habituales: datos + dark mode + scroll final visible.

Comandos:

```bash
npm run lint
npx tsc --noEmit
```

## Escalado

Escalar a backend cuando:
- endpoint y payload frontend están correctos;
- error persiste con `403/5xx` y `responseData` confirma regla backend.

En escalado incluir siempre:
- endpoint + método;
- payload real;
- status + responseData;
- usuario/entorno afectado.
