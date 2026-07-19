# Tool Usage Protocol

## File Operations
- Usa `glob` para buscar archivos por patrón, NO `bash Get-ChildItem`
- Usa `grep` para buscar contenido, NO `bash Select-String`
- Usa `read` para leer archivos, NO `bash Get-Content`
- Usa `edit` para modificar archivos existentes, `write` para crear nuevos
- Usa `workdir` parameter, NO `cd && command`

## User Interaction
- Usa `question` tool para opciones múltiples, NO preguntas inline
- Usa `todowrite`/`todoread` para tareas de 3+ pasos, NO seguimiento inline

## Ejecución
- Usa `bash` solo para: git, npm, python, node, y comandos del proyecto
- Prefiere el workdir parameter sobre cambiar de directorio
- Siempre describe el comando en 5-10 palabras con el parámetro description
