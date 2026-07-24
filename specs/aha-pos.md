# AHA POS — Punto de venta offline para pequeños comercios

## Descripción comercial

Sistema POS (punto de venta) offline para tiendas, ferias, puestos y pequeños comercios. Carrito de compras rápido, escaneo de códigos de barras, corte de caja diario y reportes de ventas. Sin internet, sin mensualidades.

**Target:** Tiendas de barrio, ferias, puestos de mercado, pequeños comercios, emprendedores.

**Dolor que resuelve:** "Cuando no hay internet no puedo cobrar y pierdo la venta."

## Niveles comerciales

| Nivel | Perfil tecnico | Formato | IA |
|-------|---------------|---------|----|
| Inicio | Lite | ZIP + GitHub Pages | FlexSearch |
| Profesional | Full | Bun --compile .exe + GitHub Pages + Release | FlexSearch + Transformers.js QA |
| Enterprise | Full + custom | Codigo fuente + UI personalizada | FlexSearch + Transformers.js QA |

## Módulos

### 🏷️ Módulo Productos
- CRUD: nombre, código barras, precio, categoría, stock, imagen
- Escaneo de código de barras desde cámara (.apk)
- Búsqueda instantánea por nombre o código

### 🛒 Módulo Ventas (Carrito)
- Agregar productos por escaneo o búsqueda
- Cantidad, descuento por producto, subtotal en tiempo real
- Múltiples formas de pago: efectivo, tarjeta, transferencia
- Ticket de venta en pantalla (imprimible)

### 💵 Módulo Corte
- **Arqueo**: ingreso de montos por denominación (billetes/monedas), total calculado vs esperado, alerta de descuadre
- **Gastos Menores**: registro rápido de gasto con concepto y monto, se descuenta del fondo de caja
- **Cierre**: congela el corte del turno, inicia nuevo corte automáticamente
- **Historial**: cortes anteriores con detalle de arqueo y gastos, exportable

### ↩️ Módulo Devoluciones
- Seleccionar venta del historial, elegir productos a devolver
- Registrar motivo, reembolso parcial o total
- Afecta inventario automáticamente

### 📊 Módulo Reportes
- Dashboard: ventas hoy, productos top, corte activo
- Ventas por día/semana/mes con gráficos Chart.js
- Export a CSV

## Tablas Dexie

```javascript
db.version(3).stores({
  productos: 'id, nombre, *codigoBarras, *categoriaId, precio, stock, createdAt, updatedAt',
  categorias: 'id, nombre, color, createdAt, updatedAt',
  ventas: 'id, *folio, total, *metodoPago, *createdBy, createdAt, updatedAt',
  ventas_items: 'id, *ventaId, *productoId, cantidad, precioUnitario, descuento',
  cortes: 'id, *folio, apertura, cierre, totalEsperado, totalReal, *createdBy, createdAt, updatedAt',
  devoluciones: 'id, *ventaId, *productoId, cantidad, *motivo, reembolso, createdAt',
  gastosMenores: 'id, *corteId, *concepto, monto, *hora, *createdBy, createdAt',
  _sync_log: 'id, *tabla, *operacion, *idRegistro, *estado, *fecha, *createdBy, createdAt',
  _ia_chats: 'id, *titulo, *modelo, *createdBy, createdAt, updatedAt',
  _ia_messages: 'id, *chatId, *rol, contenido, *createdBy, createdAt'
});
```

## Pricing sugerido

| Nivel | Precio USD |
|-------|-----------|
| Lite | $49 |
| Standard | $99 |
| Custom | $199+ |

## Arquitectura del sistema de modulos

### appRouter (core/app.js)
- `navigate(id, params, replace)` orquesta la carga: llama `mod.init()`, luego `mod.render(params)`, recibe HTML string y lo inyecta via `refreshContent()`
- `refreshContent(html)` — destroyTree del contenido anterior, crea nuevo contenedor con innerHTML, replaceChild (MutationObserver de Alpine auto-inicia el nuevo arbol). Ya NO usa stopObservingMutations/startObservingMutations
- `done()` callback: corre como microtask (Promise.then). NO setea `location.hash` si `replace=true` (todas las navegaciones desde hashchange usan replace=true)
- `_onHashChange()` tiene **debounce 300ms** para ignorar hashchanges rapidos (frena cascade de modulos)
- `_lastHashChange: 0` inicializado en appRouter para que el debounce funcione desde el primer hashchange
- Guard contra loop: salta si `_current.id === id && store.moduloActual === id`

### Convencion de modulos
- Cada modulo expone `{ id, titulo, icono, init(), render(params), destroy() }`
- `render()` es async y **solo retorna HTML string**. NO debe llamar `refreshContent()` ni manipular el DOM directamente
- La inyeccion del HTML la hace exclusivamente `appRouter.refreshContent()` desde el callback `done()`

### Tipos de modulo

Dos patrones para modulos:

1. **Simple** (ventas, productos, devoluciones, reportes): objeto literal con `init()`, `render()`, `destroy()`. Alpine component definido global via `Alpine.data('nombre', ...)` y referenciado en el HTML de `render()` con `x-data="nombre()"`.

2. **Factory function** (corte): `CorteData` (objeto con operaciones Dexie, usado por el router) + `window.corteComponent()` (factory que retorna objeto Alpine, instancia NUEVA cada render). Esto evita estado reactivo compartido entre renders.

### Modulo Corte (factory function)

- `window.CorteData` — modulo de datos (router lo usa para `init()`/`render()`/`destroy()`)
- `window.corteComponent()` — factory function que retorna objeto Alpine. Instancia nueva cada render
- `_guardarCorteDb(corte)` — deep-clone `JSON.parse(JSON.stringify())` antes de `db.cortes.put()` para evitar `DataCloneError` (Alpine proxy no clonable por IndexedDB)
- `_escAttr()` — helper de escape HTML en closure (NO en window global)

## Errores conocidos y soluciones

| Error | Causa | Solucion |
|-------|-------|----------|
| `Cannot redefine property: $nextTick` | Alpine MutationObserver + doble initTree sobre mismo nodo | Modulos solo retornan HTML; `refreshContent()` se llama 1 vez desde `done()`; destroyTree antes de replaceChild |
| Modulo se queda en loading skeleton | `Alpine.store('loading').visible` nunca se pone `false` | Verificar que `done()` o `.catch()` en navigate() lo apague siempre |
| Pagina en blanco en modulo | Excepcion no capturada en `render()` | `navigate()` tiene try/catch alrededor de todo; revisar consola |
| `DataCloneError: The object could not be cloned` | Alpine proxy pasado a `db.table.put()` (IndexedDB no clona proxies) | Deep-clone con `JSON.parse(JSON.stringify())` antes de guardar en Dexie |
| Cascade hashchange (autocycling entre modulos) | Origen externo no identificado (posiblemente browser en file://) | Debounce 300ms en `_onHashChange()` ignora hashchanges rapidos; `_lastHashChange: 0` inicializado |
