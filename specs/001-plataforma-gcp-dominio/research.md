# Research: Plataforma en producción con dominio propio

**Feature**: [spec.md](./spec.md) · **Fecha**: 2026-09-30

Formato: Decisión / Por qué / Alternativas descartadas. Todas las decisiones respetan la [constitución](../../.specify/memory/constitution.md).

---

## R1. Dónde corre la app

- **Decisión**: Firebase App Hosting, conectado al repo de GitHub (rama `main`).
- **Por qué**: soporta Next.js con SSR y Server Actions sin configuración extra, hace el build y el rollout en cada push, emite certificados para dominios propios, escala a cero (corre sobre Cloud Run) y ofrece redirección de dominio a dominio. Permite reutilizar el scaffold Next.js existente.
- **Alternativas descartadas**:
  - *Firebase Hosting estático + Cloud Functions*: obliga a partir la app en export estático + funciones; el soporte "framework-aware" de Next.js en Hosting está cerrado a proyectos nuevos y Firebase recomienda App Hosting.
  - *Cloud Run directo*: más control, pero hay que armar CI/CD, certificados y CDN a mano. No aporta nada para este tamaño.
  - *S3 + CloudFront / Amplify / Vercel*: fuera del ecosistema elegido (constitución IV).

## R2. Región

- **Decisión**: `us-east4` (Virginia del Norte) para el backend de App Hosting **y** para Firestore.
- **Por qué**: App Hosting solo ofrece `us-central1`, `us-east4`, `us-east5`, `asia-east1`, `asia-southeast1` y `europe-west4`; ninguna en Sudamérica. `us-east4` es la más cercana a Buenos Aires. Firestore tiene que estar en la misma región para que cada consulta del servidor no cruce el continente.
- **Ojo**: la ubicación de Firestore **no se puede cambiar** después de crear la base.
- **Alternativas descartadas**: Firestore en `southamerica-east1` (São Paulo) con el cómputo en EE. UU.: cada lectura del servidor sumaría ~120 ms de ida y vuelta. `us-central1`: algo más lejos; su única ventaja (cuota gratis de Cloud Storage) solo aplica a deploys desde código local, y acá se despliega desde GitHub.

## R3. Base de datos

- **Decisión**: Cloud Firestore, edición Standard, modo nativo. Todo el acceso pasa por el servidor con el Admin SDK. Las reglas de seguridad **niegan todo** acceso directo desde el navegador.
- **Por qué**: escala a cero, sin costo fijo, con cuota gratuita diaria (50k lecturas, 20k escrituras, 1 GiB) que alcanza de sobra. Con deny-all en las reglas, aunque alguien use la config pública del proyecto no puede leer nada: cumple la constitución I sin depender de reglas finas. Si más adelante hace falta tiempo real en el cliente, se abren colecciones puntuales con tests.
- **Alternativas descartadas**: Postgres (Cloud SQL / Firebase SQL Connect): descartado explícitamente y con costo fijo. Realtime Database: modelo de datos y reglas menos cómodos para relaciones grupo–participante.

## R4. Identidad

- **Decisión**: Firebase Authentication con tres proveedores: Email/Contraseña, Link por email (passwordless) y Google. Configuración: "una cuenta por email" (vincula métodos del mismo email), política de contraseña de mínimo 10 caracteres, plantillas de mail en español, dominio autorizado `amigoinvisible.com.ar`.
- **Por qué**: cubre los tres métodos de DESIGN.md sin mantener tablas ni hashing propios. Gratis hasta 50k usuarios activos por mes. En plan Blaze el límite de mails de link de acceso es 25.000/día (en Spark es 5/día: otra razón para Blaze).
- **Alternativas descartadas**: seguir con Auth.js + adaptador de Firestore: más código propio (hash de contraseñas, envío de mails, tablas de sesión) para lo mismo.

## R5. Sesión del lado del servidor

- **Decisión**: *session cookies* de Firebase. El cliente inicia sesión con el SDK web, manda el ID token a `POST /api/sesion`, el servidor lo verifica (y exige un login reciente, < 5 min), crea una session cookie de 14 días con el Admin SDK y la guarda como cookie `__session` (`HttpOnly`, `Secure`, `SameSite=Lax`). Los Server Components y Server Actions la validan con `verifySessionCookie(cookie, checkRevoked=true)`. El middleware solo hace un chequeo optimista (¿hay cookie?) para redirigir al login; la validación real siempre ocurre en el servidor.
- **Por qué**: es el mecanismo oficial para sesiones con cookie, permite revocar sesiones al cerrar sesión y no depende de JavaScript en el cliente para renderizar páginas privadas. El nombre `__session` es la convención de Firebase y evita que la CDN descarte la cookie.
- **Alternativas descartadas**: `FirebaseServerApp` con el ID token en cookie (el token dura 1 h y hay que refrescarlo desde el cliente; complica los Server Components). `next-firebase-auth-edge` (dependencia extra; no hace falta validar en el edge).
- **Riesgo a verificar**: que la service account del backend de App Hosting tenga permiso para crear session cookies. Si `createSessionCookie` falla con un error de permisos, otorgarle el rol *Firebase Authentication Admin* (tarea T034).

## R6. Login con Google

