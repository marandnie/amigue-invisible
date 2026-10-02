# Data Model: Plataforma en producción con dominio propio

Firestore (modo nativo). En esta feature solo existe la colección de perfiles. Las entidades de producto (grupos, participantes, invitaciones, wishlists, exclusiones, asignaciones) se definen en la feature 002.

## `users/{uid}`

`uid` es el id de Firebase Auth.

| Campo | Tipo | Regla |
|---|---|---|
| `displayName` | string | 1–60 caracteres; al crearse se toma de Google o de la parte local del email |
| `email` | string | minúsculas; igual al email de Auth |
| `emailVerified` | boolean | copia del estado en Auth, se actualiza en cada login |
| `providers` | string[] | `password`, `emailLink`, `google.com` |
| `createdAt` | timestamp | lo pone el servidor en el alta |
| `lastLoginAt` | timestamp | lo pone el servidor en cada `POST /api/sesion` |

- **Escritura**: solo el servidor (Admin SDK), en `POST /api/sesion` (upsert).
- **Lectura**: solo el servidor, y únicamente el propio perfil de la persona con sesión.
- **Reglas de seguridad**: acceso directo desde el cliente negado para **todas** las colecciones:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- **Índices**: ninguno además de los automáticos.
- **Transiciones de estado**: ninguna; el perfil se crea y se actualiza.
