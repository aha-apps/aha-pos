# Pipeline orquestado (orden exacto)

`nuevo proyecto` → `iniciar setup` → `generar spec + brand` → `aplicar diseño` → `generar codigo` → `validar + auditar marca` → `publicar`

- **PAUSA tras cada fase**. OpenCode pierde contexto >15k tokens. No generar todo de una vez.
- `pipeline-engine/SKILL.md` es el orquestador maestro. Soporta dos modos: Classic (5 fases, /new) y Design (10 fases, /pro).
- `stack-compliance-guard` se auto-activa tras cada output de código. No requiere trigger.
- **Push requiere confirmación explícita** — solo hacer commit, no push sin pedir.
- **Perfil (lite/professional/business)** se define en `project.config.js` y determina setup, templates y empaquetado.
- **IA Jutia (lite / IA Full / no)** es opcional, definida en `project.config.js`.

## Contratos entre Skills

| Emisor | Receptor(es) | Artefacto |
|--------|-------------|-----------|
| pipeline-engine | setup-init, spec-engine | Nombre + tipo + descripción + perfil + modo (classic/design) |
| setup-init | code-generator | Estructura + librerías según perfil (curl o bun add) |
| spec-engine | design-engine, code-generator, wiki-engine | `specs/[app].md` (con modelo datos + journeys + testing) + `specs/DESIGN.md` (brand layer) |
| design-engine | code-generator, alpine-ui-patterns | Preferencias de diseño en `.omd/preferences.md` (tokens, paleta, tipografía, `component_library`) |
| alpine-ui-patterns | design-engine, code-generator | `alpine-ui-patterns/SKILL.md` — catálogo de ~100 componentes con categorías A/B/C y fallback chain |
| code-generator | stack-compliance-guard, validation-engine, wiki-engine, design-engine (retroalimentación) | `modules/*`, `core/*` (incl. `core/sync.js`), `index.html` (+ `neutralino.config.json` en Professional/Business, + `capacitor.config.json` en Professional/Business) |
| stack-compliance-guard | code-generator | Validación automática post-generación (con checks de perfil) |
| validation-engine | wiki-engine | `docs/validacion-[app].md` + brand audit + QA rubric |
| deployment-jigue | — | Commit + Push + empaquetado segun perfil (Essential: ZIP+Pages / Professional: .exe+.apk+FixedWV2 / Business: .exe+.apk+white-label+branding) |
| capacitor | deployment-jigue | `capacitor.config.json` + `android/` |
| upgrade-engine | — | project.config.js actualizado + infraestructura nueva según perfil destino. Invocación directa `/upgrade` |
| wiki-engine | — | `wiki/` + `.omd/preferences.md` + Engram memory (opcional) |

## Archivos generados (no versionar)

- `docs/validacion-[app].md`, `docs/test_results.json`, `docs/screenshot_test.png`
- `dist/[AppName]-Essential-v[version].zip` (Lite) o `dist/[AppName]-Professional-v[version].zip` (Professional/Business)
- `.omd/preferences.md` (preferencias de diseño persistentes)
- `skills.rar`