- **Decisión**: `signInWithPopup`. En navegadores embebidos (Instagram, Facebook y similares), donde Google bloquea el login, se muestra un aviso para abrir el link en el navegador del teléfono o entrar con link por email.
- **Por qué**: `signInWithRedirect` falla en navegadores que particionan el almacenamiento de terceros cuando el `authDomain` (`*.firebaseapp.com`) no coincide con el dominio de la app. El popup no tiene ese problema.
- **Alternativa de respaldo**: si los popups dan problemas en mobile, usar `authDomain = amigoinvisible.com.ar` y hacer proxy de `/__/auth/*` hacia `<proyecto>.firebaseapp.com` con un *rewrite* de Next.js.

## R7. Redirección de los dominios secundarios

- **Decisión**: la opción de App Hosting "redirigir todos los pedidos de este dominio a otro dominio" para `www.amigoinvisible.com.ar`, `amigueinvisible.com.ar` y `www.amigueinvisible.com.ar`, todos hacia `amigoinvisible.com.ar`. App Hosting emite los certificados de los cuatro nombres.
- **Por qué**: todo queda en un mismo lugar, Cloudflare se usa solo como DNS y no hace falta código.
- **A verificar**: que la redirección conserve la ruta y el query string (FR-002). Lo valida `scripts/check-domains.sh`.
- **Plan B**: *Redirect Rule* de Cloudflare (registro proxied + regla 301 dinámica `concat("https://amigoinvisible.com.ar", http.request.uri)`) solo para la zona `amigueinvisible.com.ar`.

## R8. DNS

- **Decisión**: Cloudflare (plan free) como DNS autoritativo de las dos zonas, delegado desde NIC.ar. Todos los registros que apuntan a Firebase van en **DNS only** (nube gris).
- **Por qué**: NIC.ar solo delega, no guarda registros. Cloudflare es gratis y cómodo. Con el proxy activado, Firebase no puede verificar el dominio ni emitir el certificado (ve IPs de Cloudflare en lugar de las suyas) y habría dos CDNs encadenadas.
- **Pasos en NIC.ar**: entrar a nic.ar con Clave Fiscal → *Mis dominios* → el dominio → delegaciones → reemplazar por los 2 nameservers que asigna Cloudflare. El menú puede variar un poco; los datos que importan son los dos hosts `*.ns.cloudflare.com`.
- **Estado actual** (RDAP de NIC.ar, 2026-09-30): los dos dominios figuran como registrados y *inactivos* (sin delegación). Vencen el 17/04/2027.

## R9. Mails de autenticación

- **Decisión**: los mails de acceso y verificación los manda Firebase Auth con **dominio propio** (remitente `noreply@amigoinvisible.com.ar`). Se agregan en Cloudflare los registros TXT/CNAME que pide la consola, y un DMARC inicial `v=DMARC1; p=none; rua=mailto:<responsable>`.
- **Por qué**: cero infraestructura extra y mejor entregabilidad (SC-006).
- **Para la feature 002**: los mails propios de la app (invitación, "ya se hizo el sorteo") necesitan un proveedor transaccional. Candidato: Resend (ya se usa en mandieto.com.ar). **Ojo**: el plan free de Resend permite 1 dominio (≈3.000 mails/mes, 100/día; verificar precios vigentes). Si ese cupo ya está ocupado, hay que evaluar el plan pago o una alternativa. Se decide en el plan de la 002.
- **Cuidado con SPF**: un dominio admite un solo registro `v=spf1`. Si después se suma otro remitente en el dominio raíz, se combinan en un único registro.

## R10. Costo estimado (constitución III)

Supuestos: < 1.000 visitas/mes fuera de temporada, ~30 deploys/mes, imagen de ~300 MB.

| Ítem | Uso estimado | Cuota gratis | Costo |
|---|---|---|---|
| Cloud Run (CPU/memoria/requests) | muy por debajo | 180k vCPU-s, 360k GiB-s, 2M req | USD 0 |
| App Hosting, tráfico saliente | < 1 GiB | 10 GiB/mes | USD 0 |
| Cloud Build | ~150 min | 2.500 min/mes | USD 0 |
| Artifact Registry | ~0,6 GB (2 imágenes durante un rollout) | 0,5 GB | ~USD 0,01 |
| Secret Manager | ≤ 6 versiones | 6 versiones | USD 0 |
| Firestore | muy por debajo | 50k lecturas/20k escrituras por día | USD 0 |
| Firebase Auth | < 50k MAU | 50k MAU | USD 0 |
| Cloudflare DNS | 2 zonas | plan free | USD 0 |
| **Total nube** | | | **< USD 0,10/mes** |

Aparte: la renovación anual de los dominios en NIC.ar. Pico de diciembre (supuesto 10k visitas) sigue dentro de las cuotas gratuitas según el ejemplo de facturación de App Hosting. Protección: presupuesto de USD 5/mes con alertas al 50/90/100 % y `maxInstances: 3`.

## R11. Riesgos y verificaciones abiertas

| Riesgo | Mitigación |
|---|---|
| Permisos para `createSessionCookie` | T034: probar en el primer rollout; otorgar rol si falla |
| La redirección de App Hosting no conserva la ruta | `scripts/check-domains.sh`; plan B en Cloudflare (R7) |
| Emisión del certificado demora hasta 24 h | Conectar dominios con tiempo; probar primero en `*.hosted.app` |
| Ubicación de Firestore irreversible | Confirmar `us-east4` antes de crear la base |
| Vencimiento de dominios (17/04/2027) | Recordatorio en el calendario un mes antes |
| Git local roto (`.git` sin commits) | T001: restaurar desde `git-repo.tar.gz` |
