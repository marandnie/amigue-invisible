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
4. El chequeo CSRF pasa: el header `Origin` es el sitio (`NEXT_PUBLIC_SITE_URL` o `localhost` en dev) → si no, `403`.

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

- Si hay una `__session` válida: `revokeRefreshTokens(uid)`.
- `Set-Cookie: __session=; Path=/; Max-Age=0`.

**Response `200`**: `{ "ok": true }`, haya o no sesión (idempotente).

## Validación en páginas privadas (contrato interno)

- `lib/session.ts` → `getSessionUser()` devuelve `{ uid, email, displayName } | null` usando `verifySessionCookie(cookie, true)`.
- `requireUser(nextPath)` redirige a `/ingresar?next=<nextPath>` si no hay sesión.
- `middleware.ts` solo mira si existe la cookie `__session` en `/mis-grupos`, `/grupos/*` y `/ajustes`, y si no existe redirige a `/ingresar?next=…`. Nunca se usa como autorización.
- `next` solo acepta rutas relativas internas (empiezan con `/` y no con `//`), para evitar redirecciones abiertas.
