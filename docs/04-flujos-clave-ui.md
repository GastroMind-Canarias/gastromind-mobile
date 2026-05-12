# 04 - Flujos Clave de UI

Documento de referencia funcional para QA y desarrollo.

## 1) Flujo Fridge (crear, editar, eliminar)

## Crear item

Pasos:
1. usuario abre modal "Nuevo producto";
2. completa nombre, cantidad, fecha de caducidad y estado;
3. pulsa Guardar.

Resultado esperado:
- item aparece en lista sin recargar pantalla;
- no debe romper dark mode ni layout.

Errores esperables:
- sin conexión: mensaje claro y sin pérdida de estado local.

## Editar item

Pasos:
1. usuario abre modal "Editar producto";
2. modifica `quantity`, `expirationDate`, `status`;
3. nombre queda bloqueado (solo lectura);
4. pulsa Guardar.

Resultado esperado:
- cambios visibles en la lista;
- payload de update sin `productName`.

## Eliminar item

Pasos:
1. usuario pulsa eliminar;
2. confirma acción;
3. item desaparece de lista.

Resultado esperado:
- eliminación persistida en backend;
- rollback visual si backend falla.

## 2) Flujo IA (generar receta)

Pasos:
1. usuario define comensales;
2. pulsa generar;
3. backend devuelve receta + `ingredientsUsed`.

Resultado esperado:
- se renderiza receta completa;
- botones de acción visibles y centrados;
- estados de carga y error coherentes.

## Acciones sobre receta IA

### Añadir a favoritos
- si ya existe, mostrar "Ya esta en favoritos";
- botón debe deshabilitarse cuando ya se añadió.

### Consumir ingredientes
- endpoint: `PUT /fridge-items/me/consume-from-recipe`;
- payload: `ingredientsUsed` con `productId`, `productName`, `quantityUsed`;
- botón se deshabilita al completar.

## 3) Flujo Favoritos (lista)

Pasos:
1. abrir pantalla Favoritos;
2. aplicar filtros por utensilio/tiempo;
3. abrir detalle o eliminar receta.

Resultado esperado:
- filtros afectan listado en tiempo real;
- eliminar muestra dialogo consistente con estilo de app;
- dark mode sin pérdida de contraste.

## 4) Flujo Detalle de receta favorita

Pasos:
1. abrir detalle desde Favoritos;
2. verificar sección "Productos usados";
3. pulsar "Consumir ingredientes".

Resultado esperado:
- botón siempre visible;
- si no hay `ingredientsUsed`, botón deshabilitado con mensaje informativo;
- si hay datos válidos, consume contra `consume-from-recipe`;
- feedback con `AppDialog` (no `Alert` nativo suelto).

## 5) Flujo Compras habituales

Pasos:
1. abrir pestaña de compras habituales;
2. cargar sugerencias backend;
3. revisar cobertura, faltantes y métricas.

Resultado esperado:
- datos vienen de `/usual-purchases/me/suggestions`;
- nombres en Capitalize;
- UI legible en light/dark;
- último item no debe quedar cortado.

## Reglas UX transversales

- botones de red:
  - deshabilitar durante `loading`;
  - evitar doble submit.
- feedback:
  - éxito/error con componentes visuales consistentes;
  - mensajes al usuario simples y accionables.
- logs:
  - mantener logs técnicos estructurados para soporte;
  - no exponer detalles técnicos al usuario final.

## Criterios de aceptación (QA rápido)

- Fridge: create/update/delete OK en backend y UI.
- IA: generar + favorito + consumo OK.
- Favoritos: eliminar y detalle OK.
- Detalle favorita: botón consumir visible y funcional.
- Compras habituales: datos reactivos + dark mode legible.
