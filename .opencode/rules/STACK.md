# Stack offline-first (no negociable)

## Reglas comunes (todos los perfiles)

- ✅ Variables globales (`Alpine`, `Dexie`, `CryptoJS`) para reactividad
- ✅ `cryptoHelpers.encrypt()` en campos sensibles (CryptoJS en ambos)
- ✅ UI: DaisyUI + Bootstrap Icons + Animate.css en español
- ❌ CDNs en runtime — todo local en `assets/` o vía npm bundle
- ❌ Fetch/axios para datos — usar Dexie (IndexedDB local)
- ✅ Todo en español (UI, comentarios, docs)

## Perfil Lite (Essential — file://)

- ❌ `import`/`export`/`type="module"` — CORS en `file://` bloquea ES6 modules
- ❌ Build steps — la app se abre con doble clic en `index.html`
- ✅ Librerías en `assets/js/libs/` vía curl
- ✅ Service Worker para PWA opcional
- **Nivel comercial:** Essential
- **IA Jutía:** Lite (FlexSearch + estadísticas + predicciones)
- **Entregable:** ZIP + GitHub Pages. HTML visible (demo online)

## Perfil Professional (Neutralino .exe + Fixed WebView2 + .apk)

- ✅ `import`/`export` NO permitido en `public/` (mismo que Lite, mismo código)
- ✅ Build .exe: `neu build --release` + `package-professional.ps1`
- ✅ **Sin dependencia de WebView2 del sistema** — incluye Fixed Version embebida
- ✅ Fixed WebView2 stripped: solo x64 + es-419.pak + swiftshader (WebGPU)
- ✅ Ventana nativa, bandeja sistema, notificaciones (sin terminal)
- ✅ Neutralino API vía `window.Neutrino` en `public/core/neutralino.js`
- ✅ `neutralino.config.json` en raíz del proyecto
- ✅ Mismo frontend que Lite en `public/` (Alpine + Dexie + CryptoJS + DaisyUI)
- ✅ **IA Jutía Full incluida**: FlexSearch + ingesta documentos + QA (WebGPU acelerado)
- ✅ **Sin HTML visible para el cliente** (resources.neu ofuscado con terser)
- ✅ **.apk Android incluido** — Capacitor con SQLite FTS5, cámara, GPS, notificaciones, compartir
- ✅ Build .apk: `npx cap sync android && cd android && ./gradlew assembleRelease`
- ✅ `capacitor.config.json` en raíz del proyecto
- ✅ `android/` directorio con proyecto Gradle
- 📦 Tamaño entregable: ~30MB ZIP (app ~3MB + WebView2 fixed stripped ~53MB + .apk → ~28MB comprimido)

## Perfil Business (Professional + white-label + soporte prioritario)

- Todo lo del perfil Professional, más:
- ✅ White-label completo: logo, colores, nombre del cliente aplicados en toda la UI
- ✅ Documentación personalizada con marca del cliente: `GUIA_USUARIO.md`, `GUIA_INSTALACION.md`
- ✅ Soporte prioritario 48h
- ✅ Guía de marca personalizada (DESIGN.md hecho a medida)
- ✅ Dominio personalizado (opcional)
- 📦 Tamaño entregable: ~35MB ZIP

## Herramientas de desarrollo (opcionales)

Estas herramientas mejoran el pipeline pero **no afectan las apps generadas**. Sin ellas todo funciona igual.

| Herramienta | Perfil | Propósito | Instalación |
|-------------|:------:|-----------|-------------|
| **Engram** | Professional / Business | Memoria persistente para el agente OpenCode (wiki-engine) | `winget install Gentleman.Programming.Engram` |
| **OpenPencil CLI** | Business (opcional) | Extracción de tokens desde archivos .fig para DESIGN.md | `npm install -g @open-pencil/cli` |
| **OpenPencil Desktop** | Business (opcional) | Editor visual Figma-compatible + preview diseño + MCP server | `winget install OpenPencil.OpenPencil` |

**Nota**: OpenPencil exporta a Tailwind v4 puro. Los tokens extraídos se aplican a DaisyUI 5 vía `@theme`. El resultado visual es el mismo porque DaisyUI usa los mismos tokens.
