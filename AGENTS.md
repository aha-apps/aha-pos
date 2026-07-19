# AHA POS — Punto de Venta Offline-first

{file:.opencode/rules/STACK.md}
{file:.opencode/rules/TOOL_USAGE.md}
{file:.opencode/rules/RESPONSE_STYLE.md}

App generada con **Ateje Stack**, perfil **Lite**. POS offline-first para pequeños comercios.

## Stack

Alpine.js 3.14 + DaisyUI 4.12 + Tailwind CSS 2.2 + Dexie 4.0 + CryptoJS 4.2

## Comandos

- `npx tailwindcss -i src\tailwind-input.css -o dist\tailwind.css` — único build step
- Abrir `index.html` con doble clic (sin servidor, `file://`)

## Arquitectura

- **Carga secuencial** en `index.html`: core/db.js → crypto.js → app.js → ui.js → theme.js → main.js → env.js → file-store.js → sync.js → network.js → search-palette.js → license.js
- **Módulos** (5): ventas, productos, corte, devoluciones, reportes — cada uno `module.js` (sin `module.html`, todo el template va inline en JS)
- **Routing hash-based** (`#/ventas`, `#/productos`)
- **Pattern IIFE** `(function(){ 'use strict'; ... })()` — sin `import`/`export` (compatible `file://`)
- **Variables globales** (`window.db`, `window.UI`, `window.appRouter`, `window.cryptoHelpers`, `window.MODULES`)
- **Datos**: Dexie (IndexedDB), esquema en `core/db.js:6-17`, 12 tablas
- **Cifrado**: CryptoJS AES en `core/crypto.js`, key en localStorage
- **SW**: precache en `sw.js`, activación manual desde consola

## Convenciones

- Todo en español (UI, código, docs, commits)
- CSS personalizada en clases `.btn-ds-*`, `.input-ds`, `.card-ds`, `.sk-*` (skeleton)
- Tema DaisyUI custom con 4 modos (light/dark/emerald/autumn), primary `#0cc681`
- Sin emojis en código/docs a menos que el usuario los solicite
- Sin librerías vía CDN en runtime — todo debe ir en `assets/` (actualmente bootstrap-icons, animate.css y Google Fonts usan CDN)
- `project.config.js` controla perfil, módulos activos, tema y extras

## Config OpenCode

- `opencode.json` referencia skills Ateje desde `D:\REPOSITORIOS GitHUB\Ateje`
- **Engram** (memoria persistente) activo via `.omd/engram.db`
- Comandos slash disponibles: `/status`, `/test`, `/deploy`, `/upgrade`, etc. (vía skills Ateje)

## Sistema de modulos (app.js)

- `appRouter.navigate(id, params, replace)` — orquesta carga: llama `mod.init()`, luego `mod.render(params)`, recibe HTML string, lo inyecta via `refreshContent()`
- `refreshContent(html)` — pausa MutationObserver de Alpine (`stopObservingMutations`), asigna `innerHTML`, llama `Alpine.initTree` en cada child, reanuda observer
- Los modulos **solo retornan HTML string** en `render()`. NO deben llamar `refreshContent()` ellos mismos o se duplica la inyeccion (causa `Cannot redefine property: $nextTick`)
- `navigate()` tiene guard contra loop de `hashchange`: salta si `_current.id === id && store.moduloActual === id`
- `done()` callback corre como microtask (Promise.then) — siempre antes que setTimeout(0) macrotasks

## Errores conocidos y soluciones

| Error | Causa | Solucion |
|-------|-------|----------|
| `Cannot redefine property: $nextTick` | Alpine MutationObserver + doble initTree sobre mismo nodo | Modulos solo retornan HTML; `refreshContent()` se llama 1 vez desde `done()` |
| Modulo se queda en loading skeleton | `Alpine.store('loading').visible` nunca se pone `false` | Verificar que `done()` o `.catch()` en navigate() lo apague siempre |
| Pagina en blanco en modulo | Excepcion no capturada en `render()` | `navigate()` tiene try/catch alrededor de todo; revisar consola |

## Tests

No hay infraestructura de tests. `package.json` solo tiene `"test": "echo Error: no test specified"`.
