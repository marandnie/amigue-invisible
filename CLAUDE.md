# Amigo Invisible — guía para Claude

- **Método**: Spec-Driven Development con Spec Kit. Antes de tocar código de producto, leé la constitución (`.specify/memory/constitution.md`) y la spec/plan/tasks de la feature (`specs/NNN-*/`). Si el comportamiento cambia, primero se actualiza la spec.
- **Idioma**: UI, mails, specs y mensajes de commit en español rioplatense (voseo). Identificadores de código en inglés.
- **Privacidad (no negociable)**: nadie ve asignaciones ajenas; el sorteo corre solo en el servidor; nunca loguear pares giver→receiver.
- **Datos**: Firestore con reglas deny-all; todo acceso pasa por el servidor (`lib/firebase/admin.ts`) con la autorización en el código. Sin bases relacionales.
- **Sesión**: cookie `__session` (session cookie de Firebase). Páginas privadas: `requireUser(path)` de `lib/session.ts`. No hay middleware.
- **Costo**: todo escala a cero; `apphosting.yaml` tiene `maxInstances: 3`.

## Comandos

```bash
npm run emulators   # Auth + Firestore (requiere Java 21+)
npm run dev
npm test            # unit
npm run test:rules  # reglas contra el emulador
npm run build && npm run test:smoke
npm run typecheck
```
