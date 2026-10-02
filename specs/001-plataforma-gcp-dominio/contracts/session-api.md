# Contract: API de sesión

Base: `https://amigoinvisible.com.ar`. Ninguna respuesta incluye datos de otras personas.

## `POST /api/sesion`

Crea la sesión del servidor a partir de un login hecho en el cliente.

**Request**

```json
{ "idToken": "<ID token de Firebase Auth>" }
```

**Validaciones**

1. El body cumple el esquema (zod) → si no, `400`.
2. `verifyIdToken(idToken)` válido → si no, `401`.
3. `auth_time` hace menos de 5 minutos (login reciente) → si no, `401` con `{"error":"login_viejo"}`.
4. El chequeo CSRF pasa: el host del header `Origin` es igual al host del pedido (`X-Forwarded-Host` o `Host`) → si no, `403`. Así funciona igual en `localhost`, en `*.hosted.app` y en el dominio propio.

**Efectos**

- `createSessionCookie(idToken, { expiresIn: 14 días })`.
- `Set-Cookie: __session=<cookie>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=1209600`.
- Upsert de `users/{uid}` ([data-model.md](../data-model.md)).

**Response `200`**

```json
{ "ok": true }
```

## `DELETE /api/sesion`

Cierra la sesión.

**Efectos**

- Requiere el mismo chequeo de `Origin` que `POST`.
- Si hay una `__session` válida: `revokeRefreshTokens(uid)`. Firebase no permite revocar una cookie suelta, así que **salir cierra la sesión en todos los dispositivos** de la persona.
- `Set-Cookie: __session=; Path=/; Max-Age=0`.

**Response `200`**: `{ "ok": true }`, haya o no sesión (idempotente).

## Validación en páginas privadas (contrato interno)

- `lib/session.ts` → `getSessionUser()` devuelve `{ uid, email, displayName } | null` usando `verifySessionCookie(cookie, true)`.
- `requireUser(nextPath)` redirige a `/ingresar?next=<nextPath>` si no hay sesión.
- No hay `middleware.ts`: cada página privada llama a `requireUser()`.
- `next` solo acepta rutas relativas internas (empiezan con `/` y no con `//`), para evitar redirecciones abiertas.
