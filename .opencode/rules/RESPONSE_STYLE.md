# Response Style

- Responde siempre en **español** (incluyendo UI, comentarios, docs)
- Sé **conciso**: menos de 4 líneas de texto cuando sea posible
- Usa **markdown** para formato en respuestas
- Sin emojis a menos que el usuario los solicite explícitamente
- Respuestas técnicas, directas, sin relleno
- Cuando refieras código, incluye `archivo:línea` para navegación rápida

## Convenciones del proyecto

- **Versiones**: en `meta.version` del YAML de cada SKILL.md. Bump al modificar.
- **Auto-validación**: `stack-compliance-guard` chequea imports, CDNs, cifrado, UI, módulos, accesibilidad y privacidad. Corrige automático o pregunta si ambiguo.
- **design-engine**: activada por spec-engine cuando el usuario menciona "tono visual" o "diseño". No genera código, solo valida/sugiere.
- **code-generator**: un módulo por turno. Pausa tras cada uno. Lee `libreriasAdicionales` de la spec.
- **validation-engine**: pregunta primero si tiene Python/Playwright. Si no, salta Fase 3.6 y solo da comandos DevTools manuales.
